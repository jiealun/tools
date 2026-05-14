# 部署指南

## 一、准备工作

### 1. Supabase 设置

1. 去 [supabase.com](https://supabase.com) 创建免费项目
2. 进入 SQL Editor，执行 `schema.sql` 中的所有 SQL
3. 记录以下信息：
   - Project URL: `https://xxx.supabase.co`
   - Service Role Key: `eyJxxx...`（在 Settings → API 中找到）

### 2. Cloudflare 设置

1. 登录 [dash.cloudflare.com](https://dash.cloudflare.com)
2. 创建 R2 存储桶：
   - 进入 R2 → Create bucket
   - 名称填 `toolbox-files`
   - 设置公开访问（或绑定自定义域名）

### 3. 爱发卡设置

1. 去 [ifaka.com](https://www.ifaka.com) 注册
2. 创建商品（每个工具一个商品）
3. 导入激活码到爱发卡
4. 获取每个商品的购买链接

---

## 二、部署后端（Cloudflare Workers）

```bash
cd worker

# 安装依赖
npm install

# 登录 Cloudflare
npx wrangler login

# 设置环境变量（密钥类的用 secret）
npx wrangler secret put SUPABASE_URL
# 输入: https://xxx.supabase.co

npx wrangler secret put SUPABASE_SERVICE_KEY
# 输入: eyJxxx...

npx wrangler secret put ADMIN_USERNAME
# 输入: admin（你的管理员用户名）

npx wrangler secret put ADMIN_PASSWORD
# 输入: 你的管理员密码

npx wrangler secret put JWT_SECRET
# 输入: 随便一串随机字符串，如 my-super-secret-key-2024

# 部署
npm run deploy
```

部署成功后会得到一个 URL，如：`https://toolbox-api.xxx.workers.dev`

---

## 三、部署前端（Cloudflare Pages）

```bash
cd frontend

# 安装依赖
npm install

# 创建环境变量文件
echo "VITE_API_URL=https://toolbox-api.xxx.workers.dev" > .env.production

# 构建
npm run build

# 部署到 Cloudflare Pages
npx wrangler pages deploy dist --project-name=toolbox
```

或者在 Cloudflare Dashboard 中：
1. Pages → Create a project → Connect to Git（或直接上传）
2. Build settings:
   - Framework: None
   - Build command: `npm run build`
   - Build output: `dist`
3. Environment variables:
   - `VITE_API_URL` = 你的 Worker URL

---

## 四、使用流程

### 管理员操作流程：

1. 访问 `你的网站/admin/login` 登录后台
2. 添加新产品（填写名称、简介、价格、分类）
3. 在本地用密码加密ZIP：
   ```bash
   # macOS/Linux
   zip -e -P "你的激活码密码" output.zip 要打包的文件或文件夹/*
   
   # 或用 7zip
   7z a -p"你的激活码密码" output.zip 要打包的文件或文件夹/
   ```
4. 上传加密ZIP到后台
5. 在爱发卡创建对应商品，导入激活码
6. 将爱发卡购买链接填入后台
7. 在后台「激活码管理」中也录入一份（用于统计）
8. 勾选「发布」

### 用户购买流程：

1. 从自媒体链接进入网站
2. 浏览工具列表，点击感兴趣的工具
3. 点击「免费下载」获得加密ZIP
4. 点击「购买激活码」跳转爱发卡
5. 支付后自动获得激活码（解压密码）
6. 用激活码解压ZIP，获得完整内容

---

## 五、加密ZIP的制作方法

### 方法1：命令行（推荐）

```bash
# 单个文件
zip -e -P "MYCODE123" tool.zip tool.crx

# 整个文件夹
zip -e -r -P "MYCODE123" tutorial.zip ./教程文件夹/
```

### 方法2：7-Zip（Windows）

1. 右键文件 → 7-Zip → 添加到压缩包
2. 格式选 zip
3. 输入密码（即激活码）
4. 勾选「加密文件名」

### 方法3：macOS 归档工具

使用 Keka 等工具，设置密码压缩。

---

## 六、注意事项

1. **一码一密**：每个激活码就是一个解压密码，所以同一个产品的所有ZIP用同一个密码即可。或者你可以为每个码生成不同的ZIP（高级玩法）。

2. **简单做法**：一个产品用一个固定密码加密ZIP，然后把这个密码作为激活码批量录入爱发卡。用户买到的都是同一个密码。

3. **R2 公开访问**：封面图需要公开访问，可以在 R2 设置中开启公开访问或绑定自定义域名。

4. **自定义域名**：建议给 Pages 和 Workers 都绑定自定义域名，更专业。
