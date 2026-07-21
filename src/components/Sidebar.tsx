import React from "react";
import { 
  FolderGit2, 
  Cpu, 
  Wrench, 
  BrainCircuit, 
  Settings2, 
  MessageSquareCode, 
  Sparkles,
  AlertCircle
} from "lucide-react";
import { Project } from "../lib/supabase/client.js";

interface SidebarProps {
  activeSection: string;
  onNavigate: (section: string, projectId?: string) => void;
  projects: Project[];
  activeProjectId?: string;
  hasUnreadCommander?: boolean;
}

export default function Sidebar({ activeSection, onNavigate, projects, activeProjectId, hasUnreadCommander }: SidebarProps) {
  return (
    <aside className="flex h-screen w-64 flex-col border-r border-border bg-white px-4 py-6">
      {/* Brand logo & header */}
      <div className="mb-8 flex items-center gap-3 px-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-md shadow-primary/20">
          <Cpu className="h-5 w-5 text-white animate-pulse" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-bold tracking-tight text-primary leading-none">AutoClaw</span>
          <span className="text-[10px] font-semibold text-text-primary uppercase tracking-wider mt-0.5">Command Center</span>
        </div>
      </div>

      {/* Main navigation menu */}
      <div className="flex flex-1 flex-col gap-8 overflow-y-auto">
        {/* Core Sections */}
        <div className="flex flex-col gap-1">
          <span className="px-3 text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-2">Core</span>
          
          {/* Commander */}
          <button
            onClick={() => onNavigate("commander")}
            className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-all mb-1 ${
              activeSection === "commander"
                ? "bg-[#E8F2FF] text-primary font-semibold shadow-sm"
                : "text-text-secondary hover:bg-gray-50 hover:text-text-primary"
            }`}
            id="sidebar-commander-button"
          >
            <div className="flex items-center gap-3">
              <span className="text-base shrink-0">💬</span>
              <span>Commander</span>
            </div>
            {hasUnreadCommander && (
              <span className="h-2 w-2 rounded-full bg-[#FF375F] animate-pulse" />
            )}
          </button>

          {/* Universal Timeline */}
          <button
            onClick={() => onNavigate("timeline")}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
              activeSection === "timeline"
                ? "bg-[#E8F2FF] text-primary font-semibold shadow-sm"
                : "text-text-secondary hover:bg-gray-50 hover:text-text-primary"
            }`}
            id="sidebar-timeline-button"
          >
            <MessageSquareCode className="h-4.5 w-4.5" />
            <span>Universal Timeline</span>
          </button>
        </div>

        {/* Projects section */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between px-3 mb-2">
            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Active Projects</span>
            <span className="rounded bg-[#E8F2FF] px-1.5 py-0.5 text-[9px] font-bold text-primary">
              {projects.length}
            </span>
          </div>

          <div className="flex flex-col gap-0.5 max-h-48 overflow-y-auto pr-1">
            {projects.length === 0 ? (
              <p className="px-3 py-2 text-xs italic text-gray-400">No active projects.</p>
            ) : (
              projects.map((p) => {
                const isActive = activeSection === "project" && activeProjectId === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => onNavigate("project", p.id)}
                    className={`group flex items-center justify-between rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
                      isActive
                        ? "bg-[#E8F2FF] text-primary font-semibold"
                        : "text-text-secondary hover:bg-gray-50 hover:text-text-primary"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <FolderGit2 className={`h-4 w-4 shrink-0 ${isActive ? "text-primary" : "text-text-secondary"}`} />
                      <span className="truncate">{p.name}</span>
                    </div>
                    
                    <div className="flex items-center gap-1.5">
                      {p.message_count !== undefined && p.message_count > 0 && (
                        <span className="rounded bg-gray-100 px-1.5 py-0.2 text-[9px] text-text-secondary font-mono group-hover:bg-gray-200">
                          {p.message_count}
                        </span>
                      )}
                      {p.has_notifications && (
                        <span className="h-2 w-2 rounded-full bg-[#FF375F]" />
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Administration Section */}
        <div className="flex flex-col gap-1 mt-auto">
          <span className="px-3 text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-2">Ecosystem</span>

          {/* Agents */}
          <button
            onClick={() => onNavigate("agents")}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
              activeSection === "agents"
                ? "bg-[#E8F2FF] text-primary font-semibold"
                : "text-text-secondary hover:bg-gray-50 hover:text-text-primary"
            }`}
          >
            <Cpu className="h-4.5 w-4.5" />
            <span>AI Agents</span>
          </button>

          {/* Skills */}
          <button
            onClick={() => onNavigate("skills")}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
              activeSection === "skills"
                ? "bg-[#E8F2FF] text-primary font-semibold"
                : "text-text-secondary hover:bg-gray-50 hover:text-text-primary"
            }`}
          >
            <Wrench className="h-4.5 w-4.5" />
            <span>Skills Catalog</span>
          </button>

          {/* Memory Matrix */}
          <button
            onClick={() => onNavigate("memory")}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
              activeSection === "memory"
                ? "bg-[#E8F2FF] text-primary font-semibold"
                : "text-text-secondary hover:bg-gray-50 hover:text-text-primary"
            }`}
          >
            <BrainCircuit className="h-4.5 w-4.5" />
            <span>Memory Matrix</span>
          </button>

          {/* GitHub Installer */}
          <button
            onClick={() => onNavigate("github-installer")}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
              activeSection === "github-installer"
                ? "bg-[#E8F2FF] text-primary font-semibold"
                : "text-text-secondary hover:bg-gray-50 hover:text-text-primary"
            }`}
            id="sidebar-github-installer-button"
          >
            <span className="text-base shrink-0">📦</span>
            <span>GitHub Installer</span>
          </button>

          {/* System Settings */}
          <button
            onClick={() => onNavigate("settings")}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
              activeSection === "settings"
                ? "bg-[#E8F2FF] text-primary font-semibold"
                : "text-text-secondary hover:bg-gray-50 hover:text-text-primary"
            }`}
          >
            <Settings2 className="h-4.5 w-4.5" />
            <span>Settings</span>
          </button>
        </div>
      </div>

      {/* Powered by tag */}
      <div className="mt-8 flex items-center gap-2 rounded-xl bg-[#E8F2FF]/50 p-3 border border-primary/10">
        <Sparkles className="h-4 w-4 text-primary animate-pulse shrink-0" />
        <span className="text-[10px] text-primary-dark font-semibold">Commander Core Online</span>
      </div>
    </aside>
  );
}
