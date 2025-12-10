/**
 * Biology Tutor Backend Service
 * 
 * This service integrates with the Biology Tutorial Workflow backend
 * for AI-powered biology tutoring with SSE real-time updates.
 */
import { Message } from "../types";

// 运行时配置接口
interface RuntimeConfig {
  BACKEND_URL?: string;
  API_KEY?: string;
}

// 获取运行时配置（Docker 环境注入）
function getRuntimeConfig(): RuntimeConfig {
  return (window as any).__RUNTIME_CONFIG__ || {};
}

// 动态配置 - 优先使用运行时配置
const runtimeConfig = getRuntimeConfig();
let API_BASE = (runtimeConfig.BACKEND_URL || "http://localhost:8000").replace(/\/$/, '') + "/api";
let currentModelConfig: any = null;

/**
 * 意图类型枚举
 */
export enum IntentType {
  IMAGE_ANALYSIS = "image_analysis",  // 图片分析（错题辅导）
  GENERAL_CHAT = "general_chat",      // 普通聊天
  CONCEPT_EXPLAIN = "concept_explain", // 概念解释
  // 预留更多意图类型
}

/**
 * 意图识别结果
 */
export interface IntentResult {
  intent: IntentType;
  confidence: number;
  params?: Record<string, any>;
}

/**
 * 意图识别接口（预留）
 * 后续可以接入 LLM 或规则引擎进行意图识别
 */
export async function detectIntent(message: Message): Promise<IntentResult> {
  const hasImage = message.attachments && message.attachments.length > 0;
  
  // 简单规则：有图片就是图片分析，否则是普通聊天
  // TODO: 后续可以接入 LLM 进行更智能的意图识别
  if (hasImage) {
    return {
      intent: IntentType.IMAGE_ANALYSIS,
      confidence: 1.0,
    };
  }
  
  // 检查是否是概念相关问题（简单关键词匹配）
  const conceptKeywords = ["什么是", "解释", "概念", "定义", "原理"];
  const content = message.content.toLowerCase();
  if (conceptKeywords.some(kw => content.includes(kw))) {
    return {
      intent: IntentType.CONCEPT_EXPLAIN,
      confidence: 0.8,
    };
  }
  
  return {
    intent: IntentType.GENERAL_CHAT,
    confidence: 1.0,
  };
}

/**
 * 设置后端配置
 */
export function setBackendConfig(backendUrl: string, modelConfig?: any) {
  API_BASE = backendUrl.replace(/\/$/, '') + "/api";
  currentModelConfig = modelConfig;
  console.log("[BiologyTutor] Backend URL set to:", API_BASE);
  console.log("[BiologyTutor] Model config set to:", modelConfig);
}

/**
 * 获取当前后端 URL
 */
export function getBackendUrl(): string {
  return API_BASE;
}

export interface BiologySession {
  sessionId: string;
  greeting: string;
}

export interface TaskStatus {
  session_id: string;
  conversation_state: string;
  tasks: Record<string, string>;
  task_errors?: Record<string, string>;
  has_question: boolean;
  has_solution: boolean;
  question_text?: string;
  exam_points?: string[];
  knowledge_points?: string[];
  logic_chain_steps?: string[];
  thinking_pattern?: string;
}

export interface SSEEvent {
  type: string;
  data: any;
  timestamp: number;
}

/**
 * 解析错误响应
 */
async function parseErrorResponse(response: Response): Promise<string> {
  try {
    const data = await response.json();
    if (response.status === 401 || response.status === 403) {
      return `API 鉴权失败：${data.detail || data.message || 'API Key 无效或已过期，请检查设置'}`;
    }
    if (data.detail) return data.detail;
    if (data.message) return data.message;
    if (data.error) return data.error;
    return response.statusText;
  } catch {
    return response.statusText;
  }
}

/**
 * Create a new tutoring session with model configuration
 */
