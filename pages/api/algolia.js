import { BLOG } from '@/blog.config'
import algoliasearch from 'algoliasearch'
import { getAllPosts } from '@/db/getNotionData' // lib/notion ではなく db から読み込む

/**
 * Algolia同期用API (v4対応版)
 */
export default async function handler(req, res) {
  // 必要な設定があるか確認
  if (BLOG.ALGOLIA_APP_ID && BLOG.ALGOLIA_ADMIN_APP_KEY && BLOG.ALGOLIA_INDEX_NAME) {
    try {
      const client = algoliasearch(BLOG.ALGOLIA_APP_ID, BLOG.ALGOLIA_ADMIN_APP_KEY)
      const index = client.initIndex(BLOG.ALGOLIA_INDEX_NAME)

      // 最新の db モジュールから記事を取得
      const allPosts = await getAllPosts({ from: 'api-algolia' })

      if (!allPosts || allPosts.length === 0) {
        return res.status(500).json({ message: 'Notionから記事を取得できませんでした。IDや公開設定を確認してください。' })
      }

      // Algolia用のデータ形式に整える
      const records = allPosts.map(post => ({
        objectID: post.id,
        title: post.title || '',
        slug: post.slug || '',
        date: post.publishDay || post.lastEditedDay,
        category: post.category || [],
        tags: post.tags || [],
        summary: post.summary || ''
      }))

      // Algoliaへ保存（既存データを上書き）
      await index.saveObjects(records)
      
      res.status(200).json({ message: 'success', count: records.length })
    } catch (error) {
      console.error('Algolia Sync Error:', error)
      res.status(500).json({ message: 'error', error: error.message })
    }
  } else {
    res.status(404).json({ message: 'Algoliaの設定(AppID, AdminKey, IndexName)が不足しています。' })
  }
}
