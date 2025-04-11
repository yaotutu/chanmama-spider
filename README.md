# 商品数据采集爬虫

自动化采集商品数据的Puppeteer爬虫脚本。

## 功能特点

- 支持手动登录保存会话
- 自动采集商品信息
- 数据保存为JSON格式
- 按日期分类存储

## 使用说明

1. 安装依赖：
```bash
npm install
```

2. 运行爬虫：
```bash
npm start
```

3. 操作步骤：
   - 脚本会自动打开浏览器
   - 等待用户手动登录
   - 登录完成后在控制台按回车继续
   - 自动开始采集数据
   - 数据保存在 `data/当前日期/` 目录下

## 数据格式

```json
{
  "totalCount": 10,
  "products": [
    {
      "title": "商品标题",
      "shop": "店铺名称",
      "link": "商品链接",
      "timestamp": "采集时间"
    }
  ],
  "crawlTime": "爬虫运行时间"
}
```

## 文件结构

```
├── src/
│   ├── browser.js    # 浏览器控制模块
│   ├── scraper.js    # 页面采集模块
│   ├── storage.js    # 数据存储模块
│   └── index.js      # 主程序入口
├── data/             # 采集数据存储目录
└── user-data/        # 浏览器用户数据目录