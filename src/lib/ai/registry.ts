import { AIProvider } from "./types.js";
import { DeepSeekProvider } from "./providers/deepseek.js";
import { KimiProvider } from "./providers/kimi.js";
import { GeminiProvider } from "./providers/gemini.js";
import { OpenAIProvider } from "./providers/openai.js";
import { supabaseServer } from "../supabase/server.js";
import fs from "fs";
import path from "path";

const FALLBACK_FILE_PATH = path.join(process.cwd(), "ai_config_fallback.json");

class AIProviderRegistry {
  private providers: Map<string, AIProvider> = new Map();
  private agentModels: Map<string, { provider: string; model: string; temperature?: number; maxTokens?: number }> = new Map();
  private defaults = {
    provider: 'deepseek',
    model: 'deepseek-chat'
  };
  
  constructor() {
    this.register(new DeepSeekProvider());
    this.register(new KimiProvider());
    this.register(new GeminiProvider());
    this.register(new OpenAIProvider());
    
    // Initial standard configuration from process.env
    this.initializeFromEnv();
  }
  
  private initializeFromEnv() {
    this.getProvider('deepseek')?.configure({
      apiKey: process.env.DEEPSEEK_API_KEY || '',
      model: process.env.DEFAULT_AI_MODEL || 'deepseek-chat'
    });
    this.getProvider('kimi')?.configure({
      apiKey: process.env.KIMI_API_KEY || '',
      model: 'kimi-k2'
    });
    this.getProvider('gemini')?.configure({
      apiKey: process.env.GEMINI_API_KEY || '',
      model: 'gemini-3.5-flash'
    });
    this.getProvider('openai')?.configure({
      apiKey: process.env.OPENAI_API_KEY || '',
      baseUrl: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
      model: 'gpt-4o-mini'
    });
    
    // Set default AI provider
    const defProvider = process.env.DEFAULT_AI_PROVIDER || 'deepseek';
    const defModel = process.env.DEFAULT_AI_MODEL || 'deepseek-chat';
    this.defaults = { provider: defProvider, model: defModel };
  }
  
  register(provider: AIProvider) {
    this.providers.set(provider.name, provider);
  }
  
  getProvider(name: string): AIProvider | undefined {
    return this.providers.get(name);
  }
  
  getAvailableProviders(): AIProvider[] {
    return Array.from(this.providers.values());
  }
  
  // Get active provider for an agent
  getProviderForAgent(agentName: string): AIProvider {
    const config = this.getAgentConfig(agentName);
    return this.providers.get(config.provider) || this.providers.get('deepseek')!;
  }
  
  getAgentConfig(agentName: string) {
    // Normalise agent name to check configuration
    const key = agentName.toLowerCase().trim();
    const config = this.agentModels.get(key);
    if (config) {
      return config;
    }
    
    // Global fallback
    return {
      provider: this.defaults.provider,
      model: this.defaults.model,
      temperature: 0.7,
      maxTokens: 4096
    };
  }
  
  private loadFallbackConfig() {
    try {
      if (fs.existsSync(FALLBACK_FILE_PATH)) {
        const fileContent = fs.readFileSync(FALLBACK_FILE_PATH, "utf-8");
        const fallbackData = JSON.parse(fileContent);
        
        console.log("[AI Registry] Loading config fallback from local file...");
        
        if (fallbackData.providers) {
          Object.keys(fallbackData.providers).forEach(pName => {
            const providerInstance = this.getProvider(pName);
            if (providerInstance) {
              providerInstance.configure(fallbackData.providers[pName]);
            }
          });
        }
        
        if (fallbackData.agents) {
          Object.keys(fallbackData.agents).forEach(agentName => {
            this.agentModels.set(agentName.toLowerCase().trim(), fallbackData.agents[agentName]);
          });
        }
      }
    } catch (e) {
      console.warn("[AI Registry] Error loading fallback file:", e);
    }
  }

