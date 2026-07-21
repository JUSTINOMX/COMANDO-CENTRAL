import React, { useState } from "react";
import { Search, Database, Globe, Filter, ExternalLink } from "lucide-react";
import { ProjectExtraction } from "../../lib/supabase/client.js";

interface ExtraccionesProps {
  extracciones: ProjectExtraction[];
}

export default function Extracciones({ extracciones }: ExtraccionesProps) {
  const [platformFilter, setPlatformFilter] = useState("");
  const [search, setSearch] = useState("");

  const platforms = Array.from(new Set(extracciones.map((e) => e.platform).filter(Boolean)));

  const filteredExtracciones = extracciones.filter((e) => {
    const matchesPlatform = platformFilter ? e.platform === platformFilter : true;
    const matchesSearch = search
      ? e.title.toLowerCase().includes(search.toLowerCase()) ||
        e.content.toLowerCase().includes(search.toLowerCase())
      : true;
    return matchesPlatform && matchesSearch;
  });

  return (
    <div className="flex flex-col gap-4">
      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute top-2.5 left-3 h-4 w-4 text-text-secondary/60" />
          <input
            type="text"
            placeholder="Search platform extractions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-border bg-white py-2 pl-9 pr-4 text-xs outline-none transition-all placeholder:text-text-secondary/60 focus:border-primary focus:ring-4 focus:ring-primary/15"
          />
        </div>

        <div className="relative w-full sm:w-48">
          <select
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value)}
            className="w-full appearance-none rounded-lg border border-border bg-white px-3 py-2 text-xs outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/15"
          >
            <option value="">All Platforms</option>
            {platforms.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <Filter className="absolute top-2.5 right-3 h-3.5 w-3.5 pointer-events-none text-text-secondary" />
        </div>
      </div>

      {/* Extractions list */}
      <div className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
        {filteredExtracciones.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-text-secondary">
            <Database className="h-8 w-8 text-border mb-2" />
            <p className="text-xs font-bold">No platform extractions found.</p>
            <p className="text-[10px] text-text-secondary/60 mt-0.5">Extractions are processed automatically by web scrape agents.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border bg-[#E8F2FF] text-[#0066CC] font-bold uppercase tracking-wider">
                  <th className="p-3.5 pl-4">Extraction Title</th>
                  <th className="p-3.5">Platform</th>
                  <th className="p-3.5">File Source</th>
                  <th className="p-3.5 pr-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredExtracciones.map((ext) => (
                  <tr key={ext.id} className="hover:bg-background transition-colors">
                    <td className="p-3.5 pl-4">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-bold text-text-primary">{ext.title}</span>
                        <span className="text-[10px] text-text-secondary line-clamp-1">{ext.content}</span>
                      </div>
                    </td>
                    <td className="p-3.5">
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#E8F2FF] border border-[#0A84FF]/10 px-2 py-0.5 text-[10px] font-bold text-[#0066CC] capitalize">
                        <Globe className="h-3 w-3" />
                        {ext.platform || "unknown"}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono text-text-secondary">{ext.file_name}</td>
                    <td className="p-3.5 pr-4 text-right">
                      <button
                        onClick={() => alert(`Content Preview:\n\n${ext.content}`)}
                        className="rounded-lg border border-border bg-white p-1 text-text-secondary hover:bg-background hover:text-primary transition-colors shadow-sm cursor-pointer"
                        title="View Raw Content"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