export async function createSession(): Promise<BiologySession> {
  const requestBody: any = {};
  
  if (currentModelConfig) {
    requestBody.models = {
      vision_model: currentModelConfig.visionModel,
      vision_api_key: currentModelConfig.visionApiKey,
      deep_model: currentModelConfig.deepModel,
      deep_api_key: currentModelConfig.deepApiKey,
      quick_model: currentModelConfig.quickModel,
      quick_api_key: currentModelConfig.quickApiKey,
    };
  }
  
  const response = await fetch(`${API_BASE}/session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody),
  });
  
  if (!response.ok) {
    const errorMsg = await parseErrorResponse(response);
    throw new Error(`创建会话失败: ${errorMsg}`);
  }
  
  const data = await response.json();
  return {
    sessionId: data.session_id,
    greeting: data.greeting,
  };
}

/**
 * Upload an image for analysis
 */
export async function uploadImage(
  sessionId: string,
  imageData: string,
  mimeType: string
): Promise<string> {
  const byteCharacters = atob(imageData);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: mimeType });
  
  const formData = new FormData();
  formData.append("file", blob, "image.jpg");
  
  const response = await fetch(`${API_BASE}/session/${sessionId}/image`, {
    method: "POST",
    body: formData,
  });
  
  if (!response.ok) {
    const errorMsg = await parseErrorResponse(response);
    throw new Error(`图片上传失败: ${errorMsg}`);
  }
  
  const data = await response.json();
  return data.message;
}

/**
 * Send a message in the tutoring session
 */
export async function sendMessage(
  sessionId: string,
  content: string
): Promise<{ content: string; is_final: boolean }> {
  const response = await fetch(`${API_BASE}/session/${sessionId}/message`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });
  
  if (!response.ok) {
    const errorMsg = await parseErrorResponse(response);
    throw new Error(`发送消息失败: ${errorMsg}`);
  }
  
  return response.json();
}

/**
 * Get session status
 */
export async function getSessionStatus(sessionId: string): Promise<TaskStatus> {
  const response = await fetch(`${API_BASE}/session/${sessionId}/status`);
  
  if (!response.ok) {
    const errorMsg = await parseErrorResponse(response);
    throw new Error(`获取状态失败: ${errorMsg}`);
  }
  
  return response.json();
}

/**
 * Subscribe to SSE events and wait for specific event or error
 */
function waitForTaskResult(
  sessionId: string,
  taskName: string,
  timeoutMs: number = 60000
): Promise<{ success: boolean; data?: any; error?: string }> {
  return new Promise((resolve) => {
    const eventSource = new EventSource(`${API_BASE}/session/${sessionId}/events`);
    const timeout = setTimeout(() => {
      eventSource.close();
      resolve({ success: false, error: "任务超时" });
    }, timeoutMs);
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("[SSE] Received event:", data);
        
        // Check for task completion
        if (data.type === "task_completed" && data.data?.task === taskName) {
          clearTimeout(timeout);
          eventSource.close();
          resolve({ success: true, data: data.data });
        }
        
        // Check for task failure
        if (data.type === "task_failed" && data.data?.task === taskName) {
          clearTimeout(timeout);
          eventSource.close();
          resolve({ success: false, error: data.data?.error || "任务失败" });
        }
        
        // Check for any task failure (for immediate error reporting)
        if (data.type === "task_failed") {
          console.error("[SSE] Task failed:", data.data);
        }
      } catch (e) {
        console.error("Failed to parse SSE event:", e);
      }
    };
    
    eventSource.onerror = () => {
      clearTimeout(timeout);
      eventSource.close();
      resolve({ success: false, error: "SSE 连接错误" });
    };
  });
}

/**
 * 监听所有任务状态，返回第一个失败的任务
 */
async function monitorTasksForErrors(
  sessionId: string,
  onError: (taskName: string, error: string) => void,
  onComplete: () => void
): Promise<() => void> {
  const eventSource = new EventSource(`${API_BASE}/session/${sessionId}/events`);
  
  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      
      // 任务失败 - 立即报错
      if (data.type === "task_failed") {
        const taskName = data.data?.task || "unknown";
        const error = data.data?.error || "任务失败";
        console.error(`[SSE] Task ${taskName} failed:`, error);
        onError(taskName, error);
      }
      
      // 会话完成
      if (data.type === "session_complete") {
        onComplete();
      }
    } catch (e) {
      console.error("Failed to parse SSE event:", e);
    }
  };
  
  // 返回清理函数
  return () => {
    eventSource.close();
  };
}

/**
 * 普通聊天工作流 - 通过后端处理
 */
async function* handleGeneralChat(
  sessionId: string,
  messages: Message[]
): AsyncGenerator<string, void, unknown> {
  const lastMessage = messages[messages.length - 1];
  
  try {
    // 通过后端的通用聊天接口处理
    const response = await fetch(`${API_BASE}/session/${sessionId}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: lastMessage.content }),
    });
    
    if (!response.ok) {
      const errorMsg = await parseErrorResponse(response);
      yield `❌ **聊天失败**\n\n${errorMsg}\n\n请检查网络连接或 API 配置。`;
      return;
    }
    
    const data = await response.json();
    yield data.content;
  } catch (error: any) {
    yield `❌ **聊天失败**\n\n${error.message}\n\n请检查网络连接或 API 配置。`;
  }
}

