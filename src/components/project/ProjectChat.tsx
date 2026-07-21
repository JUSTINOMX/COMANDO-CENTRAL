import React, { useState, useEffect, useRef } from "react";
import { Send, Users, Shield, Cpu, MessageSquare } from "lucide-react";
import { apiClient, ConversationMessage, ProjectAgent } from "../../lib/supabase/client.js";

interface ProjectChatProps {
  projectId: string;
  projectName: string;
  assignedAgents: ProjectAgent[];
}

export default function ProjectChat({ projectId, projectName, assignedAgents }: ProjectChatProps) {
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    try {
      const data = await apiClient.getProjectMessages(projectId);
      setMessages(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Poll for messages every 2.5 seconds to simulate realtime updates
  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 2500);
    return () => clearInterval(interval);
  }, [projectId]);

  // Scroll to bottom on new message
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isSending) return;

    const userMsg = input;
    setInput("");
    setIsSending(true);

    try {
      await apiClient.sendMessage({
        projectId,
        content: userMsg,
        sender: "Edwin" // main user role
      });
      fetchMessages();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex h-[450px] gap-4">
      {/* Messages area */}
      <div className="flex flex-1 flex-col rounded-xl border border-border bg-white shadow-sm overflow-hidden">
        {/* Messages list */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
          {isLoading ? (
            <div className="flex h-full items-center justify-center text-xs font-semibold text-text-secondary font-mono">
              Loading chat messages...
            </div>
          ) : messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center text-text-secondary">
              <MessageSquare className="h-8 w-8 text-border mb-2" />
              <p className="text-xs font-bold">Workspace initiated.</p>
              <p className="text-[10px] text-text-secondary/60 mt-0.5">Send a message to instruct your assigned agents.</p>
            </div>
          ) : (
            messages.map((m) => {
              const isSystem = m.message_type === "system" || m.sender?.toLowerCase() === "system";
              const isEdwin = m.sender?.toLowerCase() === "edwin";
              const isCommander = m.sender?.toLowerCase() === "commander";
              const isSteve = m.sender?.toLowerCase() === "steve";
              const isElon = m.sender?.toLowerCase() === "elon";
              const isNikitta = m.sender?.toLowerCase() === "nikitta";

              let bubbleClass = "bg-background text-[#1D1D1F]";
              let senderTextClass = "text-text-secondary";

              if (isEdwin) {
                bubbleClass = "bg-[#FF375F] text-white font-semibold";
                senderTextClass = "text-[#FF375F]";
              } else if (isCommander) {
                bubbleClass = "bg-[#E8F2FF] border border-[#0A84FF]/10 border-l-4 border-l-[#0A84FF] text-[#1D1D1F]";
                senderTextClass = "text-primary";
              } else if (isSteve) {
                bubbleClass = "bg-[#EAFDF0] border border-[#30D158]/10 border-l-4 border-l-[#30D158] text-[#1D1D1F]";
                senderTextClass = "text-secondary-dark";
              } else if (isElon) {
                bubbleClass = "bg-[#FFF5E6] border border-[#FF9F0A]/10 border-l-4 border-l-[#FF9F0A] text-[#1D1D1F]";
                senderTextClass = "text-[#D07200]";
              } else if (isNikitta) {
                bubbleClass = "bg-[#F0EFFF] border border-[#5E5CE6]/10 border-l-4 border-l-[#5E5CE6] text-[#1D1D1F]";
                senderTextClass = "text-[#5E5CE6]";
              } else if (isSystem) {
                bubbleClass = "bg-background border border-border text-text-secondary italic";
                senderTextClass = "text-system-message";
              }

              return (
                <div key={m.id} className={`flex flex-col gap-1 max-w-[85%] ${isEdwin ? "self-end" : "self-start"}`}>
                  <div className={`flex items-center gap-1.5 rounded-2xl px-3.5 py-2 text-xs leading-relaxed shadow-sm ${bubbleClass}`}>
                    <div className="flex flex-col">
                      {!isEdwin && (
                        <span className={`text-[10px] font-bold uppercase mb-1 ${senderTextClass}`}>
                          {m.sender}
                        </span>
                      )}
                      <span className="whitespace-pre-wrap">{m.content}</span>
                    </div>
                  </div>
                  <span className="text-[9px] text-text-secondary/60 font-mono self-start px-2">
                    {m.created_at ? new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                  </span>
                </div>
              );
            })
          )}
          <div ref={scrollRef} />
        </div>

        {/* Input box */}
        <form onSubmit={handleSubmit} className="border-t border-border bg-background p-3 flex items-center gap-2">
          <input
            type="text"
            placeholder="Type your message, instruct or mention agents (e.g. @STEVE)..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isSending}
            className="flex-1 rounded-lg border border-border bg-white px-3 py-2 text-xs outline-none transition-all placeholder:text-text-secondary/60 focus:border-primary focus:ring-4 focus:ring-primary/15"
          />
          <button
            type="submit"
            disabled={isSending || !input.trim()}
            className="rounded-lg bg-primary px-3.5 py-2 text-xs font-bold text-white shadow-sm shadow-primary/20 hover:bg-primary-dark transition-colors disabled:bg-gray-200"
          >
            Send
          </button>
        </form>
      </div>

      {/* Participants sidebar list */}
      <div className="hidden w-56 flex-col rounded-xl border border-border bg-white p-4 shadow-sm md:flex">
        <div className="flex items-center gap-2 text-xs font-bold text-text-secondary uppercase tracking-wider border-b border-border pb-2 mb-3">
          <Users className="h-4 w-4 text-text-secondary/60" />
          <span>Participants</span>
        </div>

        <div className="flex flex-col gap-3 overflow-y-auto">
          {/* Main User (Edwin) */}
          <div className="flex items-center gap-2.5 rounded-lg bg-[#FFEBEF] p-2 border border-[#FF375F]/15">
            <span className="flex h-6.5 w-6.5 items-center justify-center rounded-md bg-[#FF375F] text-[10px] font-bold text-white uppercase">
              👤
            </span>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-[#CC1F43] leading-tight">Edwin</span>
              <span className="text-[9px] text-[#FF375F] font-bold uppercase tracking-wider">Project Owner</span>
            </div>
          </div>

          {/* Assigned Agents */}
          {assignedAgents.length === 0 ? (
            <p className="text-[11px] italic text-text-secondary py-1">No agents assigned.</p>
          ) : (
            assignedAgents.map((pa) => {
              const display = pa.agent?.display_name || "Agent";
              const sRole = pa.role || "collaborator";
              const sStatus = pa.agent?.status || "active";
              
              let agentAvatarBg = "bg-primary";
              if (display.toLowerCase().includes("steve")) agentAvatarBg = "bg-[#30D158]";
              else if (display.toLowerCase().includes("elon")) agentAvatarBg = "bg-[#FF9F0A]";
              else if (display.toLowerCase().includes("nikitta")) agentAvatarBg = "bg-[#5E5CE6]";

              return (
                <div key={pa.id} className="flex items-center gap-2.5 rounded-lg bg-background p-2 border border-border">
                  <span className={`flex h-6.5 w-6.5 items-center justify-center rounded-md text-white ${agentAvatarBg}`}>
                    <Cpu className="h-3.5 w-3.5" />
                  </span>
                  <div className="flex flex-col truncate">
                    <span className="text-xs font-bold text-text-primary leading-tight truncate">{display}</span>
                    <span className="text-[9px] text-text-secondary font-semibold truncate capitalize">{sRole}</span>
                  </div>
                  <span className={`ml-auto h-1.5 w-1.5 rounded-full ${
                    sStatus === "active" ? "bg-[#30D158]" : "bg-border"
                  }`} />
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
