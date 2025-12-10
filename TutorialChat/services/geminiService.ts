import { GoogleGenAI, Content, Part } from "@google/genai";
import { Message, Role, Attachment } from "../types";

// Ensure API Key is present
const API_KEY = process.env.API_KEY || '';

const ai = new GoogleGenAI({ apiKey: API_KEY });

/**
 * Converts internal Message format to Gemini SDK 'Content' format.
 */
const mapMessagesToGeminiContent = (messages: Message[]): Content[] => {
  return messages.map((msg) => {
    const parts: Part[] = [];

    // Add attachments if they exist (images)
    if (msg.attachments && msg.attachments.length > 0) {
      msg.attachments.forEach((att) => {
        parts.push({
          inlineData: {
            mimeType: att.mimeType,
            data: att.data,
          },
        });
      });
    }

    // Add text content
    if (msg.content) {
      parts.push({ text: msg.content });
    }

    return {
      role: msg.role === Role.USER ? 'user' : 'model',
      parts: parts,
    };
  });
};

/**
 * Streams a response from Gemini based on chat history.
 */
export const streamGeminiResponse = async function* (
  history: Message[],
  modelId: string
): AsyncGenerator<string, void, unknown> {
  if (!API_KEY) {
    yield "Error: API_KEY is missing in the environment.";
    return;
  }

  try {
    const formattedHistory = mapMessagesToGeminiContent(history);
    
    // We use generateContentStream with full history to allow for flexible multimodal inputs
    // rather than chats.create which can be more restrictive with images in some contexts.
    const responseStream = await ai.models.generateContentStream({
      model: modelId,
      contents: formattedHistory,
      config: {
        // High School Biology Tutor Persona
        systemInstruction: "你是一位专业的高中生物辅导老师。你的目标是帮助学生理解生物学概念，解答习题，并提供考试技巧。\n\n" +
          "1. **专业性**：解释必须符合高中生物课程标准（人教版/新课标），术语准确。\n" +
          "2. **清晰易懂**：对于复杂的概念（如光合作用、有丝分裂、遗传规律），请使用类比或分步骤解释。\n" +
          "3. **解题辅助**：如果用户上传题目图片，请先分析题目考点，再逐步引导得出答案，而不是直接给出结果。\n" +
          "4. **鼓励性**：保持耐心，鼓励学生思考。\n" +
          "5. **格式**：使用Markdown格式优化阅读体验，关键术语加粗。",
        // maxOutputTokens: 1000, 
      }
    });

    for await (const chunk of responseStream) {
      const text = chunk.text;
      if (text) {
        yield text;
      }
    }
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    yield `\n[系统错误]: ${error.message || "无法生成回复，请稍后重试。"}`;
  }
};