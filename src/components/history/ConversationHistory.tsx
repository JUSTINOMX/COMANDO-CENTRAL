import React, { useEffect, useState } from "react";
import { Plus, MessageSquare, History, Loader2 } from "lucide-react";
import HistoryGroup from "./HistoryGroup.js";
import { HistoryConversation } from "./HistoryItem.js";

interface GroupedHistory {
  date: string;
  conversations: HistoryConversation[];
}

interface ConversationHistoryProps {
  agentName: string;
  activeConversationId: string | null;
  onSelectConversation: (id: string | null) => void;
  refreshTrigger?: number; // state to force refresh from parent
}

export default function ConversationHistory({
  agentName,
  activeConversationId,
  onSelectConversation,
  refreshTrigger
}: ConversationHistoryProps) {
  const [groups, setGroups] = useState<GroupedHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/chat/${agentName}/history`);
      if (!res.ok) throw new Error("Could not fetch history");
      const data = await res.json();
      setGroups(data || []);
    } catch (err) {
      console.error("Error fetching history:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [agentName, refreshTrigger]);

  const handleNewConversation = async () => {
    if (creating) return;
    setCreating(true);
    try {
      const title = `Chat #${Date.now().toString().slice(-4)}`;
      const res = await fetch(`/api/chat/${agentName}/new-conversation`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ title })
      });

      if (!res.ok) throw new Error("Could not create conversation");
      const newConvo = await res.json();

      // Refresh list
      await fetchHistory();

      // Auto select the new conversation
      onSelectConversation(newConvo.id);
    } catch (err) {
      console.error("Error creating new conversation:", err);
    } finally {
      setCreating(false);
    }
  };

  return (
    <aside className="w-64 border-l border-border bg-[#F9F9FB] flex flex-col h-full shrink-0">
      {/* Header bar with New Conversation button */}
      <div className="p-4 border-b border-border bg-white flex flex-col gap-2">
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-text-secondary uppercase tracking-wider">
          <History className="h-4 w-4" />
          <span>Historial</span>
        </div>

        <button
          onClick={handleNewConversation}
          disabled={creating}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary text-white py-2 px-4 text-xs font-bold shadow-sm hover:opacity-95 disabled:opacity-50 transition-all cursor-pointer"
        >
          {creating ? (
            <Loader2 className="h-4.5 w-4.5 animate-spin" />
          ) : (
            <Plus className="h-4.5 w-4.5" />
          )}
          <span>Nueva Conversación</span>
        </button>
      </div>

      {/* Main timeline scrollable container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {loading && groups.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-[#8E8E93]" />
            <span className="text-[10px] font-bold text-[#8E8E93]">Cargando hilos...</span>
          </div>
        ) : groups.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center px-2">
            <MessageSquare className="h-6 w-6 text-[#8E8E93] mb-2 opacity-50" />
            <p className="text-[10px] font-bold text-text-secondary">
              Sin conversaciones anteriores
            </p>
          </div>
        ) : (
          groups.map((group) => (
            <HistoryGroup
              key={group.date}
              date={group.date}
              conversations={group.conversations}
              activeConversationId={activeConversationId}
              onSelectConversation={(id) => onSelectConversation(id)}
            />
          ))
        )}
      </div>
    </aside>
  );
}
