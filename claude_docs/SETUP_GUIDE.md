# 🏋️ Gym-Buddy 数据库和认证配置指南

本指南将帮助您配置 Gym-Buddy 项目的 MongoDB 数据库和认证系统。

## 📋 前置要求

- Docker 和 Docker Compose 已安装
- Node.js 18+ 和 pnpm 已安装
- Google OAuth 应用已创建（可选）

## 🚀 快速开始

### 1. 启动本地 MongoDB

```bash
# 在项目根目录运行
docker-compose up -d

# 检查容器状态
docker-compose ps
```

这将启动：
- **MongoDB** (localhost:27017)
- **MongoDB Express** (localhost:8081) - 数据库管理界面

### 2. 配置环境变量

复制环境变量文件并配置：

```bash
cd app
cp .env.local.example .env.local
```

编辑 `.env.local` 文件，填入您的配置：

```env
# 必须配置
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-super-secret-jwt-secret-key-here
MONGODB_URI=mongodb://gym_admin:gym_password_2024@localhost:27017/gym_buddy?authSource=admin

# Google OAuth (可选但推荐)
AUTH_GOOGLE_ID=your-google-oauth-client-id
AUTH_GOOGLE_SECRET=your-google-oauth-client-secret
```

### 3. 安装依赖并启动应用

```bash
cd app
pnpm install
pnpm run dev
```

应用将在 http://localhost:3000 启动。

## 🔧 详细配置

### MongoDB 配置

#### 本地开发环境
- **用户名**: `gym_admin`
- **密码**: `gym_password_2024`
- **数据库**: `gym_buddy`
- **连接URL**: `mongodb://gym_admin:gym_password_2024@localhost:27017/gym_buddy?authSource=admin`

#### 生产环境 (MongoDB Atlas)
1. 创建 MongoDB Atlas 集群
2. 创建数据库用户
3. 获取连接字符串
4. 更新 `.env.local` 中的 `MONGODB_URI`

```env
# 生产环境示例
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/gym_buddy?retryWrites=true&w=majority
```

### Google OAuth 配置

1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 创建新项目或选择已有项目
3. 启用 Google+ API
4. 创建 OAuth 2.0 客户端ID
5. 设置授权回调URL：`http://localhost:3000/api/auth/callback/google`
6. 复制客户端ID和密钥到 `.env.local`

## 👤 用户角色系统

### 角色层级
1. **超级管理员** (SUPER_ADMIN) - 最高权限
2. **Gym管理员** (GYM_ADMIN) - 管理教练和会员 [未来功能]
3. **教练** (TRAINER) - 管理分配的学员
4. **学员** (MEMBER) - 基础用户

### 默认权限
- **OAuth注册用户**: 默认为 `MEMBER` 角色
- **凭据注册用户**: 默认为 `MEMBER` 角色
- **角色升级**: 需要管理员手动分配

## 🗃️ 数据模型

### User 模型
```typescript
interface IUser {
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  isActive: boolean;
  trainerId?: ObjectId; // 学员所属教练
  fitnessProfile?: {
    height: number;
    weight: number;
    fitnessGoals: string[];
    fitnessLevel: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  };
  // ... 其他字段
}
```

### TrainerMemberRelation 模型
```typescript
interface ITrainerMemberRelation {
  trainerId: ObjectId;
  memberId: ObjectId;
  assignedAt: Date;
  isActive: boolean;
  // ... 其他字段
}
```

## 🔐 认证流程

### 支持的认证方式
1. **Email/Password** - 传统凭据认证
2. **Google OAuth** - Google SSO
3. **GitHub OAuth** - GitHub SSO

### 安全特性
- ✅ 密码 bcrypt 加密
- ✅ JWT token 会话管理
- ✅ 基于角色的权限控制
- ✅ 安全的密码比较
- ✅ 自动会话过期
- ✅ OAuth provider 集成

## 🛠️ 开发工具

### MongoDB Express (数据库管理)
- URL: http://localhost:8081
- 用户名: 无需认证
- 功能: 查看和管理数据库

### 有用的命令

```bash
# 查看MongoDB日志
docker-compose logs mongodb

# 重启数据库
docker-compose restart mongodb

# 停止所有服务
docker-compose down

# 清理数据 (谨慎使用)
docker-compose down -v
```

## 🚨 常见问题

### 1. MongoDB 连接失败
- 确保 Docker 容器正在运行
- 检查环境变量是否正确
- 确认防火墙设置

### 2. OAuth 认证失败
- 检查 Google/GitHub OAuth 配置
- 确认回调URL正确
- 验证客户端ID和密钥

### 3. 权限错误
- 检查用户角色分配
- 验证 JWT token 有效性
- 确认数据库连接

## 📝 下一步

1. **创建初始管理员用户**
2. **配置邮件服务** (用于邮箱验证)
3. **实现文件上传** (用户头像)
4. **添加中间件路由保护**
5. **创建管理面板**

## 🆘 需要帮助？

如果遇到问题，请检查：
1. Docker 容器状态
2. 环境变量配置
3. 网络连接
4. 日志输出

联系开发团队获取更多支持。