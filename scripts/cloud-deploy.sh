#!/bin/bash
# AI漫剧工作室 - 云端部署脚本
# 支持 Vercel、Netlify、阿里云、腾讯云等平台

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}======================================${NC}"
echo -e "${BLUE}   AI漫剧工作室 - 云端部署脚本   ${NC}"
echo -e "${BLUE}======================================${NC}"
echo ""

# 1. 构建项目
echo -e "${YELLOW}[1/4] 构建项目...${NC}"
npm run build
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ 构建成功${NC}"
else
    echo -e "${RED}✗ 构建失败${NC}"
    exit 1
fi

# 2. 选择部署平台
echo ""
echo -e "${YELLOW}[2/4] 选择部署平台：${NC}"
echo "  1) Vercel (推荐 - 全球CDN)"
echo "  2) Netlify"
echo "  3) GitHub Pages"
echo "  4) 阿里云 OSS"
echo "  5) 腾讯云 COS"
echo "  6) 导出静态文件 (手动部署)"
echo ""
read -p "请选择 (1-6): " choice

case $choice in
    1)
        echo -e "${YELLOW}正在安装 Vercel CLI...${NC}"
        npm install -g vercel
        echo -e "${YELLOW}正在部署到 Vercel...${NC}"
        vercel --prod
        echo -e "${GREEN}✓ 部署完成！${NC}"
        ;;
    2)
        echo -e "${YELLOW}正在安装 Netlify CLI...${NC}"
        npm install -g netlify-cli
        echo -e "${YELLOW}正在部署到 Netlify...${NC}"
        netlify deploy --prod --dir=dist
        echo -e "${GREEN}✓ 部署完成！${NC}"
        ;;
    3)
        echo -e "${YELLOW}正在部署到 GitHub Pages...${NC}"
        ./scripts/deploy.sh
        echo -e "${GREEN}✓ 部署完成！${NC}"
        ;;
    4)
        echo -e "${YELLOW}请配置阿里云 OSS：${NC}"
        echo "  1. 安装 ossutil: curl -o ossutilmac64 http://gosspublic.alicdn.com/ossutil/ossutil64?dms=1"
        echo "  2. 配置凭证: ./ossutilmac64 config"
        echo "  3. 上传文件: ./ossutilmac64 rm -r oss://your-bucket/ --recursive"
        echo "  4. 上传dist: ./ossutilmac64 cp -rf dist oss://your-bucket/"
        echo ""
        read -p "是否已配置阿里云 OSS? (y/n): " confirm
        if [ "$confirm" = "y" ]; then
            read -p "请输入 Bucket 名称: " bucket
            read -p "请输入区域 (如 oss-cn-hangzhou): " region
            ossutil config
            ossutil cp -rf dist oss://$bucket/ --force
            echo -e "${GREEN}✓ 部署完成！访问地址: https://$bucket.oss-$region.aliyuncs.com${NC}"
        fi
        ;;
    5)
        echo -e "${YELLOW}请配置腾讯云 COS：${NC}"
        echo "  1. 安装 coscli: https://cloud.tencent.com/document/product/436/63144"
        echo "  2. 配置凭证: ./coscli configure"
        echo "  3. 上传文件: ./coscli cp -r dist/ cos://bucketName/ --force"
        echo ""
        read -p "是否已配置腾讯云 COS? (y/n): " confirm
        if [ "$confirm" = "y" ]; then
            read -p "请输入 Bucket 名称: " bucket
            read -p "请输入区域 (如 ap-guangzhou): " region
            coscli configure
            coscli cp -r dist/ cos://$bucket/ --force
            echo -e "${GREEN}✓ 部署完成！${NC}"
        fi
        ;;
    6)
        echo -e "${YELLOW}静态文件已导出到 dist 目录${NC}"
        echo -e "${YELLOW}请手动上传到您的服务器或云存储${NC}"
        echo ""
        echo "  常用部署方式:"
        echo "  - Nginx: 将 dist 内容复制到 /usr/share/nginx/html/"
        echo "  - Apache: 将 dist 内容复制到 /var/www/html/"
        echo "  - Docker: docker run -p 80:80 -v \$PWD/dist:/usr/share/nginx/html nginx"
        ;;
    *)
        echo -e "${RED}无效选择${NC}"
        exit 1
        ;;
esac

# 3. 更新版本
echo ""
echo -e "${YELLOW}[3/4] 更新版本号...${NC}"
npm version patch
echo -e "${GREEN}✓ 版本已更新${NC}"

# 4. 完成
echo ""
echo -e "${GREEN}======================================${NC}"
echo -e "${GREEN}   部署完成！🎉${NC}"
echo -e "${GREEN}======================================${NC}"
echo ""
echo -e "${BLUE}下一步操作：${NC}"
echo "  1. 配置您的 API Key (设置 > AI服务配置)"
echo "  2. 开始创作您的第一个AI漫剧"
echo "  3. 导出视频并发布到抖音/快手/B站"
echo ""
