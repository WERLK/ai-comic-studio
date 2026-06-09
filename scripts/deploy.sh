#!/bin/bash

set -e

echo "=========================================="
echo "  AI漫剧工作室 - 自动部署脚本"
echo "=========================================="

# 获取当前版本号
VERSION=$(cat package.json | grep '"version"' | sed 's/.*": "\(.*\)",/\1/')
echo "当前版本号: v$VERSION"

# 确保构建完成
if [ ! -d "dist" ]; then
    echo "❌ dist 目录不存在，请先执行 npm run build"
    exit 1
fi

# 创建 docs 目录（GitHub Pages 需要）
rm -rf docs
cp -r dist docs

# 添加所有更改
git add -A

# 提交
git commit -m "部署: v$VERSION"

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