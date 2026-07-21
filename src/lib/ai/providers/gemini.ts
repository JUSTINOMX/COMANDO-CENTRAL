import { GoogleGenAI } from "@google/genai";
import { AIProvider, AIMessage, ChatOptions, ChatResponse, ChatChunk, ProviderConfig } from "../types.js";

export class GeminiProvider implements AIProvider {
  readonly name = 'gemini';
  readonly displayName = 'Gemini';
  readonly providerType = 'gemini' as const;
  readonly defaultModel = 'gemini-3.5-flash';
  
  private apiKey: string = '';
  private model: string = 'gemini-3.5-flash';
  private client: GoogleGenAI | null = null;
  
  configure(config: ProviderConfig) {
    this.apiKey = config.apiKey || process.env.GEMINI_API_KEY || '';
    if (config.model) this.model = config.model;
    
    // Lazy or explicit init
    if (this.apiKey) {
      this.client = new GoogleGenAI({
        apiKey: this.apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
    }
  }
  
  private getClient(): GoogleGenAI {
    if (!this.client) {
      const key = this.apiKey || process.env.GEMINI_API_KEY || 'dummy_key_not_provided';
      this.client = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
    }
    return this.client;
  }
  
  async chat(messages: AIMessage[], options?: ChatOptions): Promise<ChatResponse> {
    const ai = this.getClient();
    const systemPrompt = options?.systemPrompt;
    
    const contents = messages.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));
    
    const targetModel = options?.model || this.model;
    
    const response = await ai.models.generateContent({
      model: targetModel,
      contents,
      config: systemPrompt ? { systemInstruction: systemPrompt, temperature: options?.temperature } : { temperature: options?.temperature }
    });
    
    return {
      content: response.text || '',
      model: targetModel,
      usage: {
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0
      }
    };
  }
  
  async *streamChat(messages: AIMessage[], options?: ChatOptions): AsyncGenerator<ChatChunk> {
    const ai = this.getClient();
    const systemPrompt = options?.systemPrompt;
    
    const contents = messages.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));
    
    const targetModel = options?.model || this.model;
    
    const stream = await ai.models.generateContentStream({
      model: targetModel,
      contents,
      config: systemPrompt ? { systemInstruction: systemPrompt, temperature: options?.temperature } : { temperature: options?.temperature }
    });
    
    for await (const chunk of stream) {
      const content = chunk.text || '';
      if (content) {
        yield { content, done: false };
      }
    }
    yield { content: '', done: true };
  }
  
  async embed(texts: string[]): Promise<number[][]> {
    const ai = this.getClient();
    try {
      const results: number[][] = [];
      for (const text of texts) {
        const res: any = await ai.models.embedContent({
          model: 'gemini-embedding-2-preview',
          contents: text
        });
        const values = res.embedding?.values || res.embeddings?.[0]?.values;
        if (values) {
          results.push(values);
        } else {
          results.push([]);
        }
      }
      return results;
    } catch (e) {
      console.warn("Gemini Embed error:", e);
      return texts.map(() => []);
    }
  }
  
  async isAvailable(): Promise<boolean> {
    const key = this.apiKey || process.env.GEMINI_API_KEY;
    return !!key;
  }
  
  async listModels(): Promise<string[]> {
    return ['gemini-3.5-flash', 'gemini-3.1-pro-preview', 'gemini-3.1-flash-lite'];
  }
}
