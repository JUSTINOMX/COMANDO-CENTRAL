import React, { useState, useEffect } from "react";
import { BrainCircuit, Search, Trash2, Tag, Loader2, RefreshCw } from "lucide-react";
import { Memory, Agent } from "../../lib/supabase/client.js";
import { commanderApi } from "../../api/commanderApi.js";

interface CommanderMemoryProps {
  onForgetMemory: (memoryId: string) => Promise<void>;
  agents: Agent[];
  refreshTrigger: number;
}

export default function CommanderMemory({ onForgetMemory, agents, refreshTrigger }: CommanderMemoryProps) {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const fetchLatestMemories = async () => {
    setIsLoading(true);
    try {
      // Fetch latest memories using our commander API search
      const data = await commanderApi.manageMemory({
        action: "search",
        query: searchQuery || undefined,
      });
      // Sort and take latest 5
      setMemories((data || []).slice(0, 5));
    } catch (err) {
      console.error("Error loading latest memories:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLatestMemories();
  }, [searchQuery, refreshTrigger]);

  const handleDelete = async (id: string) => {
    if (!id) return;
    try {
      await onForgetMemory(id);
      fetchLatestMemories();
    } catch (err) {
      console.error("Error forgetting memory:", err);
    }
  };

  const getAgentName = (agentId?: string) => {
    if (!agentId) return "Global / System";
    const agent = agents.find((a) => a.id === agentId);
    return agent ? agent.display_name : "System";
  };

  return (
    <div className="flex h-full w-full flex-col border-l border-border bg-white animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border p-4">
        <div className="flex items-center gap-2">
          <BrainCircuit className="h-4.5 w-4.5 text-primary animate-pulse" />
          <span className="text-xs font-bold text-text-primary uppercase tracking-wider">
            Commander Memory Panel
          </span>
        </div>
        <button
          onClick={fetchLatestMemories}
          className="rounded p-1 text-text-secondary hover:bg-gray-100 cursor-pointer"
          title="Actualizar memorias"
          id="refresh-memories-button"
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Search Input */}
      <div className="p-3 border-b border-border bg-[#F5F5F7]/30">
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar preferencias..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-border bg-white py-1.5 pl-8 pr-3 text-xs text-text-primary outline-none focus:border-primary font-medium"
            id="memory-search-input"
          />
          <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-text-secondary/60" />
        </div>
      </div>

      {/* Memories List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
        {isLoading && memories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-text-secondary">
            <Loader2 className="h-5 w-5 animate-spin text-primary mb-2" />
            <span className="text-[10px] font-bold">Cargando memorias...</span>
          </div>
        ) : memories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center text-text-secondary">
            <BrainCircuit className="h-8 w-8 text-border mb-2.5" />
            <span className="text-xs font-bold text-text-primary">Matriz sin registros</span>
            <p className="text-[10px] text-text-secondary/80 mt-1 px-4 leading-relaxed">
              Dile a Commander "Recuerda que prefiero..." para registrar una preferencia.
            </p>
          </div>
        ) : (
          memories.map((m) => (
            <div
              key={m.id}
              className="group relative rounded-xl border border-border bg-white p-3.5 shadow-sm hover:border-primary/30 hover:shadow-md transition-all border-l-4 border-l-primary"
            >
              <div className="flex items-center justify-between gap-1.5 mb-1.5">
                <span className="rounded bg-[#FFF5E6] text-[#D07200] border border-[#FF9F0A]/15 px-1.5 py-0.2 text-[8px] font-bold uppercase tracking-wider">
                  {m.memory_type || "preference"}
                </span>

                <button
                  onClick={() => handleDelete(m.id)}
                  className="rounded p-1 text-text-secondary opacity-0 group-hover:opacity-100 hover:bg-rose-50 hover:text-rose-500 transition-all cursor-pointer absolute right-2 top-2"
                  title="Olvidar memoria"
                  id={`forget-memory-${m.id}`}
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>

              <p className="text-xs font-bold text-text-primary leading-relaxed pr-5">
                "{m.content}"
              </p>

              <div className="mt-2.5 flex items-center justify-between text-[8px] font-mono text-text-secondary">
                <span>Scope: {getAgentName(m.agent_id)}</span>
                {m.tags && m.tags.length > 0 && (
                  <span className="truncate max-w-[100px] text-[8px] text-primary font-bold">
                    #{m.tags[0]}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Total Badge */}
      <div className="border-t border-border bg-[#F5F5F7] p-3 text-center">
        <span className="text-[9px] font-bold text-text-secondary uppercase tracking-widest">
          Mostrando {memories.length} de las últimas activas
        </span>
      </div>
    </div>
  );
}
