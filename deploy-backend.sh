#!/bin/bash
# 后端部署脚本 - 一键部署到 Render

echo "🚀 AI漫剧工作室后端部署脚本"
echo "================================"

# 检查必要文件
if [ ! -f "server/package.json" ]; then
    echo "❌ 错误：找不到 server/package.json"
    echo "请确保在项目根目录运行此脚本"
    exit 1
fi

echo ""
echo "📋 部署前准备："
echo "1. 您需要在 Render.com 注册账号"
echo "2. 您需要在 MongoDB Atlas 创建免费集群"
echo "3. 您需要获取 MongoDB 连接字符串"
echo ""

# 检查是否安装了 Render CLI
if ! command -v render &> /dev/null; then
    echo "⚠️  Render CLI 未安装"
    echo "请访问 https://render.com/docs/cli 安装"
    echo "或者使用 GitHub 自动部署"
    echo ""
fi

# 创建 GitHub Actions 工作流
mkdir -p .github/workflows

cat > .github/workflows/deploy-backend.yml << 'EOF'
name: Deploy Backend to Render

on:
  push:
    branches: [ master ]
    paths:
      - 'server/**'
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Render
        uses: johnbeynon/render-deploy-action@v0.0.8
        with:
          service-id: ${{ secrets.RENDER_SERVICE_ID }}
          api-key: ${{ secrets.RENDER_API_KEY }}
EOF

echo "✅ GitHub Actions 工作流已创建"
echo ""

# 创建部署说明
cat > DEPLOY_GUIDE.md << 'EOF'
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
EOF

echo "✅ 部署指南已创建：DEPLOY_GUIDE.md"
echo ""

# 创建 MongoDB 快速设置脚本
cat > setup-mongodb.js << 'EOF'
// MongoDB Atlas 设置助手
// 运行：node setup-mongodb.js

const readline = require('readline');
const fs = require('fs');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🍃 MongoDB Atlas 设置助手');
console.log('========================');
console.log('');
console.log('请按以下步骤操作：');
console.log('1. 访问 https://www.mongodb.com/atlas');
console.log('2. 注册/登录账号');
console.log('3. 创建免费集群（M0）');
console.log('4. 在 Database Access 创建用户');
console.log('5. 在 Network Access 允许所有 IP（0.0.0.0/0）');
console.log('6. 获取连接字符串');
console.log('');

rl.question('请输入您的 MongoDB 连接字符串：', (uri) => {
  if (!uri.includes('mongodb+srv://')) {
    console.log('❌ 连接字符串格式不正确');
    rl.close();
    return;
  }
  
  // 创建 .env 文件
  const envContent = `MONGODB_URI=${uri}
JWT_SECRET=ai-comic-studio-secret-${Date.now()}
PORT=3001
`;
  
  fs.writeFileSync('server/.env', envContent);
  console.log('✅ server/.env 文件已创建');
  console.log('');
  console.log('下一步：');
  console.log('1. 提交代码到 GitHub');
  console.log('2. 在 Render.com 部署后端');
  console.log('3. 查看 DEPLOY_GUIDE.md 获取详细步骤');
  
  rl.close();
});
EOF

echo "✅ MongoDB 设置脚本已创建：setup-mongodb.js"
echo ""

echo "🎉 准备完成！"
echo ""
echo "接下来请："
echo "1. 运行：node setup-mongodb.js"
echo "2. 按照提示输入 MongoDB 连接字符串"
echo "3. 阅读 DEPLOY_GUIDE.md 完成 Render 部署"
echo ""
echo "或者手动部署："
echo "1. 创建 MongoDB Atlas 数据库"
echo "2. 在 Render.com 创建 Web Service"
echo "3. 配置环境变量"
echo "4. 部署完成！"
