import React from "react";
import { 
  Database, 
  Github, 
  Folder, 
  Chrome, 
  Settings, 
  Cpu, 
  Clock, 
  Plug, 
  Trash2, 
  UserPlus,
  Play
} from "lucide-react";
import { McpServer } from "../../types/mcp.js";

interface McpCardProps {
  key?: string | number;
  mcp: McpServer;
  onUninstall?: (id: string) => void;
  onAssignAgents?: (mcp: McpServer) => void;
  onInstallPredefined?: (mcp: any) => void;
  isPredefinedOnly?: boolean;
}

export default function McpCard({
  mcp,
  onUninstall,
  onAssignAgents,
  onInstallPredefined,
  isPredefinedOnly = false
}: McpCardProps) {
  
  // Choose category icon
  const getCategoryIcon = (category: string) => {
    switch (category?.toLowerCase()) {
      case "database":
        return <Database className="h-5 w-5 text-[#30D158]" />;
      case "github":
        return <Github className="h-5 w-5 text-text-primary" />;
      case "filesystem":
        return <Folder className="h-5 w-5 text-[#FF9500]" />;
      case "browser":
        return <Chrome className="h-5 w-5 text-[#007AFF]" />;
      case "api":
        return <Plug className="h-5 w-5 text-[#AF52DE]" />;
      default:
        return <Settings className="h-5 w-5 text-text-secondary" />;
    }
  };

  // Convert category slug to a nice human label
  const getCategoryLabel = (category: string) => {
    switch (category?.toLowerCase()) {
      case "database": return "Database";
      case "github": return "GitHub";
      case "filesystem": return "Filesystem";
      case "browser": return "Browser";
      case "api": return "API";
      default: return "General";
    }
  };

  // Time formatting helper
  const formatTimeAgo = (dateStr?: string) => {
    if (!dateStr) return "Sin uso registrado";
    const date = new Date(dateStr);
    const diffMs = Date.now() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 1) return "Justo ahora";
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours} hr`;
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };

  return (
    <div className="group flex flex-col justify-between rounded-2xl border border-border bg-white p-5 hover:shadow-md transition-all">
      
      {/* Top Header Row */}
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-50 border border-border/60">
              {getCategoryIcon(mcp.category)}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="text-sm font-bold text-text-primary tracking-tight">
                  {mcp.displayName}
                </h4>
                {/* Status Dot */}
                {!isPredefinedOnly && (
                  <span className={`inline-block h-2 w-2 rounded-full ${
                    mcp.status === "installed" ? "bg-[#30D158]" : "bg-[#FF375F]"
                  }`} title={mcp.status === "installed" ? "Instalado" : "Error"} />
                )}
              </div>
              <p className="text-[10px] font-bold text-text-secondary/70 uppercase tracking-wider">
                {getCategoryLabel(mcp.category)} • Source: <span className="text-primary font-mono">{mcp.source}</span>
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1">
            {isPredefinedOnly ? (
              <button
                onClick={() => onInstallPredefined && onInstallPredefined(mcp)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-primary text-white text-[11px] font-bold hover:opacity-95 shadow-sm transition-all cursor-pointer"
              >
                Instalar
              </button>
            ) : (
              <>
                {onAssignAgents && (
                  <button
                    onClick={() => onAssignAgents(mcp)}
                    className="p-2 text-text-secondary hover:text-primary hover:bg-gray-50 rounded-xl transition-colors"
                    title="Administrar Agentes"
                  >
                    <UserPlus className="h-4.5 w-4.5" />
                  </button>
                )}
                {onUninstall && (
                  <button
                    onClick={() => onUninstall(mcp.id)}
                    className="p-2 text-text-secondary hover:text-red-500 hover:bg-red-50/50 rounded-xl transition-colors"
                    title="Desinstalar MCP"
                  >
                    <Trash2 className="h-4.5 w-4.5" />
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-text-secondary font-semibold leading-relaxed line-clamp-2">
          {mcp.description}
        </p>

        {/* Command string container */}
        <div className="rounded-xl border border-border/80 bg-[#F5F5F7]/50 p-2.5 font-mono text-[10px] font-bold text-[#8E8E93] overflow-x-auto whitespace-nowrap">
          <div className="flex gap-1.5 items-center">
            <Play className="h-3 w-3 text-text-secondary/60 shrink-0" />
            <span>{mcp.command} {mcp.args?.join(" ")}</span>
          </div>
        </div>

        {/* Capabilities tag block */}
        {mcp.capabilities && mcp.capabilities.length > 0 && (
          <div className="space-y-1.5">
            <span className="text-[9px] font-bold tracking-wider uppercase text-text-secondary/60 block">
              Capacidades:
            </span>
            <div className="flex flex-wrap gap-1">
              {mcp.capabilities.map((cap, i) => (
                <span 
                  key={i} 
                  className="rounded-lg border border-border/50 bg-[#F5F5F7] px-1.5 py-0.5 font-mono text-[9px] font-bold text-text-primary/80"
                >
                  {cap}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Row - Assignments and Usage Stats */}
      {!isPredefinedOnly && (
        <div className="mt-5 border-t border-border/60 pt-4 flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <span className="text-[9px] font-bold tracking-wider uppercase text-text-secondary/60 block mb-1">
              Agentes asignados:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {mcp.assignedAgents && mcp.assignedAgents.length > 0 ? (
                mcp.assignedAgents.map((agent) => (
                  <span 
                    key={agent.id}
                    className="flex items-center gap-1 rounded-xl bg-[#E8F2FF] border border-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary"
                  >
                    <Cpu className="h-3 w-3 shrink-0" />
                    <span className="truncate max-w-[100px]">{agent.displayName}</span>
                  </span>
                ))
              ) : (
                <span className="text-[11px] font-semibold text-[#8E8E93] italic">
                  Sin asignar
                </span>
              )}
            </div>
          </div>

          <div className="text-right shrink-0 text-[10px] font-semibold text-text-secondary/80 flex items-center gap-1">
            <Clock className="h-3.5 w-3.5 text-[#8E8E93]/60" />
            <span>{formatTimeAgo(mcp.lastUsed)}</span>
          </div>
        </div>
      )}

    </div>
  );
}
