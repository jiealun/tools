# 工具激活码销售平台

## 架构

```
用户流程：
自媒体引流 → 网站浏览工具 → 免费下载加密ZIP → 去爱发卡购买激活码(解压密码) → 解压使用
```

## 技术栈

- 前端：React + Vite + TailwindCSS → 部署到 Cloudflare Pages
- 后端：Cloudflare Workers + Hono → 部署到 Cloudflare Workers
- 数据库：Supabase (PostgreSQL)
- 文件存储：Cloudflare R2 (存加密ZIP)
- 支付：爱发卡 (自动发卡平台)

## 项目结构

```
激活码/
├── frontend/          # 前端项目 (React + Vite)
│   ├── src/
│   │   ├── pages/     # 页面组件
│   │   ├── components/# 通用组件
│   │   └── lib/       # 工具函数
│   └── ...
├── worker/            # 后端 API (Cloudflare Workers + Hono)
│   ├── src/
│   │   ├── routes/    # API 路由
│   │   └── lib/       # 工具函数
│   └── ...
└── README.md
```

## 核心功能

### 前台（用户端）
- 工具列表展示（封面图、名称、简介、价格）
- 工具详情页（详细介绍、截图）
- 免费下载加密ZIP
- 跳转爱发卡购买激活码

### 后台（管理端）
- 登录验证
- 工具管理（增删改查）
- 上传工具文件 → 自动用激活码加密生成ZIP
- 管理激活码（批量导入、查看状态）
- 数据统计（下载量、销售量）

## 部署步骤

1. 创建 Supabase 项目，执行 schema.sql
2. 创建 Cloudflare R2 存储桶
3. 部署 Worker 后端
4. 部署 Pages 前端
