import React from "react";
import { MessageSquare, Clock, Hash } from "lucide-react";

export interface HistoryConversation {
  id: string;
  title: string;
  lastMessageAt: string;
  messageCount: number;
  preview: string;
}

interface HistoryItemProps {
  conversation: HistoryConversation;
  isActive: boolean;
  onClick: () => void;
  key?: string | number;
}

export default function HistoryItem({ conversation, isActive, onClick }: HistoryItemProps) {
  // Format message time elegantly
  const formatTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  };

  return (
    <button
      onClick={onClick}
      className={`group w-full text-left p-3 rounded-xl transition-all duration-150 border flex flex-col gap-1.5 ${
        isActive
          ? "bg-[#E8F2FF] border-[#0A84FF]/20 shadow-sm"
          : "bg-white border-border hover:bg-gray-50/70 hover:border-border/80"
      }`}
    >
      {/* Top Header Row */}
      <div className="flex items-center justify-between w-full">
        <span
          className={`text-[11px] font-bold tracking-tight truncate max-w-[130px] ${
            isActive ? "text-[#0A84FF]" : "text-text-primary"
          }`}
        >
          {conversation.title}
        </span>
        <span className="text-[9px] font-mono font-medium text-[#8E8E93] shrink-0">
          {formatTime(conversation.lastMessageAt)}
        </span>
      </div>

      {/* Preview Snippet */}
      <p className="text-[10px] font-semibold text-text-secondary line-clamp-1 group-hover:text-text-primary transition-colors">
        {conversation.preview || "Sin mensajes aún"}
      </p>

      {/* Footer Info Metadata */}
      <div className="flex items-center gap-3 text-[9px] font-bold text-[#8E8E93] mt-0.5">
        <span className="flex items-center gap-0.5">
          <MessageSquare className="h-3 w-3 text-text-secondary" />
          <span>{conversation.messageCount} mgs</span>
        </span>
      </div>
    </button>
  );
}
