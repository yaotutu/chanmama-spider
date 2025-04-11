export const config = {
  // 基础URL配置
  baseUrl:
    "https://www.chanmama.com/promotionRank/?keyword=&has_jx_commission=0",

  // 浏览器配置
  browser: {
    headless: false,
    userDataDir: "./user-data",
    defaultViewport: {
      width: 1920,
      height: 1080,
    },
    args: [
      "--start-maximized",
      "--disable-blink-features=AutomationControlled",
      "--disable-infobars",
    ],
  },

  // 浏览器指纹配置
  fingerprint: {
    // 随机的用户代理
    userAgents: [
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    ],
    // WebGL指纹随机化
    webglVendor: ["Google Inc.", "Apple Inc.", "Intel Inc."],
    webglRenderer: [
      "ANGLE (Intel, Intel(R) UHD Graphics Direct3D11 vs_5_0)",
      "ANGLE (AMD Radeon(TM) Graphics Direct3D11 vs_5_0)",
    ],
  },

  // 行为模式配置
  behavior: {
    // 随机延迟范围（毫秒）
    delayRange: {
      min: 1500,
      max: 4000,
    },
    // 鼠标移动配置
    mouse: {
      movePoints: 5, // 鼠标移动的中间点数量
      moveDelay: 100, // 每个点之间的延迟（毫秒）
    },
    // 滚动配置
    scroll: {
      smoothness: 100, // 滚动的平滑度（越大越平滑）
      chunk: 200, // 每次滚动的像素
    },
  },

  // 页面选择器
  selectors: {
    // 列表页
    productRow: "tbody > tr",
    productTitle: "a.ellipsis-2, a.product-title",
    nextPageButton: ".el-pagination .btn-next:not(.is-disabled)",

    // 详情页
    detailContainer:
      "#app > div.festival-theme.product-detail-page > div.product-detail-content.pt15.pb20 > div.product-info-content",
    copyLinkButton: 'div[title="复制商品链接"]',
    shopLabel: "span",
  },

  // 抓取配置
  concurrency: 10, // 并发处理数量
  pageLimit: 1, // 最大采集页数

  // 超时配置（毫秒）
  timeouts: {
    pageLoad: 30000,
    elementWait: 5000,
    pageDelay: [2000, 5000], // 翻页后随机等待时间范围
  },
};
