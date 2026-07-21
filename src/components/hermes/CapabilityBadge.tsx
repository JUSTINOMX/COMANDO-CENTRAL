import React from "react";
import { Globe, Terminal, FileCode, FolderOpen, Cpu } from "lucide-react";

interface CapabilityBadgeProps {
  capability: string;
  key?: string | number;
}

export default function CapabilityBadge({ capability }: CapabilityBadgeProps) {
  const cap = capability.toLowerCase().trim();

  let styles = "bg-purple-50 text-purple-700 border-purple-100";
  let icon = <Cpu className="h-3 w-3" />;
  let label = capability;

  if (cap.includes("browser") || cap.includes("chrome") || cap.includes("cdp")) {
    styles = "bg-blue-50 text-blue-700 border-blue-100";
    icon = <Globe className="h-3 w-3" />;
    label = "Navegador (CDP)";
  } else if (cap.includes("powershell") || cap.includes("shell") || cap.includes("ps")) {
    styles = "bg-slate-50 text-slate-700 border-slate-200";
    icon = <Terminal className="h-3 w-3" />;
    label = "PowerShell";
  } else if (cap.includes("nodejs") || cap.includes("node") || cap.includes("script")) {
    styles = "bg-green-50 text-green-700 border-green-200";
    icon = <FileCode className="h-3 w-3" />;
    label = "Node.js / Scripts";
  } else if (cap.includes("filesystem") || cap.includes("file") || cap.includes("onedrive")) {
    styles = "bg-amber-50 text-amber-700 border-amber-200";
    icon = <FolderOpen className="h-3 w-3" />;
    label = "Sist. Archivos";
  }

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-bold ${styles}`}>
      {icon}
      <span>{label}</span>
    </span>
  );
}
