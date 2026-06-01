import { BLOG } from '../../blog.config'
import algoliasearch from 'algoliasearch'
// あなたの環境における「記事一覧取得」の正解ルートはここです
import { getAllPosts } from '../../db/getNotionData'

export default async function handler(req, res) {
  // 1. 設定チェック
  if (!BLOG.ALGOLIA_APP_ID || !BLOG.ALGOLIA_ADMIN_APP_KEY || !BLOG.ALGOLIA_INDEX_NAME) {
    return res.status(404).json({ message: 'Algolia config missing in blog.config.js' })
  }

  try {
    const client = algoliasearch(BLOG.ALGOLIA_APP_ID, BLOG.ALGOLIA_ADMIN_APP_KEY)
    const index = client.initIndex(BLOG.ALGOLIA_INDEX_NAME)

    // 2. 記事データの取得
    // さきほど確認した getNotionAPI.js 等を裏側で使っている getAllPosts を呼び出します
    const allPosts = await getAllPosts({ from: 'api-algolia' })

    if (!allPosts || allPosts.length === 0) {
      return res.status(500).json({ message: 'Notionから記事を取得できませんでした。IDを確認してください。' })
    }

    // 3. Algolia用の形式に変換
    const records = allPosts.map(post => ({
      objectID: post.id,
      title: post.title || '',
      slug: post.slug || '',
      date: post.publishDate || post.lastEditedTime,
      category: post.category || [],
      tags: post.tags || [],
      summary: post.summary || ''
    }))

    // 4. Algoliaへ保存
    await index.saveObjects(records)
    
    res.status(200).json({ message: 'success', count: records.length })
  } catch (error) {
    console.error('Algolia Sync Error:', error)
    res.status(500).json({ message: 'error', error: error.message })
  }
}
