import BLOG from '@/blog.config'
import { getOrSetDataWithCache } from '../cache/cache_manager'
import { getAllCategories } from '@/lib/db/notion/getAllCategories'
import getAllPageIds from '@/lib/db/notion/getAllPageIds'
import { getAllTags } from '@/lib/db/notion/getAllTags'
import { getConfigMapFromConfigPage } from '@/lib/db/notion/getNotionConfig'
import getPageProperties, {
  adjustPageProperties
} from '@/lib/db/notion/getPageProperties'
import {
  fetchInBatches,
  fetchNotionPageBlocks,
  formatNotionBlock
} from '@/lib/db/notion/getPostBlocks'
import { compressImage, mapImgUrl } from '@/lib/db/notion/mapImage'
import { deepClone } from '@/lib/utils'
import { idToUuid } from 'notion-utils'
import { siteConfig } from '../config'
import { extractLangId, extractLangPrefix, getShortId } from '../utils/pageId'
import {
  normalizeNotionMetadata,
  normalizeCollection,
  normalizeSchema,
  normalizePageBlock
} from './notion/normalizeUtil'
import { fetchPageFromNotion } from './notion/getNotionPost'
import { processPostData } from '../utils/post'
import { adapterNotionBlockMap } from '../utils/notion.util'
import { sortPinnedPostsByLatestUpdate } from '@/lib/utils/pinnedPosts'
import { fetchMembersFromOfficialAPI } from './notion/memberDataSource'
// import pLimit from 'p-limit'

export { getAllTags } from './notion/getAllTags'
export { fetchPageFromNotion as getPost } from './notion/getNotionPost'
export { fetchNotionPageBlocks as getPostBlocks } from './notion/getPostBlocks'

/**
 * 全データを取得；Notionに基づき実装
 * 複数サイト（pageId カンマ区切り）と多言語（locale 接頭辞）をサポート
 */
export async function fetchGlobalAllData({
  pageId = BLOG.NOTION_PAGE_ID,
  from,
  locale
}) {
  if (BLOG.BUNDLE_ANALYZER) {
    return EmptyData(pageId)
  }

  const cacheKey = getGlobalDataCacheKey({ pageId, locale })
  const cachedData = await getOrSetDataWithCache(cacheKey, async () => {
    const siteIds = pageId?.split(',') || []
    let data = EmptyData(pageId)

    try {
      for (let index = 0; index < siteIds.length; index++) {
        const siteId = siteIds[index]
        const id = extractLangId(siteId)
        const prefix = extractLangPrefix(siteId)

        if (index === 0 || locale === prefix) {
          data = await getSiteDataByPageId({ pageId: id, from })
        }
      }
    } catch (error) {
      console.error('エラー発生', error)
    }

    return handleDataBeforeReturn(deepClone(data))
  })

  return deepClone(cachedData)
}

function getGlobalDataCacheKey({ pageId, locale }) {
  const safePageId = String(pageId || BLOG.NOTION_PAGE_ID).replace(
    /[^a-z0-9,_:-]/gi,
    '_'
  )
  const safeLocale = String(locale || 'default').replace(/[^a-z0-9_-]/gi, '_')
  return `global_data_${safeLocale}_${safePageId}`
}

/**
 * 指定された Notion collection データを取得
 */
export async function getSiteDataByPageId({ pageId, from }) {
  const cacheKey = `site_${pageId}`

  const data = await getOrSetDataWithCache(cacheKey,
    async () => {
      console.log('サイトデータを取得中... ', pageId)
      // データのプル
      const originalPageRecordMap = await fetchNotionPageBlocks(pageId, from)
      // 形式変換
      const r = await convertNotionToSiteData(pageId, from, originalPageRecordMap)
      // キャッシュして返す
      return r
    }
  )
  if (process.env.NODE_ENV === 'development') {
    console.log(
      '[ThemeResolver][site-data]',
      JSON.stringify({
        from,
        pageId,
        notionTheme: data?.NOTION_CONFIG?.THEME || null,
        configTheme: BLOG.THEME,
        cacheEnabled: BLOG.ENABLE_CACHE
      })
    )
  }
  return data
}

/**
 * お知らせブロックを取得
 */
async function getNotice(post) {
  if (!post) return null

  try {
    const rawBlockMap = await fetchNotionPageBlocks(post.id, 'data-notice')
    const adapted = adapterNotionBlockMap(rawBlockMap)
    post.blockMap = {
      ...adapted,
      block: formatNotionBlock(adapted.block)
    }
  } catch (e) {
    console.warn('[getNotice] fetchNotionPageBlocks failed:', post.id, e)
    post.blockMap = null
  }

  return post
}

