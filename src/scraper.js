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
    this.browserController = page.browser()._browserController;
  }

  /**
   * 随机移动鼠标到指定元素
   */
  async moveMouseToElement(page, element) {
    const box = await element.boundingBox();
    if (!box) return;

    // 计算元素中心点
    const targetX = box.x + box.width / 2;
    const targetY = box.y + box.height / 2;

    // 获取当前鼠标位置（默认在0,0）
    const startX = 0;
    const startY = 0;

    await this.browserController.simulateMouseMovement(
      page,
      { x: startX, y: startY },
      { x: targetX, y: targetY }
    );
  }

  /**
   * 从页面获取商品链接
   */
  async getProductLink(page) {
    try {
      console.log("开始获取商品链接...");

      // 等待容器元素加载
      await page.waitForSelector(config.selectors.detailContainer);
      console.log("容器元素已加载");

      await this.browserController.randomDelay();

      // 模拟视觉扫描行为
      await this.browserController.simulateNaturalScroll(page, 300);

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

      // 找到链接后模拟鼠标hover
      const linkElement = await page.$(config.selectors.detailContainer + " a");
      if (linkElement) {
        await this.moveMouseToElement(page, linkElement);
        await this.browserController.randomDelay();
      }

      console.log("获取到的链接:", link);
      return link;
    } catch (error) {
      console.error("获取商品链接失败:", error.message);
      return "";
    }
  }

  /**
   * 获取品牌名称
   */
  async getBrandName(page) {
    try {
      await this.browserController.randomDelay();

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
   */
  async getShopName(page) {
    try {
      await this.browserController.randomDelay();

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
   */
  async getProductDetails(url) {
    // 创建新页面并设置反爬特征
    const newPage = await this.page.browser().newPage();
    await this.browserController.setupFingerprint(newPage);
    await newPage.setDefaultNavigationTimeout(config.timeouts.pageLoad);

    try {
      // 随机延迟
      await this.browserController.randomDelay();

      await newPage.goto(url, {
        waitUntil: "networkidle0",
        timeout: config.timeouts.pageLoad,
      });

      // 等待页面加载完成
      await newPage.waitForSelector(config.selectors.shopLabel);

      // 模拟自然浏览行为
      await this.browserController.simulateNaturalScroll(
        newPage,
        this.browserController.getRandomInt(300, 800)
      );

      // 随机延迟后再获取数据
      await this.browserController.randomDelay();

      const [productLink, shopName, brandName] = await Promise.all([
        this.getProductLink(newPage),
        this.getShopName(newPage),
        this.getBrandName(newPage),
      ]);

      // 最后再随机滚动一下
      await this.browserController.simulateNaturalScroll(
        newPage,
        this.browserController.getRandomInt(-400, -100)
      );

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
      // 随机延迟后关闭页面
      await this.browserController.randomDelay();
      await newPage.close();
    }
  }
}
