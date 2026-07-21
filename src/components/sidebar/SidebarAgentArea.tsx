import React, { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { AgentArea, AgentSlot } from "../../types/agents.js";
import SidebarAgentItem from "./SidebarAgentItem.js";

interface SidebarAgentAreaProps {
  area: AgentArea;
  activeAgentName?: string;
  onSelectAgent: (name: string) => void;
  key?: string | number;
}

export default function SidebarAgentArea({ area, activeAgentName, onSelectAgent }: SidebarAgentAreaProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  // Active agents inside this area that are click-selected
  const hasActiveSelected = area.agents.some(
    (a) => a.status === "active" && a.name === activeAgentName
  );

  return (
    <div className="flex flex-col gap-1 border-b border-gray-100/30 pb-2 mb-2" id={`sidebar-area-${area.id}`}>
      {/* Area header button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full px-2 py-1 text-left select-none text-[10px] font-bold text-text-secondary hover:text-text-primary transition-colors tracking-widest uppercase"
      >
        <div className="flex items-center gap-1.5">
          <span className="text-sm">{area.icon}</span>
          <span>{area.name}</span>
          {hasActiveSelected && !isExpanded && (
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          )}
        </div>
        <div>
          {isExpanded ? (
            <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
          )}
        </div>
      </button>

      {/* Expanded list of agents */}
      {isExpanded && (
        <div className="flex flex-col gap-0.5 mt-1 pl-2 border-l border-gray-100/50 ml-2">
          {area.agents.map((agent) => (
            <SidebarAgentItem
              key={agent.name}
              agent={agent}
              isActive={agent.status === "active" && agent.name === activeAgentName}
              onClick={() => onSelectAgent(agent.name)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