/**
 * 空のデフォルトデータ（Notionからの取得失敗時のバックアップ）
 */
const EmptyData = pageId => ({
  notice: null,
  siteInfo: getSiteInfo({}),
  allPages: [
    {
      id: 1,
      title: `Notionデータを取得できません。Notion_IDを確認してください： \n 現在の設定 ${pageId}`,
      summary:
        'ヘルプドキュメントを確認する → https://docs.tangly1024.com/article/vercel-deploy-notion-next',
      status: 'Published',
      type: 'Post',
      slug: 'oops',
      publishDay: '2024-11-13',
      pageCoverThumbnail: BLOG.HOME_BANNER_IMAGE || '/bg_image.jpg',
      date: {
        start_date: '2023-04-24',
        lastEditedDay: '2023-04-24',
        tagItems: []
      }
    }
  ],
  allNavPages: [],
  collection: [],
  collectionQuery: {},
  collectionId: null,
  collectionView: {},
  viewIds: [],
  block: {},
  schema: {},
  tagOptions: [],
  categoryOptions: [],
  rawMetadata: {},
  customNav: [],
  customMenu: [],
  allMembers: [],
  allEvents: [],
  postCount: 1,
  pageIds: [],
  latestPosts: []
})

/**
 * サーバーサイドで単一記事の props を解析
 */
export async function resolvePostProps({ prefix, slug, suffix, locale, from }) {
  const segments = [prefix, slug].filter(Boolean)
  if (Array.isArray(suffix)) segments.push(...suffix)
  const fullSlug = segments.join('/')
  const lastSegment = segments.at(-1)
  const source = from || `slug-props-${fullSlug}`
  const taskId = `${fullSlug || lastSegment}-${Date.now()}`

  const startTime = Date.now()
  console.log(`[${taskId}] 🕒 記事の解析を開始: ${fullSlug || lastSegment} @ ${new Date().toISOString()}`)

  const props = await fetchGlobalAllData({ from: source, locale })

  const findPost = () => {
    if (!props?.allPages) return null
    return (
      props.allPages.find(p => p && !p.type?.includes('Menu') && p.slug === fullSlug) ||
      props.allPages.find(p => p?.id === fullSlug) ||
      null
    )
  }

  let post = findPost()

  if (!post && typeof lastSegment === 'string' && /^[a-f0-9-]{32,36}$/i.test(lastSegment)) {
    try {
      post = await fetchPageFromNotion(lastSegment)
    } catch (e) {
      console.warn(`[${taskId}] [resolvePostProps] fetchPageFromNotion failed:`, lastSegment, e)
    }
  }

  const ensureBlockMap = async (post) => {
    if (!post?.id || post?.blockMap) return post
    try {
      const rawBlockMap = await fetchNotionPageBlocks(post.id, source)
      const adapted = adapterNotionBlockMap(rawBlockMap)
      post.blockMap = {
        ...adapted,
        block: formatNotionBlock(adapted.block)
      }
    } catch (e) {
      console.warn(`[${taskId}] [resolvePostProps] fetchNotionPageBlocks failed:`, post.id, e)
    }
    return post
  }

  if (post) {
    post = await ensureBlockMap(post)
    props.post = post
    try {
      await processPostData(props, source)
    } catch (e) {
      console.warn(`[${taskId}] [resolvePostProps] processPostData failed`, e)
    }
  } else {
    props.post = null
  }

  delete props.allPages
  return props
}

