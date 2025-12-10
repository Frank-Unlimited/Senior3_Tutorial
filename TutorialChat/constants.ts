import { AIModel, ModelProvider } from './types';

export const AVAILABLE_MODELS: AIModel[] = [
  {
    id: 'biology-tutor',
    name: '生物辅导姐姐',
    provider: ModelProvider.BIOLOGY_TUTOR,
    description: '温柔大姐姐风格，专业错题辅导',
  },
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    provider: ModelProvider.GEMINI,
    description: '快速概念查询与基础题讲解',
  },
  {
    id: 'gemini-3-pro-preview',
    name: 'Gemini 3.0 Pro',
    provider: ModelProvider.GEMINI,
    description: '深度逻辑推理，适合遗传题/实验题',
  },
  {
    id: 'deepseek-chat',
    name: 'DeepSeek V3',
    provider: ModelProvider.DEEPSEEK,
    description: '擅长中文理科语境与复杂计算',
  },
];

export const DEFAULT_MODEL_ID = 'biology-tutor';