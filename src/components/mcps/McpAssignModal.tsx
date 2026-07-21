import React, { useState, useEffect } from "react";
import { X, Cpu, Loader2 } from "lucide-react";
import { Agent } from "../../lib/supabase/client.js";
import { McpServer } from "../../types/mcp.js";
import McpAgentAssigner from "./McpAgentAssigner.js";

interface McpAssignModalProps {
  isOpen: boolean;
  onClose: () => void;
  mcp: McpServer | null;
  agents: Agent[];
  onAssignmentComplete: () => void;
}

export default function McpAssignModal({
  isOpen,
  onClose,
  mcp,
  agents,
  onAssignmentComplete
}: McpAssignModalProps) {
  const [selectedAgentIds, setSelectedAgentIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (mcp && isOpen) {
      const activeIds = (mcp.assignedAgents || []).map(a => a.id);
      setSelectedAgentIds(activeIds);
      setError(null);
    }
  }, [mcp, isOpen]);

  if (!isOpen || !mcp) return null;

  const handleSave = async () => {
    setLoading(true);
    setError(null);

    try {
      const currentIds = (mcp.assignedAgents || []).map(a => a.id);
      const toAssign = selectedAgentIds.filter(id => !currentIds.includes(id));
      const toUnassign = currentIds.filter(id => !selectedAgentIds.includes(id));

      // 1. Unassign removed agents
      for (const agentId of toUnassign) {
        const res = await fetch(`/api/mcps/${mcp.id}/assign/${agentId}`, {
          method: "DELETE"
        });
        if (!res.ok) throw new Error("Error al remover asignaciones previas.");
      }

      // 2. Assign new agents
      for (const agentId of toAssign) {
        const res = await fetch(`/api/mcps/${mcp.id}/assign`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ agentId })
        });
        if (!res.ok) throw new Error("Error al crear nuevas asignaciones.");
      }

      onAssignmentComplete();
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Error al actualizar asignaciones.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-white shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col">
        
        {/* Header */}
        <header className="flex h-14 items-center justify-between border-b border-border px-6">
          <div className="flex items-center gap-2">
            <Cpu className="h-5 w-5 text-primary" />
            <h2 className="text-sm font-bold text-text-primary tracking-tight">
              Asignar {mcp.displayName}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-[#8E8E93] hover:bg-gray-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        {/* Content body */}
        <div className="p-6 space-y-4">
          <p className="text-xs text-text-secondary font-semibold leading-relaxed">
            Elige qué agentes tendrán acceso a las capacidades y herramientas proporcionadas por el driver <strong className="text-text-primary font-bold">{mcp.displayName}</strong>.
          </p>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50/50 p-3 text-xs text-red-600 font-semibold">
              {error}
            </div>
          )}

          <McpAgentAssigner
            agents={agents}
            selectedAgentIds={selectedAgentIds}
            onChange={(ids) => setSelectedAgentIds(ids)}
          />
        </div>

        {/* Footer controls */}
        <footer className="flex h-16 items-center justify-end gap-3 border-t border-border bg-gray-50 px-6">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-border bg-white px-4 py-2 text-xs font-bold text-text-secondary hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          
          <button
            type="button"
            onClick={handleSave}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl bg-primary text-white px-5 py-2 text-xs font-bold shadow-sm hover:opacity-95 disabled:opacity-50 transition-all cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Guardando...</span>
              </>
            ) : (
              <span>Guardar Cambios</span>
            )}
          </button>
        </footer>

      </div>
    </div>
  );
}
