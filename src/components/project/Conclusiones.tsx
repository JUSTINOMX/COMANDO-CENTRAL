import React, { useState } from "react";
import { CheckSquare, ChevronDown, ChevronUp, AlertCircle, Quote } from "lucide-react";
import { ProjectConclusion } from "../../lib/supabase/client.js";

interface ConclusionesProps {
  conclusiones: ProjectConclusion[];
}

export default function Conclusiones({ conclusiones }: ConclusionesProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider mb-2">Project Conclusions & Takeaways</h3>

      {conclusiones.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-white py-12 text-center text-text-secondary">
          <CheckSquare className="h-8 w-8 text-border mb-2" />
          <p className="text-xs font-bold">No conclusions compiled yet.</p>
          <p className="text-[10px] text-text-secondary/60 mt-0.5">Conclusions are consolidated outputs generated upon agent milestones.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {conclusiones.map((con) => {
            const isExpanded = expandedId === con.id;
            return (
              <div
                key={con.id}
                onClick={() => toggleExpand(con.id)}
                className="flex flex-col rounded-xl border border-border bg-white p-4 shadow-sm hover:shadow-md hover:border-primary transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#EAFDF0]">
                      <CheckSquare className="h-4 w-4 text-[#248A3D]" />
                    </div>
                    <span className="font-bold text-text-primary text-sm line-clamp-1">{con.title}</span>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-text-secondary/60 shrink-0" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-text-secondary/60 shrink-0" />
                  )}
                </div>

                {isExpanded ? (
                  <div className="mt-3 border-t border-border pt-3 text-xs text-text-secondary leading-relaxed whitespace-pre-wrap animate-in fade-in duration-200">
                    <Quote className="h-4 w-4 text-primary/20 mb-1 shrink-0" />
                    {con.content}
                    {con.file_name && (
                      <div className="mt-3 font-mono text-[9px] text-text-secondary/60">
                        Derived from: {con.file_name}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-text-secondary/80 line-clamp-2 leading-relaxed">
                    {con.content}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
