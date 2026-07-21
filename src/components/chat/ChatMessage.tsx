import React from "react";
import { Cpu, FileText, Sparkles } from "lucide-react";
import { ConversationMessage } from "../../lib/supabase/client.js";

interface ChatMessageProps {
  message: ConversationMessage;
  agentDisplayName: string;
  key?: string | number;
}

export default function ChatMessage({ message, agentDisplayName }: ChatMessageProps) {
  const isEdwin = message.sender === "Edwin" || message.sender === "commander";

  // Helper to color names or highlights in text and format basic markdown/lines
  const formatMessageText = (text: string) => {
    if (!text) return "";
    
    return text.split("\n").map((line, idx) => {
      // Bold inline syntax like **text**
      const boldParts = line.split(/(\*\*.*?\*\*)/g);
      const parsedBold = boldParts.map((part, bIdx) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={bIdx} className="font-bold text-text-primary">
              {part.substring(2, part.length - 2)}
            </strong>
          );
        }
        return part;
      });

      // Highlight key agent names
      const agentRegex = /\b(STEVE|ELON|Edwin|NIKITTA|Commander|AutoClaw)\b/gi;
      const formattedLine = parsedBold.map((item, keyIdx) => {
        if (typeof item !== "string") return item;
        const parts = item.split(agentRegex);
        return parts.map((part, pIdx) => {
          const lowerPart = part.toLowerCase();
          if (lowerPart === "steve") {
            return <span key={pIdx} className="text-[#30D158] font-bold">STEVE</span>;
          }
          if (lowerPart === "elon") {
            return <span key={pIdx} className="text-[#FF9F0A] font-bold">ELON</span>;
          }
          if (lowerPart === "edwin") {
            return <span key={pIdx} className="text-[#FF375F] font-bold">Edwin</span>;
          }
          if (lowerPart === "nikitta") {
            return <span key={pIdx} className="text-[#5E5CE6] font-bold">NIKITTA</span>;
          }
          if (lowerPart === "commander") {
            return <span key={pIdx} className="text-[#0A84FF] font-bold">Commander</span>;
          }
          return part;
        });
      });

      // Detect list lines
      const isListItem = line.trim().startsWith("-") || line.trim().startsWith("*");

      return (
        <p
          key={idx}
          className={`${
            line.trim() === "" ? "h-2" : "mb-1.5 last:mb-0"
          } leading-relaxed font-sans font-semibold text-xs ${
            isListItem ? "pl-3 list-item list-disc marker:text-primary/70" : ""
          }`}
        >
          {isListItem ? formattedLine : formattedLine}
        </p>
      );
    });
  };

  return (
    <div
      className={`flex w-full gap-3 py-1 ${
        isEdwin ? "flex-row-reverse animate-in slide-in-from-right-2 duration-150" : "flex-row animate-in slide-in-from-left-2 duration-150"
      }`}
    >
      {/* Avatar */}
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-xs font-bold shadow-sm ${
          isEdwin
            ? "bg-[#FFEBEF] text-[#FF375F] border-[#FF375F]/20"
            : "bg-[#E8F2FF] text-primary border-primary/20"
        }`}
      >
        {isEdwin ? "ED" : <Cpu className="h-4 w-4 text-primary" />}
      </div>

      {/* Message Container */}
      <div className="flex flex-col gap-1 max-w-[85%] sm:max-w-[75%]">
        {/* Name and Time */}
        <div
          className={`flex items-center gap-2 text-[10px] font-bold text-text-secondary ${
            isEdwin ? "justify-end" : "justify-start"
          }`}
        >
          <span>{isEdwin ? "Edwin (Admin)" : agentDisplayName}</span>
          <span className="text-[9px] font-mono font-medium opacity-60">
            {message.created_at
              ? new Date(message.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
              : ""}
          </span>
        </div>

        {/* Bubble */}
        <div
          className={`rounded-2xl px-4 py-3 shadow-sm text-xs border ${
            isEdwin
              ? "bg-[#E8F2FF] text-text-primary border-primary/10 rounded-tr-none"
              : "bg-white text-text-primary border-border rounded-tl-none"
          }`}
        >
          <div className="space-y-1">{formatMessageText(message.content)}</div>
        </div>
      </div>
    </div>
  );
}
