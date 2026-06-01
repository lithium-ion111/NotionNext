// 波括弧を外し、デフォルトインポートに変更して確実に読み込みます
import BLOG from '../../blog.config'
import algoliasearch from 'algoliasearch'
import { fetchGlobalAllData } from '../../lib/db/SiteDataApi'

/**
 * Algolia同期用API (Config読み込みエラー修正版)
 */
export default async function handler(req, res) {
  // BLOGが読み込めているかチェック
  if (BLOG && BLOG.ALGOLIA_APP_ID && BLOG.ALGOLIA_ADMIN_APP_KEY && BLOG.ALGOLIA_INDEX_NAME) {
    try {
      const client = algoliasearch(BLOG.ALGOLIA_APP_ID, BLOG.ALGOLIA_ADMIN_APP_KEY)
      const index = client.initIndex(BLOG.ALGOLIA_INDEX_NAME)

      // データを取得
      const siteData = await fetchGlobalAllData({ 
        pageId: BLOG.NOTION_PAGE_ID, 
        from: 'api-algolia' 
      })

      const allPosts = siteData?.allPages || []

      if (allPosts.length === 0) {
        return res.status(500).json({ message: 'Notion data is empty.' })
      }

      // 整形
      const records = allPosts
        .filter(post => post.type === 'Post' && post.status === 'Published')
        .map(post => ({
          objectID: post.id,
          title: post.title || '',
          slug: post.slug || '',
          date: post.publishDate || post.lastEditedTime,
          category: post.category || [],
          tags: post.tags || [],
          summary: post.summary || ''
        }))

      await index.saveObjects(records)
      res.status(200).json({ message: 'success', count: records.length })
    } catch (error) {
      res.status(500).json({ message: 'error', error: error.message })
    }
  } else {
    // どこが欠けているか詳細を出力するように変更
    res.status(404).json({ 
      message: 'Algolia configuration missing',
      check: {
        hasBLOG: !!BLOG,
        appId: !!BLOG?.ALGOLIA_APP_ID,
        indexName: !!BLOG?.ALGOLIA_INDEX_NAME
      }
    })
  }
}
