#!/bin/bash

set -e

echo "=========================================="
echo "  AI漫剧工作室 - 自动部署脚本"
echo "=========================================="

# 获取当前版本号
VERSION=$(cat package.json | grep '"version"' | sed 's/.*": "\(.*\)",/\1/')
echo "当前版本号: v$VERSION"

# 从环境变量读取 GitHub Token（任意设备设置一次 GH_TOKEN 即可自动推送）
#   用法:  export GH_TOKEN=ghp_your_token_here
#          bash scripts/deploy.sh
if [ -n "$GH_TOKEN" ]; then
    TOKEN_MASKED=$(echo "$GH_TOKEN" | sed 's/./\*/g; s/^***/ghp_/' )
    echo "已检测到 GH_TOKEN (${TOKEN_MASKED:0:8}****)"
fi

# 确保构建完成
if [ ! -d "dist" ]; then
    echo "❌ dist 目录不存在，正在自动构建..."
    npm run build
fi

# 若提供了 token，则将 remote 切换为带 token 的 URL
if [ -n "$GH_TOKEN" ]; then
    # 自动解析当前仓库 owner/name（如果存在）
    CURRENT_URL=$(git remote get-url origin 2>/dev/null || echo "")
    if echo "$CURRENT_URL" | grep -q "github.com"; then
        REPO_PATH=$(echo "$CURRENT_URL" | sed -E 's|.*github\.com[:/]||; s|\.git$||')
        AUTH_URL="https://oauth2:${GH_TOKEN}@github.com/${REPO_PATH}.git"
        git remote set-url origin "$AUTH_URL"
        echo "✅ remote 已注入 token，准备推送"
    fi
fi

# 创建 docs 目录（GitHub Pages 需要）
rm -rf docs
cp -r dist docs

# 添加所有更改
git add -A

# 提交
git commit -m "部署: v$VERSION" || echo "⚠️  无新改动，跳过 commit"

# 推送到 GitHub
git push origin master

echo ""
echo "=========================================="
echo "✅ 部署完成!"
echo "=========================================="
echo "版本: v$VERSION"
echo ""
echo "访问地址: https://WERLK.github.io/ai-comic-studio/"
echo ""
echo "GitHub Pages 会在 1-5 分钟内自动部署"
echo "如果页面没有更新, 请尝试:"
echo "  1. 强制刷新浏览器 (Ctrl+F5 或 Cmd+Shift+R)"
echo "  2. 清除浏览器缓存"
echo "  3. 等待几分钟后再访问"
echo "=========================================="