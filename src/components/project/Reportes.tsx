import React, { useState } from "react";
import { BarChart3, Plus, FileSpreadsheet, Calendar, PenTool } from "lucide-react";
import { ProjectReport, apiClient } from "../../lib/supabase/client.js";

interface ReportesProps {
  projectId: string;
  reportes: ProjectReport[];
  onRefresh: () => void;
}

export default function Reportes({ projectId, reportes, onRefresh }: ReportesProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [fileName, setFileName] = useState("");
  const [content, setContent] = useState("");
  const [reportType, setReportType] = useState("general");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !fileName.trim() || !content.trim()) return;

    setIsSubmitting(true);
    try {
      await apiClient.addReport(projectId, title, fileName, content, reportType);
      setTitle("");
      setFileName("");
      setContent("");
      setReportType("general");
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
        <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">Project Reports</h3>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-primary-dark transition-all cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>New Report</span>
        </button>
      </div>

      {/* Report formulation block */}
      {isOpen && (
        <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-white p-5 shadow-sm animate-in fade-in slide-in-from-top-3 duration-200">
          <h4 className="text-xs font-bold text-text-primary mb-3 flex items-center gap-2 uppercase tracking-wide">
            <PenTool className="h-4 w-4 text-primary" />
            <span>Generate / Compile New Report</span>
          </h4>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 mb-3">
            <div className="flex flex-col gap-1 col-span-1 sm:col-span-2">
              <label className="text-[10px] font-bold text-text-secondary uppercase">Report Title</label>
              <input
                type="text"
                placeholder="e.g. Análisis de Competidores Q3"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="rounded-lg border border-border bg-background px-3 py-2 text-xs outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/15"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-text-secondary uppercase">Report Type</label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="rounded-lg border border-border bg-background px-3 py-2 text-xs outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/15"
              >
                <option value="general">General Summary</option>
                <option value="market_analysis">Market Analysis</option>
                <option value="technical_architecture">Technical Specs</option>
                <option value="legal">Legal Auditing</option>
              </select>
            </div>
          </div>
          <div className="flex flex-col gap-1 mb-3">
            <label className="text-[10px] font-bold text-text-secondary uppercase">Filename</label>
            <input
              type="text"
              placeholder="e.g. competitor_report_v1.txt"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              required
              className="rounded-lg border border-border bg-background px-3 py-2 text-xs outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/15"
            />
          </div>
          <div className="flex flex-col gap-1 mb-4">
            <label className="text-[10px] font-bold text-text-secondary uppercase">Report Body Content</label>
            <textarea
              placeholder="Escribe el cuerpo del reporte, recomendaciones y notas aquí..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              rows={5}
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
              className="rounded-lg bg-primary px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-primary-dark disabled:bg-gray-200 cursor-pointer"
            >
              {isSubmitting ? "Compiling..." : "Save Report"}
            </button>
          </div>
        </form>
      )}

      {/* Reports Table list */}
      <div className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
        {reportes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-text-secondary">
            <BarChart3 className="h-8 w-8 text-border mb-2" />
            <p className="text-xs font-bold">No reports generated.</p>
            <p className="text-[10px] text-text-secondary/60 mt-0.5">Click "New Report" to register your analysis outputs.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border bg-[#E8F2FF] text-[#0066CC] font-bold uppercase tracking-wider">
                  <th className="p-3.5 pl-4">Report Title</th>
                  <th className="p-3.5">Filename</th>
                  <th className="p-3.5">Type</th>
                  <th className="p-3.5 pr-4 text-right">Size</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {reportes.map((r) => (
                  <tr key={r.id} className="hover:bg-background transition-colors">
                    <td className="p-3.5 pl-4 font-bold text-text-primary flex items-center gap-2">
                      <FileSpreadsheet className="h-4 w-4 text-primary shrink-0" />
                      <span>{r.title}</span>
                    </td>
                    <td className="p-3.5 font-mono text-text-secondary">{r.file_name}</td>
                    <td className="p-3.5">
                      <span className="rounded bg-[#EAFDF0] border border-[#30D158]/10 px-2 py-0.5 text-[9px] font-bold text-[#248A3D] uppercase">
                        {(r.report_type || "general").replace("_", " ")}
                      </span>
                    </td>
                    <td className="p-3.5 pr-4 text-right font-bold text-text-secondary/80">
                      {r.content ? `${Math.ceil(r.content.length / 1024)} KB` : "0 KB"}
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
