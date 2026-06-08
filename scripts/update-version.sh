#!/bin/bash

# AI漫剧工作室 - 自动版本更新脚本
# 使用方法: ./scripts/update-version.sh

# 进入项目目录
cd "$(dirname "$0")/.."

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
# 使用 awk 进行小数运算
NEW_MINOR=$(awk "BEGIN {printf \"%.1f\", $MINOR + 0.1}")
NEW_VERSION="${MAJOR}.${NEW_MINOR}.0"

echo "新版本号: v$NEW_VERSION"

# 获取当前日期
CURRENT_DATE=$(date +"%Y-%m-%d")

# 更新版本号
sed -i "s/const APP_VERSION = '$CURRENT_VERSION'/const APP_VERSION = '$NEW_VERSION'/" "$VERSION_FILE"
echo "✓ 版本号已更新"

# 更新 package.json 中的版本号
if [ -f "package.json" ]; then
  sed -i "s/\"version\": \"$CURRENT_VERSION\"/\"version\": \"$NEW_VERSION\"/" package.json
  echo "✓ package.json 版本号已更新"
fi

# Git 提交并推送
git add .
git commit -m "chore: 更新版本号 v$CURRENT_VERSION -> v$NEW_VERSION"
git push

echo ""
echo "=========================================="
echo "✅ 版本更新完成!"
echo "=========================================="
echo "旧版本: v$CURRENT_VERSION"
echo "新版本: v$NEW_VERSION"
echo "=========================================="
