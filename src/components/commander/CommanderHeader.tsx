import React from "react";
import { Cpu, BrainCircuit, ShieldAlert, Sparkles } from "lucide-react";

interface CommanderHeaderProps {
  isMemoryOpen: boolean;
  setIsMemoryOpen: (open: boolean) => void;
  memoriesCount: number;
}

export default function CommanderHeader({
  isMemoryOpen,
  setIsMemoryOpen,
  memoriesCount,
}: CommanderHeaderProps) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-white px-3 sm:px-6 shadow-sm">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <div className="flex h-8 sm:h-9 w-8 sm:w-9 items-center justify-center rounded-lg bg-primary/10 border border-primary/20 text-primary shrink-0">
          <Cpu className="h-4 sm:h-5 w-4 sm:w-5 text-primary animate-pulse" />
        </div>
        <div className="flex flex-col min-w-0">
          <h1 className="text-xs sm:text-sm font-bold tracking-tight text-text-primary leading-none flex items-center gap-1 sm:gap-1.5">
            <span className="truncate">Commander</span>
            <span className="rounded bg-primary/10 px-1 py-0.5 text-[8px] sm:text-[9px] font-bold text-primary font-mono shrink-0">
              V2.1
            </span>
          </h1>
          <div className="mt-0.5 sm:mt-1 flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-[#30D158] animate-ping shrink-0" />
            <span className="text-[9px] sm:text-[10px] font-bold text-text-secondary truncate">
              Core Conectado
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => setIsMemoryOpen(!isMemoryOpen)}
          className={`flex items-center gap-1.5 sm:gap-2 rounded-lg border px-2.5 sm:px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
            isMemoryOpen
              ? "border-primary bg-primary/10 text-primary"
              : "border-border bg-[#F5F5F7] text-text-secondary hover:bg-gray-100"
          }`}
          id="toggle-memory-panel"
        >
          <BrainCircuit className="h-4 w-4" />
          <span className="hidden sm:inline">Matriz de Memoria</span>
          <span className="sm:hidden text-[11px]">Memoria</span>
          {memoriesCount > 0 && (
            <span className="rounded-full bg-primary px-1.5 py-0.2 text-[9px] font-bold text-white">
              {memoriesCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
