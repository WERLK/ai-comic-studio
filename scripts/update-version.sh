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

# 读取当前版本号（提取数字部分）
CURRENT_VERSION=$(grep -oP "const APP_VERSION = '\K[0-9.]+(?=')" "$VERSION_FILE")
echo "当前版本号: v$CURRENT_VERSION"

# 简单递增版本号 - 使用简单的计数方式
# 格式: 1.MAJOR.MINOR (1.7.1.0 -> 1.7.1.1 -> 1.7.1.2 等)
# 解析版本号: 拆分最后一部分
IFS='.' read -ra PARTS <<< "$CURRENT_VERSION"
PART1=${PARTS[0]}
PART2=${PARTS[1]}
PART3=${PARTS[2]}
PART4=${PARTS[3]}

# 增加最后一部分
NEW_PART4=$((PART4 + 1))
NEW_VERSION="${PART1}.${PART2}.${PART3}.${NEW_PART4}"

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
