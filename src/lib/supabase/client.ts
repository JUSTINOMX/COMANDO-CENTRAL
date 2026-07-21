// Client-side helper to interact with our Express API routes.
// Keeps the frontend decoupled from direct Supabase HTTP requests.

export interface Agent {
  id: string;
  name: string;
  display_name: string;
  role: string;
  status: string;
  soul?: string;
  identity?: any;
  configuration?: any;
  metadata?: any;
  created_at?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: string;
  tags?: string[];
  metadata?: any;
  created_at?: string;
  message_count?: number;
  has_notifications?: boolean;
}

export interface ProjectAgent {
  id: string;
  project_id: string;
  agent_id: string;
  role: string;
  agent?: Agent;
}

export interface ProjectAntecedente {
  id: string;
  project_id: string;
  title: string;
  file_name: string;
  content: string;
  file_type?: string;
  mime_type?: string;
  tags?: string[];
  metadata?: any;
}

export interface Conversation {
  id: string;
  project_id: string;
  title: string;
  conversation_type: string;
  platform?: string;
  external_id?: string;
  status?: string;
  metadata?: any;
}

export interface ConversationMessage {
  id: string;
  conversation_id: string;
  sender: string;
  sender_agent_id?: string;
  content: string;
  message_type: string;
  parent_message_id?: string;
  sequence_num?: number;
  metadata?: any;
  created_at?: string;
  project_name?: string;
  project_id?: string;
}

export interface AgentNotification {
  id: string;
  target_agent_id: string;
  source_agent_id?: string;
  notification_type: string;
  conversation_id?: string;
  message_id?: string;
  title: string;
  content?: string;
  is_read: boolean;
  is_processed: boolean;
  priority: string;
  metadata?: any;
  created_at?: string;
}

export interface Skill {
  id: string;
  name: string;
  version: string;
  description: string;
  long_description?: string;
  usage_examples?: any;
  category?: string;
  author_agent_id?: string;
  content?: string;
  support_files?: any;
  status?: string;
  tags?: string[];
  project_id?: string;
  created_at?: string;
}

export interface Memory {
  id: string;
  agent_id?: string;
  project_id?: string;
  memory_type: string;
  title: string;
  content: string;
  tags?: string[];
  source?: string;
  importance?: number;
  is_shared?: boolean;
  created_at?: string;
}

export interface ProjectExtraction {
  id: string;
  project_id: string;
  title: string;
  file_name: string;
  platform?: string;
  content: string;
  extraction_type?: string;
  tags?: string[];
  metadata?: any;
}

export interface ProjectReport {
  id: string;
  project_id: string;
  title: string;
  file_name: string;
  content: string;
  report_type?: string;
  tags?: string[];
}

export interface ProjectConclusion {
  id: string;
  project_id: string;
  title: string;
  content: string;
  conclusion_type?: string;
  file_name?: string;
  tags?: string[];
}

export interface ProjectMarketing {
  id: string;
  project_id: string;
  section: string;
  title: string;
  file_name: string;
  content: string;
  tags?: string[];
}

export const apiClient = {
  async getProjects(): Promise<Project[]> {
    const res = await fetch("/api/projects");
    return res.json();
  },

  async getProject(id: string): Promise<Project> {
    const res = await fetch(`/api/projects/${id}`);
    if (!res.ok) throw new Error("Project not found");
    return res.json();
  },

  async getProjectDetails(id: string): Promise<{
    project: Project;
    agents: ProjectAgent[];
    antecedentes: ProjectAntecedente[];
    extracciones: ProjectExtraction[];
    reportes: ProjectReport[];
    conclusiones: ProjectConclusion[];
    marketing: ProjectMarketing[];
    conversation?: Conversation;
  }> {
    const res = await fetch(`/api/projects/${id}/details`);
    if (!res.ok) throw new Error("Failed to load project details");
    return res.json();
  },

  async createProject(data: {
    name: string;
    description: string;
    tags: string[];
    agents: { agentId: string; role: string }[];
    files?: { name: string; content: string }[];
  }): Promise<Project> {
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async getTimeline(filters: {
    projectId?: string;
    agentIds?: string[];
    search?: string;
  }): Promise<ConversationMessage[]> {
    const query = new URLSearchParams();
    if (filters.projectId) query.append("projectId", filters.projectId);
    if (filters.agentIds && filters.agentIds.length > 0) {
      filters.agentIds.forEach((id) => query.append("agentId", id));
    }
    if (filters.search) query.append("search", filters.search);

    const res = await fetch(`/api/messages/timeline?${query.toString()}`);
    return res.json();
  },

  async getProjectMessages(projectId: string): Promise<ConversationMessage[]> {
    const res = await fetch(`/api/messages/project/${projectId}`);
    return res.json();
  },

  async sendMessage(data: {
    projectId: string;
    content: string;
    sender: string;
    senderAgentId?: string;
    mentionedAgentId?: string;
  }): Promise<ConversationMessage> {
    const res = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async getAgents(): Promise<Agent[]> {
    const res = await fetch("/api/agents");
    return res.json();
  },

  async createAgent(data: {
    name: string;
    display_name: string;
    role: string;
    status: string;
  }): Promise<Agent> {
    const res = await fetch("/api/agents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async getSkills(): Promise<Skill[]> {
    const res = await fetch("/api/skills");
    return res.json();
  },

  async createSkill(data: Partial<Skill>): Promise<Skill> {
    const res = await fetch("/api/skills", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async assignSkill(agentId: string, skillId: string): Promise<any> {
    const res = await fetch("/api/skills/assign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agentId, skillId }),
    });
    return res.json();
  },

  async getMemories(): Promise<Memory[]> {
    const res = await fetch("/api/memories");
    return res.json();
  },

  async createMemory(data: Partial<Memory>): Promise<Memory> {
    const res = await fetch("/api/memories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async getNotifications(): Promise<AgentNotification[]> {
    const res = await fetch("/api/notifications");
    return res.json();
  },

  async markNotificationRead(id: string): Promise<any> {
    const res = await fetch(`/api/notifications/${id}/read`, { method: "POST" });
    return res.json();
  },

  async markAllNotificationsRead(): Promise<any> {
    const res = await fetch("/api/notifications/read-all", { method: "POST" });
    return res.json();
  },

  async sendCommanderPrompt(message: string): Promise<{
    text: string;
    actions_taken?: string[];
  }> {
    const res = await fetch("/api/commander/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || "Commander prompt failed");
    }
    return res.json();
  },

  async addAntecedente(projectId: string, title: string, fileName: string, content: string): Promise<any> {
    const res = await fetch(`/api/projects/${projectId}/antecedentes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, fileName, content }),
    });
    return res.json();
  },

  async addReport(projectId: string, title: string, fileName: string, content: string, reportType: string): Promise<any> {
    const res = await fetch(`/api/projects/${projectId}/reportes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, fileName, content, reportType }),
    });
    return res.json();
  }
};
