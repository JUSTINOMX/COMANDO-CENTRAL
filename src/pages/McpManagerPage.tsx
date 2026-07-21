import React, { useState, useEffect } from "react";
import { Plug, Plus, ShieldAlert, Sparkles, ServerCrash, RefreshCw } from "lucide-react";
import { McpServer } from "../types/mcp.js";
import { PredefinedMcp, PREDEFINED_MCPS } from "../config/predefinedMcps.js";
import { Agent } from "../lib/supabase/client.js";

import McpList from "../components/mcps/McpList.js";
import McpPredefinedList from "../components/mcps/McpPredefinedList.js";
import McpInstallModal from "../components/mcps/McpInstallModal.js";
import McpAssignModal from "../components/mcps/McpAssignModal.js";

interface McpManagerPageProps {
  agents?: Agent[];
}

export default function McpManagerPage({ agents: propAgents }: McpManagerPageProps) {
  const [installedServers, setInstalledServers] = useState<McpServer[]>([]);
  const [predefinedCatalog, setPredefinedCatalog] = useState<PredefinedMcp[]>(PREDEFINED_MCPS);
  const [agents, setAgents] = useState<Agent[]>(propAgents || []);
  
  // Loading & error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [isInstallOpen, setIsInstallOpen] = useState(false);
  const [selectedPredefined, setSelectedPredefined] = useState<PredefinedMcp | null>(null);
  
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [selectedMcpForAssign, setSelectedMcpForAssign] = useState<McpServer | null>(null);

  // Fetch installed and predefined servers
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch Installed
      const res1 = await fetch("/api/mcps");
      if (!res1.ok) throw new Error("Error al obtener los servidores MCP instalados.");
      const servers: McpServer[] = await res1.json();
      setInstalledServers(servers);

      // 2. Fetch Predefined (as fallback/updates)
      const res2 = await fetch("/api/mcps/predefined");
      if (res2.ok) {
        const catalog: PredefinedMcp[] = await res2.json();
        setPredefinedCatalog(catalog);
      }

      // 3. Fetch Agents (if not passed as prop)
      if (!propAgents || propAgents.length === 0) {
        const res3 = await fetch("/api/agents");
        if (res3.ok) {
          const fetchedAgents = await res3.json();
          setAgents(fetchedAgents);
        }
      } else {
        setAgents(propAgents);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Error al conectar con la API de MCP.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [propAgents]);

  const handleUninstall = async (mcpId: string) => {
    if (!window.confirm("¿Estás seguro de que deseas desinstalar este servidor MCP? Se removerán todas las asignaciones asociadas.")) {
      return;
    }

    try {
      const res = await fetch(`/api/mcps/${mcpId}`, {
        method: "DELETE"
      });

      if (!res.ok) throw new Error("Error al desinstalar el MCP server.");
      
      // Update local state directly
      setInstalledServers(prev => prev.filter(s => s.id !== mcpId));
    } catch (err: any) {
      alert(err.message || "No se pudo desinstalar.");
    }
  };

  const handleOpenInstallPredefined = (mcp: PredefinedMcp) => {
    setSelectedPredefined(mcp);
    setIsInstallOpen(true);
  };

  const handleOpenInstallCustom = () => {
    setSelectedPredefined(null);
    setIsInstallOpen(true);
  };

  const handleOpenAssignAgents = (mcp: McpServer) => {
    setSelectedMcpForAssign(mcp);
    setIsAssignOpen(true);
  };

  // Compute status summary
  const serversWithError = installedServers.filter(s => s.status === "error").length;

  return (
    <div className="mx-auto max-w-7xl px-8 py-8 space-y-8 animate-in fade-in duration-300">
      
      {/* Top Header Block */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Plug className="h-5.5 w-5.5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-text-primary tracking-tight">
                Gestión de MCP Servers
              </h1>
              <p className="text-xs text-text-secondary font-semibold mt-0.5 leading-relaxed">
                El Model Context Protocol (MCP) conecta de forma segura agentes inteligentes con bases de datos, APIs y sistemas de archivos locales.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-white text-text-secondary hover:text-text-primary hover:bg-gray-50 transition-colors"
            title="Refrescar Servidores"
          >
            <RefreshCw className="h-4.5 w-4.5" />
          </button>

          <button
            onClick={handleOpenInstallCustom}
            className="flex items-center gap-2 rounded-xl bg-primary text-white px-4 py-2.5 text-xs font-bold shadow-sm hover:opacity-95 transition-all cursor-pointer"
          >
            <Plus className="h-4.5 w-4.5" />
            <span>Instalar MCP</span>
          </button>
        </div>
      </div>

      {/* Warnings & Notices */}
      {serversWithError > 0 && (
        <div className="flex gap-3 rounded-2xl border border-red-200 bg-red-50/50 p-4 text-xs text-red-600 font-semibold items-start">
          <ServerCrash className="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Hay {serversWithError} servidor(es) MCP con errores de ejecución</p>
            <p className="opacity-80 mt-0.5 font-medium leading-relaxed">Verifica las variables de entorno asociadas o el comando configurado para solucionar el fallo.</p>
          </div>
        </div>
      )}

      {/* Core section 1: Installed Servers */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-text-secondary">
            Instalados y Activos ({installedServers.length})
          </h2>
        </div>

        {loading && installedServers.length === 0 ? (
          <div className="flex h-[200px] items-center justify-center rounded-2xl border border-border/60 bg-white">
            <span className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mr-3" />
            <span className="text-xs font-semibold text-text-secondary">Cargando servidores MCP...</span>
          </div>
        ) : (
          <McpList
            servers={installedServers}
            onUninstall={handleUninstall}
            onAssignAgents={handleOpenAssignAgents}
          />
        )}
      </section>

      {/* Core section 2: Predefined Catalogue */}
      <section className="border-t border-border/60 pt-8">
        <McpPredefinedList
          predefined={predefinedCatalog}
          installedServers={installedServers}
          onInstall={handleOpenInstallPredefined}
        />
      </section>

      {/* Modals */}
      <McpInstallModal
        isOpen={isInstallOpen}
        onClose={() => setIsInstallOpen(false)}
        predefinedMcp={selectedPredefined}
        onInstallComplete={fetchData}
        agents={agents}
      />

      <McpAssignModal
        isOpen={isAssignOpen}
        onClose={() => setIsAssignOpen(false)}
        mcp={selectedMcpForAssign}
        agents={agents}
        onAssignmentComplete={fetchData}
      />

    </div>
  );
}
