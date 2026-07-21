import path from "path";

export interface GitHubRepoInfo {
  full_name: string;
  description: string;
  language: string;
  topics: string[];
  stars: number;
  html_url: string;
  default_branch: string;
  license?: { name: string };
}

export interface DetectedAgent {
  name: string;
  displayName: string;
  role: string;
  description: string;
  soulContent?: string;
  skills?: DetectedSkill[];
  config?: Record<string, any>;
}

export interface DetectedSkill {
  name: string;
  description: string;
  longDescription?: string;
  category?: string;
  tags?: string[];
}

export interface ScanResult {
  valid: boolean;
  repo: GitHubRepoInfo;
  agents: DetectedAgent[];
  skills: DetectedSkill[];
  hasAgentConfig: boolean;
  error?: string;
}

export class GitHubScanner {
  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      "Accept": "application/vnd.github.v3+json",
      "User-Agent": "autoclaw-agent-installer"
    };
    if (process.env.GITHUB_TOKEN) {
      headers["Authorization"] = `token ${process.env.GITHUB_TOKEN}`;
    }
    return headers;
  }

  public parseUrl(repoUrl: string): { owner: string; repo: string } {
    try {
      // Handles formats like:
      // https://github.com/owner/repo
      // git@github.com:owner/repo.git
      // owner/repo
      let clean = repoUrl.trim().replace(/\/$/, "");
      if (clean.includes("github.com/")) {
        const parts = clean.split("github.com/")[1].split("/");
        if (parts.length >= 2) {
          return { owner: parts[0], repo: parts[1].replace(/\.git$/, "") };
        }
      } else if (clean.includes("git@github.com:")) {
        const parts = clean.split("git@github.com:")[1].split("/");
        if (parts.length >= 2) {
          return { owner: parts[0], repo: parts[1].replace(/\.git$/, "") };
        }
      } else {
        const parts = clean.split("/");
        if (parts.length === 2) {
          return { owner: parts[0], repo: parts[1] };
        }
      }
      throw new Error("Invalid GitHub URL format");
    } catch (err: any) {
      throw new Error(`Could not parse GitHub URL '${repoUrl}': ${err.message}`);
    }
  }

  public async scan(repoUrl: string): Promise<ScanResult> {
    try {
      const { owner, repo } = this.parseUrl(repoUrl);

      // 1. Fetch Repository Info
      const repoApiUrl = `https://api.github.com/repos/${owner}/${repo}`;
      const repoRes = await fetch(repoApiUrl, { headers: this.getHeaders() });
      if (!repoRes.ok) {
        if (repoRes.status === 404) {
          throw new Error("El repositorio no existe o es privado");
        }
        throw new Error(`GitHub API error: ${repoRes.statusText}`);
      }
      const repoData = await repoRes.json();

      const repoInfo: GitHubRepoInfo = {
        full_name: repoData.full_name,
        description: repoData.description || "Sin descripción disponible",
        language: repoData.language || "TypeScript",
        topics: repoData.topics || [],
        stars: repoData.stargazers_count || 0,
        html_url: repoData.html_url,
        default_branch: repoData.default_branch || "main",
        license: repoData.license ? { name: repoData.license.name } : undefined
      };

      // 2. Try to search config files in order of priority
      const configFiles = [
        "agents.json",
        "autoclaw.json",
        "agentes/agents.json",
        ".autoclaw/agents.json",
        "agentes.yaml" // Just in case, but we focus on JSON for parsing
      ];

      for (const filePath of configFiles) {
        const fileContent = await this.fetchFile(owner, repo, filePath);
        if (fileContent) {
          try {
            const parsed = this.parseAgentConfig(fileContent, filePath);
            if (parsed.agents.length > 0) {
              return {
                valid: true,
                repo: repoInfo,
                agents: parsed.agents,
                skills: parsed.skills,
                hasAgentConfig: true
              };
            }
          } catch (e) {
            console.warn(`Error parsing config file ${filePath}:`, e);
          }
        }
      }

      // 3. Fallback: Search for *.agent.json files recursively
      const allFiles = await this.listAllFilesRecursively(owner, repo, repoInfo.default_branch);
      const agentJsonPaths = allFiles.filter(p => p.endsWith(".agent.json") || (p.startsWith("agentes/") && p.endsWith(".json") && p !== "agentes/agents.json"));

      const detectedAgents: DetectedAgent[] = [];
      const detectedSkills: DetectedSkill[] = [];

      for (const agentPath of agentJsonPaths) {
        const content = await this.fetchFile(owner, repo, agentPath);
        if (content) {
          try {
            const agentObj = JSON.parse(content);
            const agent = this.normalizeSingleAgent(agentObj);
            if (agent) {
              detectedAgents.push(agent);
              if (agent.skills) {
                detectedSkills.push(...agent.skills);
              }
            }
          } catch (e) {
            console.warn(`Error parsing agent file ${agentPath}:`, e);
          }
        }
      }

      if (detectedAgents.length > 0) {
        return {
          valid: true,
          repo: repoInfo,
          agents: detectedAgents,
          skills: detectedSkills,
          hasAgentConfig: true
        };
      }

      // No agents found
      return {
        valid: true,
        repo: repoInfo,
        agents: [],
        skills: [],
        hasAgentConfig: false
      };
    } catch (err: any) {
      return {
        valid: false,
        repo: {
          full_name: "",
          description: "",
          language: "",
          topics: [],
          stars: 0,
          html_url: repoUrl,
          default_branch: "main"
        },
        agents: [],
        skills: [],
        hasAgentConfig: false,
        error: err.message || "Unknown error during scan"
      };
    }
  }

  private async fetchFile(owner: string, repo: string, path: string): Promise<string | null> {
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
    try {
      const response = await fetch(url, { headers: this.getHeaders() });
      if (!response.ok) return null;
      const data = await response.json();
      if (data.type === "file" && data.content) {
        return Buffer.from(data.content, "base64").toString("utf-8");
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  private async listAllFilesRecursively(owner: string, repo: string, branch: string): Promise<string[]> {
    const url = `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`;
    try {
      const response = await fetch(url, { headers: this.getHeaders() });
      if (!response.ok) return [];
      const data = await response.json();
      if (data.tree && Array.isArray(data.tree)) {
        return data.tree.filter((node: any) => node.type === "blob").map((node: any) => node.path);
      }
      return [];
    } catch (e) {
      return [];
    }
  }

  private parseAgentConfig(content: string, filename: string): { agents: DetectedAgent[]; skills: DetectedSkill[] } {
    const agents: DetectedAgent[] = [];
    const skills: DetectedSkill[] = [];

    try {
      const parsed = JSON.parse(content);

      // case 1: It's an array of agents directly
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          const agent = this.normalizeSingleAgent(item);
          if (agent) {
            agents.push(agent);
            if (agent.skills) {
              skills.push(...agent.skills);
            }
          }
        }
      } 
      // case 2: Object with 'agents' and/or 'skills'
      else if (parsed && typeof parsed === "object") {
        if (Array.isArray(parsed.agents)) {
          for (const item of parsed.agents) {
            const agent = this.normalizeSingleAgent(item);
            if (agent) {
              agents.push(agent);
              if (agent.skills) {
                skills.push(...agent.skills);
              }
            }
          }
        }
        if (Array.isArray(parsed.skills)) {
          for (const item of parsed.skills) {
            const skill = this.normalizeSingleSkill(item);
            if (skill) {
              skills.push(skill);
            }
          }
        }
      }
    } catch (err) {
      throw new Error(`Failed to parse agent config json in ${filename}: ${err}`);
    }

    return { agents, skills };
  }

  private normalizeSingleAgent(item: any): DetectedAgent | null {
    if (!item || typeof item !== "object") return null;

    const name = item.name || item.id || "";
    const displayName = item.displayName || item.display_name || item.title || name;
    if (!name) return null;

    // Normalize any embedded skills
    const rawSkills = item.skills || [];
    const normalizedSkills: DetectedSkill[] = [];
    if (Array.isArray(rawSkills)) {
      for (const s of rawSkills) {
        const normalized = this.normalizeSingleSkill(s);
        if (normalized) {
          normalizedSkills.push(normalized);
        }
      }
    }

    return {
      name: name.toLowerCase().replace(/[^a-z0-9-_]/g, "-"),
      displayName: displayName,
      role: item.role || "assistant",
      description: item.description || item.summary || "Agente sin descripción",
      soulContent: item.soul || item.system_instruction || item.instruction || undefined,
      skills: normalizedSkills,
      config: item.configuration || item.config || {}
    };
  }

  private normalizeSingleSkill(item: any): DetectedSkill | null {
    if (!item || typeof item !== "object") return null;
    if (typeof item === "string") {
      return {
        name: item.toUpperCase().replace(/[^A-Z0-9-_]/g, "_"),
        description: `Habilidad ${item}`
      };
    }

    const name = item.name || item.id || "";
    if (!name) return null;

    return {
      name: name.toUpperCase().replace(/[^A-Z0-9-_]/g, "_"),
      description: item.description || item.summary || "Sin descripción de habilidad",
      longDescription: item.longDescription || item.long_description || item.details || "",
      category: item.category || "general",
      tags: Array.isArray(item.tags) ? item.tags : item.tags ? [item.tags] : []
    };
  }
}