async function convertNotionToSiteData(
  SITE_DATABASE_PAGE_ID,
  from,
  pageRecordMap
) {
  const traceId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  if (!pageRecordMap) {
    console.error(`[${traceId}] Notionデータを取得できません ; pageId:`, SITE_DATABASE_PAGE_ID)
    return {}
  }

  SITE_DATABASE_PAGE_ID = idToUuid(SITE_DATABASE_PAGE_ID)
  let block = adapterNotionBlockMap({ block: pageRecordMap.block || {} }).block
  const rawMetadata = normalizeNotionMetadata(block, SITE_DATABASE_PAGE_ID)

  if (rawMetadata?.type !== 'collection_view_page' && rawMetadata?.type !== 'collection_view') {
    console.error(`[${traceId}] pageId "${SITE_DATABASE_PAGE_ID}" はデータベースではありません`)
    return EmptyData(SITE_DATABASE_PAGE_ID)
  }

  const collectionMap = pageRecordMap.collection || {}
  const inferredCollectionId = Object.keys(collectionMap).length === 1 ? Object.keys(collectionMap)[0] : null
  const collectionId = rawMetadata?.collection_id || inferredCollectionId
  const rawCollection = collectionMap?.[collectionId] || collectionMap?.[idToUuid(collectionId)] || {}
  const collection = normalizeCollection(rawCollection)
  const collectionQuery = pageRecordMap.collection_query
  const collectionView = pageRecordMap.collection_view
  const schema = normalizeSchema(collection?.schema || {})
  const viewIds = rawMetadata?.view_ids
  const collectionData = []

  const pageIds = getAllPageIds(collectionQuery, collectionId, collectionView, viewIds, block)
  const blockIdsNeedFetch = pageIds.filter(id => !normalizePageBlock(block[id]))

  if (blockIdsNeedFetch.length > 0) {
    const fetchedBlocks = await fetchInBatches(blockIdsNeedFetch)
    const adaptedFetchedBlocks = adapterNotionBlockMap({ block: fetchedBlocks }).block
    block = { ...block, ...adaptedFetchedBlocks }
  }

  for (const id of pageIds) {
    const pageBlock = normalizePageBlock(block[id])
    if (!pageBlock) continue
    if (pageBlock.parent_id !== collectionId) continue
    const properties = (await getPageProperties(id, pageBlock, schema, null, getTagOptions(schema))) || null
    if (properties) collectionData.push(properties)
  }

  const NOTION_CONFIG = (await getConfigMapFromConfigPage(collectionData)) || {}
  collectionData.forEach(element => adjustPageProperties(element, NOTION_CONFIG))

  const officialMembers = await fetchMembersFromOfficialAPI({
    typeProperty: BLOG.NOTION_PROPERTY_NAME.type,
    statusProperty: BLOG.NOTION_PROPERTY_NAME.status,
    typeValue: BLOG.NOTION_PROPERTY_NAME.type_member,
    statusValue: BLOG.NOTION_PROPERTY_NAME.status_publish
  })
  if (officialMembers.length > 0) {
    const existingMembers = new Set(collectionData.filter(item => item?.type === 'Member').flatMap(item => [item.id, item.slug].filter(Boolean)))
    officialMembers.forEach(member => {
      if (!existingMembers.has(member.id) && !existingMembers.has(member.slug)) {
        collectionData.push(member)
      }
    })
  }

  const siteInfo = getSiteInfo({ collection, block, rawMetadata, NOTION_CONFIG })
  let postCount = 0
  let allPages = collectionData.filter(post => {
    if (post?.type === 'Post' && post.status === 'Published') postCount++
    return post?.slug && (post?.status === 'Invisible' || post?.status === 'Published')
  })
  const sortBy = siteConfig('POSTS_SORT_BY', null, NOTION_CONFIG)
  if (sortBy === 'date') {
    allPages.sort((a, b) => (b?.publishDate ?? 0) - (a?.publishDate ?? 0))
  }

  const topTag = siteConfig('TOP_TAG', '', NOTION_CONFIG)
  if (topTag) {
    allPages = sortPinnedPostsByLatestUpdate(allPages, topTag)
  }

  const notice = await getNotice(collectionData.find(post => post?.type === 'Notice' && post.status === 'Published'))
  const categoryOptions = getAllCategories({ allPages, categoryOptions: getCategoryOptions(schema) })
  const tagSchemaOptions = getTagOptions(schema)
  const tagOptions = getAllTags({ allPages, tagOptions: tagSchemaOptions ?? [], NOTION_CONFIG }) ?? null
  const customNav = getCustomNav({ allPages: collectionData.filter(post => post?.type === 'Page' && post.status === 'Published') })
  const customMenu = getCustomMenu({ collectionData, NOTION_CONFIG })
  const latestPosts = getLatestPosts({ allPages, from, latestPostCount: siteConfig('LATEST_POST_COUNT', 6, NOTION_CONFIG) })
  const allNavPages = getNavPages({ allPages })
  const allMembers = getAllMembers({ allPages })
  const allEvents = getAllEvents({ allPages })

  return {
    NOTION_CONFIG, notice, siteInfo, allPages, allMembers, allEvents, allNavPages, collection, collectionQuery, collectionId, collectionView, viewIds, block, schema, tagOptions, categoryOptions, rawMetadata, customNav, customMenu, postCount, pageIds, latestPosts
  }
}

