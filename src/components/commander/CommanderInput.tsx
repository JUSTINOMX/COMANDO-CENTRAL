import React, { useState } from "react";
import { Send, Paperclip, Sparkles, Loader2 } from "lucide-react";
import { Project } from "../../lib/supabase/client.js";
import FileAttacher from "./FileAttacher.js";

interface CommanderInputProps {
  projects: Project[];
  onSendMessage: (content: string, file: File | null, projectId?: string, section?: string) => Promise<void>;
  isSending: boolean;
}

export default function CommanderInput({ projects, onSendMessage, isSending }: CommanderInputProps) {
  const [content, setContent] = useState("");
  const [showAttacher, setShowAttacher] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [selectedSection, setSelectedSection] = useState("antecedentes");

  const handleFileSelect = (file: File | null, projectId?: string, section?: string) => {
    setSelectedFile(file);
    if (projectId !== undefined) setSelectedProjectId(projectId);
    if (section !== undefined) setSelectedSection(section);
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!content.trim() && !selectedFile) return;

    try {
      await onSendMessage(
        content.trim(),
        selectedFile,
        selectedProjectId || undefined,
        selectedSection
      );

      // Reset state on success
      setContent("");
      setSelectedFile(null);
      setSelectedProjectId("");
      setSelectedSection("antecedentes");
      setShowAttacher(false);
    } catch (err) {
      console.error("Error sending commander message:", err);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col gap-2.5 sm:gap-3.5 border-t border-border bg-white p-2.5 sm:p-4 shadow-sm">
      {/* File Attacher Widget */}
      {showAttacher && (
        <div className="animate-in slide-in-from-bottom-2 duration-150">
          <FileAttacher
            projects={projects}
            onFileSelect={handleFileSelect}
            selectedFile={selectedFile}
            selectedProjectId={selectedProjectId}
            setSelectedProjectId={setSelectedProjectId}
            selectedSection={selectedSection}
            setSelectedSection={setSelectedSection}
          />
        </div>
      )}

      {/* Main input container */}
      <form onSubmit={handleSend} className="flex items-end gap-3" id="commander-message-form">
        <button
          type="button"
          onClick={() => setShowAttacher(!showAttacher)}
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-all cursor-pointer ${
            showAttacher || selectedFile
              ? "border-primary bg-primary/10 text-primary"
              : "border-border bg-[#F5F5F7] text-text-secondary hover:bg-gray-100"
          }`}
          title="Adjuntar archivo o documento"
          id="toggle-attachment-button"
        >
          <Paperclip className="h-4.5 w-4.5" />
        </button>

        <div className="relative flex flex-1 items-center">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              selectedFile
                ? "Añade instrucciones sobre este documento o presiona enviar..."
                : "Escribe tus comandos, preferencias, o consulta a Commander..."
            }
            rows={1}
            disabled={isSending}
            className="w-full resize-none rounded-xl border border-border bg-[#F5F5F7] py-2.5 pl-4 pr-10 text-sm text-text-primary outline-none focus:border-primary focus:bg-white min-h-[42px] max-h-24 leading-relaxed font-sans font-medium"
            id="commander-message-input"
          />
          <div className="absolute right-3 top-3 text-primary/50">
            <Sparkles className="h-4 w-4 animate-pulse" />
          </div>
        </div>

        <button
          type="submit"
          disabled={isSending || (!content.trim() && !selectedFile)}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-white shadow-md shadow-primary/20 hover:bg-primary-dark disabled:bg-gray-200 disabled:text-text-secondary/50 disabled:shadow-none transition-all cursor-pointer"
          id="submit-commander-message"
        >
          {isSending ? (
            <Loader2 className="h-4.5 w-4.5 animate-spin" />
          ) : (
            <Send className="h-4.5 w-4.5" />
          )}
        </button>
      </form>
    </div>
  );
}
