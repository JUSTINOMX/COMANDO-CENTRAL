import React from "react";
import { Cpu, Eye, Settings, Trash2, Folder, Clock, CheckCircle } from "lucide-react";
import { HermesAgent } from "../../types/hermes.js";
import OnlineIndicator from "./OnlineIndicator.js";
import CapabilityBadge from "./CapabilityBadge.js";

interface HermesAgentCardProps {
  agent: HermesAgent;
  onSelect: (agent: HermesAgent) => void;
  onDeactivate: (agent: HermesAgent) => void;
  key?: string | number;
}

export default function HermesAgentCard({ agent, onSelect, onDeactivate }: HermesAgentCardProps) {
  const isOnline = () => {
    if (!agent.metadata.lastPing) return false;
    const diffMs = new Date().getTime() - new Date(agent.metadata.lastPing).getTime();
    return diffMs < 5 * 60 * 1000;
  };

  const online = isOnline();

  return (
    <div 
      className={`group relative rounded-2xl border bg-white p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between ${
        online 
          ? "border-purple-200 bg-purple-50/5 hover:border-purple-300" 
          : "border-gray-200 bg-gray-50/20 text-gray-400"
      }`}
    >
      <div>
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            {/* Logo/Icon */}
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-inner font-mono text-sm font-bold uppercase transition-transform group-hover:scale-105 ${
              online ? "bg-purple-600 text-white" : "bg-gray-200 text-gray-500"
            }`}>
              ⚡
            </div>
            {/* Name/Sub */}
            <div className="flex flex-col">
              <span className={`font-bold text-sm leading-tight transition-colors ${
                online ? "text-gray-900 group-hover:text-purple-600" : "text-gray-500"
              }`}>
                {agent.displayName}
              </span>
              <span className="text-[10px] text-gray-400 font-mono mt-0.5">
                @{agent.name}
              </span>
            </div>
          </div>

          {/* Status Indicator */}
          <OnlineIndicator lastPing={agent.metadata.lastPing} />
        </div>

        {/* Soul/Description */}
        <p className="text-xs text-gray-500 italic line-clamp-2 leading-relaxed mb-4">
          "{agent.soul}"
        </p>

        {/* Assigned Projects */}
        <div className="flex items-center gap-2 mb-4.5 text-xs text-gray-500">
          <Folder className="h-3.5 w-3.5 text-gray-400 shrink-0" />
          <span className="font-bold">Proyectos:</span>
          {agent.metadata.assignedProjects && agent.metadata.assignedProjects.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {agent.metadata.assignedProjects.map(p => (
                <span key={p} className="bg-purple-100 text-purple-800 text-[9px] font-bold px-1.5 py-0.5 rounded-md border border-purple-200">
                  {p}
                </span>
              ))}
            </div>
          ) : (
            <span className="text-[10px] text-gray-400 italic">(sin asignar)</span>
          )}
        </div>

        {/* Capabilities badges list */}
        <div className="flex flex-wrap gap-1.5 border-t border-gray-100 pt-4.5">
          {agent.identity.capabilities.map(cap => (
            <CapabilityBadge key={cap} capability={cap} />
          ))}
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex items-center gap-2 mt-5 pt-3.5 border-t border-gray-100">
        <button
          onClick={() => onSelect(agent)}
          className="flex-1 rounded-xl border border-gray-200 bg-white px-2.5 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 hover:text-purple-600 hover:border-purple-200 transition flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Eye className="h-3.5 w-3.5" />
          <span>Ver</span>
        </button>
        <button
          onClick={() => onSelect(agent)}
          className="rounded-xl border border-gray-200 bg-white p-2 text-xs font-bold text-gray-700 hover:bg-gray-50 transition shrink-0 flex items-center justify-center cursor-pointer"
          title="Configurar agente"
        >
          <Settings className="h-3.5 w-3.5 text-gray-500" />
        </button>
        <button
          onClick={() => onDeactivate(agent)}
          className="rounded-xl border border-red-100 bg-red-50/30 p-2 text-xs font-bold text-red-600 hover:bg-red-50 hover:border-red-200 transition shrink-0 flex items-center justify-center cursor-pointer"
          title="Desactivar agente"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
