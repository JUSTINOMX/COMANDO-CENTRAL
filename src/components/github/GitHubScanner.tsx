import React, { useState } from "react";
import { GitBranch, GitPullRequest, Search, Star, Loader2, Bot, AlertCircle, Sparkles } from "lucide-react";
import { Project } from "../../lib/supabase/client.js";
import GitHubInstallModal from "./GitHubInstallModal.js";

interface GitHubScannerProps {
  projects: Project[];
  onRefresh: () => void;
}

export default function GitHubScanner({ projects, onRefresh }: GitHubScannerProps) {
  const [repoUrl, setRepoUrl] = useState("");
  const [activeUrlToInstall, setActiveUrlToInstall] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleScan = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!repoUrl.trim()) {
      setError("Por favor ingresa una URL de GitHub válida");
      return;
    }

    // Clean or validate format briefly
    let cleanUrl = repoUrl.trim();
    if (!cleanUrl.includes("github.com") && cleanUrl.split("/").length !== 2) {
      setError("Por favor ingresa una URL como 'https://github.com/user/repo' o 'user/repo'");
      return;
    }

    setActiveUrlToInstall(cleanUrl);
  };

  const handleInstallSuccess = (res: any) => {
    setActiveUrlToInstall(null);
    setRepoUrl("");
    onRefresh(); // Trigger parent refresh to update agents lists and timeline
    alert(`¡Éxito! Se instalaron ${res.installedCount} agentes y ${res.skillsCount} skills de forma exitosa.`);
  };

  return (
    <div className="rounded-2xl border border-border bg-white p-6 shadow-sm space-y-4" id="github-scanner-utility">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary">
          <GitPullRequest className="h-5.5 w-5.5" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-text-primary">Instalador de Agentes desde GitHub</h3>
          <p className="text-xs text-text-secondary mt-0.5">
            Analiza repositorios públicos en búsqueda de agentes y habilidades de AutoClaw para instalarlos en tu entorno local.
          </p>
        </div>
      </div>

      <form onSubmit={handleScan} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary/60" />
          <input
            type="text"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            placeholder="Ej: https://github.com/garrytan/gstack o garrytan/gstack"
            className="w-full rounded-xl border border-border bg-[#F5F5F7] pl-10 pr-4 py-2.5 text-xs font-semibold text-text-primary focus:border-primary focus:ring-1 focus:ring-primary focus:bg-white shadow-inner transition-all"
            id="github-scan-input"
          />
        </div>
        <button
          type="submit"
          className="rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-white hover:bg-primary-dark shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
          id="github-scan-submit-button"
        >
          <span>Escanear</span>
        </button>
      </form>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-100 p-3 text-red-700 text-xs font-semibold">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Recommended Repositories List */}
      <div className="pt-2">
        <h4 className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-2.5">
          Repositorios Sugeridos
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <button
            onClick={() => {
              setRepoUrl("https://github.com/garrytan/gstack");
              setActiveUrlToInstall("https://github.com/garrytan/gstack");
            }}
            className="flex items-start text-left gap-3 rounded-xl border border-border bg-white p-3 hover:border-primary/40 hover:bg-primary/5 transition-all group cursor-pointer"
          >
            <Bot className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-xs text-text-primary group-hover:text-primary transition-colors block">
                garrytan/gstack
              </span>
              <span className="text-[10px] text-text-secondary leading-relaxed block mt-0.5">
                Ecosistema estándar con agentes de DevOps, reviewers de código y analistas de stacks.
              </span>
            </div>
          </button>

          <button
            onClick={() => {
              setRepoUrl("https://github.com/autoclaw/awesome-agents");
              setActiveUrlToInstall("https://github.com/autoclaw/awesome-agents");
            }}
            className="flex items-start text-left gap-3 rounded-xl border border-border bg-white p-3 hover:border-primary/40 hover:bg-primary/5 transition-all group cursor-pointer"
          >
            <Bot className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-xs text-text-primary group-hover:text-primary transition-colors block">
                autoclaw/awesome-agents
              </span>
              <span className="text-[10px] text-text-secondary leading-relaxed block mt-0.5">
                Agentes de investigación avanzada, analistas de mercado y traductores automáticos.
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* GitHub Install Modal Overlay */}
      {activeUrlToInstall && (
        <GitHubInstallModal
          url={activeUrlToInstall}
          projects={projects}
          onClose={() => setActiveUrlToInstall(null)}
          onCancel={() => {
            setActiveUrlToInstall(null);
            console.log("Instalación cancelada");
          }}
          onInstallComplete={handleInstallSuccess}
        />
      )}
    </div>
  );
}
