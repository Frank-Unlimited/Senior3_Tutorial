export enum Role {
  USER = 'user',
  MODEL = 'model',
}

export interface Attachment {
  type: 'image';
  mimeType: string;
  data: string; // base64
  previewUrl: string;
}

export interface Message {
  id: string;
  role: Role;
  content: string;
  attachments?: Attachment[];
  timestamp: number;
  isError?: boolean;
}

export enum ModelProvider {
  GEMINI = 'gemini',
  DEEPSEEK = 'deepseek',
  BIOLOGY_TUTOR = 'biology_tutor',
}

export interface AIModel {
  id: string;
  name: string;
  provider: ModelProvider;
  description: string;
  icon?: string;
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  selectedModelId: string;
}
