import { ConversationMessage, Memory } from "../lib/supabase/client.js";

export interface MemoryActionPayload {
  action: "save" | "search" | "forget";
  title?: string;
  content?: string;
  tags?: string[];
  query?: string;
  memoryId?: string;
}

export const commanderApi = {
  // Get messages for commander_chat
  async getMessages(limit = 50, offset = 0): Promise<ConversationMessage[]> {
    const res = await fetch(`/api/commander/messages?limit=${limit}&offset=${offset}`);
    if (!res.ok) throw new Error("Failed to load Commander messages");
    return res.json();
  },

  // Send message to Commander (supports text and file upload via FormData)
  async sendMessage(
    content: string,
    file?: File,
    projectId?: string,
    section?: string
  ): Promise<{
    userMessage: ConversationMessage;
    commanderResponse: ConversationMessage;
    memorySaved?: boolean;
  }> {
    const formData = new FormData();
    formData.append("content", content);
    if (file) {
      formData.append("file", file);
    }
    if (projectId) {
      formData.append("projectId", projectId);
    }
    if (section) {
      formData.append("section", section);
    }

    const res = await fetch("/api/commander/message", {
      method: "POST",
      body: formData, // fetch automatically sets boundary header for FormData
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Failed to communicate with Commander");
    }
    return res.json();
  },

  // Perform memory operations (save, search, forget)
  async manageMemory(payload: MemoryActionPayload): Promise<any> {
    const res = await fetch("/api/commander/memory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Memory action failed");
    }
    return res.json();
  },

  // Direct upload for generic project items
  async uploadFile(
    file: File,
    projectId: string,
    section: string
  ): Promise<{ url: string; id: string; table: string }> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("projectId", projectId);
    formData.append("section", section);

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "File upload failed");
    }
    return res.json();
  },
};
