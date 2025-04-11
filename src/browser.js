import puppeteer from "puppeteer";
import readline from "readline";
import { config } from "./config.js";

export class BrowserController {
  constructor() {
    this.browser = null;
    this.page = null;
  }

  async initialize() {
    try {
      this.browser = await puppeteer.launch(config.browser);
      console.log("浏览器启动成功");
    } catch (error) {
      console.error("浏览器启动失败:", error.message);
      throw error;
    }
  }

  async openPage(url = config.baseUrl) {
    try {
      this.page = await this.browser.newPage();
      await this.page.setDefaultNavigationTimeout(config.timeouts.pageLoad);

      console.log(`正在打开页面: ${url}`);
      await this.page.goto(url, {
        waitUntil: "networkidle0",
        timeout: config.timeouts.pageLoad,
      });

      console.log("页面加载完成");
    } catch (error) {
      console.error("打开页面失败:", error.message);
      throw error;
    }
  }

  async waitForUserLogin() {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    return new Promise((resolve) => {
      console.log("\n请完成登录后按回车继续...");
      rl.question("", () => {
        rl.close();
        console.log("继续执行...\n");
        resolve();
      });
    });
  }

  async newPage() {
    const page = await this.browser.newPage();
    await page.setDefaultNavigationTimeout(config.timeouts.pageLoad);
    return page;
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      console.log("浏览器已关闭");
    }
  }
}
