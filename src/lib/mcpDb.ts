import fs from "fs";
import path from "path";
import { supabaseServer } from "./supabase/server.js";
import { PREDEFINED_MCPS } from "../config/predefinedMcps.js";

const FALLBACK_FILE = path.join(process.cwd(), "mcp_data_fallback.json");

interface FallbackData {
  mcp_servers: any[];
  agent_mcp_assignments: any[];
}

function ensureFallbackFile() {
  try {
    if (!fs.existsSync(FALLBACK_FILE)) {
      const initial: FallbackData = {
        mcp_servers: [],
        agent_mcp_assignments: []
      };
      fs.writeFileSync(FALLBACK_FILE, JSON.stringify(initial, null, 2), "utf8");
    }
  } catch (err) {
    console.error("[MCP DB] Failed to create fallback file:", err);
  }
}

function readFallback(): FallbackData {
  try {
    ensureFallbackFile();
    const content = fs.readFileSync(FALLBACK_FILE, "utf8");
    return JSON.parse(content) || { mcp_servers: [], agent_mcp_assignments: [] };
  } catch (err) {
    console.error("[MCP DB] Failed to read fallback file:", err);
    return { mcp_servers: [], agent_mcp_assignments: [] };
  }
}

function writeFallback(data: FallbackData) {
  try {
    fs.writeFileSync(FALLBACK_FILE, JSON.stringify(data, null, 2), "utf8");
  } catch (err) {
    console.error("[MCP DB] Failed to write fallback file:", err);
  }
}

export async function verifyMcpTables() {
  console.log("Verifying 'mcp_servers' and 'agent_mcp_assignments' table schemas...");
  try {
    const { error: testError1 } = await supabaseServer
      .from("mcp_servers")
      .select("id")
      .limit(1);

    const { error: testError2 } = await supabaseServer
      .from("agent_mcp_assignments")
      .select("id")
      .limit(1);

    if (testError1 || testError2) {
      console.log("Notice: 'mcp_servers' or 'agent_mcp_assignments' tables are not accessible yet in Supabase. Using secure local filesystem fallback.");
      console.log("Please run the following SQL script in your Supabase SQL Editor to enable persistent cloud storage for MCP servers:");
      console.log(`
-- Create mcp_servers table
CREATE TABLE IF NOT EXISTS public.mcp_servers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  source TEXT NOT NULL DEFAULT 'local',
  source_url TEXT,
  command TEXT,
  args JSONB DEFAULT '[]'::jsonb,
  env_vars JSONB DEFAULT '{}'::jsonb,
  capabilities JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'installed',
  category TEXT DEFAULT 'general',
  config JSONB DEFAULT '{}'::jsonb,
  installed_by TEXT DEFAULT 'commander',
  installed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create assignments table
CREATE TABLE IF NOT EXISTS public.agent_mcp_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  mcp_id UUID NOT NULL REFERENCES public.mcp_servers(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  config_override JSONB DEFAULT '{}'::jsonb,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(agent_id, mcp_id)
);

-- Enable RLS & set policy
ALTER TABLE public.mcp_servers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all" ON public.mcp_servers FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.agent_mcp_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all" ON public.agent_mcp_assignments FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_mcp_category ON public.mcp_servers(category, status);
      `);
      return false;
    }
    console.log("Verified: 'mcp_servers' and 'agent_mcp_assignments' are active in Supabase.");
    return true;
  } catch (err) {
    console.warn("Schema validation error:", err);
    return false;
  }
}

export async function getMcpServers(): Promise<any[]> {
  try {
    const { data: servers, error } = await supabaseServer
      .from("mcp_servers")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Load assignments to attach agents
    const { data: assignments, error: assignError } = await supabaseServer
      .from("agent_mcp_assignments")
      .select("*, agents(id, name, display_name)");

    if (assignError) throw assignError;

    return (servers || []).map(server => {
      const serverAssignments = (assignments || [])
        .filter(a => a.mcp_id === server.id && a.is_active)
        .map(a => ({
          id: a.agents?.id,
          name: a.agents?.name,
          displayName: a.agents?.display_name
        }))
        .filter(a => a.id);

      return {
        id: server.id,
        name: server.name,
        displayName: server.display_name,
        description: server.description,
        source: server.source,
        sourceUrl: server.source_url,
        command: server.command,
        args: server.args || [],
        envVars: server.env_vars || {},
        capabilities: server.capabilities || [],
        status: server.status || 'installed',
        category: server.category || 'general',
        config: server.config || {},
        installedBy: server.installed_by || 'commander',
        installedAt: server.installed_at,
        lastUsed: server.last_used,
        assignedAgents: serverAssignments
      };
    });
  } catch (err: any) {
    // Fallback load
    const fallback = readFallback();
    // Resolve agents for assignments manually from DB if possible
    let agents: any[] = [];
    try {
      const { data } = await supabaseServer.from("agents").select("id, name, display_name");
      agents = data || [];
    } catch (_) {}

    return fallback.mcp_servers.map(server => {
      const serverAssignments = fallback.agent_mcp_assignments
        .filter(a => a.mcp_id === server.id && a.is_active)
        .map(a => {
          const matched = agents.find(ag => ag.id === a.agent_id);
          return {
            id: a.agent_id,
            name: matched ? matched.name : "unknown",
            displayName: matched ? matched.display_name : "Agente"
          };
        });

      return {
        ...server,
        assignedAgents: serverAssignments
      };
    });
  }
}

