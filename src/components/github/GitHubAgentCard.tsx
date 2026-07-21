import React from "react";
import { Bot, Shield, CheckCircle } from "lucide-react";
import SkillBadgeList, { SkillItem } from "./SkillBadgeList.js";

export interface DetectedAgent {
  name: string;
  displayName: string;
  role: string;
  description: string;
  soulContent?: string;
  skills?: SkillItem[];
  config?: Record<string, any>;
}

interface GitHubAgentCardProps {
  agent: DetectedAgent;
  isSelected: boolean;
  onToggle: () => void;
  key?: React.Key;
}

export default function GitHubAgentCard({ agent, isSelected, onToggle }: GitHubAgentCardProps) {
  // Get a matching role color
  const getRoleColor = (role: string) => {
    const r = role.toLowerCase();
    if (r.includes("devops") || r.includes("deploy")) {
      return "bg-purple-100 text-purple-700 border-purple-200";
    }
    if (r.includes("anal") || r.includes("data") || r.includes("mkt")) {
      return "bg-blue-100 text-blue-700 border-blue-200";
    }
    if (r.includes("code") || r.includes("review") || r.includes("dev")) {
      return "bg-green-100 text-green-700 border-green-200";
    }
    return "bg-gray-100 text-gray-700 border-gray-200";
  };

  return (
    <div
      onClick={onToggle}
      className={`relative flex flex-col gap-3 rounded-xl border p-4.5 transition-all cursor-pointer select-none shadow-sm hover:shadow-md ${
        isSelected
          ? "border-primary bg-primary/5 ring-1 ring-primary/20"
          : "border-border bg-white hover:border-gray-300"
      }`}
      id={`github-agent-card-${agent.name}`}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Agent Info Header */}
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${
            isSelected
              ? "bg-primary/10 border-primary/20 text-primary"
              : "bg-[#F5F5F7] border-border text-text-secondary"
          }`}>
            <Bot className="h-5.5 w-5.5" />
          </div>
          <div className="flex flex-col">
            <h4 className="text-sm font-bold text-text-primary leading-tight">
              {agent.displayName}
            </h4>
            <div className="mt-1 flex items-center gap-1.5 flex-wrap">
              <span className="font-mono text-[10px] font-bold text-text-secondary">
                @{agent.name}
              </span>
              <span className={`rounded-full border px-2 py-0.2 text-[9px] font-bold uppercase tracking-wider ${getRoleColor(agent.role)}`}>
                {agent.role}
              </span>
            </div>
          </div>
        </div>

        {/* Custom Interactive Checkbox */}
        <div className="flex items-center">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => {}} // handled by div click
            className="h-4.5 w-4.5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer accent-primary"
          />
        </div>
      </div>

      {/* Description */}
      <p className="text-xs text-text-secondary leading-relaxed">
        {agent.description}
      </p>

      {/* Soul Prompt Accent */}
      {agent.soulContent && (
        <div className="rounded-lg bg-gray-50/50 border border-gray-100 p-2.5 text-[10.5px] text-text-secondary/90 leading-normal font-sans italic">
          <span className="font-bold block text-[10px] uppercase text-text-secondary/70 tracking-wider not-italic mb-1 flex items-center gap-1">
            <Shield className="h-3 w-3 text-primary/60" /> Custom Soul Directives
          </span>
          "{agent.soulContent.length > 120 ? `${agent.soulContent.slice(0, 120)}...` : agent.soulContent}"
        </div>
      )}

      {/* Embedded Skills */}
      {agent.skills && agent.skills.length > 0 && (
        <div className="mt-1.5 border-t border-dashed border-border pt-3">
          <span className="text-[10px] font-bold text-text-secondary/70 uppercase tracking-widest block mb-2">
            Habilidades de Agente ({agent.skills.length})
          </span>
          <SkillBadgeList skills={agent.skills} />
        </div>
      )}
    </div>
  );
}
