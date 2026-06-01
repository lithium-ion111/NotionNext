/**
 * 一些插件
 */
module.exports = {
  // 网站全文搜索
  ALGOLIA_APP_ID: process.env.NEXT_PUBLIC_ALGOLIA_APP_ID || null,
  ALGOLIA_ADMIN_APP_KEY: process.env.ALGOLIA_ADMIN_APP_KEY || null,
  // ↓ ここを API_KEY に修正しました
  ALGOLIA_SEARCH_ONLY_APP_KEY: process.env.NEXT_PUBLIC_ALGOLIA_API_KEY || null,
  // ↓ ここを INDEX_NAME に修正しました
  ALGOLIA_INDEX: process.env.NEXT_PUBLIC_ALGOLIA_INDEX_NAME || null,

  // 邮件
  MAILCHIMP_LIST_ID: process.env.MAILCHIMP_LIST_ID || null,
  MAILCHIMP_API_KEY: process.env.MAILCHIMP_API_KEY || null
}
