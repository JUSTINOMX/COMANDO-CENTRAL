import { AIProvider, AIMessage, ChatOptions, ChatResponse, ChatChunk, ProviderConfig } from "../types.js";

export class KimiProvider implements AIProvider {
  readonly name = 'kimi';
  readonly displayName = 'Kimi K2';
  readonly providerType = 'kimi' as const;
  readonly defaultModel = 'kimi-k2';
  
  private baseUrl = 'https://api.moonshot.cn/v1';
  private apiKey: string = '';
  private model: string = 'kimi-k2';
  
  configure(config: ProviderConfig) {
    this.apiKey = config.apiKey || process.env.KIMI_API_KEY || '';
    if (config.baseUrl) this.baseUrl = config.baseUrl;
    if (config.model) this.model = config.model;
  }
  
  async chat(messages: AIMessage[], options?: ChatOptions): Promise<ChatResponse> {
    const key = this.apiKey || process.env.KIMI_API_KEY || '';
    if (!key) {
      throw new Error("Kimi API Key is not configured.");
    }

    const payloadMessages = [...messages];
    if (options?.systemPrompt) {
      payloadMessages.unshift({ role: 'system', content: options.systemPrompt });
    }

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`
      },
      body: JSON.stringify({
        model: options?.model || this.model,
        messages: payloadMessages,
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 4096,
        stream: false
      })
    });
    
    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      throw new Error(`Kimi API error: ${response.status} - ${errText}`);
    }
    const data = await response.json();
    
    return {
      content: data.choices[0].message.content,
      model: data.model,
      usage: {
        promptTokens: data.usage?.prompt_tokens || 0,
        completionTokens: data.usage?.completion_tokens || 0,
        totalTokens: data.usage?.total_tokens || 0
      }
    };
  }
  
  async *streamChat(messages: AIMessage[], options?: ChatOptions): AsyncGenerator<ChatChunk> {
    const key = this.apiKey || process.env.KIMI_API_KEY || '';
    if (!key) {
      throw new Error("Kimi API Key is not configured.");
    }

    const payloadMessages = [...messages];
    if (options?.systemPrompt) {
      payloadMessages.unshift({ role: 'system', content: options.systemPrompt });
    }

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`
      },
      body: JSON.stringify({
        model: options?.model || this.model,
        messages: payloadMessages,
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 4096,
        stream: true
      })
    });
    
    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      throw new Error(`Kimi API error: ${response.status} - ${errText}`);
    }

    const body = response.body;
    if (!body) return;
    
    const decoder = new TextDecoder();
    let buffer = '';
    
    if (typeof (body as any)[Symbol.asyncIterator] === 'function') {
      for await (const chunk of (body as any)) {
        buffer += decoder.decode(chunk, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        
        for (const line of lines) {
          const cleanLine = line.trim();
          if (!cleanLine) continue;
          if (cleanLine === 'data: [DONE]') continue;
          if (cleanLine.startsWith('data: ')) {
            try {
              const json = JSON.parse(cleanLine.slice(6));
              const content = json.choices?.[0]?.delta?.content || '';
              if (content) {
                yield { content, done: false };
              }
            } catch (e) {
              // ignore
            }
          }
        }
      }
    } else {
      const reader = body.getReader();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          
          for (const line of lines) {
            const cleanLine = line.trim();
            if (!cleanLine) continue;
            if (cleanLine === 'data: [DONE]') continue;
            if (cleanLine.startsWith('data: ')) {
              try {
                const json = JSON.parse(cleanLine.slice(6));
                const content = json.choices?.[0]?.delta?.content || '';
                if (content) {
                  yield { content, done: false };
                }
              } catch (e) {
                // ignore
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    }
    yield { content: '', done: true };
  }
  
  async isAvailable(): Promise<boolean> {
    const key = this.apiKey || process.env.KIMI_API_KEY;
    return !!key;
  }
  
  async listModels(): Promise<string[]> {
    return ['kimi-k2', 'moonshot-v1-8k', 'moonshot-v1-16k', 'moonshot-v1-32k'];
  }
  
  async embed(texts: string[]): Promise<number[][]> {
    return texts.map(() => []);
  }
}
