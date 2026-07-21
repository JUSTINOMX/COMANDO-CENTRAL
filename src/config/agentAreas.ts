import { AgentArea } from "../types/agents.js";

export const AGENT_AREAS: AgentArea[] = [
  {
    id: "estrategico",
    name: "ESTRATÉGICO",
    icon: "🔝",
    agents: [
      { name: "neuron-connect", displayName: "NEURON CONNECT", role: "alma", status: "active", source: "native" },
      { name: "commander", displayName: "COMMANDER", role: "ceo", status: "active", source: "native" },
      { name: "steve", displayName: "STEVE", role: "director-proyecto", status: "active", source: "native" },
    ]
  },
  {
    id: "investigacion",
    name: "INVESTIGACIÓN",
    icon: "🔬",
    agents: [
      { name: "elon", displayName: "ELON", role: "investigador", status: "active", source: "native" },
      ...Array(1).fill(null).map((_, i) => ({
        name: `vacante-investigacion-${i + 1}`,
        displayName: "─ Vacante ─",
        role: "",
        status: "vacant" as const
      }))
    ]
  },
  {
    id: "desarrollo",
    name: "DESARROLLO",
    icon: "💻",
    agents: [
      { name: "auto-designer", displayName: "Auto Designer", role: "diseñador", status: "active", source: "native" },
      { name: "gpt-code-reviewer", displayName: "GPT Code Reviewer", role: "reviewer", status: "active", source: "github" },
      { name: "auto-deploy", displayName: "Auto Deploy", role: "deployer", status: "active", source: "native" }
    ]
  },
  {
    id: "marketing",
    name: "MARKETING",
    icon: "📈",
    agents: [
      { name: "nikitta", displayName: "NIKITTA", role: "marketing", status: "active", source: "native" },
      { name: "luisa", displayName: "LUISA", role: "directora-marketing", status: "active", source: "native" },
      ...Array(8).fill(null).map((_, i) => ({
        name: `vacante-marketing-${i + 1}`,
        displayName: "─ Vacante ─",
        role: "",
        status: "vacant" as const
      }))
    ]
  },
  {
    id: "vision",
    name: "VISIÓN",
    icon: "🔮",
    agents: [
      ...Array(2).fill(null).map((_, i) => ({
        name: `vacante-vision-${i + 1}`,
        displayName: "─ Vacante ─",
        role: "",
        status: "vacant" as const
      }))
    ]
  },
  {
    id: "management",
    name: "MANAGEMENT",
    icon: "📋",
    agents: [
      { name: "justino", displayName: "JUSTINO", role: "director-juridico", status: "active", source: "native" },
      { name: "donna", displayName: "DONNA", role: "secretaria-consejo", status: "active", source: "native" },
      ...Array(1).fill(null).map((_, i) => ({
        name: `vacante-management-${i + 1}`,
        displayName: "─ Vacante ─",
        role: "",
        status: "vacant" as const
      }))
    ]
  }
];
