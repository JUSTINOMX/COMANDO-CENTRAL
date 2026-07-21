import React, { useState } from "react";
import { Megaphone, Compass, Landmark, Newspaper, FileText } from "lucide-react";
import { ProjectMarketing } from "../../lib/supabase/client.js";

interface MarketingProps {
  marketing: ProjectMarketing[];
}

export default function Marketing({ marketing }: MarketingProps) {
  const [activeSubTab, setActiveSubTab] = useState<"atlas" | "extracciones" | "reportes">("atlas");

  const filteredMarketing = marketing.filter((m) => {
    const s = m.section ? m.section.toLowerCase() : "";
    if (activeSubTab === "atlas") {
      return s.includes("atlas") || s === "general" || s === "";
    } else if (activeSubTab === "extracciones") {
      return s.includes("extracciones") || s.includes("extrac") || s.includes("data");
    } else if (activeSubTab === "reportes") {
      return s.includes("reportes") || s.includes("repo") || s.includes("analysis") || s.includes("marketing");
    }
    return true;
  });

  return (
    <div className="flex flex-col gap-5">
      {/* Marketing Header */}
      <div className="flex items-center gap-3 border-b border-border pb-3">
        <Megaphone className="h-5 w-5 text-primary" />
        <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">Marketing Strategy & Collaterals</h3>
      </div>

      {/* Sub-tabs selection */}
      <div className="flex items-center gap-1.5 rounded-lg bg-background p-1 self-start border border-border">
        <button
          onClick={() => setActiveSubTab("atlas")}
          className={`flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
            activeSubTab === "atlas"
              ? "bg-white text-primary shadow-sm"
              : "text-text-secondary hover:bg-white/50 hover:text-text-primary"
          }`}
        >
          <Compass className="h-3.5 w-3.5" />
          <span>Atlas Platform</span>
        </button>
        <button
          onClick={() => setActiveSubTab("extracciones")}
          className={`flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
            activeSubTab === "extracciones"
              ? "bg-white text-primary shadow-sm"
              : "text-text-secondary hover:bg-white/50 hover:text-text-primary"
          }`}
        >
          <Landmark className="h-3.5 w-3.5" />
          <span>Extracciones</span>
        </button>
        <button
          onClick={() => setActiveSubTab("reportes")}
          className={`flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
            activeSubTab === "reportes"
              ? "bg-white text-primary shadow-sm"
              : "text-text-secondary hover:bg-white/50 hover:text-text-primary"
          }`}
        >
          <Newspaper className="h-3.5 w-3.5" />
          <span>Marketing Reports</span>
        </button>
      </div>

      {/* Marketing entries list */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {filteredMarketing.length === 0 ? (
          <div className="col-span-1 sm:col-span-2 flex flex-col items-center justify-center py-12 text-center text-text-secondary">
            <Megaphone className="h-8 w-8 text-border mb-2" />
            <p className="text-xs font-bold">No assets compiled for this section.</p>
            <p className="text-[10px] text-text-secondary/60 mt-0.5">Marketing content is generated upon scoping target user markets.</p>
          </div>
        ) : (
          filteredMarketing.map((m) => (
            <div key={m.id} className="flex flex-col gap-2 rounded-xl border border-border bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#E8F2FF]">
                  <Megaphone className="h-4 w-4 text-primary" />
                </div>
                <span className="font-bold text-text-primary text-sm leading-snug">{m.title}</span>
              </div>
              <p className="text-xs text-text-secondary leading-relaxed whitespace-pre-wrap mt-1">
                {m.content}
              </p>
              {m.file_name && (
                <div className="mt-2 font-mono text-[9px] text-text-secondary/60">
                  File name: {m.file_name}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