export async function installMcpServer(mcpData: any): Promise<any> {
  const insertPayload = {
    name: mcpData.name,
    display_name: mcpData.displayName || mcpData.display_name,
    description: mcpData.description,
    source: mcpData.source || 'npm',
    source_url: mcpData.sourceUrl || mcpData.source_url || '',
    command: mcpData.command,
    args: mcpData.args || [],
    env_vars: mcpData.envVars || mcpData.env_vars || {},
    capabilities: mcpData.capabilities || [],
    status: 'installed',
    category: mcpData.category || 'general',
    config: mcpData.config || {},
    installed_by: 'commander',
    installed_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  try {
    const { data, error } = await supabaseServer
      .from("mcp_servers")
      .insert(insertPayload)
      .select()
      .single();

    if (error) throw error;

    // Handle initial agent assignments if passed
    if (mcpData.assignedAgentIds && Array.isArray(mcpData.assignedAgentIds)) {
      for (const agentId of mcpData.assignedAgentIds) {
        await assignMcpToAgent(data.id, agentId);
      }
    }

    return data;
  } catch (err: any) {
    // Fallback write
    const fallback = readFallback();
    const id = `local-mcp-${Date.now()}`;
    const newServer = {
      id,
      name: insertPayload.name,
      displayName: insertPayload.display_name,
      description: insertPayload.description,
      source: insertPayload.source,
      sourceUrl: insertPayload.source_url,
      command: insertPayload.command,
      args: insertPayload.args,
      envVars: insertPayload.env_vars,
      capabilities: insertPayload.capabilities,
      status: 'installed',
      category: insertPayload.category,
      config: insertPayload.config,
      installedBy: insertPayload.installed_by,
      installedAt: insertPayload.installed_at,
      createdAt: insertPayload.created_at,
      updatedAt: insertPayload.updated_at
    };

    // Remove duplicates
    fallback.mcp_servers = fallback.mcp_servers.filter(s => s.name !== newServer.name);
    fallback.mcp_servers.push(newServer);

    if (mcpData.assignedAgentIds && Array.isArray(mcpData.assignedAgentIds)) {
      for (const agentId of mcpData.assignedAgentIds) {
        fallback.agent_mcp_assignments.push({
          id: `local-assign-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          agent_id: agentId,
          mcp_id: id,
          is_active: true,
          config_override: {},
          assigned_at: new Date().toISOString()
        });
      }
    }

    writeFallback(fallback);
    return newServer;
  }
}

export async function uninstallMcpServer(mcpId: string): Promise<boolean> {
  try {
    const { error } = await supabaseServer
      .from("mcp_servers")
      .delete()
      .eq("id", mcpId);

    if (error) throw error;
    return true;
  } catch (err) {
    const fallback = readFallback();
    fallback.mcp_servers = fallback.mcp_servers.filter(s => s.id !== mcpId);
    fallback.agent_mcp_assignments = fallback.agent_mcp_assignments.filter(a => a.mcp_id !== mcpId);
    writeFallback(fallback);
    return true;
  }
}

export async function assignMcpToAgent(mcpId: string, agentId: string, configOverride: any = {}): Promise<any> {
  const payload = {
    mcp_id: mcpId,
    agent_id: agentId,
    is_active: true,
    config_override: configOverride,
    assigned_at: new Date().toISOString()
  };

  try {
    const { data, error } = await supabaseServer
      .from("agent_mcp_assignments")
      .upsert(payload, { onConflict: "agent_id,mcp_id" })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    const fallback = readFallback();
    const existingIdx = fallback.agent_mcp_assignments.findIndex(
      a => a.mcp_id === mcpId && a.agent_id === agentId
    );

    const assignment = {
      id: existingIdx !== -1 ? fallback.agent_mcp_assignments[existingIdx].id : `local-assign-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      agent_id: agentId,
      mcp_id: mcpId,
      is_active: true,
      config_override: configOverride,
      assigned_at: new Date().toISOString()
    };

    if (existingIdx !== -1) {
      fallback.agent_mcp_assignments[existingIdx] = assignment;
    } else {
      fallback.agent_mcp_assignments.push(assignment);
    }

    writeFallback(fallback);
    return assignment;
  }
}

export async function unassignMcpFromAgent(mcpId: string, agentId: string): Promise<boolean> {
  try {
    const { error } = await supabaseServer
      .from("agent_mcp_assignments")
      .delete()
      .eq("mcp_id", mcpId)
      .eq("agent_id", agentId);

    if (error) throw error;
    return true;
  } catch (err) {
    const fallback = readFallback();
    fallback.agent_mcp_assignments = fallback.agent_mcp_assignments.filter(
      a => !(a.mcp_id === mcpId && a.agent_id === agentId)
    );
    writeFallback(fallback);
    return true;
  }
}

export async function getMcpsForAgent(agentId: string): Promise<any[]> {
  try {
    const { data: assignments, error } = await supabaseServer
      .from("agent_mcp_assignments")
      .select("*, mcp_servers(*)")
      .eq("agent_id", agentId)
      .eq("is_active", true);

    if (error) throw error;

    return (assignments || [])
      .map(a => a.mcp_servers)
      .filter(s => s)
      .map(s => ({
        id: s.id,
        name: s.name,
        displayName: s.display_name,
        description: s.description,
        source: s.source,
        sourceUrl: s.source_url,
        command: s.command,
        args: s.args || [],
        envVars: s.env_vars || {},
        capabilities: s.capabilities || [],
        status: s.status || 'installed',
        category: s.category || 'general',
        config: s.config || {}
      }));
  } catch (err) {
    const fallback = readFallback();
    const assignedIds = fallback.agent_mcp_assignments
      .filter(a => a.agent_id === agentId && a.is_active)
      .map(a => a.mcp_id);

    return fallback.mcp_servers.filter(s => assignedIds.includes(s.id));
  }
}
