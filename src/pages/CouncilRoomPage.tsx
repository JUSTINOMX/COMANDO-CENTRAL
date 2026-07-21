import React, { useState, useEffect, useRef } from "react";
import { 
  Send, 
  Loader2, 
  Sparkles, 
  User, 
  BrainCircuit, 
  Terminal, 
  Wrench, 
  Microscope, 
  TrendingUp, 
  Scale, 
  CircleDollarSign, 
  FileText, 
  CheckSquare, 
  Scroll, 
  Trash2,
  Users
} from "lucide-react";
import { ConversationMessage } from "../lib/supabase/client.js";

interface CouncilMinutes {
  resumen: string;
  acuerdos: string[];
  tareas: string[];
  documentos: string[];
}

export default function CouncilRoomPage() {
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [minutes, setMinutes] = useState<CouncilMinutes>({
    resumen: "Sincronizando el acta del consejo...",
    acuerdos: [],
    tareas: [],
    documentos: []
  });
  const [inputText, setInputText] = useState("");
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [currentSpeaker, setCurrentSpeaker] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch messages and minutes
  const loadData = async () => {
    try {
      const msgsRes = await fetch("/api/council/messages");
      if (msgsRes.ok) {
        const msgsData = await msgsRes.json();
        setMessages(msgsData.reverse());
      }

      const minRes = await fetch("/api/council/minutes");
      if (minRes.ok) {
        const minData = await minRes.json();
        setMinutes(minData);
      }
    } catch (err) {
      console.error("Error loading council data:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Auto scroll
  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isSending, currentSpeaker]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isSending) return;

    const userText = inputText.trim();
    setInputText("");
    setIsSending(true);
    setError(null);

    // Optimistic user message update
    const tempUserMsg: ConversationMessage = {
      id: "temp-council-user-" + Date.now(),
      conversation_id: "council_session",
      sender: "Edwin",
      content: userText,
      created_at: new Date().toISOString(),
      message_type: "text"
    };

    setMessages(prev => [...prev, tempUserMsg]);

    try {
      // Determine potential specialized speaker for UI visual cue
      const lowerText = userText.toLowerCase();
      let specialized = "STEVE";
      if (lowerText.includes("marketing") || lowerText.includes("venta") || lowerText.includes("marca") || lowerText.includes("luisa") || lowerText.includes("publicidad")) {
        specialized = "LUISA";
      } else if (lowerText.includes("investig") || lowerText.includes("elon") || lowerText.includes("futuro") || lowerText.includes("ia") || lowerText.includes("ciencia") || lowerText.includes("robot")) {
        specialized = "ELON";
      } else if (lowerText.includes("legal") || lowerText.includes("contrato") || lowerText.includes("justino") || lowerContentHasLegalKeyword(lowerText)) {
        specialized = "JUSTINO";
      }

      // Simulate sequential speaking cues
      setCurrentSpeaker("Neuron Connect");
      await delay(1200);
      setCurrentSpeaker("Commander");
      await delay(1200);
      setCurrentSpeaker(specialized);
      await delay(1000);
      setCurrentSpeaker("DONNA");

      const response = await fetch("/api/council/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: userText, sender: "Edwin" })
      });

      if (!response.ok) {
        throw new Error("El consejo no pudo sincronizarse. Inténtalo de nuevo.");
      }

      const result = await response.json();

      // Replace and update messages
      if (result.responses) {
        setMessages(prev => {
          const filtered = prev.filter(m => m.id !== tempUserMsg.id);
          const userMsgFromDb = result.userMessage || tempUserMsg;
          return [...filtered, userMsgFromDb, ...result.responses];
        });
      } else {
        await loadData();
      }

      if (result.minutes) {
        setMinutes(result.minutes);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Error al comunicarse con la Sala del Consejo.");
    } finally {
      setIsSending(false);
      setCurrentSpeaker(null);
    }
  };

  const handleReset = async () => {
    if (!window.confirm("¿Estás seguro de que deseas reiniciar la sesión del consejo? Se perderá el historial y el acta actual.")) {
      return;
    }

    try {
      const res = await fetch("/api/council/reset", { method: "DELETE" });
      if (res.ok) {
        setMessages([]);
        setMinutes({
          resumen: "Aún no se han iniciado los debates del consejo directivo.",
          acuerdos: [],
          tareas: [],
          documentos: []
        });
      }
    } catch (err) {
      console.error("Error resetting council:", err);
    }
  };

  const lowerContentHasLegalKeyword = (t: string) => {
    return t.includes("ley") || t.includes("justicia") || t.includes("riesgo") || t.includes("patente") || t.includes("derecho");
  };

  const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

  // Render icons helper
  const getAgentEmoji = (name: string) => {
    switch (name) {
      case "Edwin": return "👤";
      case "Neuron Connect": return "🧠";
      case "Commander": return "⚡";
      case "STEVE": return "🛠️";
      case "ELON": return "🔬";
      case "LUISA": return "📈";
      case "JUSTINO": return "⚖️";
      case "DONNA": return "📝";
      default: return "🤖";
    }
  };

  const getAgentColorClasses = (name: string) => {
    switch (name) {
      case "Edwin": return "bg-rose-50 border-rose-100 text-rose-600";
      case "Neuron Connect": return "bg-indigo-50 border-indigo-100 text-indigo-600";
      case "Commander": return "bg-blue-50 border-blue-100 text-blue-600";
      case "STEVE": return "bg-amber-50 border-amber-100 text-amber-600";
      case "ELON": return "bg-purple-50 border-purple-100 text-purple-600";
      case "LUISA": return "bg-emerald-50 border-emerald-100 text-emerald-600";
      case "JUSTINO": return "bg-slate-100 border-slate-200 text-slate-700";
      default: return "bg-gray-50 border-gray-100 text-gray-600";
    }
  };

  const participants = [
    { name: "Edwin", title: "TRISMEGISTO", icon: <User className="h-4 w-4" />, role: "Fundador & Guía", status: "online" },
    { name: "Neuron Connect", title: "NEURON CONNECT", icon: <BrainCircuit className="h-4 w-4" />, role: "Alma y Conciencia", status: "online" },
    { name: "Commander", title: "COMMANDER", icon: <Terminal className="h-4 w-4" />, role: "CEO Operativo", status: "online" },
    { name: "STEVE", title: "STEVE", icon: <Wrench className="h-4 w-4" />, role: "Director de Proyecto", status: "online" },
    { name: "ELON", title: "ELON", icon: <Microscope className="h-4 w-4" />, role: "Director Investigación", status: "online" },
    { name: "LUISA", title: "LUISA", icon: <TrendingUp className="h-4 w-4" />, role: "Directora de Marketing", status: "online" },
    { name: "JUSTINO", title: "JUSTINO", icon: <Scale className="h-4 w-4" />, role: "Director Jurídico", status: "online" },
    { name: "Finanzas", title: "(Vacante)", icon: <CircleDollarSign className="h-4 w-4" />, role: "Director de Finanzas", status: "vacant" },
    { name: "DONNA", title: "DONNA", icon: <Scroll className="h-4 w-4" />, role: "Secretaria de Actas", status: "online" },
  ];

  return (
    <div className="flex h-[calc(100vh-3.5rem)] w-full overflow-hidden bg-gray-50/20">

      {/* Column 1: Participants List (Left) */}
      <div className="hidden xl:flex w-72 shrink-0 flex-col border-r border-border bg-white p-5 justify-between">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-text-secondary" />
              <span className="text-xs font-bold text-text-primary tracking-wide uppercase">Consejo Directivo</span>
            </div>
            <span className="rounded-full bg-[#E8F2FF] px-2 py-0.5 text-[10px] font-bold text-primary">
              9 Miembros
            </span>
          </div>

          <div className="space-y-1.5 overflow-y-auto max-h-[calc(100vh-14rem)] pr-1">
            {participants.map((p, idx) => (
              <div 
                key={idx}
                className={`flex items-center justify-between rounded-xl p-2.5 border transition-all ${
                  p.status === "vacant"
                    ? "bg-gray-50/50 border-gray-100/60 opacity-60"
                    : p.name === currentSpeaker 
                      ? "bg-primary/5 border-primary/20 shadow-xs" 
                      : "bg-white border-border/50 hover:bg-gray-50/50"
                }`}
              >
                <div className="flex items-center gap-3 truncate">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg border shrink-0 ${
                    p.status === "vacant" 
                      ? "bg-gray-100 border-gray-200 text-gray-400" 
                      : p.name === currentSpeaker 
                        ? "bg-primary text-white border-primary" 
                        : "bg-gray-50 border-border/60 text-text-secondary"
                  }`}>
                    {p.status === "vacant" ? "🔒" : getAgentEmoji(p.name)}
                  </div>
                  <div className="truncate">
                    <h4 className="text-xs font-bold text-text-primary truncate">{p.title}</h4>
                    <p className="text-[10px] font-semibold text-text-secondary truncate">{p.role}</p>
                  </div>
                </div>

                <div className="flex items-center shrink-0 pl-1">
                  {p.status === "online" && (
                    <span className={`h-2 w-2 rounded-full ${p.name === currentSpeaker ? "bg-primary animate-ping" : "bg-[#30D158]"}`} />
                  )}
                  {p.status === "vacant" && (
                    <span className="text-[9px] font-bold text-[#8E8E93] bg-gray-100 px-1 py-0.2 rounded">Por designar</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={handleReset}
          className="flex items-center justify-center gap-2 rounded-xl border border-red-200 hover:bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 transition-all cursor-pointer"
        >
          <Trash2 className="h-4 w-4" />
          <span>Reiniciar Debate</span>
        </button>
      </div>

      {/* Column 2: Live Debate (Center Chat) */}
      <div className="flex flex-1 flex-col overflow-hidden bg-white">
        
        {/* Chat Feed */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-5 space-y-4"
          id="council-chat-feed"
        >
          {loadingHistory ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
              <span className="text-xs font-semibold text-text-secondary">Conectando canales del Consejo Directivo...</span>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center p-8 text-text-secondary">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E8F2FF] border border-primary/10 text-primary mb-4 animate-bounce">
                <Scroll className="h-7 w-7" />
              </div>
              <h3 className="text-sm font-bold text-text-primary">Sala del Consejo Directivo de AutoClaw</h3>
              <p className="text-xs text-[#8E8E93] font-semibold mt-1 max-w-sm leading-relaxed">
                Envía tu propuesta o tema estratégico de discusión. El alma del sistema (Neuron), el CEO operativo (Commander) y tus directores debatirán secuencialmente y DONNA generará los acuerdos en tiempo real.
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const isUser = msg.sender === "Edwin" || msg.sender === "Edwin (Admin)";
              return (
                <div 
                  key={msg.id}
                  className={`flex w-full gap-3 py-1 ${isUser ? "flex-row-reverse" : "flex-row"} animate-in fade-in duration-200`}
                >
                  {/* Avatar */}
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-[10px] font-bold ${
                    getAgentColorClasses(msg.sender)
                  }`}>
                    {getAgentEmoji(msg.sender)}
                  </div>

                  {/* Bubble */}
                  <div className="flex flex-col gap-1 max-w-[80%] sm:max-w-[70%]">
                    <div className={`flex items-center gap-2 text-[10px] font-bold text-text-secondary ${isUser ? "justify-end" : "justify-start"}`}>
                      <span>{isUser ? "TRISMEGISTO (Edwin)" : msg.sender}</span>
                      {msg.created_at && (
                        <span className="text-[9px] font-mono font-medium opacity-60">
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                    
                    <div className={`rounded-2xl px-4 py-2.5 shadow-xs text-xs font-semibold leading-relaxed ${
                      isUser
                        ? "bg-primary text-white rounded-tr-none"
                        : "bg-gray-50 text-text-primary border border-border/80 rounded-tl-none whitespace-pre-wrap"
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                </div>
              );
            })
          )}

          {/* Sequential speaker typing indicators */}
          {isSending && currentSpeaker && (
            <div className="flex gap-3 py-1 animate-in fade-in duration-200">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border bg-primary/5 text-primary">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
              <div className="flex flex-col gap-1 max-w-[70%]">
                <span className="text-[10px] font-bold text-text-secondary">{currentSpeaker}</span>
                <div className="rounded-2xl rounded-tl-none bg-gray-50 border border-border/80 px-4 py-2.5 shadow-xs flex items-center gap-2">
                  <span className="text-xs font-semibold text-text-secondary animate-pulse">
                    {currentSpeaker === "DONNA" ? "DONNA redactando acuerdos de la sesión..." : `Intervención de ${currentSpeaker}...`}
                  </span>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50/50 p-3 text-xs text-red-600 font-semibold">
              {error}
            </div>
          )}
        </div>

        {/* Input panel */}
        <form onSubmit={handleSend} className="p-4 border-t border-border/60 bg-gray-50/30 flex items-center gap-3">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isSending}
            placeholder="Introduce propuesta estratégica para debatir en el Consejo..."
            className="flex-1 rounded-xl border border-border bg-white px-4 py-2.5 text-xs font-semibold text-text-primary placeholder-[#8E8E93]/80 focus:border-primary focus:outline-none transition-colors"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isSending}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white hover:bg-primary-dark disabled:opacity-40 transition-all shadow-sm shrink-0 cursor-pointer"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>

      </div>

      {/* Column 3: DONNA's Minutes Board (Right) */}
      <div className="hidden lg:flex w-80 shrink-0 flex-col border-l border-border bg-white p-5 space-y-4 overflow-y-auto">
        <div className="flex items-center gap-2 pb-2 border-b border-border/60">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 shrink-0">
            📝
          </div>
          <div>
            <h3 className="text-xs font-bold text-text-primary tracking-tight">El Acta de DONNA</h3>
            <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">Secretaría de Actas</p>
          </div>
        </div>

        {/* Executive Summary */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-text-secondary uppercase tracking-widest">
            <Scroll className="h-3.5 w-3.5 text-indigo-500" />
            <span>Resumen Ejecutivo</span>
          </div>
          <div className="rounded-xl bg-gray-50 border border-border/80 p-3.5 text-xs font-semibold text-text-secondary leading-relaxed">
            {minutes.resumen}
          </div>
        </div>

        {/* Formal Agreements */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-text-secondary uppercase tracking-widest">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            <span>Acuerdos Tomados</span>
          </div>
          {minutes.acuerdos && minutes.acuerdos.length > 0 ? (
            <div className="space-y-1.5">
              {minutes.acuerdos.map((acr, idx) => (
                <div key={idx} className="flex gap-2 items-start text-xs font-semibold text-text-primary p-2 bg-amber-50/30 border border-amber-100/60 rounded-lg">
                  <span className="text-amber-500 shrink-0">★</span>
                  <span>{acr}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[11px] font-semibold text-text-secondary/60 italic pl-1">Sin acuerdos registrados aún.</p>
          )}
        </div>

        {/* Pending Tasks */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-text-secondary uppercase tracking-widest">
            <CheckSquare className="h-3.5 w-3.5 text-emerald-500" />
            <span>Asignación de Tareas</span>
          </div>
          {minutes.tareas && minutes.tareas.length > 0 ? (
            <div className="space-y-1.5">
              {minutes.tareas.map((tr, idx) => (
                <div key={idx} className="flex gap-2 items-start text-xs font-semibold text-text-primary p-2 bg-emerald-50/30 border border-emerald-100/60 rounded-lg">
                  <span className="text-emerald-500 shrink-0">✓</span>
                  <span>{tr}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[11px] font-semibold text-text-secondary/60 italic pl-1">Sin tareas asignadas aún.</p>
          )}
        </div>

        {/* Required Documents */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-text-secondary uppercase tracking-widest">
            <FileText className="h-3.5 w-3.5 text-blue-500" />
            <span>Documentos Requeridos</span>
          </div>
          {minutes.documentos && minutes.documentos.length > 0 ? (
            <div className="space-y-1.5">
              {minutes.documentos.map((dc, idx) => (
                <div key={idx} className="flex gap-2 items-start text-xs font-semibold text-[#1D1D1F] p-2 bg-blue-50/30 border border-blue-100/60 rounded-lg">
                  <span className="text-blue-500 shrink-0">📁</span>
                  <span>{dc}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[11px] font-semibold text-text-secondary/60 italic pl-1">Sin documentos generados aún.</p>
          )}
        </div>
      </div>

    </div>
  );
}
