export interface McpServer {
  id: string;
  name: string;
  displayName: string;
  description: string;
  source: 'local' | 'github' | 'npm';
  sourceUrl?: string;
  command: string;
  args: string[];
  envVars: Record<string, string>;
  capabilities: string[];
  status: 'installed' | 'available' | 'error';
  category: string;
  config: Record<string, any>;
  installedBy: string;
  installedAt: string;
  lastUsed?: string;
  assignedAgents?: { id: string; name: string; displayName: string }[];
}

export interface AgentMcpAssignment {
  id: string;
  agentId: string;
  mcpId: string;
  isActive: boolean;
  configOverride: Record<string, any>;
  assignedAt: string;
}