function handleDataBeforeReturn(db) {
  delete db.block
  delete db.schema
  delete db.rawMetadata
  delete db.pageIds
  delete db.viewIds
  delete db.collection
  delete db.collectionQuery
  delete db.collectionId
  delete db.collectionView

  if (db?.notice) {
    db.notice = cleanBlock(db?.notice)
    delete db.notice?.id
  }

  db.categoryOptions = cleanIds(db?.categoryOptions)
  db.customMenu = cleanIds(db?.customMenu)
  db.allNavPages = shortenIds(db?.allNavPages)
  db.tagOptions = cleanTagOptions(db?.tagOptions)
  db.allNavPages = cleanPages(db?.allNavPages, db.tagOptions)
  db.allPages = cleanPages(db.allPages, db.tagOptions)
  db.allMembers = cleanPages(db.allMembers, db.tagOptions)
  db.allEvents = cleanPages(db.allEvents, db.tagOptions)
  db.latestPosts = cleanPages(db.latestPosts, db.tagOptions)

  const POST_SCHEDULE_PUBLISH = siteConfig('POST_SCHEDULE_PUBLISH', null, db.NOTION_CONFIG)
  if (POST_SCHEDULE_PUBLISH) {
    db.allPages?.forEach(p => {
      if (p.type === 'Event' || p.type === 'Member') return
      if (!isInRange(p.title, p.date)) {
        p.status = 'Invisible'
      }
    })
  }

  return db
}

function cleanPages(allPages, tagOptions) {
  if (!Array.isArray(allPages) || !Array.isArray(tagOptions)) return allPages || []
  const validTags = new Set(tagOptions.map(tag => (typeof tag.name === 'string' ? tag.name : null)).filter(Boolean))
  allPages.forEach(page => {
    if (Array.isArray(page.tagItems)) {
      page.tagItems = page.tagItems.filter(tagItem => validTags.has(tagItem?.name) && typeof tagItem.name === 'string')
    }
  })
  return allPages
}

function shortenIds(items) {
  if (items && Array.isArray(items)) {
    return items.map(item => {
      const { id, ...rest } = item
      return { ...rest, short_id: getShortId(id) }
    })
  }
  return items
}

function cleanIds(items) {
  if (items && Array.isArray(items)) {
    return items.map(({ id, ...rest }) => rest)
  }
  return items
}

function cleanTagOptions(tagOptions) {
  if (tagOptions && Array.isArray(tagOptions)) {
    return tagOptions.filter(tagOption => tagOption.source === 'Published').map(({ id, source, ...rest }) => rest)
  }
  return tagOptions
}

function cleanBlock(item) {
  const post = deepClone(item)
  const pageBlock = post?.blockMap?.block
  if (pageBlock) {
    for (const i in pageBlock) {
      pageBlock[i] = cleanBlock(pageBlock[i])
      delete pageBlock[i]?.role
      delete pageBlock[i]?.value?.version
      delete pageBlock[i]?.value?.created_by_id
      delete pageBlock[i]?.value?.space_id
    }
  }
  return post
}

function getLatestPosts({ allPages, from, latestPostCount }) {
  const allPosts = allPages?.filter(page => page.type === 'Post' && page.status === 'Published')
  return [...(allPosts ?? [])].sort((a, b) => {
    const dateA = new Date(a?.lastEditedDate || a?.publishDate)
    const dateB = new Date(b?.lastEditedDate || b?.publishDate)
    return dateB - dateA
  }).slice(0, latestPostCount)
}

function getCustomNav({ allPages }) {
  const customNav = []
  if (allPages && allPages.length > 0) {
    allPages.forEach(p => {
      p.to = p.slug
      customNav.push({ icon: p.icon || null, name: p.title || p.name || '', href: p.href, target: p.target, show: true })
    })
  }
  return customNav
}

function getCustomMenu({ collectionData, NOTION_CONFIG }) {
  const menuPages = collectionData.filter(post => post.status === 'Published' && (post?.type === 'Menu' || post?.type === 'SubMenu'))
  const menus = []
  if (menuPages && menuPages.length > 0) {
    menuPages.forEach(e => {
      e.show = true
      if (e.type === 'Menu') {
        menus.push(e)
      } else if (e.type === 'SubMenu') {
        const parentMenu = menus[menus.length - 1]
        if (parentMenu) {
          if (parentMenu.subMenus) { parentMenu.subMenus.push(e) } else { parentMenu.subMenus = [e] }
        }
      }
    })
  }
  return menus
}

function getTagOptions(schema) {
  if (!schema) return {}
  const tagSchema = Object.values(schema).find(e => e.name === BLOG.NOTION_PROPERTY_NAME.tags)
  return tagSchema?.options || []
}

function getCategoryOptions(schema) {
  if (!schema) return {}
  const categorySchema = Object.values(schema).find(e => e.name === BLOG.NOTION_PROPERTY_NAME.category)
  return categorySchema?.options || []
}

