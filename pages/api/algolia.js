import { BLOG } from '@/blog.config'
import { NotionPageData } from '@/lib/notion/NotionPageData'
import algoliasearch from 'algoliasearch'

/**
 * Algolia同期用API
 * URL: /api/algolia
 */
const handler = async (req, res) => {
  if (BLOG.ALGOLIA_APP_ID && BLOG.ALGOLIA_ADMIN_APP_KEY && BLOG.ALGOLIA_INDEX_NAME) {
    try {
      const client = algoliasearch(BLOG.ALGOLIA_APP_ID, BLOG.ALGOLIA_ADMIN_APP_KEY)
      const index = client.initIndex(BLOG.ALGOLIA_INDEX_NAME)

      // Notionから全記事を取得
      const pageData = new NotionPageData()
      const allPosts = await pageData.getAllPosts()

      // Algolia形式に変換
      const records = allPosts.map(post => ({
        objectID: post.id,
        title: post.title,
        slug: post.slug,
        date: post.date,
        category: post.category,
        tags: post.tags,
        summary: post.summary
      }))

      // Algoliaへ保存
      await index.saveObjects(records)
      res.status(200).json({ message: 'success', count: records.length })
    } catch (error) {
      res.status(500).json({ message: 'error', error: error.message })
    }
  } else {
    res.status(404).json({ message: 'Algolia config not found' })
  }
}

export default handler
