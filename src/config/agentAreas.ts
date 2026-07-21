import { AgentArea } from "../types/agents.js";

export const AGENT_AREAS: AgentArea[] = [
  {
    id: "investigacion",
    name: "INVESTIGACIÓN",
    icon: "🔬",
    agents: [
      { name: "steve", displayName: "STEVE", role: "investigador", status: "active", source: "native" },
      { name: "elon", displayName: "ELON", role: "analista", status: "active", source: "native" },
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
      ...Array(9).fill(null).map((_, i) => ({
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
      ...Array(3).fill(null).map((_, i) => ({
        name: `vacante-management-${i + 1}`,
        displayName: "─ Vacante ─",
        role: "",
        status: "vacant" as const
      }))
    ]
  }
];
