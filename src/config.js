export const config = {
  // 基础URL配置
  baseUrl:
    "https://www.chanmama.com/promotionRank/?keyword=&has_jx_commission=0",

  // 浏览器配置
  browser: {
    headless: false,
    userDataDir: "./user-data",
    defaultViewport: null,
    args: ["--start-maximized"],
  },

  // 页面选择器
  selectors: {
    // 列表页
    productRow: "tbody > tr",
    productTitle: "a.ellipsis-2, a.product-title",
    nextPageButton: ".el-pagination .btn-next:not(.is-disabled)",
    pageLimit: "2",

    // 详情页
    detailContainer:
      "#app > div.festival-theme.product-detail-page > div.product-detail-content.pt15.pb20 > div.product-info-content",
    copyLinkButton: 'div[title="复制商品链接"]',
    shopLabel: "span",
  },

  // 超时配置（毫秒）
  timeouts: {
    pageLoad: 30000,
    elementWait: 5000,
  },
};
