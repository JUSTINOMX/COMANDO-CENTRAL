import React from "react";
import { Sparkles, Check } from "lucide-react";
import { PredefinedMcp } from "../../config/predefinedMcps.js";
import { McpServer } from "../../types/mcp.js";
import McpCard from "./McpCard.js";

interface McpPredefinedListProps {
  predefined: PredefinedMcp[];
  installedServers: McpServer[];
  onInstall: (mcp: PredefinedMcp) => void;
}

export default function McpPredefinedList({
  predefined,
  installedServers,
  onInstall
}: McpPredefinedListProps) {
  
  const installedNames = new Set(installedServers.map(s => s.name.toLowerCase()));

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 border border-amber-200 text-amber-500">
          <Sparkles className="h-4.5 w-4.5" />
        </div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary">
          Catálogo Base Predefinido
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {predefined.map((mcp) => {
          const isInstalled = installedNames.has(mcp.name.toLowerCase());
          
          // Map PredefinedMcp structure to standard McpServer for rendering
          const dummyMcp: McpServer = {
            id: mcp.name,
            name: mcp.name,
            displayName: mcp.displayName,
            description: mcp.description,
            source: mcp.source,
            command: mcp.command,
            args: [],
            envVars: {},
            capabilities: mcp.capabilities,
            status: "available",
            category: mcp.category,
            config: {},
            installedBy: "system",
            installedAt: ""
          };

          return (
            <div key={mcp.name} className="relative">
              <McpCard
                mcp={dummyMcp}
                isPredefinedOnly={!isInstalled}
                onInstallPredefined={() => !isInstalled && onInstall(mcp)}
              />
              
              {isInstalled && (
                <div className="absolute top-4 right-4 flex items-center gap-1 rounded-full bg-[#EAFBEF] border border-[#30D158]/20 px-2.5 py-1 text-[10px] font-bold text-[#30D158]">
                  <Check className="h-3 w-3" />
                  <span>Instalado</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
