import React from "react";
import { Search, SlidersHorizontal, Trash2 } from "lucide-react";
import { Project, Agent } from "../../lib/supabase/client.js";

interface FiltersProps {
  projects: Project[];
  agents: Agent[];
  selectedProjectId: string;
  setSelectedProjectId: (id: string) => void;
  selectedAgentIds: string[];
  setSelectedAgentIds: (ids: string[]) => void;
  searchText: string;
  setSearchText: (text: string) => void;
  onClearFilters: () => void;
}

export default function Filters({
  projects,
  agents,
  selectedProjectId,
  setSelectedProjectId,
  selectedAgentIds,
  setSelectedAgentIds,
  searchText,
  setSearchText,
  onClearFilters
}: FiltersProps) {
  const toggleAgent = (agentId: string) => {
    if (selectedAgentIds.includes(agentId)) {
      setSelectedAgentIds(selectedAgentIds.filter((id) => id !== agentId));
    } else {
      setSelectedAgentIds([...selectedAgentIds, agentId]);
    }
  };

  const hasActiveFilters = selectedProjectId || selectedAgentIds.length > 0 || searchText;

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-white p-4 shadow-sm">
      {/* Top Filter Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute top-2.5 left-3 h-4 w-4 text-text-secondary/60" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-4 text-sm outline-none transition-all placeholder:text-text-secondary/60 focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/15"
          />
        </div>

        {/* Project Dropdown */}
        <div className="w-full sm:w-56">
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-all focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/15"
          >
            <option value="">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="flex items-center justify-center gap-2 rounded-lg border border-border bg-white px-3 py-2 text-xs font-bold text-[#FF375F] hover:bg-red-50 hover:border-[#FF375F]/30 transition-all shadow-sm"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Clear Filters</span>
          </button>
        )}
      </div>

      {/* Agent Multi-select pills */}
      <div className="flex flex-col gap-2 border-t border-border pt-3">
        <div className="flex items-center gap-2 text-xs font-bold text-text-secondary uppercase tracking-wider">
          <SlidersHorizontal className="h-3.5 w-3.5 text-text-secondary/60" />
          <span>Filter by AI Agent</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {agents.map((a) => {
            const isSelected = selectedAgentIds.includes(a.id);
            return (
              <button
                key={a.id}
                onClick={() => toggleAgent(a.id)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? "bg-primary text-white shadow-sm shadow-primary/20"
                    : "bg-background text-text-primary hover:bg-gray-200"
                }`}
              >
                {a.display_name} ({a.role})
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
