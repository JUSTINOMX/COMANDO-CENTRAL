import React, { useState } from "react";
import { 
  X, Cpu, Settings, Play, Database, RefreshCw, CheckCircle2, 
  AlertTriangle, Folder, Globe, Terminal, Shield, Info, Clock, PlayCircle
} from "lucide-react";
import { HermesAgent } from "../../types/hermes.js";
import OnlineIndicator from "./OnlineIndicator.js";
import CapabilityBadge from "./CapabilityBadge.js";

interface HermesAgentDetailProps {
  agent: HermesAgent;
  onClose: () => void;
  onRefresh: () => void;
}

export default function HermesAgentDetail({ agent, onClose, onRefresh }: HermesAgentDetailProps) {
  const [pinging, setPinging] = useState(false);
  const [pingResult, setPingResult] = useState<{ success: boolean; message: string } | null>(null);

  const handlePing = async () => {
    setPinging(true);
    setPingResult(null);
    try {
      const res = await fetch(`/api/agents/hermes/${agent.id}/ping`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      const data = await res.json();
      if (res.ok) {
        setPingResult({ success: true, message: "Ping exitoso. El agente reportó estar activo." });
        onRefresh();
      } else {
        setPingResult({ success: false, message: data.error || "Fallo en el ping. El agente no respondió." });
      }
    } catch (err: any) {
      setPingResult({ success: false, message: err.message || "Error al conectar con la API de ping." });
    } finally {
      setPinging(false);
    }
  };

  return (
    <div className="rounded-xl border border-purple-200 bg-white p-5 shadow-md animate-in slide-in-from-right duration-200 flex flex-col gap-5">
      {/* Detail Header */}
      <div className="flex items-start justify-between border-b border-gray-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-50 border border-purple-100">
            <Cpu className="h-5 w-5 text-purple-600" />
          </div>
          <div className="flex flex-col">
            <h4 className="text-sm font-bold text-gray-900">{agent.displayName}</h4>
            <span className="text-[10px] font-mono text-gray-400">@{agent.name}</span>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="rounded-lg p-1 hover:bg-gray-50 text-gray-400 hover:text-gray-600 transition cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Online Status Status Indicator */}
      <div className="flex items-center justify-between bg-gray-50 border border-gray-100 p-3 rounded-xl">
        <span className="text-xs font-bold text-gray-500">Estado de Conexión</span>
        <OnlineIndicator lastPing={agent.metadata.lastPing} />
      </div>

      {/* Detailed Info Tabs/Stats */}
      <div className="space-y-4 text-xs">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Función Principal (Soul)</span>
          <p className="bg-purple-50/20 border border-purple-100/50 p-2.5 rounded-lg text-gray-700 italic leading-relaxed">
            "{agent.soul}"
          </p>
        </div>

        {/* Capabilities Grid */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Capacidades Autorizadas</span>
          <div className="flex flex-wrap gap-1.5">
            {agent.identity.capabilities.map((cap) => (
              <CapabilityBadge key={cap} capability={cap} />
            ))}
          </div>
        </div>

        {/* Connection Settings */}
        <div className="flex flex-col gap-1.5 border-t border-gray-100 pt-3">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide flex items-center gap-1">
            <Settings className="h-3.5 w-3.5 text-purple-500" /> Configuración de Ejecución
          </span>
          <div className="space-y-1.5 bg-gray-50/50 border border-gray-100 rounded-xl p-3 font-mono text-[11px] text-gray-600">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Tipo de Conexión:</span>
              <span className="text-gray-800 font-bold uppercase">{agent.identity.connection.type}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Endpoint CDP:</span>
              <span className="text-gray-800 font-bold break-all">{agent.identity.connection.endpoint}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Directorio Trabajo:</span>
              <span className="text-gray-800 font-bold text-right truncate max-w-[180px]" title={agent.configuration.workingDir}>
                {agent.configuration.workingDir}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Plataforma / S.O:</span>
              <span className="text-gray-800 font-bold capitalize">{agent.identity.platform} (v{agent.identity.version})</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Tiempo Límite:</span>
              <span className="text-gray-800 font-bold">{agent.configuration.timeout / 1000}s</span>
            </div>
          </div>
        </div>

        {/* Projects Assigned */}
        <div className="flex flex-col gap-1.5 border-t border-gray-100 pt-3">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide flex items-center gap-1">
            <Folder className="h-3.5 w-3.5 text-purple-500" /> Proyectos Asignados
          </span>
          {agent.metadata.assignedProjects && agent.metadata.assignedProjects.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {agent.metadata.assignedProjects.map((pName) => (
                <span key={pName} className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full text-[10px] font-bold border border-purple-200">
                  {pName}
                </span>
              ))}
            </div>
          ) : (
            <span className="text-[11px] text-gray-400 italic">No asignado a ningún proyecto activo</span>
          )}
        </div>

        {/* Live Actions allowed */}
        <div className="flex flex-col gap-1.5 border-t border-gray-100 pt-3">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Acciones de Escritorio Permitidas</span>
          <div className="flex flex-wrap gap-1">
            {agent.configuration.allowedActions.map((act) => (
              <span key={act} className="bg-slate-100 border border-slate-200 text-slate-700 px-1.5 py-0.5 rounded text-[10px] font-mono">
                {act}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Detail Actions */}
      <div className="mt-2 pt-3 border-t border-gray-100 flex flex-col gap-2">
        <button
          onClick={handlePing}
          disabled={pinging}
          className="w-full rounded-xl border border-green-200 bg-green-50/20 px-3.5 py-2 text-xs font-bold text-green-700 hover:bg-green-50 transition flex items-center justify-center gap-1.5 cursor-pointer"
        >
          {pinging ? (
            <RefreshCw className="h-3.5 w-3.5 animate-spin text-green-700" />
          ) : (
            <PlayCircle className="h-3.5 w-3.5 text-green-700 fill-green-700/20" />
          )}
          <span>Probar Ping de Agente</span>
        </button>

        {pingResult && (
          <div className={`p-3 rounded-xl border text-[11px] leading-normal ${
            pingResult.success 
              ? "bg-green-50 border-green-100 text-green-800" 
              : "bg-red-50 border-red-100 text-red-800"
          }`}>
            <div className="font-bold flex items-center gap-1.5 mb-0.5">
              {pingResult.success ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> : <AlertTriangle className="h-3.5 w-3.5 shrink-0" />}
              <span>{pingResult.success ? "Ping Correcto" : "Ping Fallido"}</span>
            </div>
            <p className="break-all">{pingResult.message}</p>
          </div>
        )}
      </div>
    </div>
  );
}
