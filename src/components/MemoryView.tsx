import React, { useState } from "react";
import { BrainCircuit, Plus, FileText, Tag, MessageSquare, ShieldCheck, Cpu } from "lucide-react";
import { Memory, Agent, apiClient } from "../lib/supabase/client.js";

interface MemoryViewProps {
  memories: Memory[];
  agents: Agent[];
  onRefresh: () => void;
}

export default function MemoryView({ memories, agents, onRefresh }: MemoryViewProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [memoryType, setMemoryType] = useState("preference");
  const [selectedAgentId, setSelectedAgentId] = useState("");
  const [tags, setTags] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsSubmitting(true);
    try {
      const parsedTags = tags ? tags.split(",").map((t) => t.trim().toLowerCase()) : [];
      await apiClient.createMemory({
        title: title.trim() || "Manual Observation",
        content: content.trim(),
        memory_type: memoryType,
        agent_id: selectedAgentId || undefined,
        tags: parsedTags,
        source: "Manual Admin Input"
      });
      setTitle("");
      setContent("");
      setMemoryType("preference");
      setSelectedAgentId("");
      setTags("");
      setIsOpen(false);
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getAgentName = (agentId?: string) => {
    if (!agentId) return "Global / System";
    const agent = agents.find((a) => a.id === agentId);
    return agent ? agent.display_name : "Unknown Agent";
  };

  const getAgentLeftBorderClass = (agentId?: string) => {
    if (!agentId) return "border-l-[3px] border-l-[#8E8E93]"; // System / Global
    const agent = agents.find((a) => a.id === agentId);
    if (!agent) return "border-l-[3px] border-l-[#8E8E93]";
    const name = agent.name?.toLowerCase() || "";
    if (name.includes("steve")) return "border-l-[3px] border-l-[#30D158]";
    if (name.includes("elon")) return "border-l-[3px] border-l-[#FF9F0A]";
    if (name.includes("nikitta")) return "border-l-[3px] border-l-[#5E5CE6]";
    return "border-l-[3px] border-l-[#0A84FF]";
  };

  const getMemoryTypeBadgeClass = (type: string) => {
    const t = type ? type.toLowerCase() : "";
    if (t === "critical") {
      return "bg-[#FFEBEF] text-[#CC1F43] border border-[#FF375F]/15";
    }
    if (t === "preference") {
      return "bg-[#FFF5E6] text-[#D07200] border border-[#FF9F0A]/15";
    }
    // observation / other (verde)
    return "bg-[#EAFDF0] text-[#248A3D] border border-[#30D158]/15";
  };

  return (
    <div className="flex flex-col gap-4 sm:gap-6 p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E8F2FF] border border-primary/10">
            <BrainCircuit className="h-5 w-5 text-primary" />
          </div>
          <div className="flex flex-col">
            <h2 className="text-base font-bold text-text-primary">Ecosystem Memory Matrix</h2>
            <p className="text-xs text-text-secondary">View and update historical preferences and context weights saved for the agents.</p>
          </div>
        </div>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-xs font-bold text-white shadow-sm shadow-primary/20 hover:bg-primary-dark transition-all cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Add Memory</span>
        </button>
      </div>

      {/* Add Memory Form */}
      {isOpen && (
        <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-white p-5 shadow-sm animate-in fade-in slide-in-from-top-3 duration-200 flex flex-col gap-4">
          <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
            <BrainCircuit className="h-4 w-4 text-primary" />
            <span>Store New Context / Preference Memory</span>
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <div className="flex flex-col gap-1 sm:col-span-2">
              <label className="text-[10px] font-bold text-text-secondary uppercase">Memory Title / Key</label>
              <input
                type="text"
                placeholder="e.g. Edwin's Color Preference"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="rounded-lg border border-border bg-background px-3 py-2 text-xs outline-none focus:border-primary focus:bg-white"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-text-secondary uppercase">Memory Type</label>
              <select
                value={memoryType}
                onChange={(e) => setMemoryType(e.target.value)}
                className="rounded-lg border border-border bg-background px-3 py-2 text-xs outline-none focus:border-primary focus:bg-white"
              >
                <option value="preference">User Preference</option>
                <option value="observation">Observation / Fact</option>
                <option value="critical">Critical Instruction</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-text-secondary uppercase">Scope (Target Agent)</label>
              <select
                value={selectedAgentId}
                onChange={(e) => setSelectedAgentId(e.target.value)}
                className="rounded-lg border border-border bg-background px-3 py-2 text-xs outline-none focus:border-primary focus:bg-white"
              >
                <option value="">Global (All Agents)</option>
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.display_name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-text-secondary uppercase">Tags (comma-separated)</label>
              <input
                type="text"
                placeholder="e.g. edwin, preferences, lightmode"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="rounded-lg border border-border bg-background px-3 py-2 text-xs outline-none focus:border-primary focus:bg-white"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-text-secondary uppercase">Memory Content</label>
            <textarea
              placeholder="e.g. Edwin likes a light, highly legible clean interface with Apple style design..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              rows={3}
              className="rounded-lg border border-border bg-background px-3 py-2 text-xs outline-none focus:border-primary focus:bg-white resize-y"
            />
          </div>
          <div className="flex items-center gap-2 justify-end pt-2">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-lg border border-border bg-white px-4 py-2 text-xs font-bold text-text-secondary hover:bg-background cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !content.trim()}
              className="rounded-lg bg-primary px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-primary-dark disabled:bg-gray-200 cursor-pointer"
            >
              {isSubmitting ? "Storing..." : "Store Memory"}
            </button>
          </div>
        </form>
      )}

      {/* Memories Grid list */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {memories.length === 0 ? (
          <div className="col-span-2 flex flex-col items-center justify-center py-20 text-center text-text-secondary">
            <BrainCircuit className="h-10 w-10 text-border mb-3" />
            <p className="text-xs font-bold text-text-primary">Memory Matrix is empty.</p>
            <p className="text-[10px] text-text-secondary/60 mt-0.5">Use Commander or the button above to register facts or context details.</p>
          </div>
        ) : (
          memories.map((m) => {
            const borderClass = getAgentLeftBorderClass(m.agent_id);
            const badgeClass = getMemoryTypeBadgeClass(m.memory_type);
            return (
              <div
                key={m.id}
                className={`flex flex-col gap-3 rounded-2xl border border-border bg-white p-5 shadow-sm hover:shadow-md transition-all ${borderClass}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${badgeClass}`}>
                      {m.memory_type}
                    </span>
                    <span className="font-bold text-text-primary text-xs truncate max-w-[150px]">
                      {m.title}
                    </span>
                  </div>
                  <span className="text-[9px] font-mono text-text-secondary/60">
                    {m.created_at ? new Date(m.created_at).toLocaleDateString() : ""}
                  </span>
                </div>

                {/* Body */}
                <p className="text-xs text-text-primary leading-relaxed font-sans font-semibold whitespace-pre-wrap">
                  "{m.content}"
                </p>

                {/* Footer */}
                <div className="flex items-center justify-between border-t border-border pt-3 text-[10px] text-text-secondary font-bold mt-1">
                  <div className="flex items-center gap-1.5">
                    <Cpu className="h-3.5 w-3.5 text-text-secondary/60 shrink-0" />
                    <span>Scope: {getAgentName(m.agent_id)}</span>
                  </div>
                  {m.tags && m.tags.length > 0 && (
                    <div className="flex gap-1">
                      {m.tags.slice(0, 3).map((t) => (
                        <span key={t} className="rounded bg-background border border-border px-1.5 py-0.5 text-[9px] font-bold text-text-secondary uppercase">
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
