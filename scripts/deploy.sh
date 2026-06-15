#!/bin/bash

set -e

echo "=========================================="
echo "  AI漫剧工作室 - 自动部署脚本"
echo "=========================================="

# 获取当前版本号
VERSION=$(cat package.json | grep '"version"' | sed 's/.*": "\(.*\)",/\1/')
echo "当前版本号: v$VERSION"

# Token 来源优先级：
#   1) 环境变量 GH_TOKEN
#   2) 项目根目录的 .github_token 文件（已在 .gitignore，不会提交）
if [ -z "$GH_TOKEN" ]; then
    SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
    PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
    if [ -f "$PROJECT_ROOT/.github_token" ]; then
        GH_TOKEN=$(cat "$PROJECT_ROOT/.github_token" | tr -d '\r\n ')
        echo "✅ 从 .github_token 读取 token"
    fi
fi

if [ -z "$GH_TOKEN" ]; then
    echo ""
    echo "❌ 未找到 GitHub Token。"
    echo "   两种方式任选一种（任选其一即可）："
    echo "   1) 在项目根目录新建文件 .github_token，内容为你的 ghp_xxxx token"
    echo "   2) export GH_TOKEN=ghp_your_token_here"
    echo ""
    exit 1
fi

# 掩码显示 token，避免完整泄露
TOKEN_LEN=${#GH_TOKEN}
TOKEN_MASKED="${GH_TOKEN:0:4}$(printf '%0.s*' $(seq 1 $((TOKEN_LEN-8))))${GH_TOKEN: -4}"
echo "Token 已就绪 (${TOKEN_MASKED})"

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

# ========== 1. 推送到 master 分支（保存源码和 docs/ 目录）==========
echo ""
echo "📦 步骤 1/3: 同步 dist → docs/ 并推送到 master..."

# 创建 docs 目录（GitHub Pages 备用）
rm -rf docs
cp -r dist docs

# 添加所有更改并提交
git add -A
git commit -m "部署: v$VERSION" || echo "⚠️  无新改动，跳过 commit"

# 推送到 master
git push origin master
echo "✅ master 分支推送完成"

# ========== 2. 推送到 gh-pages 分支（GitHub Pages 实际部署源）==========
echo ""
echo "🚀 步骤 2/3: 同步构建产物到 gh-pages 分支..."

# 保存当前分支名
CURRENT_BRANCH=$(git branch --show-current)

# 创建临时目录保存构建产物
TMP_DIR=$(mktemp -d)
cp -r dist/* "$TMP_DIR/"

# 切换到 gh-pages 分支
git fetch origin gh-pages 2>/dev/null || true
git checkout gh-pages 2>/dev/null || git checkout -b gh-pages

# 清空当前内容，复制新构建产物
rm -rf *
cp -r "$TMP_DIR/"* .

# 清理临时目录
rm -rf "$TMP_DIR"

# 移除可能误包含的敏感文件
rm -f .github_token

# 提交并推送
git add -A
git commit -m "deploy: v$VERSION" || echo "⚠️  无新改动，跳过 commit"
git push origin gh-pages --force

# 切回原分支
git checkout "$CURRENT_BRANCH"

echo "✅ gh-pages 分支推送完成"

# ========== 3. 完成 ==========
echo ""
echo "=========================================="
echo "✅ 部署完成!"
echo "=========================================="
echo "版本: v$VERSION"
echo ""
echo "已同步推送到两个分支："
echo "  • master   - 源码 + docs/ 目录"
echo "  • gh-pages - GitHub Pages 实际部署源"
echo ""
echo "访问地址: https://WERLK.github.io/ai-comic-studio/"
echo ""
echo "GitHub Pages 会在 1-5 分钟内自动部署"
echo "如果页面没有更新, 请尝试:"
echo "  1. 强制刷新浏览器 (Ctrl+F5 或 Cmd+Shift+R)"
echo "  2. 清除浏览器缓存"
echo "  3. 等待几分钟后再访问"
echo "=========================================="
