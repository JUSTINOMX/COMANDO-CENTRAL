import React from "react";
import { Wrench } from "lucide-react";

export interface SkillItem {
  name: string;
  description: string;
  category?: string;
  tags?: string[];
}

interface SkillBadgeListProps {
  skills: SkillItem[];
}

export default function SkillBadgeList({ skills }: SkillBadgeListProps) {
  if (!skills || skills.length === 0) {
    return (
      <div className="text-xs text-text-secondary italic">
        Ninguna habilidad explícita detectada.
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-1.5" id="skill-badge-list">
      {skills.map((skill, index) => (
        <div
          key={`${skill.name}-${index}`}
          className="group relative flex items-center gap-1 rounded-md border border-primary/15 bg-primary/5 px-2 py-1 text-[11px] font-medium text-primary shadow-sm hover:bg-primary/10 transition-colors cursor-help"
          title={`${skill.category ? `[${skill.category}] ` : ""}${skill.description}`}
        >
          <Wrench className="h-3 w-3 shrink-0 text-primary/70" />
          <span className="font-mono font-bold">{skill.name}</span>

          {/* Tooltip on Hover */}
          <div className="absolute bottom-full left-1/2 mb-2 w-48 -translate-x-1/2 scale-0 rounded-lg bg-gray-900 p-2 text-[10px] font-normal leading-normal text-white shadow-xl group-hover:scale-100 transition-all duration-150 z-50 pointer-events-none">
            <div className="font-bold border-b border-white/10 pb-0.5 mb-1 text-primary-light">
              {skill.name}
            </div>
            <div>{skill.description}</div>
            {skill.category && (
              <div className="mt-1 text-gray-400">
                Categoría: <span className="text-white font-semibold">{skill.category}</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
