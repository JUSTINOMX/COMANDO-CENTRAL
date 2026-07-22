import React, { useState, useEffect } from "react";
import { 
  FolderGit2, 
  MessageSquare, 
  FileText, 
  Database, 
  BarChart3, 
  CheckSquare, 
  Megaphone,
  ArrowLeft,
  Tag,
  Cpu
} from "lucide-react";
import { apiClient, Project, ProjectAgent, ProjectAntecedente, ProjectExtraction, ProjectReport, ProjectConclusion, ProjectMarketing, Conversation } from "../../lib/supabase/client.js";
import ProjectChat from "./ProjectChat.js";
import Antecedentes from "./Antecedentes.js";
import Extracciones from "./Extracciones.js";
import Reportes from "./Reportes.js";
import Conclusiones from "./Conclusiones.js";
import Marketing from "./Marketing.js";

interface ProjectWorkspaceProps {
  projectId: string;
  onBack: () => void;
}

export default function ProjectWorkspace({ projectId, onBack }: ProjectWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<"chat" | "antecedentes" | "extracciones" | "reportes" | "conclusiones" | "marketing">("chat");
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<{
    project: Project;
    agents: ProjectAgent[];
    antecedentes: ProjectAntecedente[];
    extracciones: ProjectExtraction[];
    reportes: ProjectReport[];
    conclusiones: ProjectConclusion[];
    marketing: ProjectMarketing[];
    conversation?: Conversation;
  } | null>(null);

  const fetchProjectDetails = async () => {
    try {
      const details = await apiClient.getProjectDetails(projectId);
      setData(details);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    fetchProjectDetails();
  }, [projectId]);

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center py-24 text-sm font-semibold text-text-secondary font-mono">
        <span className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full mr-3" />
        Synchronizing Project Workspace data...
      </div>
    );
  }

  if (!data || !data.project) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-12 text-center text-text-secondary">
        <FolderGit2 className="h-10 w-10 text-border mb-3 animate-bounce" />
        <p className="text-sm font-bold text-text-primary">Project Workspace Error.</p>
        <p className="text-xs mt-1">Failed to gather active project context from the server database.</p>
        <button
          onClick={onBack}
          className="mt-4 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-primary-dark"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const { project, agents, antecedentes, extracciones, reportes, conclusiones, marketing } = data;

  return (
    <div className="flex flex-col gap-4 sm:gap-6 p-3 sm:p-6">
      {/* Back button & header section */}
      <div className="flex flex-col gap-4 border-b border-border pb-5 md:flex-row md:items-start md:justify-between">
        <div className="flex flex-col gap-2">
          {/* Back button */}
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 self-start text-xs font-bold text-text-secondary hover:text-primary transition-colors uppercase tracking-wider"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Dashboard</span>
          </button>

          {/* Project Identity */}
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#E8F2FF] border border-primary/20 shadow-sm">
              <FolderGit2 className="h-6 w-6 text-primary" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-text-primary leading-none">{project.name}</h2>
                <span className="rounded bg-[#EAFDF0] border border-[#30D158]/20 px-2 py-0.5 text-[10px] font-bold text-secondary-dark capitalize">
                  {project.status || "active"}
                </span>
              </div>
              <p className="text-xs text-text-secondary mt-1 max-w-2xl leading-relaxed">{project.description || "No project description specified."}</p>
            </div>
          </div>

          {/* Tags */}
          {project.tags && project.tags.length > 0 && (
            <div className="flex items-center gap-1.5 mt-1.5 pl-14">
              <Tag className="h-3 w-3 text-text-secondary/60" />
              <div className="flex gap-1">
                {project.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded bg-background px-2 py-0.5 text-[9px] font-bold text-text-secondary border border-border uppercase tracking-wider"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Quick details / Agent count */}
        <div className="flex items-center gap-2 rounded-xl bg-white p-3 border border-border md:self-center shadow-sm">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#E8F2FF] shrink-0">
            <Cpu className="h-4.5 w-4.5 text-primary" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-text-primary leading-none">{agents.length} AI Agents</span>
            <span className="text-[9px] text-text-secondary mt-0.5">Assigned to project execution</span>
          </div>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="flex items-center gap-1 border-b border-border overflow-x-auto whitespace-nowrap pb-1 no-scrollbar">
        <button
          onClick={() => setActiveTab("chat")}
          className={`flex items-center gap-2 border-b-2 px-4 py-2 text-xs font-bold transition-all uppercase tracking-wider cursor-pointer ${
            activeTab === "chat"
              ? "border-primary text-primary"
              : "border-transparent text-text-secondary hover:text-text-primary"
          }`}
        >
          <MessageSquare className="h-4 w-4" />
          <span>Chat ({agents.length + 1})</span>
        </button>

        <button
          onClick={() => setActiveTab("antecedentes")}
          className={`flex items-center gap-2 border-b-2 px-4 py-2 text-xs font-bold transition-all uppercase tracking-wider cursor-pointer ${
            activeTab === "antecedentes"
              ? "border-primary text-primary"
              : "border-transparent text-text-secondary hover:text-text-primary"
          }`}
        >
          <FileText className="h-4 w-4" />
          <span>Antecedentes ({antecedentes.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("extracciones")}
          className={`flex items-center gap-2 border-b-2 px-4 py-2 text-xs font-bold transition-all uppercase tracking-wider cursor-pointer ${
            activeTab === "extracciones"
              ? "border-primary text-primary"
              : "border-transparent text-text-secondary hover:text-text-primary"
          }`}
        >
          <Database className="h-4 w-4" />
          <span>Extracciones ({extracciones.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("reportes")}
          className={`flex items-center gap-2 border-b-2 px-4 py-2 text-xs font-bold transition-all uppercase tracking-wider cursor-pointer ${
            activeTab === "reportes"
              ? "border-primary text-primary"
              : "border-transparent text-text-secondary hover:text-text-primary"
          }`}
        >
          <BarChart3 className="h-4 w-4" />
          <span>Reportes ({reportes.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("conclusiones")}
          className={`flex items-center gap-2 border-b-2 px-4 py-2 text-xs font-bold transition-all uppercase tracking-wider cursor-pointer ${
            activeTab === "conclusiones"
              ? "border-primary text-primary"
              : "border-transparent text-text-secondary hover:text-text-primary"
          }`}
        >
          <CheckSquare className="h-4 w-4" />
          <span>Conclusiones ({conclusiones.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("marketing")}
          className={`flex items-center gap-2 border-b-2 px-4 py-2 text-xs font-bold transition-all uppercase tracking-wider cursor-pointer ${
            activeTab === "marketing"
              ? "border-primary text-primary"
              : "border-transparent text-text-secondary hover:text-text-primary"
          }`}
        >
          <Megaphone className="h-4 w-4" />
          <span>Marketing ({marketing.length})</span>
        </button>
      </div>

      {/* Tab panel body content */}
      <div className="flex-1">
        {activeTab === "chat" && (
          <ProjectChat
            projectId={project.id}
            projectName={project.name}
            assignedAgents={agents}
          />
        )}
        {activeTab === "antecedentes" && (
          <Antecedentes
            projectId={project.id}
            antecedentes={antecedentes}
            onRefresh={fetchProjectDetails}
          />
        )}
        {activeTab === "extracciones" && (
          <Extracciones
            extracciones={extracciones}
          />
        )}
        {activeTab === "reportes" && (
          <Reportes
            projectId={project.id}
            reportes={reportes}
            onRefresh={fetchProjectDetails}
          />
        )}
        {activeTab === "conclusiones" && (
          <Conclusiones
            conclusiones={conclusiones}
          />
        )}
        {activeTab === "marketing" && (
          <Marketing
            marketing={marketing}
          />
        )}
      </div>
    </div>
  );
}
