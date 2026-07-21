import React, { useRef, useEffect } from "react";
import { Loader2, ArrowUpCircle, MessageSquarePlus, MessageSquare } from "lucide-react";
import { ConversationMessage } from "../../lib/supabase/client.js";
import CommanderMessage from "./CommanderMessage.js";

interface CommanderChatProps {
  messages: ConversationMessage[];
  isLoading: boolean;
  isSending: boolean;
  onLoadMore: () => void;
  hasMore: boolean;
}

export default function CommanderChat({
  messages,
  isLoading,
  isSending,
  onLoadMore,
  hasMore,
}: CommanderChatProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isSending]);

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-background">
      {/* Scrollable Feed Container */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5"
        id="commander-chat-feed"
      >
        {/* Load More Messages Button */}
        {hasMore && messages.length > 0 && (
          <div className="flex justify-center pt-2 pb-4">
            <button
              onClick={onLoadMore}
              disabled={isLoading}
              className="flex items-center gap-1.5 rounded-full border border-border bg-white px-3.5 py-1.5 text-xs font-bold text-text-secondary hover:text-primary hover:border-primary/40 shadow-sm transition-all cursor-pointer"
              id="load-more-messages-button"
            >
              {isLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
              ) : (
                <ArrowUpCircle className="h-3.5 w-3.5 text-primary" />
              )}
              <span>Cargar mensajes anteriores</span>
            </button>
          </div>
        )}

        {/* Empty State */}
        {messages.length === 0 && !isLoading && (
          <div className="flex h-full flex-col items-center justify-center text-center p-8 text-text-secondary">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 text-primary mb-3 animate-pulse">
              <MessageSquare className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-sm font-bold text-text-primary">Inicia una conversación con Commander</h3>
            <p className="text-xs text-text-secondary/80 mt-1 max-w-sm leading-relaxed">
              Commander controla el ecosistema AutoClaw. Puedes pedirle que cree proyectos, asigne agentes (como STEVE o ELON), recuerde preferencias o administre la matriz de conocimiento.
            </p>
          </div>
        )}

        {/* Message Bubble List (rendered chronologically) */}
        {[...messages].reverse().map((msg) => (
          <CommanderMessage key={msg.id} message={msg} />
        ))}

        {/* Commander typing state */}
        {isSending && (
          <div className="flex gap-3 py-1 animate-in fade-in duration-200">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 border border-primary/20 text-primary">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            </div>
            <div className="flex flex-col gap-1 max-w-[75%]">
              <span className="text-[10px] font-bold text-text-secondary">Commander Assistant</span>
              <div className="rounded-2xl rounded-tl-none bg-white border border-border px-4 py-3 shadow-sm flex items-center gap-2">
                <span className="text-xs font-semibold text-text-secondary">Generando respuesta...</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
