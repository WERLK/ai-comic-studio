# 后端部署指南

## 方式一：GitHub 自动部署（推荐）

### 1. 创建 MongoDB Atlas 数据库
1. 访问 https://www.mongodb.com/atlas
2. 注册账号并登录
3. 点击 "Create" 创建新集群
   - 选择 "FREE" 免费套餐
   - 选择离您最近的区域（如 AWS / N. Virginia）
4. 在 Security → Database Access 创建用户
   - 用户名：ai_comic_user
   - 密码：生成强密码并保存
5. 在 Security → Network Access 添加 IP 地址
   - 点击 "Add IP Address"
   - 选择 "Allow Access from Anywhere"（0.0.0.0/0）
6. 获取连接字符串
   - 点击 "Database" → "Connect" → "Drivers"
   - 选择 "Node.js"
   - 复制连接字符串，替换 `<password>` 为您的密码

### 2. 部署到 Render
1. 访问 https://render.com 并注册
2. 点击 "New +" → "Web Service"
3. 连接 GitHub 仓库
   - 选择 `WERLK/ai-comic-studio`
4. 配置服务：
   - **Name**: ai-comic-studio-api
   - **Root Directory**: `server`
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. 添加环境变量：
   - `MONGODB_URI`: 您的 MongoDB 连接字符串
   - `JWT_SECRET`: 随机字符串（如 `ai-comic-studio-2024-secret`）
   - `NODE_ENV`: production
6. 点击 "Create Web Service"

### 3. 获取 Render API Key（用于自动部署）
1. 在 Render Dashboard，点击右上角头像 → "Account Settings"
2. 点击 "API Keys" → "Create API Key"
3. 复制 API Key

### 4. 配置 GitHub Secrets
1. 在 GitHub 仓库，点击 Settings → Secrets and variables → Actions
2. 添加以下 Secrets：
   - `RENDER_API_KEY`: 您的 Render API Key
   - `RENDER_SERVICE_ID`: 您的 Render Service ID（从 Render Dashboard 获取）

### 5. 自动部署
- 每次推送 `server/` 目录的更改到 master 分支，GitHub Actions 会自动部署

## 方式二：手动部署

如果您不想使用 GitHub Actions，可以手动部署：

1. 完成上述步骤 1-2
2. 在 Render Dashboard 手动点击 "Manual Deploy"

## 验证部署

部署完成后，访问：
- `https://ai-comic-studio-api.onrender.com/api/health`

应该返回：
```json
{
  "ok": true,
  "message": "AI漫剧工作室后端服务运行中",
  "dbStatus": "connected"
}
```

## 更新前端 API 地址

部署成功后，修改 `src/utils/api.ts` 中的 API_BASE：
```typescript
const API_BASE = 'https://ai-comic-studio-api.onrender.com/api';
```

然后重新部署前端。
