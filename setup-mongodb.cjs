#!/usr/bin/env node
// MongoDB Atlas 设置助手
// 运行：node setup-mongodb.cjs

const readline = require('readline');
const fs = require('fs');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🍃 MongoDB Atlas 设置助手');
console.log('========================');
console.log('');
console.log('请按以下步骤操作：');
console.log('1. 访问 https://www.mongodb.com/atlas');
console.log('2. 注册/登录账号');
console.log('3. 创建免费集群（M0）');
console.log('4. 在 Database Access 创建用户');
console.log('5. 在 Network Access 允许所有 IP（0.0.0.0/0）');
console.log('6. 获取连接字符串');
console.log('');

rl.question('请输入您的 MongoDB 连接字符串：', (uri) => {
  if (!uri.includes('mongodb+srv://')) {
    console.log('❌ 连接字符串格式不正确');
    rl.close();
    return;
  }
  
  // 创建 .env 文件
  const envContent = `MONGODB_URI=${uri}
JWT_SECRET=ai-comic-studio-secret-${Date.now()}
PORT=3001
`;
  
  fs.writeFileSync('server/.env', envContent);
  console.log('✅ server/.env 文件已创建');
  console.log('');
  console.log('下一步：');
  console.log('1. 提交代码到 GitHub');
  console.log('2. 在 Render.com 部署后端');
  console.log('3. 查看 DEPLOY_GUIDE.md 获取详细步骤');
  
  rl.close();
});
