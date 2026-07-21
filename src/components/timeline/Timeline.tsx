import React, { useState, useEffect, useRef } from "react";
import { 
  Send, 
  Sparkles, 
  MessageSquare, 
  Trash2, 
  Cpu, 
  HelpCircle, 
  ArrowDownCircle, 
  FolderDown,
  ChevronDown
} from "lucide-react";
import { apiClient, ConversationMessage, Project, Agent } from "../../lib/supabase/client.js";
import Filters from "./Filters.js";
import MessageCard from "./MessageCard.js";

interface TimelineProps {
  projects: Project[];
  agents: Agent[];
  onProjectClick: (projectId: string) => void;
  onRefreshProjects: () => void;
}

export default function Timeline({ projects, agents, onProjectClick, onRefreshProjects }: TimelineProps) {
  // Filters state
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [selectedAgentIds, setSelectedAgentIds] = useState<string[]>([]);
  const [searchText, setSearchText] = useState("");

  // Timeline messages state
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Commander state
  const [commanderInput, setCommanderInput] = useState("");
  const [commanderChat, setCommanderChat] = useState<{ sender: "user" | "commander"; text: string }[]>([
    {
      sender: "commander",
      text: "👋 ¡Hola Edwin! Soy **Commander**, el asistente de control de AutoClaw. ¿En qué puedo ayudarte hoy?\n\nPrueba a escribirme comandos como:\n- *'Crea un proyecto llamado NEURON con tags IA. Van a participar STEVE y ELON.'*\n- *'Dile a STEVE que revise los antecedentes de OPTIKR.'*\n- *'Registra un nuevo agente llamado ANALYST con rol data-analyst.'*\n- *'¿Qué skills tiene STEVE?'*"
    }
  ]);
  const [isCommanderLoading, setIsCommanderLoading] = useState(false);

  // Manual message inputs
  const [manualProjectId, setManualProjectId] = useState("");
  const [manualContent, setManualContent] = useState("");
  const [isSendingManual, setIsSendingManual] = useState(false);

  const commanderBottomRef = useRef<HTMLDivElement>(null);

  // Fetch timeline messages
  const fetchTimeline = async () => {
    try {
      const data = await apiClient.getTimeline({
        projectId: selectedProjectId || undefined,
        agentIds: selectedAgentIds.length > 0 ? selectedAgentIds : undefined,
        search: searchText || undefined
      });
      setMessages(data);
    } catch (err) {
      console.error("Error fetching timeline:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Poll for messages every 2.5 seconds for realtime experience
  useEffect(() => {
    fetchTimeline();
    const interval = setInterval(fetchTimeline, 2500);
    return () => clearInterval(interval);
  }, [selectedProjectId, selectedAgentIds, searchText]);

  // Sync manual default project
  useEffect(() => {
    if (projects.length > 0 && !manualProjectId) {
      setManualProjectId(projects[0].id);
    }
  }, [projects]);

  // Scroll commander chat to bottom
  useEffect(() => {
    commanderBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [commanderChat]);

  const handleClearFilters = () => {
    setSelectedProjectId("");
    setSelectedAgentIds([]);
    setSearchText("");
  };

  // Submit Commander prompt
  const handleCommanderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commanderInput.trim()) return;

    const userMsg = commanderInput;
    setCommanderInput("");
    setCommanderChat(prev => [...prev, { sender: "user", text: userMsg }]);
    setIsCommanderLoading(true);

    try {
      const response = await apiClient.sendCommanderPrompt(userMsg);
      setCommanderChat(prev => [...prev, { sender: "commander", text: response.text }]);
      
      // Refresh timeline & projects in case of state updates (like project creation)
      fetchTimeline();
      onRefreshProjects();
    } catch (err: any) {
      console.error(err);
      setCommanderChat(prev => [
        ...prev,
        { 
          sender: "commander", 
          text: `⚠️ **Error de conexión con el modelo:** ${err.message || "Por favor, verifica que tu GEMINI_API_KEY esté configurada correctamente."}` 
        }
      ]);
    } finally {
      setIsCommanderLoading(false);
    }
  };

  // Submit manual chat message to a specific project
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualContent.trim() || !manualProjectId) return;

    setIsSendingManual(true);
    try {
      await apiClient.sendMessage({
        projectId: manualProjectId,
        content: manualContent,
        sender: "Edwin" // main user role
      });
      setManualContent("");
      fetchTimeline();
      onRefreshProjects();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSendingManual(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* SECTION A: COMMANDER CHAT ASSISTANT */}
      <section className="flex flex-col rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
        {/* Header with blue gradient */}
        <div className="bg-gradient-to-r from-[#0A84FF] to-[#0066CC] px-5 py-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm border border-white/10">
              <Sparkles className="h-5 w-5 text-white animate-pulse" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold leading-none">Commander AI Assistant</span>
              <span className="text-[10px] font-semibold text-white/80 uppercase tracking-widest mt-0.5">AutoClaw Orchestrator</span>
            </div>
          </div>
          <span className="rounded-full bg-white/20 border border-white/10 px-2.5 py-0.5 text-xs font-semibold text-white">
            ● Active
          </span>
        </div>

        <div className="p-5 flex flex-col gap-3.5">
          {/* Commander Messages Panel */}
          <div className="flex h-64 flex-col gap-3.5 overflow-y-auto rounded-xl border border-border bg-background p-4">
            {commanderChat.map((msg, idx) => (
              <div
                key={idx}
                className={`flex max-w-[85%] flex-col rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
                  msg.sender === "user"
                    ? "self-end bg-primary text-white font-medium"
                    : "self-start bg-white border border-border border-l-4 border-l-[#0A84FF] text-[#1D1D1F]"
                }`}
              >
                <div className="whitespace-pre-wrap font-sans">
                  {msg.text}
                </div>
              </div>
            ))}
            {isCommanderLoading && (
              <div className="self-start flex items-center gap-2 rounded-2xl bg-[#E8F2FF] border border-[#0A84FF]/10 border-l-4 border-l-[#0A84FF] px-4 py-2.5 shadow-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-[#0A84FF] animate-bounce" />
                <span className="h-1.5 w-1.5 rounded-full bg-[#0A84FF] animate-bounce delay-150" />
                <span className="h-1.5 w-1.5 rounded-full bg-[#0A84FF] animate-bounce delay-300" />
                <span className="text-xs font-semibold text-[#0A84FF] font-mono ml-1">Commander is thinking...</span>
              </div>
            )}
            <div ref={commanderBottomRef} />
          </div>

          {/* Commander Prompt Input */}
          <form onSubmit={handleCommanderSubmit} className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Escribe un comando para Commander (ej. 'Crea un proyecto llamado NEURON con STEVE')"
              value={commanderInput}
              onChange={(e) => setCommanderInput(e.target.value)}
              disabled={isCommanderLoading}
              className="flex-1 rounded-xl border border-border bg-white px-4 py-2.5 text-sm outline-none transition-all placeholder:text-text-secondary focus:border-primary focus:ring-4 focus:ring-primary/15 disabled:bg-background"
            />
            <button
              type="submit"
              disabled={isCommanderLoading || !commanderInput.trim()}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-white shadow-md shadow-primary/20 hover:bg-primary-dark transition-all disabled:bg-gray-200 disabled:shadow-none"
            >
              <Send className="h-4.5 w-4.5" />
            </button>
          </form>
        </div>
      </section>

      {/* SECTION B: UNIVERSAL TIMELINE FEED */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-border pb-2">
          <div className="flex items-center gap-2.5">
            <MessageSquare className="h-5 w-5 text-text-secondary" />
            <h2 className="text-base font-bold text-text-primary">Universal Activity Timeline</h2>
          </div>
          <span className="text-xs font-semibold text-text-secondary">Showing last 50 entries</span>
        </div>

        {/* Timeline Filters */}
        <Filters
          projects={projects}
          agents={agents}
          selectedProjectId={selectedProjectId}
          setSelectedProjectId={setSelectedProjectId}
          selectedAgentIds={selectedAgentIds}
          setSelectedAgentIds={setSelectedAgentIds}
          searchText={searchText}
          setSearchText={setSearchText}
          onClearFilters={handleClearFilters}
        />

        {/* Messages List */}
        <div className="flex flex-col gap-3.5 min-h-64">
          {isLoading ? (
            <div className="flex items-center justify-center py-20 text-sm font-semibold text-text-secondary font-mono">
              <span className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full mr-3" />
              Loading timeline entries...
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-white py-16 text-center text-text-secondary shadow-sm">
              <FolderDown className="h-10 w-10 text-border mb-3" />
              <p className="text-sm font-semibold">No activity logged.</p>
              <p className="text-xs text-text-secondary/80 max-w-sm mt-1">Try clearing filters or sending a message below to start logging communication.</p>
            </div>
          ) : (
            messages.map((m) => (
              <MessageCard
                key={m.id}
                message={m}
                onProjectClick={onProjectClick}
              />
            ))
          )}
        </div>
      </section>

      {/* SECTION C: MANUAL QUICK MESSAGE BOX */}
      <section className="rounded-2xl border border-border bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[#FF375F]" />
          <h3 className="text-sm font-bold text-text-primary">Post Message as Edwin (Main Operator)</h3>
        </div>

        <form onSubmit={handleManualSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            {/* Select Destination Project */}
            <div className="relative w-full sm:w-64">
              <select
                value={manualProjectId}
                onChange={(e) => setManualProjectId(e.target.value)}
                className="w-full appearance-none rounded-xl border border-border bg-background px-4 py-2.5 pr-10 text-xs font-semibold text-text-primary outline-none transition-all focus:border-primary focus:bg-white"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    Destination: {p.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute top-3.5 right-3 h-3.5 w-3.5 pointer-events-none text-text-secondary" />
            </div>
            <span className="text-[10px] text-text-secondary font-semibold">
              Mention agents with **@STEVE** or **@ELON** to trigger notifications!
            </span>
          </div>

          <div className="flex items-end gap-2.5">
            <textarea
              placeholder="Escribe un mensaje de instrucciones o actualización..."
              value={manualContent}
              onChange={(e) => setManualContent(e.target.value)}
              className="flex-1 rounded-xl border border-border bg-white px-4 py-2.5 text-sm outline-none transition-all placeholder:text-text-secondary focus:border-primary focus:ring-4 focus:ring-primary/15 resize-none h-11 focus:h-20"
            />
            <button
              type="submit"
              disabled={isSendingManual || !manualContent.trim() || !manualProjectId}
              className="flex h-11 shrink-0 items-center justify-center rounded-xl bg-[#30D158] text-white px-5 font-bold text-sm shadow-md shadow-[#30D158]/20 hover:bg-[#248A3D] transition-all disabled:bg-gray-100 disabled:shadow-none"
            >
              {isSendingManual ? "Posting..." : "Send"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
