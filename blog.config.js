// 注: process.env.XX是Vercel的环境变量，配置方式见：https://docs.tangly1024.com/article/how-to-config-notion-next#c4768010ae7d44609b744e79e2f9959a

const BLOG = {
  API_BASE_URL: process.env.API_BASE_URL || 'https://www.notion.so/api/v3',
  NOTION_PAGE_ID: process.env.NOTION_PAGE_ID || '3721e1f18e4880b98ea7c74f67aa9ab8',
  THEME: process.env.NEXT_PUBLIC_THEME || 'heo', 
  LANG: process.env.NEXT_PUBLIC_LANG || 'ja-JP',
  SINCE: process.env.NEXT_PUBLIC_SINCE || 2026,

  PSEUDO_STATIC: process.env.NEXT_PUBLIC_PSEUDO_STATIC || false,
  NEXT_REVALIDATE_SECOND: process.env.NEXT_PUBLIC_REVALIDATE_SECOND || 60,
  REVALIDATION_TOKEN: process.env.REVALIDATION_TOKEN || '',
  APPEARANCE: process.env.NEXT_PUBLIC_APPEARANCE || 'light',
  APPEARANCE_DARK_TIME: process.env.NEXT_PUBLIC_APPEARANCE_DARK_TIME || [18, 6],

  HOME_BANNER: process.env.NEXT_PUBLIC_HOME_BANNER || false,
  AUTHOR: 'ホワサバ勉強会保管庫',
  BIO: '勉強会の情報を趣味でまとめています。',
  AVATAR: ' ', 
  LINK: process.env.NEXT_PUBLIC_LINK || 'https://notion-next-coral.vercel.app',
  KEYWORDS: process.env.NEXT_PUBLIC_KEYWORD || 'ホワイトアウトサバイバル, ホワサバ, 攻略, 勉強会',
  BLOG_FAVICON: process.env.NEXT_PUBLIC_FAVICON || '/favicon.ico',
  BEI_AN: process.env.NEXT_PUBLIC_BEI_AN || '',
  BEI_AN_LINK: process.env.NEXT_PUBLIC_BEI_AN_LINK || 'https://beian.miit.gov.cn/',
  BEI_AN_GONGAN: process.env.NEXT_PUBLIC_BEI_AN_GONGAN || '',

  // HEO主題固有設定
  HEO_MENU_DISPLAY: process.env.NEXT_PUBLIC_HEO_MENU_DISPLAY || true,
  HEO_HERO_ENABLE: true,
  HEO_HERO_TITLE_1: 'ホワサバ攻略',
  HEO_HERO_TITLE_2: '知りたい情報を探す',
  HEO_HERO_TITLE_3: 'WOS STUDY GROUP',
  HEO_HERO_TITLE_4: ' ',
  HEO_HERO_TITLE_5: ' ',
  HEO_HERO_TITLE_LINK: ' ',
  HEO_HERO_ICON: ' ', 
  HEO_HERO_CATEGORY_1: { title: 'ショップ一覧', url: '/category/ショップ' },
  HEO_HERO_CATEGORY_2: { title: '専門家', url: '/category/専門家' },
  HEO_MENU_SEARCH: true,
  // Algolia設定
  // --- Algolia設定を直接書く（Vercelの環境変数は無視してOKになります） ---
  ALGOLIA_APP_ID: 'IHXV2HGHS3', // スクリーンショットで見えたIDです
  ALGOLIA_API_KEY: '72f8a1c340abfe7239ea4615d15f8058', // Search API Key
  ALGOLIA_INDEX_NAME: 'notion_next',
  ALGOLIA_ADMIN_APP_KEY: '70b4a739d2f6dd8dbcf8ca6df10ec7b9', // これが最重要！

  // 其它复杂配置
  ...require('./conf/comment.config'),
  ...require('./conf/contact.config'),
  ...require('./conf/post.config'),
  ...require('./conf/analytics.config'),
  ...require('./conf/image.config'),
  ...require('./conf/font.config'),
  ...require('./conf/right-click-menu'),
  ...require('./conf/code.config'),
  ...require('./conf/animation.config'),
  ...require('./conf/widget.config'),
  ...require('./conf/ad.config'),
  ...require('./conf/plugin.config'),
  ...require('./conf/ai.config'),
  ...require('./conf/performance.config'),
  ...require('./conf/top-tag.config'),

  // 高级用法
  ...require('./conf/layout-map.config'),
  ...require('./conf/notion.config'),
  ...require('./conf/dev.config'),

  CUSTOM_EXTERNAL_JS: [''],
  CUSTOM_EXTERNAL_CSS: [''],
  CUSTOM_MENU: process.env.NEXT_PUBLIC_CUSTOM_MENU || true,
  CAN_COPY: process.env.NEXT_PUBLIC_CAN_COPY || true,
  ...require('./conf/techgrow.config'),

  LAYOUT_SIDEBAR_REVERSE: process.env.NEXT_PUBLIC_LAYOUT_SIDEBAR_REVERSE || false,
  LAYOUT_LANDING_ENABLE: process.env.NEXT_PUBLIC_LAYOUT_LANDING_ENABLE || false,
  GREETING_WORDS: process.env.NEXT_PUBLIC_GREETING_WORDS || 'ホワサバ勉強会保管庫です．誰でも情報を追加できます．',
  UUID_REDIRECT: process.env.UUID_REDIRECT || false
}

module.exports = BLOG
