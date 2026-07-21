import React from "react";
import { Plug, AlertCircle } from "lucide-react";
import { McpServer } from "../../types/mcp.js";
import McpCard from "./McpCard.js";

interface McpListProps {
  servers: McpServer[];
  onUninstall: (id: string) => void;
  onAssignAgents: (mcp: McpServer) => void;
}

export default function McpList({
  servers,
  onUninstall,
  onAssignAgents
}: McpListProps) {
  
  if (servers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed border-border bg-white min-h-[300px]">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4">
          <Plug className="h-7 w-7" />
        </div>
        <h3 className="text-sm font-bold text-text-primary tracking-tight">
          No hay servidores MCP instalados
        </h3>
        <p className="mt-1 text-xs text-[#8E8E93] font-semibold max-w-sm leading-relaxed">
          Instala un servidor MCP del catálogo predefinido a continuación, o agrega un driver personalizado de npm o GitHub.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {servers.map((server) => (
        <McpCard
          key={server.id}
          mcp={server}
          onUninstall={onUninstall}
          onAssignAgents={onAssignAgents}
        />
      ))}
    </div>
  );
}
