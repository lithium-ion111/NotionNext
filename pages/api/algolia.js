import { BLOG } from '../../blog.config'
import algoliasearch from 'algoliasearch'
// 特定した正確な階層からインポートします
import { fetchGlobalAllData } from '../../lib/db/SiteDataApi'

/**
 * Algolia同期用API (パス特定完了版)
 */
export default async function handler(req, res) {
  if (BLOG.ALGOLIA_APP_ID && BLOG.ALGOLIA_ADMIN_APP_KEY && BLOG.ALGOLIA_INDEX_NAME) {
    try {
      const client = algoliasearch(BLOG.ALGOLIA_APP_ID, BLOG.ALGOLIA_ADMIN_APP_KEY)
      const index = client.initIndex(BLOG.ALGOLIA_INDEX_NAME)

      // 特定したファイル内の関数を呼び出し
      const siteData = await fetchGlobalAllData({ 
        pageId: BLOG.NOTION_PAGE_ID, 
        from: 'api-algolia' 
      })

      // NotionNext v4.9.x では allPages に記事一覧が入っています
      const allPosts = siteData?.allPages || []

      if (allPosts.length === 0) {
        return res.status(500).json({ message: 'Notion data is empty. Check your Notion ID.' })
      }

      // Algolia形式に整形
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

      // Algoliaへ保存
      await index.saveObjects(records)
      res.status(200).json({ message: 'success', count: records.length })
    } catch (error) {
      console.error('Algolia Sync Error:', error)
      res.status(500).json({ message: 'error', error: error.message })
    }
  } else {
    res.status(404).json({ message: 'Algolia configuration missing' })
  }
}
