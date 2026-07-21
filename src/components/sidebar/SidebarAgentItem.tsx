import React from "react";
import { Sparkles, Terminal, ShieldAlert } from "lucide-react";
import { AgentSlot } from "../../types/agents.js";

interface SidebarAgentItemProps {
  agent: AgentSlot;
  isActive: boolean;
  onClick: () => void;
  key?: string | number;
}

export default function SidebarAgentItem({ agent, isActive, onClick }: SidebarAgentItemProps) {
  const isVacant = agent.status === "vacant";

  if (isVacant) {
    return (
      <div 
        className="flex items-center gap-2 px-3 py-1.5 text-xs text-gray-300 select-none"
        id={`agent-item-vacant-${agent.name}`}
      >
        <span className="text-gray-200">🤖</span>
        <span className="italic tracking-wider font-mono text-[10px]">{agent.displayName}</span>
      </div>
    );
  }

  // Active state style
  const activeClass = isActive 
    ? "bg-[#E8F2FF] text-primary font-semibold shadow-sm border-l-2 border-primary" 
    : "text-text-secondary hover:bg-gray-50 hover:text-text-primary";

  // Helper for source badges
  const renderSourceBadge = () => {
    if (agent.source === "github") {
      return (
        <span className="text-[9px] px-1 bg-green-50 text-green-600 rounded border border-green-100 font-mono scale-90" title="Installed from GitHub">
          git
        </span>
      );
    }
    if (agent.source === "hermes") {
      return (
        <span className="text-[9px] px-1 bg-amber-50 text-amber-600 rounded border border-amber-100 font-mono scale-90" title="Hermes Exec Agent">
          hermes
        </span>
      );
    }
    return null;
  };

  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-between w-full rounded-lg px-3 py-1.5 text-sm font-medium transition-all text-left ${activeClass}`}
      id={`agent-item-active-${agent.name}`}
    >
      <div className="flex items-center gap-2 truncate">
        <span className="shrink-0 text-base" role="img" aria-label="agent avatar">
          {agent.name === "steve" ? "🕵️" : agent.name === "elon" ? "🔍" : agent.name === "nikitta" ? "🎯" : "🤖"}
        </span>
        <div className="flex flex-col truncate">
          <span className="truncate leading-tight text-xs">{agent.displayName}</span>
          <span className="text-[9px] text-gray-400 font-normal leading-none capitalize">{agent.role}</span>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        {renderSourceBadge()}
        {agent.unreadCount !== undefined && agent.unreadCount > 0 && (
          <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-[#FF375F] px-1 text-[9px] font-bold text-white leading-none">
            {agent.unreadCount}
          </span>
        )}
      </div>
    </button>
  );
}
