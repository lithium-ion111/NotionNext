import { BLOG } from '@/blog.config'
import algoliasearch from 'algoliasearch'
import { getPostBlocks } from '@/lib/notion' // 読み込み先を標準的なものに変更
import { getAllPosts } from '@/lib/notion/getNotionData' // 汎用的な関数に変更

/**
 * Algolia同期用API
 */
export default async function handler(req, res) {
  if (BLOG.ALGOLIA_APP_ID && BLOG.ALGOLIA_ADMIN_APP_KEY && BLOG.ALGOLIA_INDEX_NAME) {
    try {
      const client = algoliasearch(BLOG.ALGOLIA_APP_ID, BLOG.ALGOLIA_ADMIN_APP_KEY)
      const index = client.initIndex(BLOG.ALGOLIA_INDEX_NAME)

      // Notionから全記事を取得
      const allPosts = await getAllPosts({ from: 'api-algolia' })

      if (!allPosts) {
        return res.status(500).json({ message: 'No posts found in Notion' })
      }

      // Algolia形式に変換
      const records = allPosts.map(post => ({
        objectID: post.id,
        title: post.title || '',
        slug: post.slug || '',
        date: post.date?.start_date || post.lastEditedTime,
        category: post.category || [],
        tags: post.tags || [],
        summary: post.summary || ''
      }))

      // Algoliaへ保存
      await index.saveObjects(records)
      res.status(200).json({ message: 'success', count: records.length })
    } catch (error) {
      console.error('Algolia Error:', error)
      res.status(500).json({ message: 'error', error: error.message })
    }
  } else {
    res.status(404).json({ message: 'Algolia config not found' })
  }
}
