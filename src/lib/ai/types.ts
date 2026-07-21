export interface AIProvider {
  readonly name: string;
  readonly displayName: string;
  readonly providerType: 'deepseek' | 'kimi' | 'gemini' | 'openai';
  readonly defaultModel: string;
  
  // Chat
  chat(messages: AIMessage[], options?: ChatOptions): Promise<ChatResponse>;
  streamChat(messages: AIMessage[], options?: ChatOptions): AsyncGenerator<ChatChunk>;
  
  // Embeddings (para búsqueda semántica en memoria)
  embed(texts: string[]): Promise<number[][]>;
  
  // Utilidades
  configure(config: ProviderConfig): void;
  isAvailable(): Promise<boolean>;
  listModels(): Promise<string[]>;
}

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  name?: string;
}

export interface ChatOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  stream?: boolean;
}

export interface ChatResponse {
  content: string;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface ChatChunk {
  content: string;
  done: boolean;
}

export interface ProviderConfig {
  apiKey: string;
  baseUrl?: string;
  model?: string;
  maxRetries?: number;
  timeout?: number;
}

export interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  description?: string;
  maxTokens?: number;
  isDefault?: boolean;
}
