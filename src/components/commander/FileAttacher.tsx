import React, { useRef, useState } from "react";
import { Upload, X, FileText, Check } from "lucide-react";
import { Project } from "../../lib/supabase/client.js";

interface FileAttacherProps {
  projects: Project[];
  onFileSelect: (file: File | null, projectId?: string, section?: string) => void;
  selectedFile: File | null;
  selectedProjectId: string;
  setSelectedProjectId: (id: string) => void;
  selectedSection: string;
  setSelectedSection: (sec: string) => void;
}

export default function FileAttacher({
  projects,
  onFileSelect,
  selectedFile,
  selectedProjectId,
  setSelectedProjectId,
  selectedSection,
  setSelectedSection,
}: FileAttacherProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      onFileSelect(file, selectedProjectId, selectedSection);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      onFileSelect(file, selectedProjectId, selectedSection);
    }
  };

  const triggerSelect = () => {
    fileInputRef.current?.click();
  };

  const removeFile = () => {
    onFileSelect(null, "", "antecedentes");
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  return (
    <div className="w-full">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept=".txt,.md,.pdf,.doc,.docx,.json,.csv,.xml,.png,.jpg,.jpeg"
      />

      {!selectedFile ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={triggerSelect}
          className={`flex flex-col items-center justify-center rounded-xl border border-dashed p-4 text-center transition-all cursor-pointer ${
            isDragging
              ? "border-primary bg-primary/5 text-primary"
              : "border-border bg-[#F5F5F7] text-text-secondary hover:border-primary/50 hover:bg-white"
          }`}
          id="file-drop-zone"
        >
          <Upload className="h-5 w-5 mb-1.5 text-primary/80" />
          <p className="text-xs font-bold text-text-primary">
            Arrastra archivos aquí o haz clic para explorar
          </p>
          <p className="text-[10px] text-text-secondary/80 mt-0.5">
            Soporta PDFs, Texto, JSON, CSV, Imágenes (Máx 15MB)
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-[#F5F5F7] p-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-start justify-between gap-3 border-b border-border/60 pb-2.5 mb-2.5">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 border border-primary/20 text-primary">
                <FileText className="h-4.5 w-4.5" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-text-primary truncate max-w-[200px]">
                  {selectedFile.name}
                </span>
                <span className="text-[9px] font-mono text-text-secondary">
                  {formatSize(selectedFile.size)}
                </span>
              </div>
            </div>

            <button
              onClick={removeFile}
              className="rounded-full bg-white p-1 hover:bg-gray-100 text-text-secondary border border-border transition-all cursor-pointer"
              id="remove-file-button"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {/* Project association select */}
            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-bold text-text-secondary uppercase tracking-wider">
                Asociar a Proyecto
              </label>
              <select
                value={selectedProjectId}
                onChange={(e) => {
                  setSelectedProjectId(e.target.value);
                  onFileSelect(selectedFile, e.target.value, selectedSection);
                }}
                className="rounded-lg border border-border bg-white px-2.5 py-1.5 text-xs text-text-primary font-medium outline-none focus:border-primary cursor-pointer"
                id="associate-project-select"
              >
                <option value="">🔮 Inferir automáticamente / Ninguno</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    📁 {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Section classification select */}
            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-bold text-text-secondary uppercase tracking-wider">
                Tipo de Documento
              </label>
              <select
                value={selectedSection}
                onChange={(e) => {
                  setSelectedSection(e.target.value);
                  onFileSelect(selectedFile, selectedProjectId, e.target.value);
                }}
                className="rounded-lg border border-border bg-white px-2.5 py-1.5 text-xs text-text-primary font-medium outline-none focus:border-primary cursor-pointer"
                id="document-type-select"
              >
                <option value="antecedentes">📄 Antecedente (Análisis)</option>
                <option value="extracciones">📊 Extracción (Datos)</option>
                <option value="reportes">📈 Reporte (Seguimiento)</option>
                <option value="conclusiones">💡 Conclusión (Cierre)</option>
                <option value="marketing">📣 Marketing (Activos)</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
