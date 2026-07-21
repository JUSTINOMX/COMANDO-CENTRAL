import React, { useState } from "react";
import { FileText, Plus, Upload, Tag, Calendar } from "lucide-react";
import { ProjectAntecedente, apiClient } from "../../lib/supabase/client.js";

interface AntecedentesProps {
  projectId: string;
  antecedentes: ProjectAntecedente[];
  onRefresh: () => void;
}

export default function Antecedentes({ projectId, antecedentes, onRefresh }: AntecedentesProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [fileName, setFileName] = useState("");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !fileName.trim() || !content.trim()) return;

    setIsSubmitting(true);
    try {
      await apiClient.addAntecedente(projectId, title, fileName, content);
      setTitle("");
      setFileName("");
      setContent("");
      setIsOpen(false);
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">Project Files & Antecedentes</h3>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1.5 rounded-lg bg-[#30D158] px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#248A3D] transition-all cursor-pointer"
        >
          <Upload className="h-3.5 w-3.5" />
          <span>Upload Antecedente</span>
        </button>
      </div>

      {/* Upload Form */}
      {isOpen && (
        <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-white p-5 shadow-sm animate-in fade-in slide-in-from-top-3 duration-200">
          <h4 className="text-xs font-bold text-text-primary mb-3 uppercase tracking-wide">Register New File / Document</h4>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 mb-3">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-text-secondary uppercase">Document Title</label>
              <input
                type="text"
                placeholder="e.g. Especificaciones Técnicas"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="rounded-lg border border-border bg-background px-3 py-2 text-xs outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/15"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-text-secondary uppercase">File Name</label>
              <input
                type="text"
                placeholder="e.g. specs_v1.txt"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                required
                className="rounded-lg border border-border bg-background px-3 py-2 text-xs outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/15"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1 mb-4">
            <label className="text-[10px] font-bold text-text-secondary uppercase">Content / Raw Text Data</label>
            <textarea
              placeholder="Escribe el contenido o pega el documento aquí..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              rows={4}
              className="rounded-lg border border-border bg-background px-3 py-2 text-xs outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/15 resize-y"
            />
          </div>
          <div className="flex items-center gap-2 justify-end">
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
              className="rounded-lg bg-[#30D158] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#248A3D] disabled:bg-gray-200 cursor-pointer"
            >
              {isSubmitting ? "Uploading..." : "Save Document"}
            </button>
          </div>
        </form>
      )}

      {/* Antecedentes Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
        {antecedentes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-text-secondary">
            <FileText className="h-8 w-8 text-border mb-2" />
            <p className="text-xs font-bold">No documents uploaded.</p>
            <p className="text-[10px] text-text-secondary/60 mt-0.5">Click "Upload Antecedente" to register project materials.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border bg-[#E8F2FF] text-[#0066CC] font-bold uppercase tracking-wider">
                  <th className="p-3.5 pl-4">Title</th>
                  <th className="p-3.5">Filename</th>
                  <th className="p-3.5">Mime Type</th>
                  <th className="p-3.5 pr-4 text-right">Size</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {antecedentes.map((a) => (
                  <tr key={a.id} className="hover:bg-background transition-colors">
                    <td className="p-3.5 pl-4 font-bold text-text-primary flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary shrink-0" />
                      <span>{a.title}</span>
                    </td>
                    <td className="p-3.5 font-mono text-text-secondary">{a.file_name}</td>
                    <td className="p-3.5 text-text-secondary">
                      <span className="rounded bg-background px-1.5 py-0.5 text-[9px] font-bold text-text-secondary border border-border">
                        {a.mime_type || "text/plain"}
                      </span>
                    </td>
                    <td className="p-3.5 pr-4 text-right font-bold text-text-secondary/80">
                      {a.content ? `${Math.ceil(a.content.length / 1024)} KB` : "0 KB"}
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
