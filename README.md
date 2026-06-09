# AI 漫剧工作室 (ai-comic-studio)

React + TypeScript + Vite 实现的前端应用，配合 Express 后端统一保存用户账号、积分、等级、任务等数据。

## 功能特性

- 账号注册 / 登录（用户名 + 密码）
- 积分系统：签到、任务、创作、兑换等
- 云端数据同步：所有用户数据通过 REST API 保存在后端 `server/db/users.json`
- localStorage 仅作为前端缓存，不再是唯一数据源
- 跨设备数据同步：登录后自动从后端读取；支持手动 JSON 导入/导出作为备份

## 启动方式

```bash
# 1. 安装依赖（前后端共用一个 node_modules）
npm install

# 2. 同时启动前后端
npm run dev
```

启动后：

- 前端 Vite 开发服务器：`http://localhost:5173`
- 后端 Express 服务器：`http://localhost:3001`
- 前端对 `/api` 的请求通过 Vite dev proxy 转发到 `http://localhost:3001`

### 单独启动

```bash
# 只启动后端（用于调试后端 API）
npm run dev:server

# 只启动前端（后端必须先启动）
npm run dev:client
```

### 构建生产版本

```bash
# 前端生产构建
npm run build

# 类型检查
npm run check

# Lint
npm run lint
```

## 后端 API

后端运行在 `http://localhost:3001`。所有用户数据以 JSON 格式持久化在 `server/db/users.json`（自动创建目录）。密码使用 SHA256 哈希存储。

### 认证

- `POST /api/auth/register` - 注册（字段：`username`, `email?`, `password`）
  - 若用户名已存在且密码正确 → 返回 `{ user }`（等同于登录）
  - 若用户名已存在但密码不正确 → 返回 `409 { error: "该用户名已注册，请直接登录或使用其他用户名" }`
  - 新用户创建 → 返回 `200 { user }`，初始积分 50、等级 1
- `POST /api/auth/login` - 登录（字段：`username`, `password`）
  - 成功 → 返回 `{ user }`，同时更新 `lastLoginDate` 与 `consecutiveLoginDays`
  - 用户不存在 → `404 { error: "该用户名未注册，请先注册" }`
  - 密码错误 → `401 { error: "密码错误，请重新输入" }`

### 用户数据

- `GET /api/users/:id` - 获取用户完整数据
- `PATCH /api/users/:id` - 部分更新用户字段（`points`, `totalEarnedPoints`, `level`, `projectsCount`, `isVIP`, `completedTasks`, `visitedPages`, `usedStyles`, `transactions` 等）

所有返回的 `user` 不包含 `password` 字段。

### 健康检查

- `GET /api/health` - 返回服务器状态与用户总数

## 目录结构

```
/workspace
├── server/                    # Express 后端
│   ├── index.ts               # 后端入口（REST API）
│   └── db/users.json          # 用户数据持久化（运行时自动生成）
├── src/                       # 前端源文件
│   ├── pages/Login.tsx        # 登录/注册页
│   ├── stores/authStore.ts    # Zustand 状态管理（调用后端 API）
│   └── types/auth.ts          # 用户/凭证类型定义
├── vite.config.ts             # 含 /api → http://localhost:3001 的代理
└── package.json
```

## 前后端同步流程

1. 用户在登录页提交用户名/密码
2. 前端 `authStore.login()` 向 `POST /api/auth/login` 发起请求
3. 后端根据 `users.json` 校验，返回用户数据或对应 HTTP 错误码（404/401）
4. 前端根据状态码显示不同提示（"该用户名未注册"、"密码错误"、"网络错误" 等）
5. 登录成功后，用户数据（积分、等级、任务、visitedPages、usedStyles 等）完全由后端返回覆盖
6. 用户在使用过程中触发的积分变动、任务完成、页面访问等，会通过 `PATCH /api/users/:id` 同步到后端
