import React, { useEffect, useRef } from "react";
import { MessageSquare, Calendar } from "lucide-react";
import { ConversationMessage } from "../../lib/supabase/client.js";
import ChatMessage from "./ChatMessage.js";

interface AgentChatMessagesProps {
  messages: ConversationMessage[];
  agentDisplayName: string;
  loading?: boolean;
}

export default function AgentChatMessages({ messages, agentDisplayName, loading }: AgentChatMessagesProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  if (messages.length === 0 && !loading) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-8 text-center bg-[#F9F9FB]">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/5 text-primary mb-4 border border-primary/10">
          <MessageSquare className="h-6 w-6" />
        </div>
        <h3 className="text-sm font-bold text-text-primary mb-1">
          Comienza la conversación con {agentDisplayName}
        </h3>
        <p className="text-xs text-text-secondary max-w-xs font-medium">
          Envía un mensaje o comparte archivos del proyecto para que el agente comience a trabajar en ellos.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-[#F9F9FB] px-6 py-6 space-y-4">
      {/* Messages */}
      {messages.map((m) => (
        <ChatMessage
          key={m.id}
          message={m}
          agentDisplayName={agentDisplayName}
        />
      ))}

      {/* Loading Answer Bubble */}
      {loading && (
        <div className="flex gap-3 py-1 animate-pulse">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-[#E8F2FF] text-primary text-xs font-bold">
            ...
          </div>
          <div className="flex flex-col gap-1 max-w-[80%]">
            <span className="text-[10px] font-bold text-text-secondary">{agentDisplayName}</span>
            <div className="rounded-2xl rounded-tl-none border border-border bg-white px-4 py-3 text-xs text-text-secondary font-semibold">
              <div className="flex gap-1.5 items-center">
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce delay-75"></span>
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce delay-150"></span>
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce delay-220"></span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
