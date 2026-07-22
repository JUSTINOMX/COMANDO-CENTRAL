import React, { useState, useEffect } from "react";
import { ConversationMessage, Project, Agent } from "../lib/supabase/client.js";
import { commanderApi } from "../api/commanderApi.js";
import CommanderHeader from "../components/commander/CommanderHeader.js";
import CommanderChat from "../components/commander/CommanderChat.js";
import CommanderInput from "../components/commander/CommanderInput.js";
import CommanderMemory from "../components/commander/CommanderMemory.js";
import GitHubInstallModal from "../components/github/GitHubInstallModal.js";

interface CommanderPageProps {
  projects: Project[];
  agents: Agent[];
  onRefreshGlobalData: () => void;
}

export default function CommanderPage({
  projects,
  agents,
  onRefreshGlobalData,
}: CommanderPageProps) {
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isMemoryOpen, setIsMemoryOpen] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth >= 768;
    }
    return false;
  });
  const [refreshMemoriesCounter, setRefreshMemoriesCounter] = useState(0);
  
  // GitHub installation states
  const [githubUrlToInstall, setGithubUrlToInstall] = useState<string | null>(null);
  const [pendingGithubMsg, setPendingGithubMsg] = useState<{
    content: string;
    file: File | null;
    projectId?: string;
    section?: string;
  } | null>(null);

  const LIMIT = 30;

  const loadMessages = async (isInitial = false) => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      const currentOffset = isInitial ? 0 : offset;
      const data = await commanderApi.getMessages(LIMIT, currentOffset);

      if (isInitial) {
        setMessages(data);
        setOffset(data.length);
        setHasMore(data.length >= LIMIT);
      } else {
        setMessages((prev) => [...prev, ...data]);
        setOffset((prev) => prev + data.length);
        setHasMore(data.length >= LIMIT);
      }
    } catch (err) {
      console.error("Error loading commander messages:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMessages(true);
  }, []);

  const handleSendMessage = async (
    content: string,
    file: File | null,
    projectId?: string,
    section?: string
  ) => {
    // Intercept GitHub URLs for custom installer flow
    const gitHubUrlRegex = /(https?:\/\/)?(www\.)?github\.com\/([a-zA-Z0-9_-]+)\/([a-zA-Z0-9_-]+)/i;
    const match = content.match(gitHubUrlRegex);
    if (match) {
      const fullUrl = match[0];
      setGithubUrlToInstall(fullUrl);
      setPendingGithubMsg({ content, file, projectId, section });
      return;
    }

    if (isSending) return;
    setIsSending(true);

    try {
      // Send message to Express API
      const result = await commanderApi.sendMessage(
        content,
        file || undefined,
        projectId,
        section
      );

      // Prepend user message and commander reply to our current state
      setMessages((prev) => [result.commanderResponse, result.userMessage, ...prev]);
      setOffset((prev) => prev + 2);

      // If a memory was auto-saved, trigger a refresh on our Memory side drawer
      if (result.memorySaved) {
        setRefreshMemoriesCounter((prev) => prev + 1);
        onRefreshGlobalData(); // sync global memories count
      }

      // Refresh other lists (since commander might have created a project or modified things)
      onRefreshGlobalData();
    } catch (err: any) {
      console.error("Error sending message to Commander:", err);
      // Fallback message to prevent frozen chat UI
      const fallbackUser: ConversationMessage = {
        id: `temp-err-u-${Date.now()}`,
        conversation_id: "error",
        sender: "Edwin",
        content: file ? `📎 [Adjunto] ${content}` : content,
        created_at: new Date().toISOString(),
        message_type: "text",
      };
      const fallbackComm: ConversationMessage = {
        id: `temp-err-c-${Date.now()}`,
        conversation_id: "error",
        sender: "Commander",
        content: `Lo siento Edwin, ocurrió un error al procesar el comando: ${err.message || err}. Asegúrate de tener configurada la API KEY de Gemini en Settings.`,
        created_at: new Date().toISOString(),
        message_type: "text",
      };
      setMessages((prev) => [fallbackComm, fallbackUser, ...prev]);
    } finally {
      setIsSending(false);
    }
  };

  const handleCancelInstallation = () => {
    if (pendingGithubMsg) {
      // Create local conversation logs for the canceled event
      const userMsg: ConversationMessage = {
        id: `cancel-u-${Date.now()}`,
        conversation_id: "commander_chat",
        sender: "Edwin",
        content: pendingGithubMsg.content,
        created_at: new Date().toISOString(),
        message_type: "text"
      };
      const commMsg: ConversationMessage = {
        id: `cancel-c-${Date.now()}`,
        conversation_id: "commander_chat",
        sender: "Commander",
        content: "❌ Instalación cancelada. El repositorio de GitHub no fue importado.",
        created_at: new Date().toISOString(),
        message_type: "text"
      };
      setMessages((prev) => [commMsg, userMsg, ...prev]);
    }
    setGithubUrlToInstall(null);
    setPendingGithubMsg(null);
  };

  const handleInstallComplete = (res: any) => {
    setGithubUrlToInstall(null);
    setPendingGithubMsg(null);
    
    // Refresh global states
    onRefreshGlobalData();
    
    // Reload message list after a brief delay to fetch newly registered logs from DB
    setTimeout(() => {
      loadMessages(true);
    }, 800);
  };

  const handleForgetMemory = async (memoryId: string) => {
    try {
      await commanderApi.manageMemory({
        action: "forget",
        memoryId,
      });
      setRefreshMemoriesCounter((prev) => prev + 1);
      onRefreshGlobalData(); // sync global memories count
    } catch (err) {
      console.error("Error forgetting memory:", err);
    }
  };

  return (
    <div className="relative flex h-full w-full overflow-hidden bg-background">
      {/* Primary chat layout */}
      <div className="flex flex-1 flex-col overflow-hidden w-full">
        {/* Header Console Banner */}
        <CommanderHeader
          isMemoryOpen={isMemoryOpen}
          setIsMemoryOpen={setIsMemoryOpen}
          memoriesCount={refreshMemoriesCounter}
        />

        {/* Scrollable message container */}
        <CommanderChat
          messages={messages}
          isLoading={isLoading}
          isSending={isSending}
          onLoadMore={() => loadMessages(false)}
          hasMore={hasMore}
        />

        {/* User command entry bar */}
        <CommanderInput
          projects={projects}
          onSendMessage={handleSendMessage}
          isSending={isSending}
        />
      </div>

      {/* Slide-out / Collapsible Memory Side Panel with mobile overlay */}
      {isMemoryOpen && (
        <>
          <div 
            onClick={() => setIsMemoryOpen(false)} 
            className="fixed inset-0 z-30 bg-black/40 backdrop-blur-xs md:hidden"
            aria-hidden="true"
          />
          <div className="fixed inset-y-0 right-0 z-40 w-80 max-w-[85vw] bg-white shadow-2xl md:relative md:z-0 md:w-80 md:shadow-none h-full border-l border-border">
            <CommanderMemory
              onForgetMemory={handleForgetMemory}
              agents={agents}
              refreshTrigger={refreshMemoriesCounter}
            />
          </div>
        </>
      )}

      {/* GitHub Installation Modal Overlay */}
      {githubUrlToInstall && (
        <GitHubInstallModal
          url={githubUrlToInstall}
          projects={projects}
          onClose={() => setGithubUrlToInstall(null)}
          onCancel={handleCancelInstallation}
          onInstallComplete={handleInstallComplete}
        />
      )}
    </div>
  );
}
