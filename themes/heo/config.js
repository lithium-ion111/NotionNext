const CONFIG = {
  HEO_HOME_POST_TWO_COLS: true, // 記事を2列で表示（一覧性が高いので攻略向け）
  HEO_LOADING_COVER: false,     // 読み込みアニメをオフ（爆速表示）

  HEO_HOME_BANNER_ENABLE: true, // 看板は出す

  HEO_SITE_CREATE_TIME: '2026-06-01',

  // 不要な通知バーは空に
  HEO_NOTICE_BAR: [],

  HEO_HERO_REVERSE: false,
  HEO_HERO_BODY_REVERSE: false,

  // --- 看板（タイトル）の設定 ---
  HEO_HERO_TITLE_1: 'ホワイトアウト・サバイバル', // ゲーム名
  HEO_HERO_TITLE_2: '攻略データベース',          // サイトの目的
  HEO_HERO_TITLE_3: 'HOWASABA.COM',
  HEO_HERO_TITLE_4: '',                         // 空欄にしてスッキリ
  HEO_HERO_TITLE_5: ' ',
  HEO_HERO_TITLE_LINK: '/',
  HEO_HERO_COVER_TITLE: '攻略記事を見る',

  // 看板の下に置く主要カテゴリ（Wikiのトップメニュー風）
  HEO_HERO_CATEGORY_1: { title: '初心者ガイド', url: '/tag/初心者' },
  HEO_HERO_CATEGORY_2: { title: 'キャラ一覧', url: '/tag/キャラ' },
  HEO_HERO_CATEGORY_3: { title: '最新イベント', url: '/tag/イベント' },

  HEO_HERO_RECOMMEND_POST_TAG: 'おすすめ',
  HEO_HERO_RECOMMEND_POST_SORT_BY_UPDATE_TIME: true, // 更新順に並べる
  HEO_HERO_RECOMMEND_COVER_ENABLE: false,

  // --- 自己紹介系はすべて空にして削除 ---
  HEO_INFOCARD_GREETINGS: [], 
  HEO_GROUP_ICONS: [],
  
  HEO_INFO_CARD_URL1: '/about',
  HEO_INFO_CARD_ICON1: 'fas fa-user',
  HEO_INFO_CARD_URL2: '',
  HEO_INFO_CARD_ICON2: '',
  HEO_INFO_CARD_URL3: '',
  HEO_INFO_CARD_TEXT3: '詳細',

  HEO_SOCIAL_CARD: false, // 交流カードは不要

  // 統計ラベル（日本語化のみ）
  HEO_POST_COUNT_TITLE: '記事数:',
  HEO_SITE_TIME_TITLE: '運営日数:',
  HEO_SITE_VISIT_TITLE: '総閲覧数:',
  HEO_SITE_VISITOR_TITLE: '訪客数:',

  // メニュー表示
  HEO_MENU_INDEX: true,
  HEO_MENU_CATEGORY: true,
  HEO_MENU_TAG: true,
  HEO_MENU_ARCHIVE: true,
  HEO_MENU_SEARCH: true,

  HEO_POST_LIST_COVER: true,
  HEO_POST_LIST_COVER_HOVER_ENLARGE: false,
  HEO_POST_LIST_COVER_DEFAULT: true,
  HEO_POST_LIST_SUMMARY: true,
  HEO_POST_LIST_PREVIEW: false,
  HEO_POST_LIST_IMG_CROSSOVER: false, // 画像は左固定で見やすく

  HEO_ARTICLE_ADJACENT: true,
  HEO_ARTICLE_COPYRIGHT: false, // 攻略サイトなのでコピーライト表示を消してスッキリ
  HEO_ARTICLE_NOT_BY_AI: false,
  HEO_ARTICLE_RECOMMEND: true,

  HEO_WIDGET_LATEST_POSTS: true,
  HEO_WIDGET_ANALYTICS: false,
  HEO_WIDGET_TO_TOP: true,
  HEO_WIDGET_TO_COMMENT: false, // 攻略サイトにコメント機能が不要ならfalse
  HEO_WIDGET_DARK_MODE: true,
  HEO_WIDGET_TOC: true // 目次は絶対必要
}
export default CONFIG
