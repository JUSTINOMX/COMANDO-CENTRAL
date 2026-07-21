import React, { useState, useEffect } from "react";
import { Loader2, GitPullRequest, Star, Layers, Folder, X, Check, AlertCircle, Wrench } from "lucide-react";
import GitHubAgentCard, { DetectedAgent } from "./GitHubAgentCard.js";
import { Project } from "../../lib/supabase/client.js";

interface GitHubRepoInfo {
  full_name: string;
  description: string;
  language: string;
  topics: string[];
  stars: number;
  html_url: string;
  default_branch: string;
  license?: { name: string };
}

interface GitHubInstallModalProps {
  url: string;
  projects: Project[];
  onClose: () => void;
  onInstallComplete: (result: {
    success: boolean;
    repo: GitHubRepoInfo;
    installedCount: number;
    skillsCount: number;
  }) => void;
  onCancel: () => void;
}

export default function GitHubInstallModal({
  url,
  projects,
  onClose,
  onInstallComplete,
  onCancel,
}: GitHubInstallModalProps) {
  const [loading, setLoading] = useState(true);
  const [installing, setInstalling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [repoInfo, setRepoInfo] = useState<GitHubRepoInfo | null>(null);
  const [detectedAgents, setDetectedAgents] = useState<DetectedAgent[]>([]);
  const [selectedAgentNames, setSelectedAgentNames] = useState<string[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");

  // Scan repository on mount
  useEffect(() => {
    const scanRepo = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/github/scan?url=${encodeURIComponent(url)}`);
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || "Error al escanear el repositorio");
        }
        const data = await res.json();
        setRepoInfo(data.repo);
        setDetectedAgents(data.detectedAgents || []);
        // Select all by default
        setSelectedAgentNames((data.detectedAgents || []).map((a: DetectedAgent) => a.name));
      } catch (err: any) {
        console.error("Scanning failed:", err);
        setError(err.message || "No se pudo conectar con el servidor para escanear");
      } finally {
        setLoading(false);
      }
    };

    scanRepo();
  }, [url]);

  const handleToggleAgent = (name: string) => {
    setSelectedAgentNames((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  };

  const handleInstall = async () => {
    if (selectedAgentNames.length === 0) return;
    setInstalling(true);
    setError(null);

    try {
      const res = await fetch("/api/commander/install-github", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          selectedAgents: selectedAgentNames,
          projectId: selectedProjectId || undefined,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Ocurrió un error al instalar los agentes");
      }

      const data = await res.json();
      if (data.success) {
        onInstallComplete({
          success: true,
          repo: data.repo,
          installedCount: data.installed?.length || 0,
          skillsCount: data.skillsInstalled || 0,
        });
      } else {
        throw new Error(data.errors?.join(", ") || "No se instaló ningún agente");
      }
    } catch (err: any) {
      console.error("Installation failed:", err);
      setError(err.message || "Error de red durante la instalación");
      setInstalling(false);
    }
  };

  // Extract all skills from selected agents for listing in the summary preview
  const getSelectedSkills = () => {
    const skillsSet = new Set<string>();
    detectedAgents
      .filter((a) => selectedAgentNames.includes(a.name))
      .forEach((a) => {
        a.skills?.forEach((s) => skillsSet.add(s.name));
      });
    return Array.from(skillsSet);
  };

  const activeSkills = getSelectedSkills();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200"
      id="github-install-modal-overlay"
    >
      <div
        className="flex h-full max-h-[85vh] w-full max-w-2xl flex-col rounded-2xl bg-white border border-border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        id="github-install-modal-content"
      >
        {/* Modal Header */}
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-[#F5F5F7] px-6">
          <div className="flex items-center gap-2">
            <GitPullRequest className="h-5 w-5 text-primary" />
            <h3 className="text-sm font-bold text-text-primary">
              📦 Instalar Agente(s) desde GitHub
            </h3>
          </div>
          <button
            onClick={onCancel}
            disabled={installing}
            className="rounded-lg p-1.5 text-text-secondary hover:bg-gray-200/60 transition-colors cursor-pointer"
            id="close-github-install-modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Loading State */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
              <h4 className="text-sm font-bold text-text-primary">
                Analizando repositorio GitHub...
              </h4>
              <p className="text-xs text-text-secondary mt-1 max-w-sm">
                Estamos leyendo la estructura, analizando configuraciones de agentes y mapeando habilidades sin clonar el repositorio.
              </p>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 space-y-3">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-red-800">
                    Ocurrió un error en el proceso
                  </h4>
                  <p className="text-xs text-red-700/95 mt-1 leading-relaxed font-semibold">
                    {error}
                  </p>
                </div>
              </div>
              <div className="flex justify-end pt-1">
                <button
                  onClick={onCancel}
                  className="rounded-lg bg-red-100 px-3.5 py-1.5 text-xs font-bold text-red-800 hover:bg-red-200 transition-colors cursor-pointer"
                >
                  Regresar al Chat
                </button>
              </div>
            </div>
          )}

          {/* Main Loaded Info */}
          {!loading && !error && repoInfo && (
            <div className="space-y-6">
              {/* Repo Summary Panel */}
              <div className="rounded-xl border border-border bg-[#F5F5F7] p-4.5 space-y-2.5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-bold text-primary uppercase tracking-widest">
                      Repositorio Detectado
                    </span>
                    <h4 className="text-sm font-extrabold text-text-primary mt-0.5">
                      {repoInfo.full_name}
                    </h4>
                  </div>
                  <a
                    href={repoInfo.html_url}
                    target="_blank"
                    referrerPolicy="no-referrer"
                    className="flex items-center gap-1 rounded-md bg-white border border-border px-2.5 py-1 text-[11px] font-bold text-text-secondary hover:text-primary transition-colors cursor-pointer"
                  >
                    Ver en GitHub
                  </a>
                </div>

                <p className="text-xs text-text-secondary leading-relaxed">
                  {repoInfo.description}
                </p>

                <div className="flex items-center gap-4 pt-1 text-[11px] font-bold text-text-secondary/80 font-mono">
                  <span className="flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                    {repoInfo.stars.toLocaleString()} stars
                  </span>
                  <span>•</span>
                  <span>{repoInfo.language}</span>
                  {repoInfo.license && (
                    <>
                      <span>•</span>
                      <span>Licencia: {repoInfo.license.name}</span>
                    </>
                  )}
                </div>
              </div>

              {/* No Agents Found State */}
              {detectedAgents.length === 0 && (
                <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-5 text-center space-y-3">
                  <AlertCircle className="h-8 w-8 text-amber-600 mx-auto" />
                  <h4 className="text-sm font-bold text-amber-800">
                    ⚠️ No encontré agentes configurables en este repositorio
                  </h4>
                  <p className="text-xs text-amber-700/90 leading-relaxed max-w-md mx-auto">
                    El escáner no localizó ningún archivo <code className="bg-white/80 px-1 py-0.5 rounded border border-amber-200 font-mono">agents.json</code>, <code className="bg-white/80 px-1 py-0.5 rounded border border-amber-200 font-mono">autoclaw.json</code> o archivos individuales <code className="bg-white/80 px-1 py-0.5 rounded border border-amber-200 font-mono">*.agent.json</code>.
                  </p>
                  <div className="pt-2 border-t border-amber-200/50 flex justify-center gap-3">
                    <button
                      onClick={onCancel}
                      className="rounded-lg border border-amber-300 bg-white px-4 py-1.5 text-xs font-bold text-amber-800 hover:bg-amber-100 transition-all cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={onCancel}
                      className="rounded-lg bg-amber-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-amber-700 transition-all cursor-pointer"
                    >
                      Agregar como Skill en su lugar
                    </button>
                  </div>
                </div>
              )}

              {/* Detected Agents List */}
              {detectedAgents.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-bold text-text-secondary uppercase tracking-wider flex items-center gap-2">
                      <Layers className="h-4 w-4 text-primary" />
                      Agentes Detectados ({detectedAgents.length})
                    </h5>
                    <span className="text-[10px] font-bold text-text-secondary bg-gray-100 px-2 py-0.5 rounded-full">
                      {selectedAgentNames.length} seleccionados
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-3 max-h-60 overflow-y-auto pr-1">
                    {detectedAgents.map((agent) => (
                      <GitHubAgentCard
                        key={agent.name}
                        agent={agent}
                        isSelected={selectedAgentNames.includes(agent.name)}
                        onToggle={() => handleToggleAgent(agent.name)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Aggregated Skills summary to install */}
              {detectedAgents.length > 0 && activeSkills.length > 0 && (
                <div className="space-y-2">
                  <h5 className="text-xs font-bold text-text-secondary uppercase tracking-wider flex items-center gap-2">
                    <Wrench className="h-4 w-4 text-primary" />
                    Skills a instalar ({activeSkills.length})
                  </h5>
                  <div className="flex flex-wrap gap-1.5 rounded-xl border border-dashed border-border p-3 bg-gray-50/50">
                    {activeSkills.map((skillName) => (
                      <span
                        key={skillName}
                        className="rounded bg-white border border-border px-2 py-0.5 font-mono text-[10px] font-bold text-text-secondary"
                      >
                        🏷️ {skillName}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Destination Project Selector */}
              {detectedAgents.length > 0 && (
                <div className="space-y-2 border-t border-border pt-4">
                  <h5 className="text-xs font-bold text-text-secondary uppercase tracking-wider flex items-center gap-2">
                    <Folder className="h-4 w-4 text-primary" />
                    Proyecto destino (opcional)
                  </h5>
                  <p className="text-[11px] text-text-secondary leading-normal">
                    Si seleccionas un proyecto, los agentes instalados serán asignados inmediatamente y se creará una sala de chat conjunta.
                  </p>
                  <select
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    className="w-full rounded-xl border border-border bg-white px-3.5 py-2 text-xs font-semibold text-text-primary focus:border-primary focus:ring-1 focus:ring-primary shadow-sm cursor-pointer"
                    id="project-selector-dropdown"
                  >
                    <option value="">-- No asignar a ningún proyecto --</option>
                    {projects.map((proj) => (
                      <option key={proj.id} value={proj.id}>
                        💼 {proj.name} — {proj.description?.slice(0, 50)}...
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        {!loading && !error && repoInfo && (
          <div className="flex h-16 shrink-0 items-center justify-between border-t border-border bg-[#F5F5F7] px-6">
            <button
              onClick={onCancel}
              disabled={installing}
              className="rounded-xl border border-border bg-white px-4 py-2 text-xs font-bold text-text-secondary hover:bg-gray-100 transition-colors disabled:opacity-50 cursor-pointer"
              id="cancel-installation-button"
            >
              Cancelar
            </button>

            {detectedAgents.length > 0 && (
              <button
                onClick={handleInstall}
                disabled={installing || selectedAgentNames.length === 0}
                className="flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2 text-xs font-bold text-white hover:bg-primary-dark shadow-sm transition-all disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
                id="confirm-installation-button"
              >
                {installing ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Instalando...</span>
                  </>
                ) : (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    <span>✅ Instalar ({selectedAgentNames.length})</span>
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
