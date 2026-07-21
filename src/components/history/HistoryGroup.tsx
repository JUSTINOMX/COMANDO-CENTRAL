import React from "react";
import HistoryItem, { HistoryConversation } from "./HistoryItem.js";

interface HistoryGroupProps {
  date: string;
  conversations: HistoryConversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  key?: string | number;
}

export default function HistoryGroup({
  date,
  conversations,
  activeConversationId,
  onSelectConversation
}: HistoryGroupProps) {
  return (
    <div className="flex flex-col gap-2">
      {/* Date Header Title */}
      <h4 className="text-[10px] font-bold tracking-wider uppercase text-text-secondary px-1">
        {date}
      </h4>

      {/* List of Rows */}
      <div className="flex flex-col gap-2">
        {conversations.map((convo) => (
          <HistoryItem
            key={convo.id}
            conversation={convo}
            isActive={activeConversationId === convo.id}
            onClick={() => onSelectConversation(convo.id)}
          />
        ))}
      </div>
    </div>
  );
}
