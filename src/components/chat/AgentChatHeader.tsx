import React from "react";
import { Cpu, Terminal, ShieldAlert, Wifi, FileSpreadsheet } from "lucide-react";
import { Agent } from "../../lib/supabase/client.js";

interface AgentChatHeaderProps {
  agent: Agent;
}

export default function AgentChatHeader({ agent }: AgentChatHeaderProps) {
  const isHermes = agent.identity?.type === "hermes";
  const status = agent.status || "active";
  const cdpPort = agent.identity?.connection?.endpoint?.split(":").pop() || "9222";

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-white px-6">
      <div className="flex items-center gap-3">
        {/* Agent Avatar Frame */}
        <div className="relative">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/5 border border-primary/10 text-primary font-bold">
            <Cpu className="h-5 w-5" />
          </div>
          {status === "active" && (
            <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#30D158] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-[#30D158] border border-white"></span>
            </span>
          )}
        </div>

        {/* Name and Subtitle */}
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold text-text-primary tracking-tight">
              {agent.display_name}
            </h1>
            <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-primary">
              {agent.role || "Agente"}
            </span>
            {isHermes && (
              <span className="rounded bg-[#E8F5E9] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#2E7D32] flex items-center gap-0.5 border border-[#81C784]/25">
                <Terminal className="h-2.5 w-2.5" />
                <span>Hermes (CDP)</span>
              </span>
            )}
          </div>
          <p className="text-[10px] font-semibold text-text-secondary">
            {agent.soul ? agent.soul.substring(0, 75) + (agent.soul.length > 75 ? "..." : "") : "Listo para recibir instrucciones."}
          </p>
        </div>
      </div>

      {/* Connection Info */}
      <div className="flex items-center gap-3">
        {isHermes && (
          <div className="hidden sm:flex flex-col items-end text-right">
            <span className="text-[9px] font-mono font-bold text-text-secondary flex items-center gap-1">
              <Wifi className="h-3 w-3 text-[#30D158]" />
              <span>Puerto: {cdpPort}</span>
            </span>
            <span className="text-[8px] font-semibold text-[#8E8E93] uppercase">
              Controlador Windows
            </span>
          </div>
        )}

        <div className="flex items-center gap-2 rounded-lg border border-border bg-[#F5F5F7] px-3 py-1.5 text-xs font-bold text-text-secondary">
          <span className="h-1.5 w-1.5 rounded-full bg-[#30D158]" />
          <span>{status === "active" ? "En Línea" : "Inactivo"}</span>
        </div>
      </div>
    </header>
  );
}
