import fs from "fs/promises";
import path from "path";

export class Storage {
  constructor() {
    this.baseDir = "data";
  }

  /**
   * 获取当前日期格式化字符串
   * @returns {string} YYYY-MM-DD格式的日期
   */
  getCurrentDate() {
    const now = new Date();
    return now.toISOString().split("T")[0];
  }

  /**
   * 确保目录存在
   * @param {string} dirPath - 目录路径
   */
  async ensureDir(dirPath) {
    try {
      await fs.access(dirPath);
    } catch {
      await fs.mkdir(dirPath, { recursive: true });
    }
  }

  /**
   * 生成文件名
   * @param {string} prefix - 文件名前缀
   * @returns {string} 完整文件名
   */
  generateFilename(prefix) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    return `${prefix}_${timestamp}.json`;
  }

  /**
   * 保存数据到JSON文件
   * @param {Object} data - 要保存的数据
   * @param {string} prefix - 文件名前缀
   */
  async saveToJson(data, prefix = "products") {
    const currentDate = this.getCurrentDate();
    const datePath = path.join(this.baseDir, currentDate);

    // 确保日期目录存在
    await this.ensureDir(datePath);

    const filename = this.generateFilename(prefix);
    const filepath = path.join(datePath, filename);

    try {
      await fs.writeFile(filepath, JSON.stringify(data, null, 2), "utf-8");
      console.log(`数据已保存到: ${filepath}`);
    } catch (error) {
      console.error(`保存数据失败: ${error.message}`);
      throw error;
    }
  }
}
