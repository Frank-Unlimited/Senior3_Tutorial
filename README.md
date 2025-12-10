# Senior3 Tutorial - 高中生物智能辅导系统

基于 LangChain 和 React 的高中生物错题辅导系统，采用"温柔大姐姐"人设，提供个性化的学习辅导体验。

## 项目结构

```
├── TutorialChat/          # 前端 (React + Vite + TypeScript)
├── TutorialChat_backend/  # 后端 (FastAPI + LangChain)
└── .kiro/                 # Kiro 规格文档
```

## 功能特点

- 📸 **图片识别**: 上传错题图片，自动提取题目内容
- 🧠 **智能解答**: 深度思考模型生成详细解答过程
- 📊 **考察点分析**: 快速总结题目考察的知识点
- 🔗 **逻辑链梳理**: 整理解题思路和逻辑链
- 💬 **个性化辅导**: 支持引导式和直接解答两种辅导方式
- 🌸 **温柔人设**: 温柔大姐姐风格的交互体验

## 快速开始

### 前端

```bash
cd TutorialChat
npm install
npm run dev
```

访问 http://localhost:3000

### 后端

```bash
cd TutorialChat_backend
pip install -r requirements.txt
cp settings.example.yaml settings.yaml
# 编辑 settings.yaml 配置 API Key
python main.py
```

访问 http://localhost:8000

## Docker 部署

### 前端

```bash
cd TutorialChat
docker build -t biotutor-frontend .
docker run -d -p 80:80 -e BACKEND_URL=http://your-backend:8000 biotutor-frontend
```

### 后端

```bash
cd TutorialChat_backend
docker build -t biotutor-backend .
docker run -d -p 8000:8000 -v ./settings.yaml:/app/settings.yaml biotutor-backend
```

## 配置说明

后端配置文件 `settings.yaml` 示例：

```yaml
vision_model:
  provider: doubao
  model_name: doubao-1-5-vision-pro-32k-250115
  api_key: your-api-key
  api_base: https://ark.cn-beijing.volces.com/api/v3

deep_thinking_model:
  provider: doubao
  model_name: doubao-1-5-pro-32k-250115
  api_key: your-api-key
  api_base: https://ark.cn-beijing.volces.com/api/v3

quick_model:
  provider: doubao
  model_name: doubao-1-5-lite-32k-250115
  api_key: your-api-key
  api_base: https://ark.cn-beijing.volces.com/api/v3
```

## 技术栈

**前端:**
- React 19
- TypeScript
- Vite
- TailwindCSS

**后端:**
- FastAPI
- LangChain
- Python 3.10+

## License

MIT
