import React from "react";
import { MessageSquare, Sparkles, Cpu, Paperclip, FileText, Bot, BrainCircuit } from "lucide-react";
import { ConversationMessage } from "../../lib/supabase/client.js";

interface CommanderMessageProps {
  message: ConversationMessage;
  key?: React.Key;
}

export default function CommanderMessage({ message }: CommanderMessageProps) {
  const isEdwin = message.sender === "Edwin";

  // Check if there is an uploaded file
  const uploadedFile = message.metadata?.uploaded_file;

  // Check if there are actions taken by Commander
  const actionsTaken = message.metadata?.actions_taken;

  // Helper to color agent names or highlights in text
  const formatMessageText = (text: string) => {
    if (!text) return "";
    
    // Split lines and render with soft styles
    return text.split("\n").map((line, idx) => {
      // Bold syntax
      let formattedLine = line;
      
      // Let's replace agent names with styled chips or colored text spans
      const agentRegex = /\b(STEVE|ELON|Edwin|NIKITTA|Commander|AutoClaw)\b/gi;
      const parts = formattedLine.split(agentRegex);
      
      const parsedLine = parts.map((part, pIdx) => {
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

      return (
        <p key={idx} className={`${line.trim() === "" ? "h-2" : "mb-1.5 last:mb-0"} leading-relaxed font-sans font-semibold text-xs`}>
          {parsedLine}
        </p>
      );
    });
  };

  return (
    <div
      className={`flex w-full gap-3 py-1 ${
        isEdwin ? "flex-row-reverse" : "flex-row"
      } animate-in fade-in duration-200`}
    >
      {/* Avatar */}
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-xs font-bold ${
          isEdwin
            ? "bg-[#FFEBEF] text-[#FF375F] border-[#FF375F]/20"
            : "bg-[#E8F2FF] text-primary border-primary/20"
        }`}
      >
        {isEdwin ? "ED" : <Cpu className="h-4.5 w-4.5 text-primary" />}
      </div>

      {/* Bubble */}
      <div className="flex flex-col gap-1 max-w-[85%] sm:max-w-[75%]">
        {/* Name and Time */}
        <div
          className={`flex items-center gap-2 text-[10px] font-bold text-text-secondary ${
            isEdwin ? "justify-end" : "justify-start"
          }`}
        >
          <span>{isEdwin ? "Edwin (Admin)" : "Commander Assistant"}</span>
          <span className="text-[9px] font-mono font-medium opacity-60">
            {message.created_at ? new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
          </span>
        </div>

        {/* Message Content */}
        <div
          className={`rounded-2xl px-4 py-3 shadow-sm text-xs ${
            isEdwin
              ? "bg-[#E8F2FF] text-text-primary border border-primary/10 rounded-tr-none"
              : "bg-white text-text-primary border border-border rounded-tl-none"
          }`}
        >
          {/* Main message text */}
          <div className="space-y-1">{formatMessageText(message.content)}</div>

          {/* Render uploaded file metadata if attached directly */}
          {uploadedFile && (
            <div className="mt-3 flex items-center gap-2 rounded-lg border border-border bg-[#F5F5F7] p-2">
              <FileText className="h-4 w-4 text-primary shrink-0" />
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] font-bold text-text-primary truncate max-w-[180px]">
                  {uploadedFile.fileName}
                </span>
                <span className="text-[8px] font-mono text-text-secondary uppercase">
                  Guardado en {uploadedFile.section}
                </span>
              </div>
              <a
                href={uploadedFile.url}
                target="_blank"
                referrerPolicy="no-referrer"
                className="ml-auto rounded bg-white px-2 py-0.5 text-[9px] font-bold border border-border hover:bg-gray-50 text-primary"
              >
                Ver
              </a>
            </div>
          )}

          {/* Render action badges/pills taken by Commander */}
          {actionsTaken && Array.isArray(actionsTaken) && actionsTaken.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5 border-t border-border/60 pt-2.5">
              {actionsTaken.map((action, aIdx) => (
                <span
                  key={aIdx}
                  className="inline-flex items-center gap-1 rounded bg-[#EAFDF0] text-[#248A3D] border border-[#30D158]/25 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide"
                >
                  <Sparkles className="h-3 w-3 shrink-0" />
                  <span>{action}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
