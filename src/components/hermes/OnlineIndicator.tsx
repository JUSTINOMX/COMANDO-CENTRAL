import React from "react";
import { Clock } from "lucide-react";

interface OnlineIndicatorProps {
  lastPing: string | null;
  className?: string;
}

export default function OnlineIndicator({ lastPing, className = "" }: OnlineIndicatorProps) {
  const getOnlineStatus = () => {
    if (!lastPing) return { online: false, text: "Offline (Nunca reportado)", colorClass: "bg-gray-300 text-gray-500 border-gray-200" };
    
    const pingDate = new Date(lastPing);
    const now = new Date();
    const diffMs = now.getTime() - pingDate.getTime();
    const fiveMinutesMs = 5 * 60 * 1000;
    
    if (diffMs < fiveMinutesMs) {
      // Calculate minutes ago for fine display if needed
      return { online: true, text: "Online", colorClass: "bg-green-500 text-green-700 border-green-200" };
    } else {
      const minutesAgo = Math.floor(diffMs / 60000);
      let timeStr = `${minutesAgo} min`;
      if (minutesAgo >= 60) {
        const hoursAgo = Math.floor(minutesAgo / 60);
        timeStr = `${hoursAgo}h`;
        if (hoursAgo >= 24) {
          timeStr = `${Math.floor(hoursAgo / 24)}d`;
        }
      }
      return { online: false, text: `Offline · Hace ${timeStr}`, colorClass: "bg-gray-300 text-gray-500 border-gray-200" };
    }
  };

  const status = getOnlineStatus();

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <span className={`relative flex h-2 w-2`}>
        {status.online && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${status.online ? "bg-green-500" : "bg-gray-400"}`}></span>
      </span>
      <span className="text-[11px] font-mono font-bold leading-none text-gray-600 flex items-center gap-1">
        {status.text}
      </span>
    </div>
  );
}