  private saveFallbackConfig(type: 'provider' | 'agent', name: string, data: any) {
    try {
      let fallbackData: any = { providers: {}, agents: {} };
      if (fs.existsSync(FALLBACK_FILE_PATH)) {
        fallbackData = JSON.parse(fs.readFileSync(FALLBACK_FILE_PATH, "utf-8"));
      }
      
      if (type === 'provider') {
        fallbackData.providers = fallbackData.providers || {};
        fallbackData.providers[name] = data;
      } else {
        fallbackData.agents = fallbackData.agents || {};
        fallbackData.agents[name] = data;
      }
      
      fs.writeFileSync(FALLBACK_FILE_PATH, JSON.stringify(fallbackData, null, 2), "utf-8");
    } catch (e) {
      console.warn("[AI Registry] Error saving fallback file:", e);
    }
  }

  async loadFromDatabase() {
    // 1. Always load fallback first
    this.loadFallbackConfig();

    try {
      console.log("[AI Registry] Loading configurations from Supabase...");
      
      // 2. Load active providers config
      const { data: dbProviders, error: pErr } = await supabaseServer
        .from('ai_providers')
        .select('*');
        
      if (!pErr && dbProviders) {
        for (const p of dbProviders) {
          const providerInstance = this.getProvider(p.name);
          if (providerInstance) {
            const mergedConfig = {
              apiKey: p.config?.apiKey || '',
              baseUrl: p.config?.baseUrl || '',
              model: p.config?.model || providerInstance.defaultModel,
              ...p.config
            };
            providerInstance.configure(mergedConfig);
          }
        }
      } else if (pErr) {
        console.warn("[AI Registry] ai_providers table loading warning:", pErr.message);
      }
      
      // 3. Load agent model config
      const { data: dbAgentConfigs, error: acErr } = await supabaseServer
        .from('agent_model_config')
        .select('*, agents(name)');
        
      if (!acErr && dbAgentConfigs) {
        for (const ac of dbAgentConfigs) {
          const agentName = ac.agents?.name || ac.agent_id;
          if (agentName) {
            this.agentModels.set(agentName.toLowerCase().trim(), {
              provider: ac.provider,
              model: ac.model_name,
              temperature: ac.temperature,
              maxTokens: ac.max_tokens
            });
          }
        }
      } else if (acErr) {
        console.warn("[AI Registry] agent_model_config table loading warning:", acErr.message);
      }
    } catch (err: any) {
      console.error("[AI Registry] Error loading from database:", err);
    }
  }

  async saveAgentModelConfig(agentId: string, agentName: string, provider: string, model: string, temperature = 0.7, maxTokens = 4096) {
    const configData = {
      provider,
      model,
      temperature,
      maxTokens
    };

    // Update local state and local backup file
    this.agentModels.set(agentName.toLowerCase().trim(), configData);
    this.saveFallbackConfig('agent', agentName, configData);

    // Save to database
    try {
      const { error } = await supabaseServer
        .from('agent_model_config')
        .upsert({
          agent_id: agentId,
          provider,
          model_name: model,
          temperature,
          max_tokens: maxTokens,
          updated_at: new Date().toISOString()
        }, { onConflict: 'agent_id' });

      if (error) {
        console.warn("[AI Registry] DB save warning (table might be missing, using fallback file):", error.message);
      }
    } catch (err) {
      console.warn("[AI Registry] Error in saveAgentModelConfig, using fallback file persistence.");
    }
  }

  async saveProviderConfig(name: string, displayName: string, config: any, isActive = true, isDefault = false) {
    const provider = this.getProvider(name);
    if (provider) {
      provider.configure(config);
    }
    
    if (isDefault) {
      this.defaults = { provider: name, model: config.model || provider?.defaultModel || '' };
    }

    // Save to local backup file
    this.saveFallbackConfig('provider', name, config);

    try {
      const { error } = await supabaseServer
        .from('ai_providers')
        .upsert({
          name,
          display_name: displayName,
          config,
          is_active: isActive,
          is_default: isDefault,
          updated_at: new Date().toISOString()
        }, { onConflict: 'name' });

      if (error) {
        console.warn("[AI Registry] DB save warning (table might be missing, using fallback file):", error.message);
      }
    } catch (err) {
      console.warn("[AI Registry] Error in saveProviderConfig, using fallback file persistence.");
    }
  }
}

export const aiRegistry = new AIProviderRegistry();

