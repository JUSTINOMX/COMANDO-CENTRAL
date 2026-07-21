// src/types/hermes.ts

export interface HermesAgent {
  id: string;
  name: string;
  displayName: string;
  role: 'executor';
  status: 'active' | 'inactive';
  soul: string;
  identity: {
    type: 'hermes';
    capabilities: string[];
    connection: {
      type: 'cdp' | 'direct' | 'service';
      endpoint: string;
      autoReconnect: boolean;
    };
    platform: 'windows';
    version: string;
  };
  configuration: {
    allowedActions: string[];
    timeout: number;
    workingDir: string;
  };
  metadata: {
    isOnline: boolean;
    lastPing: string | null;
    createdBy: string;
    assignedProjects?: string[];
  };
  capabilities: HermesCapability[];
  createdAt: string;
  updatedAt: string;
}

export interface HermesCapability {
  id: string;
  agentId: string;
  capability: string;
  config: Record<string, any>;
  isActive: boolean;
  lastUsed: string | null;
}

export interface CreateHermesRequest {
  name: string;
  displayName: string;
  description: string;
  capabilities: ('browser' | 'powershell' | 'nodejs' | 'filesystem')[];
  cdpPort?: number;
  projectId?: string;
}