/**
 * サイト情報
 */
function getSiteInfo({ collection, block, rawMetadata, NOTION_CONFIG }) {
  const defaultTitle = NOTION_CONFIG?.TITLE || 'NotionNext BLOG'
  const defaultDescription = NOTION_CONFIG?.DESCRIPTION || 'これはNotionNextで生成されたサイトです'
  const defaultPageCover = NOTION_CONFIG?.HOME_BANNER_IMAGE || '/bg_image.jpg'
  const defaultIcon = NOTION_CONFIG?.AVATAR || '/avatar.svg'
  const defaultLink = NOTION_CONFIG?.LINK || BLOG.LINK

  if (!collection && !block) {
    return { title: defaultTitle, description: defaultDescription, pageCover: defaultPageCover, icon: defaultIcon, link: defaultLink }
  }

  const title = collection?.name?.[0][0] || defaultTitle
  const description = collection?.description ? Object.assign(collection).description[0][0] : defaultDescription
  const pageCover = collection?.cover ? mapImgUrl(collection?.cover, collection, 'collection') : rawMetadata?.format?.page_cover ? mapImgUrl(rawMetadata?.format?.page_cover, rawMetadata, 'block') : defaultPageCover

  let icon = compressImage(collection?.icon ? mapImgUrl(collection?.icon, collection, 'collection') : defaultIcon)
  const link = NOTION_CONFIG?.LINK || defaultLink
  const emojiPattern = /\uD83C[\uDF00-\uDFFF]|\uD83D[\uDC00-\uDE4F]/g
  if (!icon || emojiPattern.test(icon)) icon = defaultIcon

  return { title, description, pageCover, icon, link }
}

function isInRange(title, date = {}) {
  const { start_date, start_time = '00:00', end_date, end_time = '23:59', time_zone = 'Asia/Tokyo' } = date
  const currentTimestamp = Date.now()
  const startTimestamp = getTimestamp(start_date, start_time, time_zone)
  const endTimestamp = getTimestamp(end_date, end_time, time_zone)
  if (startTimestamp && currentTimestamp < startTimestamp) return false
  if (endTimestamp && currentTimestamp > endTimestamp) return false
  return true
}

function convertToUTC(dateStr, timeZone = 'Asia/Tokyo') {
  const timeZoneOffsets = { 'Asia/Tokyo': 9, 'UTC': 0 }
  const offsetHours = timeZoneOffsets[timeZone] || 9
  const localDate = new Date(`${dateStr.replace(' ', 'T')}Z`)
  return new Date(localDate.getTime() - offsetHours * 3600 * 1000)
}

function getTimestamp(date, time = '00:00', time_zone) {
  if (!date) return null
  return convertToUTC(`${date} ${time}:00`, time_zone).getTime()
}

export function getNavPages({ allPages }) {
  const allNavPages = allPages?.filter(post => post && post?.slug && post?.type === 'Post' && post?.status === 'Published')
  return allNavPages.map(item => ({
    id: item.id, title: item.title || '', pageCoverThumbnail: item.pageCoverThumbnail || '', category: item.category || null, tags: item.tags || null, summary: item.summary || null, slug: item.slug, href: item.href, pageIcon: item.pageIcon || '', lastEditedDate: item.lastEditedDate, publishDate: item.publishDate, ext: item.ext || {}
  }))
}

export function getAllMembers({ allPages }) {
  if (!Array.isArray(allPages)) return []
  const published = allPages.filter(page => page?.type === 'Member' && page?.status === 'Published')
  return published.map(m => ({
    id: m.id || '', title: m.title || '', type: m.type || 'Member', status: m.status || 'Published', slug: m.slug || '', summary: m.summary || '', avatar: m.avatar || '', quote: m.quote || '', role: m.role || '', bio: m.bio || '', featured: m.featured || '', verified: m.verified || '', sortOrder: m.sortOrder ?? null, joinedAtText: m.joinedAtText || '', pageIcon: m.pageIcon || '', pageCoverThumbnail: m.pageCoverThumbnail || '', pageCover: m.pageCover || '', publishDate: m.publishDate ?? null
  })).sort((a, b) => (b?.publishDate ?? 0) - (a?.publishDate ?? 0))
}

export function getAllEvents({ allPages }) {
  if (!Array.isArray(allPages)) return []
  return allPages.filter(page => page?.type === 'Event' && page?.status === 'Published').sort((a, b) => (b?.publishDate ?? 0) - (a?.publishDate ?? 0))
}
