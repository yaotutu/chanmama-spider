import fs from "fs";
import path from "path";

export class Storage {
  /**
   * 获取当前时间字符串（精确到秒）
   */
  static getCurrentTimeString() {
    const now = new Date();
    return now
      .toISOString()
      .replace(/[-:]/g, "") // 移除日期中的-和:
      .replace(/\..+/, "") // 移除毫秒部分
      .replace("T", "_"); // 将T替换为_
  }

  /**
   * 保存简化数据（仅title和productLink）
   */
  static async saveSimpleData(products) {
    const timestamp = this.getCurrentTimeString();
    const filename = path.join("data", `${timestamp}.txt`);

    const content = products
      .map((product) => `${product.title}###@@${product.productLink}`)
      .join("\n");

    await fs.promises.writeFile(filename, content, "utf8");
    console.log(`简化数据已保存到: ${filename}`);
    return filename;
  }

  /**
   * 保存完整数据（缓存）
   */
  static async saveCacheData(products) {
    const timestamp = this.getCurrentTimeString();
    const filename = path.join("data", "cache", `${timestamp}.txt`);

    const content = JSON.stringify(products, null, 2);
    await fs.promises.writeFile(filename, content, "utf8");
    console.log(`完整数据已保存到: ${filename}`);
    return filename;
  }

  /**
   * 保存所有数据（同时保存简化和完整数据）
   */
  static async saveAllData(products) {
    try {
      const [simpleFile, cacheFile] = await Promise.all([
        this.saveSimpleData(products),
        this.saveCacheData(products),
      ]);

      return {
        simpleFile,
        cacheFile,
        count: products.length,
      };
    } catch (error) {
      console.error("保存数据时出错:", error);
      throw error;
    }
  }
}
