import { BrowserController } from "./browser.js";
import { Scraper } from "./scraper.js";
import { config } from "./config.js";

/**
 * 处理单页的商品数据
 * @param {Scraper} scraper - 爬虫实例
 * @param {Array} rows - 商品行元素数组
 * @param {Page} page - 页面实例
 * @returns {Promise<Array>} 商品数据数组
 */
/**
 * 处理单个商品
 */
async function processProduct(scraper, row, page, globalIndex, currentPage) {
  try {
    const titleLink = await row.$(config.selectors.productTitle);
    if (!titleLink) {
      return null;
    }

    const href = await page.evaluate((el) => el.href, titleLink);
    const title = await page.evaluate(
      (el) => el.textContent?.trim(),
      titleLink
    );

    console.log(`\n处理商品[${globalIndex}]: ${title}`);
    console.log(`链接: ${href}`);

    // 在新标签页获取详细信息
    const details = await scraper.getProductDetails(href);

    // 添加商品信息
    details.title = title;
    details.index = globalIndex;
    details.page = currentPage;

    return details;
  } catch (error) {
    console.error("处理商品时出错:", error.message);
    return null;
  }
}

/**
 * 并发处理一批商品
 */
async function processBatch(scraper, batch, page, startIndex, currentPage) {
  const promises = batch.map((row, index) => {
    const globalIndex = startIndex + index;
    return processProduct(scraper, row, page, globalIndex, currentPage);
  });

  return Promise.all(promises);
}

/**
 * 处理单页的商品数据
 */
async function processPage(scraper, rows, page, currentPage) {
  const products = [];
  const batchSize = config.concurrency;

  // 将商品分成多个批次处理
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const startIndex = (currentPage - 1) * rows.length + i + 1;

    console.log(
      `\n处理第${currentPage}页 - 批次${Math.floor(i / batchSize) + 1}`
    );

    // 并发处理当前批次
    const batchResults = await processBatch(
      scraper,
      batch,
      page,
      startIndex,
      currentPage
    );

    // 过滤掉失败的结果，并按顺序添加到产品列表
    products.push(...batchResults.filter((result) => result !== null));

    // 输出进度
    console.log(
      `当前页已处理 ${Math.min(i + batchSize, rows.length)}/${
        rows.length
      } 个商品`
    );
    console.log("------------------------");
  }

  return products;
}

async function main() {
  const browser = new BrowserController();

  try {
    // 初始化浏览器
    await browser.initialize();

    // 打开目标页面并等待用户登录
    await browser.openPage();
    await browser.waitForUserLogin();
    console.log("登录完成，开始获取商品列表");

    const scraper = new Scraper(browser.page);
    const allProducts = [];
    let currentPage = 1;

    try {
      while (currentPage <= config.pageLimit) {
        console.log(`\n开始处理第 ${currentPage} 页`);

        // 等待商品表格加载
        await browser.page.waitForSelector(config.selectors.productRow, {
          timeout: config.timeouts.elementWait,
        });

        // 获取当前页的所有商品行
        const rows = await browser.page.$$(config.selectors.productRow);
        console.log(`当前页找到 ${rows.length} 个商品`);

        // 处理当前页的所有商品
        const pageProducts = await processPage(
          scraper,
          rows,
          browser.page,
          currentPage
        );
        allProducts.push(...pageProducts);

        // 检查是否有下一页
        const hasNextPage = await browser.page.$(
          config.selectors.nextPageButton
        );
        if (!hasNextPage || currentPage >= config.pageLimit) {
          console.log("已达到最后一页或页数限制");
          break;
        }

        // 点击下一页
        await browser.page.click(config.selectors.nextPageButton);
        console.log("正在跳转到下一页...");

        // 等待页面加载
        await new Promise((resolve) =>
          setTimeout(resolve, config.timeouts.pageDelay)
        );
        currentPage++;
      }

      // 输出最终结果
      console.log("\n采集完成!");
      console.log(`共采集 ${currentPage} 页，${allProducts.length} 个商品`);
      console.log("采集结果:", JSON.stringify(allProducts, null, 2));
    } catch (error) {
      console.error("获取商品列表失败:", error.message);
    }

    // 保持浏览器打开以便查看结果
    // await browser.close();
  } catch (error) {
    console.error("程序运行错误:", error);
  }
}

main().catch(console.error);
