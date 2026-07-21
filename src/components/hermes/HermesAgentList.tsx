import React, { useState, useEffect } from "react";
import { 
  Plus, RefreshCw, Cpu, HelpCircle, Sparkles, FolderSync, CheckCircle2, AlertTriangle, PlayCircle
} from "lucide-react";
import { Project } from "../../lib/supabase/client.js";
import { HermesAgent } from "../../types/hermes.js";
import HermesAgentCard from "./HermesAgentCard.js";
import HermesCreateModal from "./HermesCreateModal.js";
import HermesAgentDetail from "./HermesAgentDetail.js";

interface HermesAgentListProps {
  projects: Project[];
}

export default function HermesAgentList({ projects }: HermesAgentListProps) {
  const [hermesAgents, setHermesAgents] = useState<HermesAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modals / Details states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<HermesAgent | null>(null);

  const fetchHermesAgents = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/agents/hermes");
      if (!res.ok) throw new Error("Fallo al cargar los agentes Hermes.");
      const data = await res.json();
      setHermesAgents(data);
      
      // Update selected agent if open to keep data fresh
      if (selectedAgent) {
        const fresh = data.find((a: HermesAgent) => a.id === selectedAgent.id);
        if (fresh) setSelectedAgent(fresh);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Error al conectar con la API.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHermesAgents();
  }, []);

  const handleDeactivate = async (agent: HermesAgent) => {
    const confirmed = window.confirm(`¿Estás seguro de que deseas desactivar el agente '${agent.displayName}'?`);
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/agents/hermes/${agent.id}`, {
        method: "DELETE"
      });

      if (!res.ok) throw new Error("No se pudo desactivar el agente.");
      
      // Refresh list
      await fetchHermesAgents();
      if (selectedAgent?.id === agent.id) {
        setSelectedAgent(null);
      }
    } catch (err: any) {
      alert(err.message || "Error al desactivar el agente.");
    }
  };

  return (
    <div className="flex flex-col gap-6 p-0 animate-in fade-in duration-200">
      
      {/* Sub Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5">
        <div className="flex flex-col">
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-purple-600 animate-pulse" />
            <span>Automatización con Procesos Hermes</span>
          </h3>
          <p className="text-xs text-gray-500 mt-1 max-w-2xl leading-relaxed">
            Los agentes Hermes son procesos nativos que se conectan vía Chrome DevTools Protocol (CDP) o shell. Pueden ejecutar comandos de PowerShell, Node.js, manipular el navegador Chrome y el sistema de archivos de Windows de forma segura.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={fetchHermesAgents}
            className="rounded-xl border border-gray-200 bg-white p-2.5 hover:bg-gray-50 text-gray-700 transition cursor-pointer flex items-center gap-1.5 text-xs font-bold"
            title="Sincronizar agentes"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-purple-600" : ""}`} />
            <span>Sincronizar</span>
          </button>
          
          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-purple-700 transition cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Dar de Alta</span>
          </button>
        </div>
      </div>

      {loading && hermesAgents.length === 0 ? (
        <div className="flex h-64 items-center justify-center text-sm font-medium text-gray-400 font-mono">
          <RefreshCw className="animate-spin h-5 w-5 text-purple-600 mr-3" />
          Cargando ecosistema de procesos Hermes...
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center text-center p-10 bg-red-50/50 border border-red-100 rounded-2xl">
          <AlertTriangle className="h-10 w-10 text-red-500 mb-3" />
          <h4 className="text-sm font-bold text-red-900">Error al Cargar Agentes</h4>
          <p className="text-xs text-red-700 mt-1">{error}</p>
          <button 
            onClick={fetchHermesAgents}
            className="mt-4 rounded-xl bg-red-600 text-white px-4 py-2 text-xs font-bold hover:bg-red-700 transition"
          >
            Reintentar
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          
          {/* Main Grid Card list */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            {hermesAgents.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center py-20 bg-gray-50 border border-gray-100 rounded-2xl">
                <Cpu className="h-12 w-12 text-gray-300 mb-4" />
                <h4 className="text-sm font-bold text-gray-700">No hay Agentes Hermes activos</h4>
                <p className="text-xs text-gray-400 mt-1 max-w-[320px] leading-relaxed">
                  Agrega tu primer proceso de ejecución para automatizar flujos de trabajo locales directamente en tu máquina.
                </p>
                <button
                  onClick={() => setIsCreateOpen(true)}
                  className="mt-5 flex items-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-purple-700 transition cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  <span>Dar de Alta Agente</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {hermesAgents.map((agent) => (
                  <HermesAgentCard
                    key={agent.id}
                    agent={agent}
                    onSelect={setSelectedAgent}
                    onDeactivate={handleDeactivate}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Right Sidebar Detail Panel */}
          <div className="flex flex-col gap-4">
            {selectedAgent ? (
              <HermesAgentDetail
                agent={selectedAgent}
                onClose={() => setSelectedAgent(null)}
                onRefresh={fetchHermesAgents}
              />
            ) : (
              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm text-center py-12 flex flex-col items-center justify-center">
                <div className="h-12 w-12 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center mb-4">
                  <Plus className="h-6 w-6 text-purple-600" />
                </div>
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Selecciona un Agente</h4>
                <p className="text-xs text-gray-400 mt-1.5 max-w-[220px] leading-relaxed">
                  Haz clic en "Ver" en cualquiera de tus agentes de ejecución para inspeccionar sus parámetros y verificar conexiones activas.
                </p>
              </div>
            )}
          </div>

        </div>
      )}

      {/* Creation Modal Form */}
      {isCreateOpen && (
        <HermesCreateModal
          projects={projects}
          onClose={() => setIsCreateOpen(false)}
          onCreated={async () => {
            setIsCreateOpen(false);
            await fetchHermesAgents();
          }}
        />
      )}

    </div>
  );
}