/**
 * Stream response from Biology Tutor backend
 * This is an async generator that yields response chunks
 */
export async function* streamBiologyTutorResponse(
  messages: Message[],
  onTaskUpdate?: (taskName: string, status: string, data?: any) => void
): AsyncGenerator<string, void, unknown> {
  const lastMessage = messages[messages.length - 1];
  
  // 意图识别
  const intentResult = await detectIntent(lastMessage);
  console.log("[BiologyTutor] Detected intent:", intentResult);
  
  // 检查是否已有会话
  let sessionId = (window as any).__biologySessionId;
  const hasExistingSession = !!sessionId;
  
  // 如果没有会话，需要创建
  if (!sessionId) {
    try {
      const session = await createSession();
      sessionId = session.sessionId;
      (window as any).__biologySessionId = sessionId;
      
      // 如果是图片分析，显示问候语
      if (intentResult.intent === IntentType.IMAGE_ANALYSIS) {
        yield session.greeting + "\n\n";
      }
    } catch (error: any) {
      yield `❌ **连接失败**\n\n${error.message}\n\n请检查后端服务是否启动，或在设置中检查配置。`;
      return;
    }
  }
  
  // 只有在【没有已存在的会话】且【是普通聊天意图】时，才走普通聊天工作流
  // 如果已经有会话（说明已经上传过图片），后续的文字输入都走题目解答工作流
  if (!hasExistingSession && (intentResult.intent === IntentType.GENERAL_CHAT || intentResult.intent === IntentType.CONCEPT_EXPLAIN)) {
    // 普通聊天工作流 - 通过后端处理
    yield* handleGeneralChat(sessionId, messages);
    return;
  }
  
  // 图片分析工作流
  const hasImage = lastMessage.attachments && lastMessage.attachments.length > 0;
  
  // 设置错误监听
  let hasError = false;
  let errorMessage = "";
  
  const cleanup = await monitorTasksForErrors(
    sessionId,
    (taskName, error) => {
      hasError = true;
      errorMessage = `❌ **${taskName} 失败**\n\n${error}\n\n请检查设置中的 API Key 配置。`;
      onTaskUpdate?.(taskName, "failed", { error });
    },
    () => {
      onTaskUpdate?.("session", "complete");
    }
  );
  
  try {
    // 如果有图片，上传并处理
    if (hasImage && lastMessage.attachments) {
      const attachment = lastMessage.attachments[0];
      
      try {
        const uploadMessage = await uploadImage(
          sessionId,
          attachment.data,
          attachment.mimeType
        );
        yield uploadMessage + "\n\n";
        
        // 检查是否已经有错误
        if (hasError) {
          yield errorMessage;
          return;
        }
        
        const response = await sendMessage(sessionId, "");
        yield response.content;
        
        // 等待一小段时间让后台任务开始，然后检查错误
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // 检查任务状态
        const status = await getSessionStatus(sessionId);
        
        // 检查是否有任务失败
        const failedTasks = Object.entries(status.tasks)
          .filter(([_, taskStatus]) => taskStatus === "failed");
        
        if (failedTasks.length > 0) {
          for (const [taskName] of failedTasks) {
            const error = status.task_errors?.[taskName] || "任务失败";
            yield `\n\n❌ **${taskName} 失败**\n\n${error}\n\n请检查设置中的 API Key 配置。`;
          }
          return;
        }
        
        // 再次检查 SSE 错误
        if (hasError) {
          yield errorMessage;
          return;
        }
      } catch (error: any) {
        yield `❌ **上传失败**\n\n${error.message}\n\n请检查网络连接或重试。`;
        return;
      }
      
      return;
    }
    
    // 发送文本消息
    if (lastMessage.content.trim()) {
      // 先获取状态，判断当前阶段
      const status = await getSessionStatus(sessionId);
      
      // 如果已经在辅导状态（第二阶段），直接使用流式接口发送用户消息
      if (status.conversation_state === "tutoring") {
        console.log("[BiologyTutor] Phase 2: Sending user message via stream:", lastMessage.content);
        for await (const chunk of sendMessageStream(sessionId, lastMessage.content)) {
          yield chunk;
        }
        return;
      }
      
      // 第一阶段：使用普通消息接口
      let response: { content: string; is_final: boolean };
      try {
        response = await sendMessage(sessionId, lastMessage.content);
        yield response.content;
      } catch (error: any) {
        yield `❌ **发送失败**\n\n${error.message}\n\n请检查网络连接或重试。`;
        return;
      }
      
      // 检查错误
      if (hasError) {
        yield "\n\n" + errorMessage;
        return;
      }
      
      // 重新获取状态
      const newStatus = await getSessionStatus(sessionId);
      
      // 如果进入辅导状态，等待任务完成
      if (newStatus.conversation_state === "tutoring") {
        yield* waitForTutoringResults(sessionId, newStatus, () => hasError, () => errorMessage);
      }
    }
  } finally {
    cleanup();
  }
}

