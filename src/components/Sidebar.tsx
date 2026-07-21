import React from "react";
import { 
  FolderGit2, 
  Cpu, 
  Wrench, 
  BrainCircuit, 
  Settings2, 
  MessageSquareCode, 
  Sparkles,
  Plug,
  ChevronDown,
  ChevronRight
} from "lucide-react";
import { Project, Agent, AgentNotification } from "../lib/supabase/client.js";
import { AGENT_AREAS } from "../config/agentAreas.js";
import SidebarAgentArea from "./sidebar/SidebarAgentArea.js";
import { AgentArea, AgentSlot } from "../types/agents.js";

interface SidebarProps {
  activeSection: string;
  onNavigate: (section: string, projectId?: string, agentName?: string) => void;
  projects: Project[];
  agents: Agent[];
  notifications: AgentNotification[];
  activeProjectId?: string;
  activeAgentName?: string;
  hasUnreadCommander?: boolean;
}

export default function Sidebar({ 
  activeSection, 
  onNavigate, 
  projects, 
  agents = [], 
  notifications = [],
  activeProjectId, 
  activeAgentName,
  hasUnreadCommander 
}: SidebarProps) {

  const [hasMcpError, setHasMcpError] = React.useState(false);
  const [isProjectsOpen, setIsProjectsOpen] = React.useState(true);
  const [isAgentsOpen, setIsAgentsOpen] = React.useState(true);

  React.useEffect(() => {
    fetch("/api/mcps")
      .then(res => res.json())
      .then((data: any[]) => {
        setHasMcpError(data.some(s => s.status === "error"));
      })
      .catch(() => {});
  }, [activeSection]);

  // Dynamic merger: Classify agents from database into pre-defined areas
  // This ensures that any new agents installed from GitHub or registered (like hermes)
  // appear in the correct area in real-time.
  const getMergedAreas = (): AgentArea[] => {
    return AGENT_AREAS.map((area) => {
      // Create a list of agents for this area
      const areaAgents: AgentSlot[] = [];

      // Add static/placeholder agents, but update their status from DB if found
      area.agents.forEach((staticAgent) => {
        const dbAgent = agents.find(
          (a) => a.name.toLowerCase() === staticAgent.name.toLowerCase()
        );

        const unreadCount = notifications.filter(
          (n) => !n.is_read && 
                 (n.target_agent_id === dbAgent?.id || 
                  n.source_agent_id === dbAgent?.id ||
                  n.title?.toLowerCase().includes(staticAgent.name.toLowerCase()) ||
                  n.content?.toLowerCase().includes(staticAgent.name.toLowerCase()))
        ).length;

        if (dbAgent) {
          areaAgents.push({
            name: staticAgent.name,
            displayName: dbAgent.display_name || staticAgent.displayName,
            role: dbAgent.role || staticAgent.role,
            status: "active",
            source: (dbAgent.identity?.type || staticAgent.source || "native") as any,
            unreadCount: unreadCount > 0 ? unreadCount : undefined,
          });
        } else {
          // Keep static agent as is
          areaAgents.push({
            ...staticAgent,
            unreadCount: undefined,
          });
        }
      });

      // Also append any database agents that belong to this area but aren't in the static list
      // For example:
      // - Herme/Exec or Dev agents go to DESARROLLO
      // - Research/Analyst agents go to INVESTIGACIÓN
      // - Marketing agents go to MARKETING
      agents.forEach((dbAgent) => {
        const alreadyAdded = areaAgents.some(
          (a) => a.name.toLowerCase() === dbAgent.name.toLowerCase()
        );
        if (alreadyAdded) return;

        // Determine destination area id
        let targetAreaId = "desarrollo"; // default fallback
        const roleLower = (dbAgent.role || "").toLowerCase();
        const nameLower = dbAgent.name.toLowerCase();

        if (roleLower.includes("estrateg") || roleLower.includes("alma") || roleLower.includes("ceo") || nameLower.includes("neuron") || nameLower.includes("commander")) {
          targetAreaId = "estrategico";
        } else if (roleLower.includes("investig") || roleLower.includes("anal") || nameLower.includes("elon")) {
          targetAreaId = "investigacion";
        } else if (roleLower.includes("market") || roleLower.includes("ventas") || nameLower.includes("nikitta") || nameLower.includes("luisa")) {
          targetAreaId = "marketing";
        } else if (roleLower.includes("vision") || roleLower.includes("disen") || roleLower.includes("design")) {
          targetAreaId = "vision";
        } else if (roleLower.includes("manager") || roleLower.includes("admin") || roleLower.includes("coord") || nameLower.includes("donna") || nameLower.includes("justino") || roleLower.includes("juridic") || roleLower.includes("secretar") || roleLower.includes("contab") || roleLower.includes("finanz")) {
          targetAreaId = "management";
        }

        if (area.id === targetAreaId) {
          const unreadCount = notifications.filter(
            (n) => !n.is_read && 
                   (n.target_agent_id === dbAgent.id || 
                    n.source_agent_id === dbAgent.id ||
                    n.title?.toLowerCase().includes(dbAgent.name) ||
                    n.content?.toLowerCase().includes(dbAgent.name))
          ).length;

          // Replace first vacant spot if available, or just push it
          const firstVacantIndex = areaAgents.findIndex((a) => a.status === "vacant");
          const newAgentSlot: AgentSlot = {
            name: dbAgent.name,
            displayName: dbAgent.display_name || dbAgent.name,
            role: dbAgent.role || "agente",
            status: "active",
            source: (dbAgent.identity?.type || "native") as any,
            unreadCount: unreadCount > 0 ? unreadCount : undefined,
          };

          if (firstVacantIndex !== -1) {
            areaAgents[firstVacantIndex] = newAgentSlot;
          } else {
            areaAgents.push(newAgentSlot);
          }
        }
      });

      return {
        ...area,
        agents: areaAgents,
      };
    });
  };

  const mergedAreas = getMergedAreas();

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-border bg-white px-4 py-6" id="sidebar-container">
      {/* Brand logo & header */}
      <div className="mb-6 flex items-center gap-3 px-2 shrink-0">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-md shadow-primary/20">
          <Cpu className="h-5 w-5 text-white animate-pulse" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-bold tracking-tight text-primary leading-none">AutoClaw</span>
          <span className="text-[10px] font-semibold text-text-primary uppercase tracking-wider mt-0.5">Command Center</span>
        </div>
      </div>

      {/* Main navigation menu */}
      <div className="flex flex-1 flex-col gap-6 overflow-y-auto pr-1">
        {/* Núcleo Estratégico */}
        <div className="flex flex-col gap-1 shrink-0">
          <span className="px-3 text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-1">Núcleo Estratégico</span>

          {/* Neuron Connect */}
          <button
            onClick={() => onNavigate("neuron")}
            className={`flex items-center gap-3 rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
              activeSection === "neuron"
                ? "bg-indigo-50 text-indigo-700 font-semibold shadow-sm border-l-2 border-indigo-500"
                : "text-text-secondary hover:bg-gray-50 hover:text-text-primary"
            }`}
            id="sidebar-neuron-button"
          >
            <span className="text-base shrink-0">🧠</span>
            <span>Neuron Connect</span>
          </button>

          {/* Commander (existente, mantener igual) */}
          <button
            onClick={() => onNavigate("commander")}
            className={`flex items-center justify-between rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
              activeSection === "commander"
                ? "bg-[#E8F2FF] text-primary font-semibold shadow-sm border-l-2 border-primary"
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

          {/* STEVE */}
          <button
            onClick={() => onNavigate("agent-chat", undefined, "steve")}
            className={`flex items-center gap-3 rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
              activeSection === "agent-chat" && activeAgentName === "steve"
                ? "bg-amber-50 text-amber-700 font-semibold shadow-sm border-l-2 border-amber-400"
                : "text-text-secondary hover:bg-gray-50 hover:text-text-primary"
            }`}
            id="sidebar-steve-button"
          >
            <span className="text-base shrink-0">🛠️</span>
            <span>STEVE</span>
          </button>

          {/* 🏛️ Consejo */}
          <button
            onClick={() => onNavigate("council")}
            className={`flex items-center gap-3 rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
              activeSection === "council"
                ? "bg-slate-100 text-slate-900 font-semibold shadow-sm border-l-2 border-slate-500"
                : "text-text-secondary hover:bg-gray-50 hover:text-text-primary"
            }`}
            id="sidebar-council-button"
          >
            <span className="text-base shrink-0">🏛️</span>
            <span>Sala del Consejo</span>
          </button>
        </div>

        {/* Projects section */}
        <div className="flex flex-col gap-1 shrink-0">
          <button 
            onClick={() => setIsProjectsOpen(!isProjectsOpen)}
            className="flex items-center justify-between px-3 mb-1 w-full text-left hover:text-text-primary focus:outline-none"
          >
            <div className="flex items-center gap-1.5">
              {isProjectsOpen ? (
                <ChevronDown className="h-3.5 w-3.5 text-text-secondary shrink-0" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5 text-text-secondary shrink-0" />
              )}
              <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Active Projects</span>
            </div>
            <span className="rounded bg-[#E8F2FF] px-1.5 py-0.5 text-[9px] font-bold text-primary">
              {projects.length}
            </span>
          </button>

          {isProjectsOpen && (
            <div className="flex flex-col gap-0.5 max-h-32 overflow-y-auto pr-1">
              {projects.length === 0 ? (
                <p className="px-3 py-2 text-xs italic text-gray-400">No active projects.</p>
              ) : (
                projects.map((p) => {
                  const isActive = activeSection === "project" && activeProjectId === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => onNavigate("project", p.id)}
                      className={`group flex items-center justify-between rounded-lg px-3 py-1 text-sm font-medium transition-all ${
                        isActive
                          ? "bg-[#E8F2FF] text-primary font-semibold border-l-2 border-primary"
                          : "text-text-secondary hover:bg-gray-50 hover:text-text-primary"
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <FolderGit2 className={`h-3.5 w-3.5 shrink-0 ${isActive ? "text-primary" : "text-text-secondary"}`} />
                        <span className="truncate text-xs">{p.name}</span>
                      </div>
                      
                      <div className="flex items-center gap-1.5">
                        {p.message_count !== undefined && p.message_count > 0 && (
                          <span className="rounded bg-gray-100 px-1 py-0.2 text-[9px] text-text-secondary font-mono group-hover:bg-gray-200">
                            {p.message_count}
                          </span>
                        )}
                        {p.has_notifications && (
                          <span className="h-1.5 w-1.5 rounded-full bg-[#FF375F]" />
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* AGENTS SECTION */}
        <div className={`flex flex-col gap-1 ${isAgentsOpen ? "flex-1 min-h-[180px]" : "shrink-0"} overflow-y-auto pr-1`}>
          <button
            onClick={() => setIsAgentsOpen(!isAgentsOpen)}
            className="flex items-center gap-1.5 px-3 mb-1 text-left hover:text-text-primary focus:outline-none w-full"
          >
            {isAgentsOpen ? (
              <ChevronDown className="h-3.5 w-3.5 text-text-secondary shrink-0" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-text-secondary shrink-0" />
            )}
            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">
              AGENTES
            </span>
          </button>
          
          {isAgentsOpen && (
            <div className="flex flex-col">
              {mergedAreas.map((area) => (
                <SidebarAgentArea
                  key={area.id}
                  area={area}
                  activeAgentName={activeSection === "agent-chat" ? activeAgentName : undefined}
                  onSelectAgent={(name) => onNavigate("agent-chat", undefined, name)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Configuration Section */}
        <div className="flex flex-col gap-1 shrink-0 mt-auto pt-4 border-t border-gray-100">
          <span className="px-3 text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-1">
            CONFIGURACIÓN
          </span>

          {/* AI Agents Catalog */}
          <button
            onClick={() => onNavigate("agents")}
            className={`flex items-center gap-3 rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
              activeSection === "agents"
                ? "bg-[#E8F2FF] text-primary font-semibold border-l-2 border-primary"
                : "text-text-secondary hover:bg-gray-50 hover:text-text-primary"
            }`}
          >
            <Cpu className="h-4 w-4" />
            <span className="text-xs">Agents Dashboard</span>
          </button>

          {/* Skills */}
          <button
            onClick={() => onNavigate("skills")}
            className={`flex items-center gap-3 rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
              activeSection === "skills"
                ? "bg-[#E8F2FF] text-primary font-semibold border-l-2 border-primary"
                : "text-text-secondary hover:bg-gray-50 hover:text-text-primary"
            }`}
          >
            <Wrench className="h-4 w-4" />
            <span className="text-xs">Skills Catalog</span>
          </button>

          {/* Memory Matrix */}
          <button
            onClick={() => onNavigate("memory")}
            className={`flex items-center gap-3 rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
              activeSection === "memory"
                ? "bg-[#E8F2FF] text-primary font-semibold border-l-2 border-primary"
                : "text-text-secondary hover:bg-gray-50 hover:text-text-primary"
            }`}
          >
            <BrainCircuit className="h-4 w-4" />
            <span className="text-xs">Memory Matrix</span>
          </button>

          {/* MCP Servers */}
          <button
            onClick={() => onNavigate("mcps")}
            className={`flex items-center justify-between rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
              activeSection === "mcps"
                ? "bg-[#E8F2FF] text-primary font-semibold border-l-2 border-primary"
                : "text-text-secondary hover:bg-gray-50 hover:text-text-primary"
            }`}
          >
            <div className="flex items-center gap-3">
              <Plug className={`h-4 w-4 ${activeSection === "mcps" ? "text-primary" : "text-text-secondary"}`} />
              <span className="text-xs">🔌 MCPs</span>
            </div>
            {hasMcpError && (
              <span className="h-2 w-2 rounded-full bg-[#FF375F] animate-pulse" />
            )}
          </button>

          {/* GitHub Installer */}
          <button
            onClick={() => onNavigate("github-installer")}
            className={`flex items-center gap-3 rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
              activeSection === "github-installer"
                ? "bg-[#E8F2FF] text-primary font-semibold border-l-2 border-primary"
                : "text-text-secondary hover:bg-gray-50 hover:text-text-primary"
            }`}
            id="sidebar-github-installer-button"
          >
            <span className="text-sm shrink-0">📦</span>
            <span className="text-xs">GitHub Installer</span>
          </button>

          {/* System Settings */}
          <button
            onClick={() => onNavigate("settings")}
            className={`flex items-center gap-3 rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
              activeSection === "settings"
                ? "bg-[#E8F2FF] text-primary font-semibold border-l-2 border-primary"
                : "text-text-secondary hover:bg-gray-50 hover:text-text-primary"
            }`}
          >
            <Settings2 className="h-4 w-4" />
            <span className="text-xs">Settings</span>
          </button>
        </div>
      </div>

      {/* Powered by tag */}
      <div className="mt-4 flex items-center gap-2 rounded-xl bg-[#E8F2FF]/50 p-2 border border-primary/10 shrink-0">
        <Sparkles className="h-3.5 w-3.5 text-primary animate-pulse shrink-0" />
        <span className="text-[10px] text-primary-dark font-semibold">Commander Core Online</span>
      </div>
    </aside>
  );
}
