import puppeteer from "puppeteer";
import readline from "readline";
import { config } from "./config.js";

export class BrowserController {
  constructor() {
    this.browser = null;
    this.page = null;
  }

  getRandomFromArray(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  async initialize() {
    try {
      this.browser = await puppeteer.launch(config.browser);
      // 存储browserController引用
      this.browser._browserController = this;
      console.log("浏览器启动成功");
    } catch (error) {
      console.error("浏览器启动失败:", error.message);
      throw error;
    }
  }

  // 随机延迟函数
  async randomDelay() {
    const delay = this.getRandomInt(
      config.behavior.delayRange.min,
      config.behavior.delayRange.max
    );
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  // 模拟真实的鼠标移动
  async simulateMouseMovement(page, start, end) {
    const points = config.behavior.mouse.movePoints;
    const moveDelay = config.behavior.mouse.moveDelay;

    for (let i = 1; i <= points; i++) {
      const x = start.x + ((end.x - start.x) * i) / points;
      const y = start.y + ((end.y - start.y) * i) / points;

      // 添加随机偏移
      const offsetX = this.getRandomInt(-10, 10);
      const offsetY = this.getRandomInt(-10, 10);

      await page.mouse.move(x + offsetX, y + offsetY);
      await new Promise((r) => setTimeout(r, moveDelay));
    }

    // 最后移动到精确位置
    await page.mouse.move(end.x, end.y);
  }

  // 模拟自然滚动
  async simulateNaturalScroll(page, scrollAmount) {
    const { smoothness, chunk } = config.behavior.scroll;
    const steps = Math.abs(Math.floor(scrollAmount / chunk));

    for (let i = 0; i < steps; i++) {
      const currentScroll = chunk * (i + 1);
      await page.evaluate((y) => {
        window.scrollTo({
          top: y,
          behavior: "smooth",
        });
      }, currentScroll);

      await new Promise((r) => setTimeout(r, smoothness));
    }
  }

  // 设置浏览器指纹
  async setupFingerprint(page) {
    const userAgent = this.getRandomFromArray(config.fingerprint.userAgents);
    const webglVendor = this.getRandomFromArray(config.fingerprint.webglVendor);
    const webglRenderer = this.getRandomFromArray(
      config.fingerprint.webglRenderer
    );

    await page.setUserAgent(userAgent);

    // 注入WebGL指纹
    await page.evaluateOnNewDocument(
      () => {
        const overrideWebgl = (webglVendor, webglRenderer) => {
          const getParameterProxy =
            WebGLRenderingContext.prototype.getParameter;
          WebGLRenderingContext.prototype.getParameter = function (parameter) {
            if (parameter === 37445) return webglVendor;
            if (parameter === 37446) return webglRenderer;
            return getParameterProxy.apply(this, arguments);
          };
        };
        overrideWebgl(arguments[0], arguments[1]);
      },
      webglVendor,
      webglRenderer
    );
  }

  async openPage(url = config.baseUrl) {
    try {
      this.page = await this.browser.newPage();

      // 设置浏览器指纹
      await this.setupFingerprint(this.page);

      await this.page.setDefaultNavigationTimeout(config.timeouts.pageLoad);

      // 隐藏webdriver特征
      await this.page.evaluateOnNewDocument(() => {
        Object.defineProperty(navigator, "webdriver", { get: () => false });
        window.navigator.chrome = { runtime: {} };
      });

      console.log(`正在打开页面: ${url}`);
      await this.page.goto(url, {
        waitUntil: "networkidle0",
        timeout: config.timeouts.pageLoad,
      });

      // 随机滚动
      await this.simulateNaturalScroll(this.page, this.getRandomInt(500, 1000));
      await this.randomDelay();

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
    await this.setupFingerprint(page);
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
