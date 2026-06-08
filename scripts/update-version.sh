#!/bin/bash

# AI漫剧工作室 - 自动版本更新和部署脚本
# 使用方法: ./scripts/update-version.sh

# 进入项目目录
cd "$(dirname "$0")/.."

echo "=========================================="
echo "  AI漫剧工作室 - 自动部署脚本"
echo "=========================================="
echo ""

# 版本文件路径
VERSION_FILE="src/components/AppVersion.tsx"

# 读取当前版本号
CURRENT_VERSION=$(grep -oP "const APP_VERSION = '\K[^']+" "$VERSION_FILE")
echo "当前版本号: v$CURRENT_VERSION"

# 解析版本号 (格式: x.y.z)
IFS='.' read -ra VERSION_PARTS <<< "$CURRENT_VERSION"
MAJOR=${VERSION_PARTS[0]}
MINOR=${VERSION_PARTS[1]}

# 增加小版本号 (MINOR + 0.1)
NEW_MINOR=$(awk "BEGIN {printf \"%.1f\", $MINOR + 0.1}")
NEW_VERSION="${MAJOR}.${NEW_MINOR}.0"

echo "新版本号: v$NEW_VERSION"

# 更新版本号
sed -i "s/const APP_VERSION = '$CURRENT_VERSION'/const APP_VERSION = '$NEW_VERSION'/" "$VERSION_FILE"
echo "✓ AppVersion.tsx 版本号已更新"

# 更新 package.json 中的版本号
if [ -f "package.json" ]; then
  sed -i "s/\"version\": \"$CURRENT_VERSION\"/\"version\": \"$NEW_VERSION\"/" package.json
  echo "✓ package.json 版本号已更新"
fi

echo ""
echo "开始构建项目..."
echo "------------------------------------------"

# 构建项目
npm run build
if [ $? -ne 0 ]; then
  echo "❌ 构建失败！"
  exit 1
fi
echo "✓ 构建成功"

echo ""
echo "准备部署文件..."
echo "------------------------------------------"

# 清理旧的 docs 目录
rm -rf docs
# 复制构建产物到 docs 目录
cp -r dist docs
echo "✓ 已复制到 docs 目录"

# Git 提交并推送
echo ""
echo "提交并推送..."
echo "------------------------------------------"
git add -A
git commit -m "部署: v$CURRENT_VERSION -> v$NEW_VERSION"
git push

echo ""
echo "=========================================="
echo "✅ 部署完成!"
echo "=========================================="
echo "旧版本: v$CURRENT_VERSION"
echo "新版本: v$NEW_VERSION"
echo ""
echo "请在 GitHub 仓库设置中配置："
echo "Settings → Pages → Source: Deploy from a branch"
echo "Branch: master, Folder: /docs"
echo "=========================================="
