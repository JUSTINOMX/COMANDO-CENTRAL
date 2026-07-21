import React from "react";
import { User, Cpu, Terminal, ShieldAlert, Sparkles, MessageSquare } from "lucide-react";
import { ConversationMessage } from "../../lib/supabase/client.js";

interface MessageCardProps {
  message: ConversationMessage;
  onProjectClick?: (projectId: string) => void;
}

export const MessageCard: React.FC<MessageCardProps> = ({ message, onProjectClick }) => {
  const { sender, content, message_type, created_at, project_name, project_id } = message;

  // Find sender styling (colors, avatars, borders)
  const getSenderStyle = () => {
    const s = sender ? sender.toLowerCase() : "";
    if (s === "edwin") {
      return {
        border: "border-l-[3px] border-l-[#FF375F]",
        text: "text-[#FF375F]",
        avatarBg: "bg-[#FF375F]",
        icon: <User className="h-4 w-4 text-white" />,
        badge: "bg-[#FFEBEF] text-[#CC1F43]"
      };
    } else if (s === "steve") {
      return {
        border: "border-l-[3px] border-l-[#30D158]",
        text: "text-[#248A3D]",
        avatarBg: "bg-[#30D158]",
        icon: <Cpu className="h-4 w-4 text-white" />,
        badge: "bg-[#EAFDF0] text-[#248A3D]"
      };
    } else if (s === "elon") {
      return {
        border: "border-l-[3px] border-l-[#FF9F0A]",
        text: "text-[#D07200]",
        avatarBg: "bg-[#FF9F0A]",
        icon: <Cpu className="h-4 w-4 text-white" />,
        badge: "bg-[#FFF5E6] text-[#D07200]"
      };
    } else if (s === "commander") {
      return {
        border: "border-l-[3px] border-l-[#0A84FF]",
        text: "text-[#0A84FF]",
        avatarBg: "bg-[#0A84FF]",
        icon: <Sparkles className="h-4 w-4 text-white animate-pulse" />,
        badge: "bg-[#E8F2FF] text-[#0066CC]"
      };
    } else if (s === "nikitta") {
      return {
        border: "border-l-[3px] border-l-[#5E5CE6]",
        text: "text-[#5E5CE6]",
        avatarBg: "bg-[#5E5CE6]",
        icon: <Cpu className="h-4 w-4 text-white" />,
        badge: "bg-[#F0EFFF] text-[#4743C9]"
      };
    } else if (message_type === "system" || s === "system") {
      return {
        border: "border-l-[3px] border-l-[#8E8E93] italic",
        text: "text-[#8E8E93]",
        avatarBg: "bg-[#8E8E93]",
        icon: <Terminal className="h-4 w-4 text-white" />,
        badge: "bg-gray-100 text-gray-600"
      };
    } else {
      // Default other agents (púrpura suave)
      return {
        border: "border-l-[3px] border-l-[#5E5CE6]",
        text: "text-[#5E5CE6]",
        avatarBg: "bg-[#5E5CE6]",
        icon: <Cpu className="h-4 w-4 text-white" />,
        badge: "bg-[#F0EFFF] text-[#4743C9]"
      };
    }
  };

  const style = getSenderStyle();

  const formattedTime = created_at
    ? new Date(created_at).toLocaleString([], {
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  return (
    <div className={`group relative rounded-xl border border-border bg-white p-4 transition-all hover:shadow-md hover:border-gray-300 ${style.border}`}>
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-2">
        <div className="flex items-center gap-3">
          {/* Avatar Icon (Circular) */}
          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full shadow-sm ${style.avatarBg}`}>
            {style.icon}
          </div>
          {/* Sender & Badge */}
          <div className="flex flex-col">
            <span className={`text-sm font-bold tracking-tight ${style.text}`}>
              {sender || "Unknown Sender"}
            </span>
            <span className="text-[10px] text-gray-400 font-medium">
              {formattedTime}
            </span>
          </div>
        </div>

        {/* Project Tag & Nav Button */}
        {project_name && (
          <button
            onClick={() => project_id && onProjectClick && onProjectClick(project_id)}
            className="flex items-center gap-1.5 rounded-lg bg-background px-2.5 py-1 text-xs font-semibold text-text-secondary border border-border transition-all hover:bg-gray-100 hover:text-primary"
          >
            <MessageSquare className="h-3 w-3 text-text-secondary/60" />
            <span>{project_name}</span>
          </button>
        )}
      </div>

      {/* Content body */}
      <div className="pl-11 text-sm text-text-primary font-medium whitespace-pre-wrap leading-relaxed">
        {content}
      </div>
    </div>
  );
};

export default MessageCard;
