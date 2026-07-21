import React, { useState, useRef, ChangeEvent } from "react";
import { Send, Paperclip, FileText, X, FolderKanban, Layers } from "lucide-react";
import { Project } from "../../lib/supabase/client.js";

interface AgentChatInputProps {
  onSendMessage: (
    content: string,
    file?: { name: string; content: string },
    projectId?: string,
    documentType?: string
  ) => void;
  projects: Project[];
  defaultProjectId?: string;
  disabled?: boolean;
}

export default function AgentChatInput({ onSendMessage, projects, defaultProjectId, disabled }: AgentChatInputProps) {
  const [text, setText] = useState("");
  const [attachedFile, setAttachedFile] = useState<{ name: string; content: string } | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(defaultProjectId || "");
  const [selectedDocType, setSelectedDocType] = useState<string>("antecedentes");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Set default project ID if list loads and default is not yet set
  if (!selectedProjectId && projects.length > 0) {
    setSelectedProjectId(projects[0].id);
  }

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() && !attachedFile) return;

    onSendMessage(
      text,
      attachedFile || undefined,
      attachedFile ? selectedProjectId : undefined,
      attachedFile ? selectedDocType : undefined
    );

    // Reset fields
    setText("");
    setAttachedFile(null);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const fileContent = event.target?.result as string;
      setAttachedFile({
        name: file.name,
        content: fileContent || ""
      });
    };
    reader.readAsText(file);
  };

  const removeAttachment = () => {
    setAttachedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  return (
    <div className="border-t border-border bg-white p-4">
      <form onSubmit={handleSend} className="flex flex-col gap-3">
        {/* Attachment Options Drawer */}
        {attachedFile && (
          <div className="flex flex-col gap-2 rounded-xl border border-[#0A84FF]/25 bg-[#E8F2FF]/40 p-3 animate-in slide-in-from-bottom-2 duration-150">
            {/* Selected File Name & Remove Button */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <FileText className="h-4.5 w-4.5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-text-primary truncate max-w-sm sm:max-w-md">
                    {attachedFile.name}
                  </span>
                  <span className="text-[10px] font-semibold text-text-secondary">
                    Archivo de texto cargado
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={removeAttachment}
                className="rounded-full p-1 text-[#8E8E93] hover:bg-gray-100 hover:text-text-primary transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Inline Project Filing Selectors */}
            <div className="flex flex-wrap items-center gap-4 border-t border-border/40 pt-2 text-[11px] font-bold text-text-secondary">
              {/* Project Selector */}
              <div className="flex items-center gap-1.5">
                <FolderKanban className="h-3.5 w-3.5 text-[#8E8E93]" />
                <span>Asociar al proyecto:</span>
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="rounded-md border border-border bg-white px-2 py-1 font-semibold text-text-primary focus:border-primary focus:outline-none"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Section Selector */}
              <div className="flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-[#8E8E93]" />
                <span>Guardar en:</span>
                <select
                  value={selectedDocType}
                  onChange={(e) => setSelectedDocType(e.target.value)}
                  className="rounded-md border border-border bg-white px-2 py-1 font-semibold text-text-primary focus:border-primary focus:outline-none"
                >
                  <option value="antecedentes">Antecedentes</option>
                  <option value="extracciones">Extracciones</option>
                  <option value="reportes">Reportes</option>
                  <option value="conclusiones">Conclusiones</option>
                  <option value="marketing">Marketing</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Action Controls & Main Input */}
        <div className="flex items-end gap-3">
          {/* File Picker Toggle */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-white text-[#8E8E93] hover:text-primary hover:border-primary/20 hover:bg-primary/5 transition-all"
            title="Adjuntar archivo y archivar en proyecto"
          >
            <Paperclip className="h-5 w-5" />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".txt,.json,.md,.csv,.ts,.js,.html,.css,.xml"
            className="hidden"
          />

          {/* Chat Field */}
          <div className="relative flex-1">
            <textarea
              rows={1}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyPress}
              disabled={disabled}
              placeholder={`Escribe un mensaje para ${disabled ? "un agente vacante..." : "el agente..."}`}
              className="w-full resize-none rounded-xl border border-border bg-[#F5F5F7]/50 py-2.5 pl-4 pr-12 text-xs font-semibold text-text-primary focus:border-primary focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary/20 disabled:opacity-50 transition-all min-h-[40px] max-h-[120px]"
            />
            {/* Submit Button */}
            <button
              type="submit"
              disabled={disabled || (!text.trim() && !attachedFile)}
              className="absolute right-2.5 bottom-2.5 flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-white shadow-sm hover:opacity-90 disabled:opacity-30 disabled:pointer-events-none transition-all"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
