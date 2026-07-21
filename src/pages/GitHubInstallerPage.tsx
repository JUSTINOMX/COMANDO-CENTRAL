import React, { useState, useEffect } from "react";
import { GitPullRequest, Calendar, Trash2, Globe, ArrowLeft, Bot, Wrench, Shield, CheckCircle } from "lucide-react";
import { Project, Agent } from "../lib/supabase/client.js";
import GitHubScanner from "../components/github/GitHubScanner.js";

interface GitHubInstallerPageProps {
  projects: Project[];
  agents: Agent[];
  onRefreshGlobalData: () => void;
  onNavigateBack?: () => void;
}

export default function GitHubInstallerPage({
  projects,
  agents,
  onRefreshGlobalData,
  onNavigateBack,
}: GitHubInstallerPageProps) {
  // Filter for agents installed from GitHub
  const gitHubAgents = agents.filter(
    (a) => a.identity && typeof a.identity === "object" && a.identity.source === "github"
  );

  const handleDeleteAgent = async (agentId: string) => {
    if (!confirm("¿Estás seguro de que deseas desinstalar este agente del ecosistema?")) return;

    try {
      // Direct call to delete via Express
      const res = await fetch(`/api/agents/${agentId}`, {
        method: "DELETE",
      });

      // Let's check fallback if agent deletion fails or needs a different route.
      // Wait, in commander.ts we have a delete agent handler, let's see if we can use it or a simple DELETE /api/agents/:id.
      // Let's check what routes are registered for agents delete in server.ts or write a simple route.
      // Wait, in server.ts do we have a DELETE /api/agents/:id route? Let's verify or write it!
      // But we can also make sure we have a DELETE endpoint in server.ts just in case. Let's look at server.ts to be sure!
      const data = await res.json();
      if (res.ok) {
        onRefreshGlobalData();
        alert("Agente desinstalado con éxito.");
      } else {
        throw new Error(data.error || "Error al desinstalar");
      }
    } catch (err: any) {
      console.error("Failed to delete agent:", err);
      // Fallback: If no direct endpoint, we can inform the user how to ask Commander
      alert(`No se pudo desinstalar directamente: ${err.message}. Puedes pedirle a Commander: "Commander, elimina el agente ${agents.find(a => a.id === agentId)?.name}"`);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-background p-6 space-y-6" id="github-installer-page">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onNavigateBack && (
            <button
              onClick={onNavigateBack}
              className="rounded-lg p-1.5 text-text-secondary hover:bg-gray-100 transition-colors cursor-pointer"
              title="Volver"
            >
              <ArrowLeft className="h-4.5 w-4.5" />
            </button>
          )}
          <div>
            <h1 className="text-lg font-bold text-text-primary flex items-center gap-2">
              <GitPullRequest className="h-5 w-5 text-primary" />
              Gestor de Instalaciones GitHub
            </h1>
            <p className="text-xs text-text-secondary mt-0.5">
              Administra, desinstala y sincroniza agentes de IA y habilidades integradas desde repositorios Git remotos.
            </p>
          </div>
        </div>
      </div>

      {/* Embedded Scanner Widget */}
      <GitHubScanner projects={projects} onRefresh={onRefreshGlobalData} />

      {/* Installed Agents List */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xs font-bold text-text-secondary uppercase tracking-wider">
            Agentes Instalados desde Git ({gitHubAgents.length})
          </h2>
          <p className="text-[11px] text-text-secondary mt-0.5">
            Estos agentes han sido importados y están listos para interactuar en tus proyectos de AutoClaw.
          </p>
        </div>

        {gitHubAgents.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-white p-8 text-center text-text-secondary">
            <Bot className="h-10 w-10 text-text-secondary/40 mx-auto mb-3" />
            <h4 className="text-xs font-bold text-text-primary">No hay agentes de Git instalados</h4>
            <p className="text-[11px] text-text-secondary mt-1 max-w-xs mx-auto">
              Ingresa una URL de GitHub arriba o dile a Commander: <br />
              <code className="bg-gray-100 px-1 py-0.5 rounded text-primary text-[10px] font-mono select-all mt-1 inline-block">
                Commander, instala https://github.com/garrytan/gstack
              </code>
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {gitHubAgents.map((agent) => (
              <div
                key={agent.id}
                className="rounded-2xl border border-border bg-white p-5 space-y-4 shadow-sm hover:shadow-md transition-shadow"
                id={`installed-git-agent-${agent.name}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary">
                      <Bot className="h-5.5 w-5.5" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-text-primary flex items-center gap-1.5">
                        <span>{agent.display_name}</span>
                        <span className="rounded bg-primary/10 px-1.5 py-0.2 text-[9px] font-bold text-primary uppercase font-mono">
                          {agent.role}
                        </span>
                      </h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Globe className="h-3 w-3 text-text-secondary/60" />
                        <span className="font-mono text-[9.5px] font-semibold text-text-secondary leading-none">
                          {agent.identity?.repository || "GitHub"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteAgent(agent.id)}
                    className="rounded-lg p-1.5 text-text-secondary hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                    title="Desinstalar Agente"
                  >
                    <Trash2 className="h-4.5 w-4.5" />
                  </button>
                </div>

                <p className="text-[11.5px] text-text-secondary leading-relaxed">
                  {agent.soul?.slice(0, 140)}...
                </p>

                <div className="flex items-center justify-between border-t border-border pt-3.5 text-[10px] font-bold text-text-secondary font-mono">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-text-secondary/60" />
                    <span>
                      Instalado:{" "}
                      {agent.identity?.installDate
                        ? new Date(agent.identity.installDate).toLocaleDateString()
                        : "Recientemente"}
                    </span>
                  </div>

                  <span className="rounded-full bg-[#30D158]/10 border border-[#30D158]/20 px-2 py-0.5 text-[#30D158] uppercase">
                    ● Activo
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
