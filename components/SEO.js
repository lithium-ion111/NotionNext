import { siteConfig } from '@/lib/config'
import { useGlobal } from '@/lib/global'
import { loadExternalResource } from '@/lib/utils'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { useEffect } from 'react'

const SEO = props => {
  const { children, siteInfo, post, NOTION_CONFIG } = props
  const router = useRouter()
  const locale = useGlobal()?.locale
  
  // --- 基本設定の読み込み ---
  const TITLE = siteConfig('TITLE')
  const AUTHOR = siteConfig('AUTHOR')
  const BLOG_FAVICON = siteConfig('BLOG_FAVICON')
  const BACKGROUND_DARK = siteConfig('BACKGROUND_DARK', '', NOTION_CONFIG)
  const webFontUrl = siteConfig('FONT_URL')

  // --- 中国語のデフォルト文言を強制的に日本語へ上書き ---
  const defaultDesc = 'ホワサバ勉強会の備忘録ブログです' // ←ここを好きな説明文に変えてください
  let description = siteInfo?.description
  if (!description || description.includes('NotionNext')) {
    description = defaultDesc
  }

  // --- メタデータの取得 ---
  const meta = getSEOMeta(props, router, locale)
  const title = meta?.title || TITLE
  const pageDescription = meta?.description || description
  
  useEffect(() => {
    loadExternalResource(
      'https://cdnjs.cloudflare.com/ajax/libs/webfont/1.6.28/webfontloader.js',
      'js'
    ).then(() => {
      if (window?.WebFont) {
        window.WebFont.load({ custom: { urls: webFontUrl } })
      }
    })
  }, [webFontUrl])

  return (
    <Head>
      <link rel='icon' href={BLOG_FAVICON} />
      <title>{title}</title>
      <meta name='description' content={pageDescription} />
      <meta name='keywords' content={meta?.tags || siteConfig('KEYWORDS')} />
      <meta name='author' content={AUTHOR} />
      <meta name='viewport' content='width=device-width, initial-scale=1.0' />
      <meta property='og:title' content={title} />
      <meta property='og:description' content={pageDescription} />
      <meta property='og:type' content={meta?.type || 'website'} />
      <meta name='twitter:card' content='summary_large_image' />
      {children}
    </Head>
  )
}

/**
 * SEO情報の組み立て
 */
const getSEOMeta = (props, router, locale) => {
  const { post, siteInfo } = props
  const keyword = router?.query?.s

  switch (router.route) {
    case '/':
      return {
        title: `${siteInfo?.title}`, // タイトルのみにする
        description: siteInfo?.description?.includes('NotionNext') ? siteInfo?.title : siteInfo?.description,
        slug: '',
        type: 'website'
      }
    case '/archive':
      return {
        title: `${locale?.NAV?.ARCHIVE} | ${siteInfo?.title}`,
        slug: 'archive',
        type: 'website'
      }
    case '/search':
      return {
        title: `${keyword || ''}${keyword ? ' | ' : ''}${locale?.NAV?.SEARCH} | ${siteInfo?.title}`,
        slug: 'search',
        type: 'website'
      }
    default:
      return {
        title: post ? `${post?.title} | ${siteInfo?.title}` : `${siteInfo?.title}`,
        description: post?.summary,
        type: post?.type || 'website',
        slug: post?.slug || ''
      }
  }
}

export default SEO
