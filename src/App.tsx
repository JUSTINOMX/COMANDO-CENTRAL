import React, { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar.js";
import Header from "./components/Header.js";
import Timeline from "./components/timeline/Timeline.js";
import ProjectWorkspace from "./components/project/ProjectWorkspace.js";
import AgentsView from "./components/AgentsView.js";
import SkillsView from "./components/SkillsView.js";
import MemoryView from "./components/MemoryView.js";
import SettingsView from "./components/SettingsView.js";
import CommanderPage from "./pages/CommanderPage.js";
import GitHubInstallerPage from "./pages/GitHubInstallerPage.js";
import AgentChatWindow from "./components/chat/AgentChatWindow.js";
import ConversationHistory from "./components/history/ConversationHistory.js";
import McpManagerPage from "./pages/McpManagerPage.js";
import { apiClient, Project, Agent, Skill, Memory, AgentNotification } from "./lib/supabase/client.js";

export default function App() {
  const [activeSection, setActiveSection] = useState<string>("timeline");
  const [activeProjectId, setActiveProjectId] = useState<string | undefined>(undefined);
  const [activeAgentName, setActiveAgentName] = useState<string | undefined>(undefined);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [refreshHistoryTrigger, setRefreshHistoryTrigger] = useState<number>(0);

  // Core collections
  const [projects, setProjects] = useState<Project[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [notifications, setNotifications] = useState<AgentNotification[]>([]);

  const [isLoading, setIsLoading] = useState(true);

  const fetchGlobalData = async () => {
    try {
      // Parallel fetches for speed & clean load
      const [projData, agentData, skillData, memData, notifData] = await Promise.all([
        apiClient.getProjects(),
        apiClient.getAgents(),
        apiClient.getSkills(),
        apiClient.getMemories(),
        apiClient.getNotifications()
      ]);

      setProjects(projData);
      setAgents(agentData);
      setSkills(skillData);
      setMemories(memData);
      setNotifications(notifData);
    } catch (err) {
      console.error("Error fetching system catalog data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial and periodic sync
  useEffect(() => {
    fetchGlobalData();
    const interval = setInterval(fetchGlobalData, 3000); // 3 seconds sync
    return () => clearInterval(interval);
  }, []);

  const handleNavigate = (section: string, projectId?: string, agentName?: string) => {
    setActiveSection(section);
    if (section === "project" && projectId) {
      setActiveProjectId(projectId);
    } else {
      setActiveProjectId(undefined);
    }

    if (section === "agent-chat" && agentName) {
      setActiveAgentName(agentName);
      setActiveConversationId(null);
    } else {
      setActiveAgentName(undefined);
    }
  };

  // Dynamic header title helper
  const getHeaderTitle = () => {
    if (activeSection === "commander") return "Commander Console";
    if (activeSection === "github-installer") return "GitHub Agent Installer";
    if (activeSection === "timeline") return "Universal Activity Timeline";
    if (activeSection === "project" && activeProjectId) {
      const activeProj = projects.find((p) => p.id === activeProjectId);
      return activeProj ? `Project Workspace: ${activeProj.name}` : "Project Workspace";
    }
    if (activeSection === "agents") return "AI Agents Catalog";
    if (activeSection === "skills") return "Ecosystem Automation Skills";
    if (activeSection === "memory") return "Ecosystem Memory Matrix";
    if (activeSection === "mcps") return "Gestión de MCP Servers";
    if (activeSection === "settings") return "System Settings";
    if (activeSection === "agent-chat" && activeAgentName) {
      const display = activeAgentName.charAt(0).toUpperCase() + activeAgentName.slice(1);
      return `Conversación Directa: ${display}`;
    }
    return "AutoClaw Command Center";
  };

  const hasUnreadCommander = notifications.some(
    (n) => !n.is_read && (n.sender?.toLowerCase() === "commander" || n.message?.toLowerCase().includes("commander"))
  );

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gray-50/50 text-gray-800 font-sans antialiased">
      {/* Sidebar Navigation */}
      <Sidebar
        activeSection={activeSection}
        onNavigate={handleNavigate}
        projects={projects}
        agents={agents}
        notifications={notifications}
        activeProjectId={activeProjectId}
        activeAgentName={activeAgentName}
        hasUnreadCommander={hasUnreadCommander}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header Bar */}
        <Header
          title={getHeaderTitle()}
          notifications={notifications}
          onNotificationRead={fetchGlobalData}
        />

        {/* Dynamic View Panel */}
        <main className={`flex-1 bg-gray-50/20 ${activeSection === "agent-chat" ? "overflow-hidden" : "overflow-y-auto"}`}>
          {isLoading && projects.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm font-medium text-gray-400 font-mono">
              <span className="animate-spin h-5 w-5 border-2 border-purple-500 border-t-transparent rounded-full mr-3" />
              Initializing AutoClaw Command Center...
            </div>
          ) : (
            <>
              {activeSection === "commander" && (
                <CommanderPage
                  projects={projects}
                  agents={agents}
                  onRefreshGlobalData={fetchGlobalData}
                />
              )}

              {activeSection === "github-installer" && (
                <GitHubInstallerPage
                  projects={projects}
                  agents={agents}
                  onRefreshGlobalData={fetchGlobalData}
                  onNavigateBack={() => handleNavigate("timeline")}
                />
              )}

              {activeSection === "timeline" && (
                <Timeline
                  projects={projects}
                  agents={agents}
                  onProjectClick={(projId) => handleNavigate("project", projId)}
                  onRefreshProjects={fetchGlobalData}
                />
              )}

              {activeSection === "project" && activeProjectId && (
                <ProjectWorkspace
                  projectId={activeProjectId}
                  onBack={() => handleNavigate("timeline")}
                />
              )}

              {activeSection === "agents" && (
                <AgentsView
                  agents={agents}
                  projects={projects}
                  onRefresh={fetchGlobalData}
                />
              )}

              {activeSection === "skills" && (
                <SkillsView
                  skills={skills}
                  agents={agents}
                  onRefresh={fetchGlobalData}
                />
              )}

              {activeSection === "memory" && (
                <MemoryView
                  memories={memories}
                  agents={agents}
                  onRefresh={fetchGlobalData}
                />
              )}

              {activeSection === "mcps" && (
                <McpManagerPage agents={agents} />
              )}

              {activeSection === "settings" && (
                <SettingsView />
              )}

              {activeSection === "agent-chat" && activeAgentName && (
                (() => {
                  const selectedAgent = agents.find(a => a.name.toLowerCase() === activeAgentName.toLowerCase()) || {
                    id: "placeholder",
                    name: activeAgentName,
                    display_name: activeAgentName.charAt(0).toUpperCase() + activeAgentName.slice(1),
                    role: "Asistente",
                    status: "vacant"
                  } as Agent;

                  return (
                    <div className="flex h-full w-full overflow-hidden">
                      <AgentChatWindow
                        agent={selectedAgent}
                        projects={projects}
                        defaultProjectId={activeProjectId}
                        activeConversationId={activeConversationId}
                        onNewMessageSent={() => setRefreshHistoryTrigger(p => p + 1)}
                      />
                      <ConversationHistory
                        agentName={activeAgentName}
                        activeConversationId={activeConversationId}
                        onSelectConversation={(convoId) => setActiveConversationId(convoId)}
                        refreshTrigger={refreshHistoryTrigger}
                      />
                    </div>
                  );
                })()
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
