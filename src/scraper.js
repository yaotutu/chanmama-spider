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

export class Scraper {
  constructor(page) {
    this.page = page;
  }

  /**
   * 从页面获取商品链接
   * @param {Page} page - Puppeteer页面实例
   * @returns {Promise<string>} 商品链接
   */
  async getProductLink(page) {
    try {
      console.log("开始获取商品链接...");

      // 等待容器元素加载
      await page.waitForSelector(config.selectors.detailContainer);
      console.log("容器元素已加载");

      // 从容器中获取第一个链接
      const link = await page.evaluate((selector) => {
        const container = document.querySelector(selector.detailContainer);
        if (!container) {
          console.log("未找到容器元素");
          return "";
        }

        // 查找容器中的第一个a标签
        const firstLink = container.querySelector("a");
        if (!firstLink) {
          console.log("未找到链接元素");
          return "";
        }

        const href = firstLink.href;
        console.log("找到链接:", href);
        return href;
      }, config.selectors);

      console.log("获取到的链接:", link);
      return link;
    } catch (error) {
      console.error("获取商品链接失败:", error.message);
      return "";
    }
  }

  /**
   * 获取品牌名称
   * @param {Page} page - Puppeteer页面实例
   * @returns {Promise<string>} 品牌名称
   */
  async getBrandName(page) {
    try {
      return await page.evaluate((selector) => {
        const container = document.querySelector(selector.detailContainer);
        if (!container) {
          console.log("未找到容器元素");
          return "";
        }

        // 查找"品牌"标签
        const brandLabel = Array.from(container.querySelectorAll("span")).find(
          (span) => span.textContent?.trim() === "品牌"
        );

        if (!brandLabel) {
          console.log("未找到品牌标签");
          return "";
        }

        // 获取品牌标签的下一个兄弟元素
        const brandValueSpan = brandLabel.nextElementSibling;
        if (
          !brandValueSpan ||
          brandValueSpan.tagName.toLowerCase() !== "span"
        ) {
          console.log("未找到品牌值");
          return "";
        }

        const brandName = brandValueSpan.textContent?.trim() || "";
        console.log("找到品牌名称:", brandName);
        return brandName;
      }, config.selectors);
    } catch (error) {
      console.error("获取品牌名称失败:", error.message);
      return "";
    }
  }

  /**
   * 获取店铺名称
   * @param {Page} page - Puppeteer页面实例
   * @returns {Promise<string>} 店铺名称
   */
  async getShopName(page) {
    try {
      return await page.evaluate((selector) => {
        const shopLabel = Array.from(document.querySelectorAll(selector)).find(
          (el) => el.textContent?.trim() === "小店"
        );
        if (!shopLabel) return "";

        const shopLink = shopLabel.parentElement?.querySelector("a");
        return shopLink?.textContent?.trim() || "";
      }, config.selectors.shopLabel);
    } catch (error) {
      console.error("获取店铺名称失败:", error.message);
      return "";
    }
  }

  /**
   * 获取商品详情
   * @param {string} url - 商品详情页URL
   * @returns {Promise<Object>} 商品详情
   */
  async getProductDetails(url) {
    const newPage = await this.page.browser().newPage();

    try {
      await newPage.goto(url, { waitUntil: "networkidle0" });
      await newPage.waitForSelector(config.selectors.shopLabel);

      const [productLink, shopName, brandName] = await Promise.all([
        this.getProductLink(newPage),
        this.getShopName(newPage),
        this.getBrandName(newPage),
      ]);

      return {
        shopName,
        productLink,
        brandName,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error("获取商品详情失败:", error.message);
      return {
        shopName: "",
        productLink: "",
        brandName: "",
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    } finally {
      await newPage.close();
    }
  }
}
