import React, { useState, useEffect } from "react";
import { Agent, Project, ConversationMessage } from "../../lib/supabase/client.js";
import AgentChatHeader from "./AgentChatHeader.js";
import AgentChatMessages from "./AgentChatMessages.js";
import AgentChatInput from "./AgentChatInput.js";

interface AgentChatWindowProps {
  agent: Agent;
  projects: Project[];
  defaultProjectId?: string;
  activeConversationId?: string | null;
  onNewMessageSent?: () => void; // callbacks to refresh conversation history
}

export default function AgentChatWindow({
  agent,
  projects,
  defaultProjectId,
  activeConversationId,
  onNewMessageSent
}: AgentChatWindowProps) {
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  // Load messages for this agent/conversation thread
  const loadMessages = async () => {
    setLoading(true);
    try {
      const url = new URL(`/api/chat/${agent.name}/messages`, window.location.origin);
      if (activeConversationId) {
        url.searchParams.append("conversationId", activeConversationId);
      }

      const res = await fetch(url.toString());
      if (!res.ok) throw new Error("Could not load agent messages");
      const data = await res.json();
      setMessages(data || []);
    } catch (err) {
      console.error("Error loading messages:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
  }, [agent.id, activeConversationId]);

  const handleSendMessage = async (
    content: string,
    file?: { name: string; content: string },
    projectId?: string,
    documentType?: string
  ) => {
    if (sending) return;
    setSending(true);

    // Optimistically insert user's message
    const tempUserMsg: ConversationMessage = {
      id: `temp-${Date.now()}`,
      conversation_id: activeConversationId || "temp-convo",
      sender: "Edwin",
      content: file
        ? `${content}\n\n📎 *[Adjuntando archivo: "${file.name}"]*`
        : content,
      message_type: "text",
      created_at: new Date().toISOString()
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const res = await fetch(`/api/chat/${agent.name}/message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          content,
          file,
          projectId,
          documentType,
          conversationId: activeConversationId || undefined
        })
      });

      if (!res.ok) throw new Error("Failed to send message to agent");
      const updatedMessages = await res.json();
      setMessages(updatedMessages || []);

      // Notify history column to refresh
      if (onNewMessageSent) {
        onNewMessageSent();
      }
    } catch (err) {
      console.error("Error sending message:", err);
    } finally {
      setSending(false);
    }
  };

  const isVacant = agent.status === "vacant";

  return (
    <div className="flex flex-1 flex-col h-full bg-white relative">
      {/* Header */}
      <AgentChatHeader agent={agent} />

      {/* Messages viewport */}
      <AgentChatMessages
        messages={messages}
        agentDisplayName={agent.display_name}
        loading={sending}
      />

      {/* Input panel */}
      <AgentChatInput
        onSendMessage={handleSendMessage}
        projects={projects}
        defaultProjectId={defaultProjectId}
        disabled={isVacant}
      />
    </div>
  );
}
