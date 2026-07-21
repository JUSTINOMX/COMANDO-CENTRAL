import React from "react";
import { Cpu, Check } from "lucide-react";
import { Agent } from "../../lib/supabase/client.js";

interface McpAgentAssignerProps {
  agents: Agent[];
  selectedAgentIds: string[];
  onChange: (selectedIds: string[]) => void;
}

export default function McpAgentAssigner({
  agents,
  selectedAgentIds,
  onChange
}: McpAgentAssignerProps) {
  // Filter out system_commander or just display all standard agents
  const availableAgents = agents.filter(a => a.name !== "commander" && a.status !== "vacant");

  const handleToggle = (agentId: string) => {
    if (selectedAgentIds.includes(agentId)) {
      onChange(selectedAgentIds.filter(id => id !== agentId));
    } else {
      onChange([...selectedAgentIds, agentId]);
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-[11px] font-bold tracking-wider uppercase text-text-secondary">
        Asignar a agente(s):
      </label>
      
      {availableAgents.length === 0 ? (
        <p className="text-xs text-text-secondary font-semibold italic">
          No hay agentes activos disponibles para asignación.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-2 mt-1">
          {availableAgents.map((agent) => {
            const isSelected = selectedAgentIds.includes(agent.id);
            return (
              <button
                type="button"
                key={agent.id}
                onClick={() => handleToggle(agent.id)}
                className={`flex items-center gap-2.5 p-2 rounded-xl border text-left transition-all ${
                  isSelected
                    ? "bg-[#E8F2FF] border-primary/20 text-primary"
                    : "bg-white border-border text-text-primary hover:bg-gray-50/50"
                }`}
              >
                <div
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-all ${
                    isSelected
                      ? "bg-primary border-primary text-white"
                      : "bg-white border-border"
                  }`}
                >
                  {isSelected && <Check className="h-3 w-3" />}
                </div>

                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold truncate">
                    {agent.display_name}
                  </span>
                  <span className="text-[9px] font-semibold opacity-75 truncate uppercase">
                    {agent.role || "Agente"}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
