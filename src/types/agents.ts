export interface AgentSlot {
  name: string;          // nombre del agente en Supabase
  displayName: string;   // nombre visible
  role: string;
  status: "active" | "vacant";
  source?: "native" | "github" | "hermes";
  unreadCount?: number;
}

export interface AgentArea {
  id: string;
  name: string;
  icon: string;
  agents: AgentSlot[];
}

export interface ChatHistoryItem {
  id: string;
  title: string;
  lastMessageAt: string;
  messageCount: number;
  preview?: string;
}

export interface ChatHistoryGroup {
  date: string;          // 'Hoy' | 'Ayer' | '19 Jul'
  conversations: ChatHistoryItem[];
}