/**
 * 等待辅导结果
 */
async function* waitForTutoringResults(
  sessionId: string,
  initialStatus: TaskStatus,
  checkError: () => boolean,
  getErrorMessage: () => string
): AsyncGenerator<string, void, unknown> {
  let shownQuestion = false;
  let shownExamPoints = false;
  
  // 检查已有结果
  if (initialStatus.tasks.vision_extraction === "completed" && initialStatus.question_text) {
    yield "\n\n📝 **题目内容：**\n" + initialStatus.question_text + "\n\n";
    shownQuestion = true;
  }
  
  if (initialStatus.tasks.exam_points === "completed" && initialStatus.exam_points?.length) {
    yield "📊 **这道题的考察点：**\n" + 
      initialStatus.exam_points.map((p: string) => `• ${p}`).join("\n") + "\n\n";
    shownExamPoints = true;
  }
  
  // 等待结果
  if (!shownQuestion || !shownExamPoints) {
    if (!shownQuestion) yield "\n\n正在识别题目...\n\n";
    
    let attempts = 0;
    const maxAttempts = 60;
    
    while (attempts < maxAttempts && (!shownQuestion || !shownExamPoints)) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      attempts++;
      
      // 检查错误
      if (checkError()) {
        yield getErrorMessage();
        return;
      }
      
      try {
        const currentStatus = await getSessionStatus(sessionId);
        
        // 检查任务失败
        if (currentStatus.tasks.vision_extraction === "failed") {
          const error = currentStatus.task_errors?.vision_extraction || "图片识别失败";
          yield `❌ **题目识别失败**\n\n${error}\n\n请检查设置中的 API Key 配置。\n\n`;
          return;
        }
        
        if (!shownQuestion && currentStatus.tasks.vision_extraction === "completed" && currentStatus.question_text) {
          yield "📝 **题目内容：**\n" + currentStatus.question_text + "\n\n";
          shownQuestion = true;
        }
        
        if (currentStatus.tasks.exam_points === "failed") {
          const error = currentStatus.task_errors?.exam_points || "考察点分析失败";
          yield `❌ **考察点分析失败**\n\n${error}\n\n`;
          shownExamPoints = true;
        } else if (!shownExamPoints && currentStatus.tasks.exam_points === "completed" && currentStatus.exam_points?.length) {
          yield "📊 **这道题的考察点：**\n" + 
            currentStatus.exam_points.map((p: string) => `• ${p}`).join("\n") + "\n\n";
          shownExamPoints = true;
        }
      } catch (e) {
        console.error("Status check failed:", e);
      }
    }
    
    if (attempts >= maxAttempts) {
      if (!shownQuestion) yield "⏰ 题目识别超时\n\n";
      if (!shownExamPoints) yield "⏰ 考察点分析超时\n\n";
    }
  }
  
  // 等待所有任务完成
  yield "请稍等，我正在整理完整的分析结果...\n\n";
  
  let attempts = 0;
  const maxAttempts = 120;
  
  while (attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    attempts++;
    
    if (checkError()) {
      yield getErrorMessage();
      return;
    }
    
    try {
      const currentStatus = await getSessionStatus(sessionId);
      
      // 检查任务失败
      const failedTasks = Object.entries(currentStatus.tasks)
        .filter(([_, status]) => status === "failed");
      
      if (failedTasks.length > 0) {
        for (const [taskName] of failedTasks) {
          const error = currentStatus.task_errors?.[taskName] || "任务失败";
          yield `\n\n❌ **${taskName} 失败**\n\n${error}\n\n`;
        }
        yield "请检查设置中的 API Key 配置后重试~";
        return;
      }
      
      // 检查是否全部完成
      const allComplete = 
        currentStatus.tasks.vision_extraction === "completed" &&
        currentStatus.tasks.exam_points === "completed" &&
        currentStatus.tasks.deep_solution === "completed" &&
        currentStatus.tasks.knowledge_points === "completed" &&
        currentStatus.tasks.logic_chain === "completed";
      
      if (allComplete) {
        yield "✅ 分析完成！\n\n";
        yield "正在为你准备辅导内容...\n\n";
        
        // 用户已经选择了辅导方式，自动开始辅导
        // 调用流式端点开始辅导
        for await (const chunk of sendMessageStream(sessionId, "开始辅导")) {
          yield chunk;
        }
        return;
      }
      
      if (attempts % 10 === 0) {
        yield ".";
      }
    } catch (e) {
      console.error("Status check failed:", e);
    }
  }
  
  yield "\n⏰ 分析超时，请重试~";
}


