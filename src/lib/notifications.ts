import fs from "fs";
import path from "path";
import { supabaseServer } from "./supabase/server.js";

export interface AgentNotification {
  id: string;
  target_agent_id: string;
  source_agent_id?: string | null;
  notification_type: string;
  conversation_id?: string | null;
  message_id?: string | null;
  title: string;
  content?: string | null;
  is_read: boolean;
  is_processed: boolean;
  priority: string;
  metadata?: any;
  created_at: string;
}

const NOTIFICATIONS_FILE = path.join(process.cwd(), "notifications.json");

let useSupabase = true;

// Initialize and check table existence
export async function initNotifications() {
  try {
    console.log("[Notifications] Verifying 'agent_notifications' table in Supabase...");
    const { error } = await supabaseServer
      .from("agent_notifications")
      .select("id")
      .limit(1);

    if (error) {
      console.warn("[Notifications] 'agent_notifications' table is NOT available. Falling back to local file storage:", error.message);
      useSupabase = false;
      ensureLocalFile();
    } else {
      console.log("[Notifications] 'agent_notifications' table is verified and available in Supabase.");
      useSupabase = true;
    }
  } catch (err: any) {
    console.warn("[Notifications] Exception during verification. Falling back to local file storage:", err.message);
    useSupabase = false;
    ensureLocalFile();
  }
}

function ensureLocalFile() {
  try {
    if (!fs.existsSync(NOTIFICATIONS_FILE)) {
      fs.writeFileSync(NOTIFICATIONS_FILE, JSON.stringify([], null, 2), "utf8");
    }
  } catch (err) {
    console.error("[Notifications] Failed to ensure local file:", err);
  }
}

function readLocal(): AgentNotification[] {
  try {
    ensureLocalFile();
    const content = fs.readFileSync(NOTIFICATIONS_FILE, "utf8");
    return JSON.parse(content) || [];
  } catch (err) {
    console.error("[Notifications] Failed to read local notifications:", err);
    return [];
  }
}

function writeLocal(notifications: AgentNotification[]) {
  try {
    fs.writeFileSync(NOTIFICATIONS_FILE, JSON.stringify(notifications, null, 2), "utf8");
  } catch (err) {
    console.error("[Notifications] Failed to write local notifications:", err);
  }
}

// Public API
export async function getNotifications(): Promise<AgentNotification[]> {
  if (useSupabase) {
    try {
      const { data, error } = await supabaseServer
        .from("agent_notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(30);

      if (!error && data) {
        return data as AgentNotification[];
      }
      console.warn("[Notifications] Failed to fetch from Supabase, returning local instead:", error?.message);
    } catch (e) {
      console.warn("[Notifications] Exception fetching from Supabase, returning local instead:", e);
    }
  }
  return readLocal();
}

export async function insertNotification(notification: Partial<AgentNotification>): Promise<AgentNotification | null> {
  const notifObj: AgentNotification = {
    id: notification.id || Math.random().toString(36).substring(2) + Date.now().toString(36),
    target_agent_id: notification.target_agent_id || "",
    source_agent_id: notification.source_agent_id || null,
    notification_type: notification.notification_type || "new_message",
    conversation_id: notification.conversation_id || null,
    message_id: notification.message_id || null,
    title: notification.title || "",
    content: notification.content || null,
    is_read: notification.is_read || false,
    is_processed: notification.is_processed || false,
    priority: notification.priority || "normal",
    metadata: notification.metadata || {},
    created_at: notification.created_at || new Date().toISOString()
  };

  if (useSupabase) {
    try {
      const { data, error } = await supabaseServer
        .from("agent_notifications")
        .insert(notifObj)
        .select()
        .single();

      if (!error && data) {
        return data as AgentNotification;
      }
      console.warn("[Notifications] Failed to insert to Supabase, writing to local instead:", error?.message);
    } catch (e) {
      console.warn("[Notifications] Exception inserting to Supabase, writing to local instead:", e);
    }
  }

  const list = readLocal();
  list.unshift(notifObj);
  writeLocal(list);
  return notifObj;
}

export async function markAsRead(id: string): Promise<boolean> {
  if (useSupabase) {
    try {
      const { error } = await supabaseServer
        .from("agent_notifications")
        .update({ is_read: true })
        .eq("id", id);

      if (!error) return true;
      console.warn("[Notifications] Failed to mark read in Supabase:", error.message);
    } catch (e) {
      console.warn("[Notifications] Exception marking read in Supabase:", e);
    }
  }

  const list = readLocal();
  const index = list.findIndex(n => n.id === id);
  if (index !== -1) {
    list[index].is_read = true;
    writeLocal(list);
    return true;
  }
  return false;
}

export async function markAllAsRead(): Promise<number> {
  if (useSupabase) {
    try {
      const { data, error } = await supabaseServer
        .from("agent_notifications")
        .update({ is_read: true })
        .eq("is_read", false)
        .select();

      if (!error && data) return data.length;
      console.warn("[Notifications] Failed to mark all read in Supabase:", error?.message);
    } catch (e) {
      console.warn("[Notifications] Exception marking all read in Supabase:", e);
    }
  }

  const list = readLocal();
  let count = 0;
  list.forEach(n => {
    if (!n.is_read) {
      n.is_read = true;
      count++;
    }
  });
  if (count > 0) {
    writeLocal(list);
  }
  return count;
}

export async function deleteByAgentId(agentId: string): Promise<void> {
  if (useSupabase) {
    try {
      const { error } = await supabaseServer
        .from("agent_notifications")
        .delete()
        .eq("target_agent_id", agentId);

      if (!error) return;
      console.warn("[Notifications] Failed to delete in Supabase:", error.message);
    } catch (e) {
      console.warn("[Notifications] Exception deleting in Supabase:", e);
    }
  }

  const list = readLocal();
  const filtered = list.filter(n => n.target_agent_id !== agentId);
  if (filtered.length !== list.length) {
    writeLocal(filtered);
  }
}
