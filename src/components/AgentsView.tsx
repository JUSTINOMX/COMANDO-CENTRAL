import React, { useState } from "react";
import { Cpu, Plus, UserCheck, Activity, Award, UserPlus, Info, Sparkles } from "lucide-react";
import { Agent, apiClient, Project } from "../lib/supabase/client.js";
import HermesAgentList from "./hermes/HermesAgentList.js";

interface AgentsViewProps {
  agents: Agent[];
  projects?: Project[];
  onRefresh: () => void;
}

export default function AgentsView({ agents, projects = [], onRefresh }: AgentsViewProps) {
  const [activeTab, setActiveTab] = useState<"ia" | "hermes">("ia");
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("active");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter out hermes agents from standard AI agents list so they don't blend in
  const standardAgents = agents.filter(a => a.identity?.type !== "hermes");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !displayName.trim() || !role.trim()) return;

    setIsSubmitting(true);
    try {
      await apiClient.createAgent({
        name: name.trim().toLowerCase(),
        display_name: displayName.trim(),
        role: role.trim(),
        status
      });
      setName("");
      setDisplayName("");
      setRole("");
      setStatus("active");
      setIsOpen(false);
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getAgentAvatar = (dispName: string) => {
    const s = dispName.toLowerCase();
    if (s.includes("steve")) return "bg-[#30D158] text-white";
    if (s.includes("elon")) return "bg-[#FF9F0A] text-white";
    if (s.includes("commander")) return "bg-[#0A84FF] text-white";
    if (s.includes("nikitta")) return "bg-[#5E5CE6] text-white";
    if (s.includes("edwin")) return "bg-[#FF375F] text-white";
    return "bg-[#0A84FF] text-white";
  };

  return (
    <div className="flex flex-col gap-6 p-6 animate-in fade-in duration-200">
      
      {/* Tab Selector Nav */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab("ia")}
          className={`flex items-center gap-2 px-6 py-3.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === "ia"
              ? "border-primary text-primary"
              : "border-transparent text-gray-400 hover:text-gray-900"
          }`}
        >
          <Cpu className="h-4 w-4" />
          <span>🤖 AI Agents Catalog</span>
        </button>
        <button
          onClick={() => setActiveTab("hermes")}
          className={`flex items-center gap-2 px-6 py-3.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === "hermes"
              ? "border-purple-600 text-purple-600"
              : "border-transparent text-gray-400 hover:text-gray-900"
          }`}
        >
          <Sparkles className="h-4 w-4" />
          <span>⚡ Hermes Exec Agents</span>
        </button>
      </div>

      {activeTab === "ia" ? (
        <div className="flex flex-col gap-6 animate-in fade-in duration-150">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E8F2FF] border border-primary/10">
                <Cpu className="h-5 w-5 text-primary" />
              </div>
              <div className="flex flex-col">
                <h2 className="text-base font-bold text-text-primary">AI Agents Ecosystem</h2>
                <p className="text-xs text-text-secondary">Manage and deploy AI agents configured for specialized automation roles.</p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(!isOpen)}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-primary-dark transition-all cursor-pointer"
            >
              <UserPlus className="h-4 w-4" />
              <span>Register Agent</span>
            </button>
          </div>

          {/* New agent form */}
          {isOpen && (
            <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-white p-5 shadow-sm animate-in fade-in slide-in-from-top-3 duration-200 flex flex-col gap-4">
              <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
                <Cpu className="h-4 w-4 text-primary" />
                <span>Register New Agent Node</span>
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-text-secondary uppercase">System Name (Unique)</label>
                  <input
                    type="text"
                    placeholder="e.g. analyst"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="rounded-lg border border-border bg-background px-3 py-2 text-xs outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/15"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-text-secondary uppercase">Display Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Auto Analyst"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required
                    className="rounded-lg border border-border bg-background px-3 py-2 text-xs outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/15"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-text-secondary uppercase">Primary Role / Function</label>
                  <input
                    type="text"
                    placeholder="e.g. data-analyst"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    required
                    className="rounded-lg border border-border bg-background px-3 py-2 text-xs outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/15"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-text-secondary uppercase">Operational Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="rounded-lg border border-border bg-background px-3 py-2 text-xs outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/15"
                  >
                    <option value="active">Active (Online)</option>
                    <option value="idle">Idle (Standby)</option>
                    <option value="offline">Offline (Paused)</option>
                  </select>
                </div>
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
                  disabled={isSubmitting}
                  className="rounded-lg bg-primary px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-primary-dark disabled:bg-gray-200 cursor-pointer"
                >
                  {isSubmitting ? "Deploying..." : "Deploy Agent Node"}
                </button>
              </div>
            </form>
          )}

          {/* Agents grid cards list */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {standardAgents.map((agent) => {
              const avatarStyle = getAgentAvatar(agent.display_name);
              const isCommander = agent.name === "commander";
              return (
                <div
                  key={agent.id}
                  className="group relative rounded-2xl border border-border bg-white p-5 shadow-sm hover:shadow-md hover:border-primary transition-all"
                >
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-inner font-mono text-xs font-bold uppercase ${avatarStyle}`}>
                        {agent.display_name.charAt(0)}
                      </div>
                      {/* Info */}
                      <div className="flex flex-col">
                        <span className="font-bold text-text-primary text-sm leading-tight group-hover:text-primary transition-colors">
                          {agent.display_name}
                        </span>
                        <span className="text-[10px] text-text-secondary font-mono mt-0.5">
                          @{agent.name}
                        </span>
                      </div>
                    </div>

                    {/* Status Indicator */}
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${
                      agent.status === "active"
                        ? "bg-[#EAFDF0] border-[#30D158]/10 text-[#248A3D]"
                        : agent.status === "idle"
                        ? "bg-[#E8F2FF] border-[#0A84FF]/10 text-[#0066CC]"
                        : "bg-background border-border text-text-secondary"
                    }`}>
                      {agent.status}
                    </span>
                  </div>

                  {/* Specifications list */}
                  <div className="flex flex-col gap-2.5 border-t border-border pt-4 text-xs">
                    <div className="flex items-center justify-between text-text-secondary font-bold">
                      <div className="flex items-center gap-1.5 font-bold">
                        <Activity className="h-3.5 w-3.5 text-text-secondary/60" />
                        <span>Specialty Role</span>
                      </div>
                      <span className="font-bold text-text-primary capitalize">{agent.role}</span>
                    </div>
                    
                    {isCommander && (
                      <div className="mt-2.5 flex items-start gap-2 rounded-xl bg-[#E8F2FF] p-3 border border-[#0A84FF]/10">
                        <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <p className="text-[10px] text-[#0066CC] font-bold leading-relaxed">
                          Assigned as Commander Assistant to interpret command-line prompts and coordinate Supabase actions dynamically.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <HermesAgentList projects={projects} />
      )}
    </div>
  );
}
