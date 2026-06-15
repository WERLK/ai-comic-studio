import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const pkgPath = path.join(rootDir, 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
const VERSION = pkg.version;

console.log(`\n🚀 开始部署 AI 漫剧工作室 v${VERSION}\n`);

const indexHtmlPath = path.join(rootDir, 'index.html');
let indexHtml = fs.readFileSync(indexHtmlPath, 'utf-8');

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

console.log('📦 开始构建...');
try {
  execSync('npx vite build', { cwd: rootDir, stdio: 'inherit' });
} catch (e) {
  console.error('❌ 构建失败');
  process.exit(1);
}

const distHtmlPath = path.join(rootDir, 'dist', 'index.html');
if (fs.existsSync(distHtmlPath)) {
  let distHtml = fs.readFileSync(distHtmlPath, 'utf-8');
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

console.log('\n📤 开始部署到 GitHub...');

try {
  console.log('  1. 更新 master 分支...');
  execSync(`git add -A && git commit -m "deploy: v${VERSION}"`, { 
    cwd: rootDir, 
    stdio: 'inherit' 
  });
  execSync('git push origin master', { 
    cwd: rootDir, 
    stdio: 'inherit' 
  });
  console.log('   ✅ master 分支已推送');

  console.log('  2. 部署到 gh-pages 分支...');
  const tempDist = path.join(rootDir, '.temp-deploy-dist');
  if (fs.existsSync(tempDist)) {
    fs.rmSync(tempDist, { recursive: true });
  }
  copyDir(path.join(rootDir, 'dist'), tempDist);

  execSync('git checkout gh-pages', { 
    cwd: rootDir, 
    stdio: 'inherit' 
  });
  
  execSync('rm -rf index.html assets favicon.svg', { 
    cwd: rootDir, 
    stdio: 'inherit',
    stderr: 'ignore'
  });
  
  const tempEntries = fs.readdirSync(tempDist, { withFileTypes: true });
  for (const entry of tempEntries) {
    const srcPath = path.join(tempDist, entry.name);
    const dstPath = path.join(rootDir, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, dstPath);
    } else {
      fs.copyFileSync(srcPath, dstPath);
    }
  }

  if (fs.existsSync(tempDist)) {
    fs.rmSync(tempDist, { recursive: true });
  }
  
  execSync(`git add -A && git commit -m "deploy: v${VERSION}"`, { 
    cwd: rootDir, 
    stdio: 'inherit' 
  });
  execSync('git push origin gh-pages --force', { 
    cwd: rootDir, 
    stdio: 'inherit' 
  });
  console.log('   ✅ gh-pages 分支已推送');

  execSync('git checkout master', { 
    cwd: rootDir, 
    stdio: 'inherit' 
  });
  console.log('   ✅ 已切换回 master 分支');

} catch (e) {
  console.error('❌ 推送失败');
  try {
    execSync('git checkout master', { cwd: rootDir, stdio: 'inherit' });
  } catch {}
  process.exit(1);
}

console.log(`\n🎉 部署完成！AI 漫剧工作室 v${VERSION}`);
console.log('   ✅ master 分支已更新');
console.log('   ✅ gh-pages 分支已更新');
console.log('   ✅ GitHub Pages 将自动同步\n');