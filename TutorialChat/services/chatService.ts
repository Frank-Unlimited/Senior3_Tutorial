import { Message, ModelProvider } from "../types";
import { AVAILABLE_MODELS } from "../constants";
import { streamGeminiResponse } from "./geminiService";
import { streamBiologyTutorResponse, setBackendConfig } from "./biologyTutorService";

// 模型配置接口
export interface ModelConfig {
  visionModel: string;
  visionApiKey: string;
  deepModel: string;
  deepApiKey: string;
  quickModel: string;
  quickApiKey: string;
  backendUrl: string;
}

// 当前配置
let currentConfig: ModelConfig | null = null;

/**
 * 设置模型配置
 */
export function setModelConfig(config: ModelConfig) {
  currentConfig = config;
  // 更新 biologyTutorService 的后端 URL
  setBackendConfig(config.backendUrl, config);
}

/**
 * 获取当前配置
 */
export function getModelConfig(): ModelConfig | null {
  return currentConfig;
}

/**
 * Simulates a response from a backend for non-Gemini models (like DeepSeek).
 * In a real production app, this would fetch() to your Python/Node backend.
 */
async function* streamSimulatedResponse(modelName: string): AsyncGenerator<string, void, unknown> {
  const text = `This is a simulated response for **${modelName}**. \n\nSince the demo environment only has a Gemini API key configured, this provider is mocked to demonstrate UI extensibility.\n\nTo implement real DeepSeek support:\n1. Update \`services/chatService.ts\`\n2. Add your API call logic.\n3. Return the stream.`;
  
  const tokens = text.split(/(?=[ \n])/); // Split preserving delimiters for rough token simulation
  
  for (const token of tokens) {
    await new Promise(resolve => setTimeout(resolve, 30)); // Simulate network latency
    yield token;
  }
}

/**
 * Main service entry point. Decouples UI from specific API implementations.
 */
export const generateChatResponse = async function* (
  messages: Message[],
  modelId: string
): AsyncGenerator<string, void, unknown> {
  
  const modelConfig = AVAILABLE_MODELS.find(m => m.id === modelId);
  
  if (!modelConfig) {
    yield "Error: Selected model configuration not found.";
    return;
  }

  // Routing logic based on provider
  if (modelConfig.provider === ModelProvider.BIOLOGY_TUTOR) {
    yield* streamBiologyTutorResponse(messages);
  } else if (modelConfig.provider === ModelProvider.GEMINI) {
    yield* streamGeminiResponse(messages, modelId);
  } else {
    // Fallback / Mock for other providers (DeepSeek, etc.)
    yield* streamSimulatedResponse(modelConfig.name);
  }
};
