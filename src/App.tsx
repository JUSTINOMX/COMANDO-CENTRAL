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
import { apiClient, Project, Agent, Skill, Memory, AgentNotification } from "./lib/supabase/client.js";

export default function App() {
  const [activeSection, setActiveSection] = useState<string>("timeline");
  const [activeProjectId, setActiveProjectId] = useState<string | undefined>(undefined);

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

  const handleNavigate = (section: string, projectId?: string) => {
    setActiveSection(section);
    if (section === "project" && projectId) {
      setActiveProjectId(projectId);
    } else {
      setActiveProjectId(undefined);
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
    if (activeSection === "settings") return "System Settings";
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
        activeProjectId={activeProjectId}
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
        <main className="flex-1 overflow-y-auto bg-gray-50/20">
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

              {activeSection === "settings" && (
                <SettingsView />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