/**
 * Send a message with streaming response (Phase 2 tutoring)
 * This function handles guided tutoring and direct answer modes
 */
export async function* sendMessageStream(
  sessionId: string,
  content: string
): AsyncGenerator<string, void, unknown> {
  try {
    // Directly use streaming endpoint for Phase 2
    // No need to check first - just stream
    const response = await fetch(`${API_BASE}/session/${sessionId}/message/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    
    if (!response.ok) {
      const errorMsg = await parseErrorResponse(response);
      yield `❌ **发送失败**\n\n${errorMsg}`;
      return;
    }
    
    // Process SSE stream
    const reader = response.body?.getReader();
    if (!reader) {
      yield "❌ **无法读取响应流**";
      return;
    }
    
    const decoder = new TextDecoder();
    let buffer = "";
    
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || "";
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.type === 'chunk' && data.content) {
                yield data.content;
              } else if (data.type === 'error') {
                yield `\n\n❌ **错误**\n\n${data.error}`;
              } else if (data.type === 'done') {
                return;
              }
            } catch (e) {
              // Ignore parse errors
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  } catch (error: any) {
    yield `❌ **连接失败**\n\n${error.message}\n\n请检查网络连接或后端服务是否启动。`;
  }
}

/**
 * Enhanced workflow that uses streaming for Phase 2
 */
export async function* processMessageWithStreaming(
  sessionId: string,
  messages: Message[],
  onTaskUpdate?: (taskName: string, status: string, data?: any) => void
): AsyncGenerator<string, void, unknown> {
  if (messages.length === 0) return;
  
  const lastMessage = messages[messages.length - 1];
  const hasImage = lastMessage.attachments && lastMessage.attachments.length > 0;
  
  // Set up error monitoring
  let hasError = false;
  let errorMessage = "";
  
  const cleanup = await monitorTasksForErrors(
    sessionId,
    (taskName, error) => {
      hasError = true;
      errorMessage = `❌ **${taskName} 失败**\n\n${error}\n\n请检查设置中的 API Key 配置。`;
      onTaskUpdate?.(taskName, "failed", { error });
    },
    () => {
      onTaskUpdate?.("session", "complete");
    }
  );
  
  try {
    // Handle image upload (Phase 1)
    if (hasImage && lastMessage.attachments) {
      const attachment = lastMessage.attachments[0];
      
      try {
        const uploadMessage = await uploadImage(
          sessionId,
          attachment.data,
          attachment.mimeType
        );
        yield uploadMessage + "\n\n";
        
        if (hasError) {
          yield errorMessage;
          return;
        }
        
        const response = await sendMessage(sessionId, "");
        yield response.content;
        
        // Wait for tasks to start
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const status = await getSessionStatus(sessionId);
        const failedTasks = Object.entries(status.tasks)
          .filter(([_, taskStatus]) => taskStatus === "failed");
        
        if (failedTasks.length > 0) {
          for (const [taskName] of failedTasks) {
            const error = status.task_errors?.[taskName] || "任务失败";
            yield `\n\n❌ **${taskName} 失败**\n\n${error}`;
          }
          return;
        }
        
        if (hasError) {
          yield errorMessage;
          return;
        }
      } catch (error: any) {
        yield `❌ **上传失败**\n\n${error.message}`;
        return;
      }
      
      return;
    }
    
    // Handle text message
    if (lastMessage.content.trim()) {
      // Get current status to determine phase
      const status = await getSessionStatus(sessionId);
      
      // If in tutoring state (Phase 2), use streaming
      if (status.conversation_state === "tutoring" || 
          status.conversation_state === "awaiting_style") {
        // Use streaming for Phase 2
        for await (const chunk of sendMessageStream(sessionId, lastMessage.content)) {
          yield chunk;
        }
      } else {
        // Phase 1 - use regular message
        try {
          const response = await sendMessage(sessionId, lastMessage.content);
          yield response.content;
          
          if (hasError) {
            yield "\n\n" + errorMessage;
            return;
          }
          
          // Check if we need to wait for tutoring results
          const newStatus = await getSessionStatus(sessionId);
          if (newStatus.conversation_state === "tutoring") {
            yield* waitForTutoringResults(sessionId, newStatus, () => hasError, () => errorMessage);
          }
        } catch (error: any) {
          yield `❌ **发送失败**\n\n${error.message}`;
          return;
        }
      }
    }
  } finally {
    cleanup();
  }
}
