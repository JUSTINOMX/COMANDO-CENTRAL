import React, { useState, useEffect } from "react";
import { X, Plug, ShieldAlert, Loader2, Plus, Trash2 } from "lucide-react";
import { Agent } from "../../lib/supabase/client.js";
import { PredefinedMcp } from "../../config/predefinedMcps.js";
import McpAgentAssigner from "./McpAgentAssigner.js";

interface McpInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  predefinedMcp?: PredefinedMcp | null;
  onInstallComplete: () => void;
  agents: Agent[];
}

export default function McpInstallModal({
  isOpen,
  onClose,
  predefinedMcp,
  onInstallComplete,
  agents
}: McpInstallModalProps) {
  // Common states
  const [name, setName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("general");
  const [source, setSource] = useState<"local" | "npm" | "github">("npm");
  const [sourceUrl, setSourceUrl] = useState("");
  const [command, setCommand] = useState("");
  const [argsText, setArgsText] = useState("");
  const [capabilitiesText, setCapabilitiesText] = useState("");
  
  // Dynamic lists
  const [envVars, setEnvVars] = useState<Record<string, string>>({});
  const [envKey, setEnvKey] = useState("");
  const [envValue, setEnvValue] = useState("");

  const [selectedAgentIds, setSelectedAgentIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Populate form if predefined MCP is passed
  useEffect(() => {
    if (predefinedMcp) {
      setName(predefinedMcp.name);
      setDisplayName(predefinedMcp.displayName);
      setDescription(predefinedMcp.description);
      setCategory(predefinedMcp.category);
      setSource(predefinedMcp.source);
      setCommand(predefinedMcp.command);
      setArgsText("");
      setCapabilitiesText(predefinedMcp.capabilities.join(", "));
      
      // Initialize required env variables with empty strings
      const initialEnv: Record<string, string> = {};
      if (predefinedMcp.requiredEnvVars) {
        predefinedMcp.requiredEnvVars.forEach(key => {
          initialEnv[key] = "";
        });
      }
      setEnvVars(initialEnv);
    } else {
      // Clear for custom MCP
      setName("");
      setDisplayName("");
      setDescription("");
      setCategory("general");
      setSource("npm");
      setSourceUrl("");
      setCommand("");
      setArgsText("");
      setCapabilitiesText("");
      setEnvVars({});
    }
    setSelectedAgentIds([]);
    setError(null);
  }, [predefinedMcp, isOpen]);

  if (!isOpen) return null;

  const handleAddEnv = () => {
    if (!envKey.trim()) return;
    setEnvVars(prev => ({
      ...prev,
      [envKey.trim().toUpperCase()]: envValue
    }));
    setEnvKey("");
    setEnvValue("");
  };

  const handleRemoveEnv = (key: string) => {
    setEnvVars(prev => {
      const updated = { ...prev };
      delete updated[key];
      return updated;
    });
  };

  const handleEnvValueChange = (key: string, val: string) => {
    setEnvVars(prev => ({
      ...prev,
      [key]: val
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !displayName.trim() || !command.trim()) {
      setError("Por favor completa los campos obligatorios: Nombre, Nombre a Mostrar y Comando.");
      return;
    }

    setLoading(true);
    setError(null);

    const parsedArgs = argsText
      .split(",")
      .map(a => a.trim())
      .filter(a => a.length > 0);

    const parsedCapabilities = capabilitiesText
      .split(",")
      .map(c => c.trim())
      .filter(c => c.length > 0);

    const payload = {
      name: name.trim().toLowerCase(),
      displayName: displayName.trim(),
      description: description.trim(),
      category,
      source,
      sourceUrl: source === "github" ? sourceUrl.trim() : "",
      command: command.trim(),
      args: parsedArgs,
      envVars,
      capabilities: parsedCapabilities,
      assignedAgentIds: selectedAgentIds
    };

    try {
      const res = await fetch("/api/mcps/install", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Error al instalar el MCP");
      }

      onInstallComplete();
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Error de conexión.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-lg rounded-2xl border border-border bg-white shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <header className="flex h-14 items-center justify-between border-b border-border px-6">
          <div className="flex items-center gap-2">
            <Plug className="h-5 w-5 text-primary" />
            <h2 className="text-sm font-bold text-text-primary tracking-tight">
              {predefinedMcp ? `Instalar ${predefinedMcp.displayName}` : "Instalar MCP Server Personalizado"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-[#8E8E93] hover:bg-gray-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="flex gap-2 rounded-xl border border-red-200 bg-red-50/50 p-3 text-xs text-red-600 font-semibold items-start">
              <ShieldAlert className="h-4.5 w-4.5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Core Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase text-text-secondary">
                Identificador Único (Name) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                disabled={!!predefinedMcp}
                value={name}
                onChange={(e) => setName(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                placeholder="ej: filesystem-mcp"
                className="rounded-xl border border-border bg-[#F5F5F7]/30 px-3 py-2 text-xs font-semibold text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/15 disabled:bg-gray-50 disabled:opacity-70"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase text-text-secondary">
                Nombre a Mostrar <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="ej: File System MCP"
                className="rounded-xl border border-border bg-[#F5F5F7]/30 px-3 py-2 text-xs font-semibold text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/15"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold uppercase text-text-secondary">
              Descripción
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="¿Qué hace este MCP?"
              className="rounded-xl border border-border bg-[#F5F5F7]/30 px-3 py-2 text-xs font-semibold text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/15"
            />
          </div>

          {/* Meta & Execution Specs */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase text-text-secondary">
                Categoría
              </label>
              <select
                disabled={!!predefinedMcp}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="rounded-xl border border-border bg-[#F5F5F7]/30 px-3 py-2 text-xs font-semibold text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/15 disabled:opacity-70"
              >
                <option value="general">📦 General</option>
                <option value="database">🗄️ Database</option>
                <option value="filesystem">📂 Filesystem</option>
                <option value="github">🐙 GitHub</option>
                <option value="browser">🌐 Browser</option>
                <option value="api">🔌 API</option>
                <option value="custom">⚙️ Custom</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase text-text-secondary">
                Origen de Origen
              </label>
              <select
                disabled={!!predefinedMcp}
                value={source}
                onChange={(e) => setSource(e.target.value as any)}
                className="rounded-xl border border-border bg-[#F5F5F7]/30 px-3 py-2 text-xs font-semibold text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/15 disabled:opacity-70"
              >
                <option value="npm">npm Registry</option>
                <option value="github">GitHub Repository</option>
                <option value="local">Local Command</option>
              </select>
            </div>
          </div>

          {source === "github" && (
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase text-text-secondary">
                URL del Repositorio de GitHub
              </label>
              <input
                type="text"
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                placeholder="https://github.com/..."
                className="rounded-xl border border-border bg-[#F5F5F7]/30 px-3 py-2 text-xs font-semibold text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/15"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase text-text-secondary">
                Comando de Ejecución <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                disabled={!!predefinedMcp}
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                placeholder="ej: npx @anthropic/filesystem-mcp"
                className="rounded-xl border border-border bg-[#F5F5F7]/30 px-3 py-2 text-xs font-semibold text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/15 disabled:bg-gray-50 disabled:opacity-70"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase text-text-secondary">
                Argumentos (Separados por coma)
              </label>
              <input
                type="text"
                value={argsText}
                onChange={(e) => setArgsText(e.target.value)}
                placeholder="/path/one, /path/two"
                className="rounded-xl border border-border bg-[#F5F5F7]/30 px-3 py-2 text-xs font-semibold text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/15"
              />
            </div>
          </div>

          {/* Environment Variables */}
          <div className="space-y-2.5">
            <label className="text-[10px] font-bold uppercase text-text-secondary block">
              Variables de Entorno Requeridas
            </label>

            {Object.keys(envVars).length > 0 && (
              <div className="space-y-2 rounded-xl border border-border bg-[#F5F5F7]/40 p-3">
                {Object.entries(envVars).map(([key, val]) => (
                  <div key={key} className="flex gap-2 items-center">
                    <span className="text-[10px] font-mono font-bold text-text-primary bg-white border border-border px-1.5 py-1 rounded max-w-[150px] truncate">
                      {key}
                    </span>
                    <input
                      type="text"
                      value={val}
                      onChange={(e) => handleEnvValueChange(key, e.target.value)}
                      placeholder="Valor de variable"
                      className="flex-1 rounded-lg border border-border bg-white px-2.5 py-1 text-xs font-semibold text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/15"
                    />
                    {!predefinedMcp?.requiredEnvVars?.includes(key) && (
                      <button
                        type="button"
                        onClick={() => handleRemoveEnv(key)}
                        className="p-1 text-[#FF375F] hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Form to add custom vars (only if custom or supplementary to predefined) */}
            <div className="flex gap-2 items-center">
              <input
                type="text"
                value={envKey}
                onChange={(e) => setEnvKey(e.target.value)}
                placeholder="NUEVA_VAR"
                className="w-1/3 rounded-xl border border-border bg-white px-3 py-2 text-xs font-mono font-bold uppercase text-text-primary focus:border-primary focus:outline-none"
              />
              <input
                type="text"
                value={envValue}
                onChange={(e) => setEnvValue(e.target.value)}
                placeholder="valor_secreto"
                className="flex-1 rounded-xl border border-border bg-white px-3 py-2 text-xs font-semibold text-text-primary focus:border-primary focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddEnv}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary hover:bg-primary/15 transition-all"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Capabilities */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold uppercase text-text-secondary">
              Capacidades / Herramientas (Separadas por coma)
            </label>
            <input
              type="text"
              value={capabilitiesText}
              onChange={(e) => setCapabilitiesText(e.target.value)}
              placeholder="query_db, list_tables, write_file"
              className="rounded-xl border border-border bg-[#F5F5F7]/30 px-3 py-2 text-xs font-semibold text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/15"
            />
          </div>

          {/* Agent Assigning Area */}
          <McpAgentAssigner
            agents={agents}
            selectedAgentIds={selectedAgentIds}
            onChange={(ids) => setSelectedAgentIds(ids)}
          />
        </form>

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
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl bg-primary text-white px-5 py-2 text-xs font-bold shadow-sm hover:opacity-95 disabled:opacity-50 transition-all cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Instalando...</span>
              </>
            ) : (
              <span>Instalar y Asignar</span>
            )}
          </button>
        </footer>

      </div>
    </div>
  );
}
