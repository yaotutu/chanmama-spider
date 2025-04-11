import { BrowserController } from "./browser.js";
import { Scraper } from "./scraper.js";
import { config } from "./config.js";
import readline from "readline";

async function waitForUserInput(message = "Press Enter to continue...") {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(message + "\n", () => {
      rl.close();
      resolve();
    });
  });
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

    try {
      // 等待商品表格加载
      await browser.page.waitForSelector(config.selectors.productRow, {
        timeout: config.timeouts.elementWait,
      });

      // 获取所有商品行
      const rows = await browser.page.$$(config.selectors.productRow);
      console.log(`找到 ${rows.length} 个商品行`);

      // 只测试第一个商品
      if (rows.length > 0) {
        const row = rows[0];
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
            await waitForUserInput("准备获取商品链接，按回车继续...");
            const details = await scraper.getProductDetails(href);
            await waitForUserInput("获取商品链接完成，按回车继续...");

            // 输出结果
            console.log("获取到的数据:", details);
          }
        } catch (error) {
          console.error("处理商品时出错:", error.message);
        }
      }
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
