// 部署脚本：构建 + 版本号注入 + docs/ 部署
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// 读取 package.json 版本号
const pkgPath = path.join(rootDir, 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
const VERSION = pkg.version;

console.log(`\n🚀 开始部署 AI 漫剧工作室 v${VERSION}\n`);

// 1. 读取 index.html 模板
const indexHtmlPath = path.join(rootDir, 'index.html');
let indexHtml = fs.readFileSync(indexHtmlPath, 'utf-8');

// 2. 替换版本号
const oldVersionMatch = indexHtml.match(/CURRENT_VERSION\s*=\s*['"][^'"]*['"]/);
if (oldVersionMatch) {
  indexHtml = indexHtml.replace(
    oldVersionMatch[0],
    `CURRENT_VERSION = '${VERSION}'`
  );
}

const oldTitleMatch = indexHtml.match(/<title>[^<]*<\/title>/);
if (oldTitleMatch) {
  indexHtml = indexHtml.replace(
    oldTitleMatch[0],
    `<title>AI 漫剧工作室 v${VERSION}</title>`
  );
}

fs.writeFileSync(indexHtmlPath, indexHtml, 'utf-8');
console.log('✅ 已更新 index.html 版本号');

// 3. 执行构建（通过 npx 确保使用项目内的 vite）
console.log('📦 开始构建...');
try {
  execSync('npx vite build', { cwd: rootDir, stdio: 'inherit' });
} catch (e) {
  console.error('❌ 构建失败');
  process.exit(1);
}

// 4. 构建后再次确保 dist/index.html 有正确的版本号
const distHtmlPath = path.join(rootDir, 'dist', 'index.html');
if (fs.existsSync(distHtmlPath)) {
  let distHtml = fs.readFileSync(distHtmlPath, 'utf-8');
  // 在 dist 的 HTML 中注入版本号到 title 和脚本变量
  const distTitleMatch = distHtml.match(/<title>[^<]*<\/title>/);
  if (distTitleMatch) {
    distHtml = distHtml.replace(
      distTitleMatch[0],
      `<title>AI 漫剧工作室 v${VERSION}</title>`
    );
  }

  const distVersionMatch = distHtml.match(/CURRENT_VERSION\s*=\s*['"][^'"]*['"]/);
  if (distVersionMatch) {
    distHtml = distHtml.replace(
      distVersionMatch[0],
      `CURRENT_VERSION = '${VERSION}'`
    );
  }

  fs.writeFileSync(distHtmlPath, distHtml, 'utf-8');
  console.log('✅ 已注入 dist/index.html 版本号');
}

// 5. 复制 dist 到 docs
const docsDir = path.join(rootDir, 'docs');
if (fs.existsSync(docsDir)) {
  fs.rmSync(docsDir, { recursive: true });
}

function copyDir(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const dstPath = path.join(dst, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, dstPath);
    } else {
      fs.copyFileSync(srcPath, dstPath);
    }
  }
}

copyDir(path.join(rootDir, 'dist'), docsDir);
console.log('✅ 已复制 dist/ -> docs/');

console.log(`\n🎉 部署完成！AI 漫剧工作室 v${VERSION} 已就绪`);
console.log('   👉 docs/ 目录可直接部署到 GitHub Pages');
console.log(`   👉 请运行: git add -A && git commit -m "部署: v${VERSION}" && git push\n`);
