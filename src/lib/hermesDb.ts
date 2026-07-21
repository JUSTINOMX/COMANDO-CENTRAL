import fs from "fs";
import path from "path";
import { supabaseServer } from "./supabase/server.js";

const FALLBACK_CAPS_FILE = path.join(process.cwd(), "hermes_capabilities_fallback.json");

export interface DbHermesCapability {
  id: string;
  agent_id: string;
  capability: string;
  config: Record<string, any>;
  is_active: boolean;
  last_used: string | null;
  created_at: string;
}

// Ensure the local file exists
function ensureLocalCapsFile() {
  try {
    if (!fs.existsSync(FALLBACK_CAPS_FILE)) {
      fs.writeFileSync(FALLBACK_CAPS_FILE, JSON.stringify([], null, 2), "utf8");
    }
  } catch (err) {
    console.error("[Hermes DB] Failed to create fallback file:", err);
  }
}

// Read local capabilities
function readLocalCaps(): DbHermesCapability[] {
  try {
    ensureLocalCapsFile();
    const content = fs.readFileSync(FALLBACK_CAPS_FILE, "utf8");
    return JSON.parse(content) || [];
  } catch (err) {
    console.error("[Hermes DB] Failed to read fallback file:", err);
    return [];
  }
}

// Write local capabilities
function writeLocalCaps(caps: DbHermesCapability[]) {
  try {
    fs.writeFileSync(FALLBACK_CAPS_FILE, JSON.stringify(caps, null, 2), "utf8");
  } catch (err) {
    console.error("[Hermes DB] Failed to write fallback file:", err);
  }
}

// Get capabilities for an agent
export async function getCapabilitiesForAgent(agentId: string): Promise<DbHermesCapability[]> {
  try {
    const { data, error } = await supabaseServer
      .from("hermes_capabilities")
      .select("*")
      .eq("agent_id", agentId);

    if (!error && data) {
      return data.map(item => ({
        id: item.id,
        agent_id: item.agent_id,
        capability: item.capability,
        config: item.config || {},
        is_active: item.is_active ?? true,
        last_used: item.last_used || null,
        created_at: item.created_at
      }));
    }
    console.warn("[Hermes DB] hermes_capabilities table not available. Reading local fallback file:", error?.message);
  } catch (err: any) {
    console.warn("[Hermes DB] hermes_capabilities table fetch exception. Reading local fallback file:", err.message);
  }

  // Fallback
  const allCaps = readLocalCaps();
  return allCaps.filter(c => c.agent_id === agentId);
}

// Add capability for an agent
export async function addCapability(agentId: string, capability: string, config: Record<string, any> = {}): Promise<DbHermesCapability> {
  const capId = Math.random().toString(36).substring(2) + Date.now().toString(36);
  const now = new Date().toISOString();
  
  const capObj: DbHermesCapability = {
    id: capId,
    agent_id: agentId,
    capability,
    config,
    is_active: true,
    last_used: null,
    created_at: now
  };

  // Try DB
  try {
    const { data, error } = await supabaseServer
      .from("hermes_capabilities")
      .insert({
        agent_id: agentId,
        capability,
        config,
        is_active: true
      })
      .select()
      .single();

    if (!error && data) {
      console.log(`[Hermes DB] Created capability in Supabase: ${capability}`);
      capObj.id = data.id;
      capObj.created_at = data.created_at;
    } else {
      console.warn("[Hermes DB] Failed to insert capability in Supabase (saving locally):", error?.message);
    }
  } catch (err: any) {
    console.warn("[Hermes DB] Exception during capability insertion in Supabase (saving locally):", err.message);
  }

  // Always save locally to keep fallback in sync
  const localCaps = readLocalCaps();
  // Avoid duplicate key combinations locally
  const index = localCaps.findIndex(c => c.agent_id === agentId && c.capability === capability);
  if (index >= 0) {
    localCaps[index] = capObj;
  } else {
    localCaps.push(capObj);
  }
  writeLocalCaps(localCaps);

  return capObj;
}

// Update last used timestamp for a capability
export async function updateCapabilityLastUsed(agentId: string, capability: string): Promise<boolean> {
  const now = new Date().toISOString();

  try {
    const { error } = await supabaseServer
      .from("hermes_capabilities")
      .update({ last_used: now })
      .eq("agent_id", agentId)
      .eq("capability", capability);

    if (!error) {
      return true;
    }
  } catch (err) {
    // ignore
  }

  // Fallback update
  const localCaps = readLocalCaps();
  const cap = localCaps.find(c => c.agent_id === agentId && c.capability === capability);
  if (cap) {
    cap.last_used = now;
    writeLocalCaps(localCaps);
    return true;
  }
  return false;
}
