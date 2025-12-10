# Senior3 Tutorial Frontend - 高中生物智能辅导系统（前端）

基于 React + Vite + TypeScript 的高中生物错题辅导系统前端。

## 功能特点

- 📸 **图片上传**: 支持拍照或选择图片上传错题
- 💬 **实时对话**: 与 AI 辅导老师实时交互
- 🎨 **温柔界面**: 清新的绿色主题，舒适的学习体验
- ⚙️ **灵活配置**: 支持配置不同的 AI 模型和后端地址
- 📱 **响应式设计**: 支持桌面和移动端

## 快速开始

### 本地开发

```bash
npm install
npm run dev
```

访问 http://localhost:3000

### 构建生产版本

```bash
npm run build
```

## Docker 部署

### 构建镜像

```bash
docker build -t biotutor-frontend .
```

### 运行容器

```bash
docker run -d -p 80:80 \
  -e BACKEND_URL=http://your-backend:8000 \
  biotutor-frontend
```

### 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| BACKEND_URL | 后端 API 地址 | http://localhost:8000 |
| API_KEY | Gemini API Key（可选） | - |

## 推送到阿里云镜像

```bash
# 登录阿里云镜像仓库
docker login --username=<账号> registry.cn-hangzhou.aliyuncs.com

# 打标签
docker tag biotutor-frontend registry.cn-hangzhou.aliyuncs.com/<命名空间>/biotutor-frontend:latest

# 推送
docker push registry.cn-hangzhou.aliyuncs.com/<命名空间>/biotutor-frontend:latest
```

## 技术栈

- React 19
- TypeScript
- Vite
- TailwindCSS
- React Markdown

## 相关仓库

- 后端仓库: [Senior3_Tutorial_Backend](https://github.com/Frank-Unlimited/Senior3_Tutorial_Backend)

## License

MIT
