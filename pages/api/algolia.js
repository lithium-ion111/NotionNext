import { BLOG } from '@/blog.config'
import algoliasearch from 'algoliasearch'
import { getDataFromNotion } from '@/lib/notion/getNotionData' 

/**
 * Algolia同期用API (v4 最新安定版)
 */
export default async function handler(req, res) {
  if (BLOG.ALGOLIA_APP_ID && BLOG.ALGOLIA_ADMIN_APP_KEY && BLOG.ALGOLIA_INDEX_NAME) {
    try {
      const client = algoliasearch(BLOG.ALGOLIA_APP_ID, BLOG.ALGOLIA_ADMIN_APP_KEY)
      const index = client.initIndex(BLOG.ALGOLIA_INDEX_NAME)

      // v4で最も安定しているデータ取得メソッドを使用
      const allPosts = await getDataFromNotion({ from: 'api-algolia' })

      if (!allPosts || allPosts.length === 0) {
        return res.status(500).json({ message: 'Notion data is empty' })
      }

      const records = allPosts.map(post => ({
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
      console.error('Algolia Sync Error:', error)
      res.status(500).json({ message: 'error', error: error.message })
    }
  } else {
    res.status(404).json({ message: 'Algolia configuration missing' })
  }
}
