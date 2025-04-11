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
async function processPage(scraper, rows, page) {
  const products = [];

  for (const row of rows) {
    try {
      const titleLink = await row.$(config.selectors.productTitle);
      if (titleLink) {
        const href = await page.evaluate((el) => el.href, titleLink);
        const title = await page.evaluate(
          (el) => el.textContent?.trim(),
          titleLink
        );

        console.log(`\n处理商品: ${title}`);
        console.log(`链接: ${href}`);

        // 在新标签页获取详细信息
        const details = await scraper.getProductDetails(href);

        // 添加商品标题
        details.title = title;
        products.push(details);

        // 输出进度
        console.log(`当前页已处理 ${products.length}/${rows.length} 个商品`);
        console.log("------------------------");
      }
    } catch (error) {
      console.error("处理商品时出错:", error.message);
    }
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
        const pageProducts = await processPage(scraper, rows, browser.page);
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
