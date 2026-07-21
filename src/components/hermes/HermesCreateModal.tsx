import React, { useState } from "react";
import { X, Play, Shield, Terminal, Globe, FolderOpen, AlertCircle, Sparkles } from "lucide-react";
import { Project } from "../../lib/supabase/client.js";

interface HermesCreateModalProps {
  projects: Project[];
  onClose: () => void;
  onCreated: () => void;
}

export default function HermesCreateModal({ projects, onClose, onCreated }: HermesCreateModalProps) {
  const [name, setName] = useState("hermes-");
  const [description, setDescription] = useState("");
  const [capabilities, setCapabilities] = useState<{
    browser: boolean;
    nodejs: boolean;
    powershell: boolean;
    filesystem: boolean;
  }>({
    browser: true,
    nodejs: true,
    powershell: false,
    filesystem: false
  });
  const [cdpPort, setCdpPort] = useState(9222);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleToggleCap = (key: 'browser' | 'nodejs' | 'powershell' | 'filesystem') => {
    setCapabilities(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim().toLowerCase();
    if (!trimmedName || trimmedName === "hermes-") {
      setError("Por favor, ingresa un nombre para el agente.");
      return;
    }

    const selectedCaps = Object.entries(capabilities)
      .filter(([_, value]) => value)
      .map(([key]) => key);

    if (selectedCaps.length === 0) {
      setError("Debes seleccionar al menos una capacidad.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/agents/hermes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmedName,
          displayName: trimmedName
            .split("-")
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" "),
          description: description.trim(),
          capabilities: selectedCaps,
          cdpPort: capabilities.browser ? cdpPort : undefined,
          projectId: selectedProjectId || undefined
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al crear el agente Hermes.");
      }

      onCreated();
    } catch (err: any) {
      setError(err.message || "Error al conectar con el servidor.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl animate-in zoom-in-95 duration-150">
        
        {/* Banner */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4.5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Sparkles className="h-5 w-5 text-purple-200" />
            <div>
              <h3 className="text-sm font-bold tracking-tight">Alta de Agente Hermes</h3>
              <p className="text-[10px] text-purple-100 mt-0.5">Crea un agente autónomo ejecutor con capacidades de automatización.</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="rounded-lg p-1.5 hover:bg-white/10 text-white/80 hover:text-white transition cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-start gap-2 rounded-xl bg-red-50 border border-red-100 p-3.5 text-xs text-red-800 leading-normal">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
              <p className="font-medium">{error}</p>
            </div>
          )}

          {/* Nombre */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Nombre del Agente</label>
            <input
              type="text"
              required
              placeholder="hermes-browser"
              value={name}
              onChange={(e) => {
                const val = e.target.value.toLowerCase().replace(/\s+/g, "-");
                setName(val.startsWith("hermes-") ? val : "hermes-" + val.replace(/^hermes/, ""));
              }}
              className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-xs font-mono text-gray-800 outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition"
            />
          </div>

          {/* Descripción */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Descripción / Función de la Soul</label>
            <textarea
              required
              rows={3}
              placeholder="Agente especializado para automatizar descargas de archivos y scraping de datos web..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-xs text-gray-800 outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition resize-none"
            />
          </div>

          {/* Capacidades */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Capacidades del Sistema</label>
            <div className="grid grid-cols-2 gap-2.5">
              <div 
                onClick={() => handleToggleCap('browser')}
                className={`flex items-center gap-3 rounded-xl border p-3 cursor-pointer select-none transition ${
                  capabilities.browser 
                    ? "border-purple-200 bg-purple-50/10 shadow-xs" 
                    : "border-gray-100 bg-gray-50/40 text-gray-400 hover:border-gray-200"
                }`}
              >
                <input 
                  type="checkbox" 
                  checked={capabilities.browser} 
                  readOnly 
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <div className="flex flex-col leading-none">
                  <span className="text-[11px] font-bold text-gray-900 flex items-center gap-1.5">
                    <Globe className={`h-3 w-3 ${capabilities.browser ? "text-purple-600" : ""}`} />
                    Navegador (CDP)
                  </span>
                </div>
              </div>

              <div 
                onClick={() => handleToggleCap('nodejs')}
                className={`flex items-center gap-3 rounded-xl border p-3 cursor-pointer select-none transition ${
                  capabilities.nodejs 
                    ? "border-purple-200 bg-purple-50/10 shadow-xs" 
                    : "border-gray-100 bg-gray-50/40 text-gray-400 hover:border-gray-200"
                }`}
              >
                <input 
                  type="checkbox" 
                  checked={capabilities.nodejs} 
                  readOnly 
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <div className="flex flex-col leading-none">
                  <span className="text-[11px] font-bold text-gray-900 flex items-center gap-1.5">
                    <Terminal className={`h-3 w-3 ${capabilities.nodejs ? "text-purple-600" : ""}`} />
                    Node.js / Scripts
                  </span>
                </div>
              </div>

              <div 
                onClick={() => handleToggleCap('powershell')}
                className={`flex items-center gap-3 rounded-xl border p-3 cursor-pointer select-none transition ${
                  capabilities.powershell 
                    ? "border-purple-200 bg-purple-50/10 shadow-xs" 
                    : "border-gray-100 bg-gray-50/40 text-gray-400 hover:border-gray-200"
                }`}
              >
                <input 
                  type="checkbox" 
                  checked={capabilities.powershell} 
                  readOnly 
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <div className="flex flex-col leading-none">
                  <span className="text-[11px] font-bold text-gray-900 flex items-center gap-1.5">
                    <Shield className={`h-3 w-3 ${capabilities.powershell ? "text-purple-600" : ""}`} />
                    PowerShell
                  </span>
                </div>
              </div>

              <div 
                onClick={() => handleToggleCap('filesystem')}
                className={`flex items-center gap-3 rounded-xl border p-3 cursor-pointer select-none transition ${
                  capabilities.filesystem 
                    ? "border-purple-200 bg-purple-50/10 shadow-xs" 
                    : "border-gray-100 bg-gray-50/40 text-gray-400 hover:border-gray-200"
                }`}
              >
                <input 
                  type="checkbox" 
                  checked={capabilities.filesystem} 
                  readOnly 
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <div className="flex flex-col leading-none">
                  <span className="text-[11px] font-bold text-gray-900 flex items-center gap-1.5">
                    <FolderOpen className={`h-3 w-3 ${capabilities.filesystem ? "text-purple-600" : ""}`} />
                    OneDrive / Files
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* CDP Port (Conditional) */}
          {capabilities.browser && (
            <div className="flex flex-col gap-1.5 animate-in slide-in-from-top-2 duration-150">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Conexión Chrome CDP (Puerto)</label>
              <input
                type="number"
                min={1024}
                max={65535}
                required
                value={cdpPort}
                onChange={(e) => setCdpPort(parseInt(e.target.value) || 9222)}
                className="w-1/2 rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-xs font-mono text-gray-800 outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition"
              />
            </div>
          )}

          {/* Proyecto */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Asignar Proyecto Destino (Opcional)</label>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-xs text-gray-800 outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition"
            >
              <option value="">-- Sin Asignar / Seleccionar --</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Acciones */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-xs font-bold text-gray-700 hover:bg-gray-50 transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-purple-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-purple-700 transition flex items-center gap-1.5 cursor-pointer disabled:bg-purple-400"
            >
              {submitting ? "Creando..." : "✅ Crear Agente"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
