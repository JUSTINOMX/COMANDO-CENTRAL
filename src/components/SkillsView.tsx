import React, { useState } from "react";
import { Wrench, Plus, Terminal, Users, BookOpen, Layers, CheckCircle } from "lucide-react";
import { Skill, Agent, apiClient } from "../lib/supabase/client.js";

interface SkillsViewProps {
  skills: Skill[];
  agents: Agent[];
  onRefresh: () => void;
}

export default function SkillsView({ skills, agents, onRefresh }: SkillsViewProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [longDescription, setLongDescription] = useState("");
  const [category, setCategory] = useState("general");
  const [tags, setTags] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Assign states
  const [selectedAgentId, setSelectedAgentId] = useState("");
  const [selectedSkillId, setSelectedSkillId] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);

  // Detail preview state
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !description.trim()) return;

    setIsSubmitting(true);
    try {
      const parsedTags = tags ? tags.split(",").map((t) => t.trim().toLowerCase()) : [];
      await apiClient.createSkill({
        name: name.trim().toUpperCase(),
        description: description.trim(),
        long_description: longDescription.trim() || undefined,
        category,
        tags: parsedTags
      });
      setName("");
      setDescription("");
      setLongDescription("");
      setCategory("general");
      setTags("");
      setIsOpen(false);
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAgentId || !selectedSkillId) return;

    setIsAssigning(true);
    try {
      await apiClient.assignSkill(selectedAgentId, selectedSkillId);
      setSelectedAgentId("");
      setSelectedSkillId("");
      setIsAssignOpen(false);
      alert("Skill assigned successfully!");
      onRefresh();
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to assign skill.");
    } finally {
      setIsAssigning(false);
    }
  };

  const getCategoryBadgeClass = (cat: string) => {
    const c = cat ? cat.toLowerCase() : "";
    if (c === "marketing" || c === "scraping") {
      return "bg-[#EAFDF0] text-[#248A3D] border border-[#30D158]/10";
    }
    if (c === "database" || c === "analysis") {
      return "bg-[#E8F2FF] text-[#0066CC] border border-[#0A84FF]/10";
    }
    return "bg-background text-text-secondary border border-border";
  };

  return (
    <div className="flex flex-col gap-4 sm:gap-6 p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E8F2FF] border border-primary/10">
            <Wrench className="h-5 w-5 text-primary" />
          </div>
          <div className="flex flex-col">
            <h2 className="text-base font-bold text-text-primary">Automation Skills Catalog</h2>
            <p className="text-xs text-text-secondary">Equip agents with predefined, reusable protocols and capabilities.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setIsAssignOpen(true);
              setIsOpen(false);
            }}
            className="flex items-center gap-1.5 rounded-lg border border-primary text-primary hover:bg-[#E8F2FF] bg-white px-3.5 py-2 text-xs font-bold transition-all cursor-pointer"
          >
            <Users className="h-4 w-4" />
            <span>Equip Agent</span>
          </button>
          
          <button
            onClick={() => {
              setIsOpen(!isOpen);
              setIsAssignOpen(false);
            }}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-xs font-bold text-white shadow-sm shadow-primary/20 hover:bg-primary-dark transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Register Skill</span>
          </button>
        </div>
      </div>

      {/* Register Skill Form */}
      {isOpen && (
        <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-white p-5 shadow-sm animate-in fade-in slide-in-from-top-3 duration-200 flex flex-col gap-4">
          <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
            <Wrench className="h-4 w-4 text-primary" />
            <span>Register New Reusable Skill</span>
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-text-secondary uppercase">Skill Identifier (System Code)</label>
              <input
                type="text"
                placeholder="e.g. DATA_EXPORT"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="rounded-lg border border-border bg-background px-3 py-2 text-xs outline-none focus:border-primary focus:bg-white"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-text-secondary uppercase">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="rounded-lg border border-border bg-background px-3 py-2 text-xs outline-none focus:border-primary focus:bg-white"
              >
                <option value="general">General Utility</option>
                <option value="scraping">Web Scraping</option>
                <option value="marketing">Marketing & Sales</option>
                <option value="database">Database Execution</option>
                <option value="analysis">Research & Analysis</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-text-secondary uppercase">Tags (comma-separated)</label>
              <input
                type="text"
                placeholder="e.g. csv, postgres, sql"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="rounded-lg border border-border bg-background px-3 py-2 text-xs outline-none focus:border-primary focus:bg-white"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-text-secondary uppercase">Short Description</label>
            <input
              type="text"
              placeholder="e.g. Exporta e integra información de la base de datos de manera automatizada."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="rounded-lg border border-border bg-background px-3 py-2 text-xs outline-none focus:border-primary focus:bg-white"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-text-secondary uppercase">Detailed Operational Protocol Guide (Long Description)</label>
            <textarea
              placeholder="Describe detalladamente el protocolo que debe seguir el agente para ejecutar este skill..."
              value={longDescription}
              onChange={(e) => setLongDescription(e.target.value)}
              rows={4}
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
              disabled={isSubmitting}
              className="rounded-lg bg-primary px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-primary-dark disabled:bg-gray-200 cursor-pointer"
            >
              {isSubmitting ? "Saving..." : "Save Reusable Skill"}
            </button>
          </div>
        </form>
      )}

      {/* Equip Agent Form */}
      {isAssignOpen && (
        <form onSubmit={handleAssign} className="rounded-2xl border border-border bg-white p-5 shadow-sm animate-in fade-in slide-in-from-top-3 duration-200 flex flex-col gap-4">
          <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <span>Equip AI Agent with Skill Capability</span>
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-text-secondary uppercase">Select Target AI Agent</label>
              <select
                value={selectedAgentId}
                onChange={(e) => setSelectedAgentId(e.target.value)}
                required
                className="rounded-lg border border-border bg-background px-3 py-2 text-xs outline-none focus:border-primary focus:bg-white"
              >
                <option value="">-- Choose Agent --</option>
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.display_name} (@{a.name})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-text-secondary uppercase">Select Capability / Skill</label>
              <select
                value={selectedSkillId}
                onChange={(e) => setSelectedSkillId(e.target.value)}
                required
                className="rounded-lg border border-border bg-background px-3 py-2 text-xs outline-none focus:border-primary focus:bg-white"
              >
                <option value="">-- Choose Skill --</option>
                {skills.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.category})
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2 justify-end pt-2">
            <button
              type="button"
              onClick={() => setIsAssignOpen(false)}
              className="rounded-lg border border-border bg-white px-4 py-2 text-xs font-bold text-text-secondary hover:bg-background cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isAssigning || !selectedAgentId || !selectedSkillId}
              className="rounded-lg bg-primary px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-primary-dark disabled:bg-gray-200 cursor-pointer"
            >
              {isAssigning ? "Equipping..." : "Equip Agent"}
            </button>
          </div>
        </form>
      )}

      {/* Main skills catalog list */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Left Skills List */}
        <div className="col-span-1 flex flex-col gap-3 max-h-[500px] overflow-y-auto pr-2">
          {skills.length === 0 ? (
            <p className="text-xs italic text-text-secondary">No skills registered.</p>
          ) : (
            skills.map((skill) => (
              <div
                key={skill.id}
                onClick={() => setSelectedSkill(skill)}
                className={`flex flex-col gap-1 rounded-xl border p-4 shadow-sm hover:shadow transition-all cursor-pointer ${
                  selectedSkill?.id === skill.id
                    ? "border-primary bg-[#E8F2FF]/40"
                    : "border-border bg-white hover:border-gray-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-text-primary text-sm">{skill.name}</span>
                  <span className={`rounded px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider ${getCategoryBadgeClass(skill.category)}`}>
                    {skill.category}
                  </span>
                </div>
                <p className="text-xs text-text-secondary line-clamp-2 mt-1 leading-relaxed">
                  {skill.description}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Right Skill Detail Preview */}
        <div className="col-span-1 md:col-span-2 rounded-2xl border border-border bg-white p-5 shadow-sm min-h-64 flex flex-col justify-between">
          {selectedSkill ? (
            <div className="flex flex-col gap-4 animate-in fade-in duration-200">
              {/* Detail Header */}
              <div className="flex items-start justify-between border-b border-border pb-3">
                <div className="flex flex-col">
                  <h3 className="text-base font-bold text-text-primary">{selectedSkill.name}</h3>
                  <span className="text-[10px] text-text-secondary font-semibold mt-1 uppercase tracking-widest">
                    Category: {selectedSkill.category || "General"} | version {selectedSkill.version || "1.0.0"}
                  </span>
                </div>
              </div>

              {/* Descriptions */}
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-text-secondary uppercase">Brief Description</span>
                  <p className="text-xs font-semibold text-text-primary leading-relaxed">{selectedSkill.description}</p>
                </div>

                {selectedSkill.long_description && (
                  <div className="flex flex-col gap-1.5 bg-background rounded-xl p-3.5 border border-border">
                    <span className="text-[10px] font-bold text-text-secondary uppercase flex items-center gap-1.5">
                      <BookOpen className="h-3.5 w-3.5 text-primary" />
                      <span>Operational execution guide</span>
                    </span>
                    <p className="text-xs text-text-primary font-medium leading-relaxed whitespace-pre-wrap">{selectedSkill.long_description}</p>
                  </div>
                )}

                {/* Tags */}
                {selectedSkill.tags && selectedSkill.tags.length > 0 && (
                  <div className="flex flex-col gap-1 mt-1">
                    <span className="text-[10px] font-bold text-text-secondary uppercase">Tags</span>
                    <div className="flex gap-1.5 flex-wrap">
                      {selectedSkill.tags.map((t) => (
                        <span key={t} className="rounded bg-background border border-border px-2 py-0.5 text-[9px] font-bold text-text-secondary uppercase tracking-wide">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 text-center text-text-secondary h-full">
              <Wrench className="h-10 w-10 text-border mb-3" />
              <p className="text-xs font-bold text-text-primary">No skill selected.</p>
              <p className="text-[10px] text-text-secondary/60 mt-0.5">Click any skill capability on the left column to view its execution blueprint.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
