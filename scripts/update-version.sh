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
PATCH=${VERSION_PARTS[2]}

# 增加小版本号 (MINOR + 0.1)
NEW_MINOR=$(echo "$MINOR + 0.1" | bc)
NEW_VERSION="${MAJOR}.${NEW_MINOR}.0"

echo "新版本号: v$NEW_VERSION"

# 获取当前日期
CURRENT_DATE=$(date +"%Y-%m-%d")

# 创建新的版本历史记录
NEW_HISTORY_ENTRY="    {
      version: '$NEW_VERSION',
      date: '$CURRENT_DATE',
      features: [
        '版本更新'
      ]
    }"

# 读取文件内容
FILE_CONTENT=$(cat "$VERSION_FILE")

# 更新版本号
FILE_CONTENT=$(echo "$FILE_CONTENT" | sed "s/const APP_VERSION = '$CURRENT_VERSION'/const APP_VERSION = '$NEW_VERSION'/")

# 在版本历史开头插入新记录
# 找到第一个 { version: 的位置，在它前面插入新记录
FILE_CONTENT=$(echo "$FILE_CONTENT" | sed "/version: '$NEW_VERSION',/a\\
$NEW_HISTORY_ENTRY\\
" )

# 写回文件
echo "$FILE_CONTENT" > "$VERSION_FILE"

echo "版本号已更新!"

# 更新 package.json 中的版本号
if [ -f "package.json" ]; then
  sed -i "s/\"version\": \"$CURRENT_VERSION\"/\"version\": \"$NEW_VERSION\"/" package.json
  echo "package.json 版本号已更新!"
fi

# Git 提交
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
