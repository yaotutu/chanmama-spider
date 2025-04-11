import { BrowserController } from "./browser.js";
import { Scraper } from "./scraper.js";
import { config } from "./config.js";

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

    try {
      // 等待商品表格加载
      await browser.page.waitForSelector(config.selectors.productRow, {
        timeout: config.timeouts.elementWait,
      });

      // 获取所有商品行
      const rows = await browser.page.$$(config.selectors.productRow);
      console.log(`找到 ${rows.length} 个商品行`);

      // 处理所有商品
      for (const row of rows) {
        try {
          const titleLink = await row.$(config.selectors.productTitle);
          if (titleLink) {
            const href = await browser.page.evaluate(
              (el) => el.href,
              titleLink
            );
            const title = await browser.page.evaluate(
              (el) => el.textContent?.trim(),
              titleLink
            );

            console.log(`\n处理商品: ${title}`);
            console.log(`链接: ${href}`);

            // 在新标签页获取详细信息
            const details = await scraper.getProductDetails(href);

            // 添加商品标题
            details.title = title;
            allProducts.push(details);

            // 输出进度
            console.log(`已处理 ${allProducts.length}/${rows.length} 个商品`);
            console.log("------------------------");
          }
        } catch (error) {
          console.error("处理商品时出错:", error.message);
        }
      }

      // 输出结果统计
      console.log("\n采集完成!");
      console.log(`共处理 ${allProducts.length} 个商品`);
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
