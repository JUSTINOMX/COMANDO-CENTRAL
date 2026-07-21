import { supabaseServer } from "./supabase/server.js";
import { initNotifications } from "./notifications.js";
import { aiRegistry } from "./ai/registry.js";

export async function initializeSystem() {
  console.log("=== AUTO-CLAW SYSTEM INITIALIZATION ===");
  
  try {
    // 0. Load AI provider and agent model configurations from the DB
    await aiRegistry.loadFromDatabase();
    // 1. Verify and create 'commander' agent if it doesn't exist
    const { data: agents, error: fetchError } = await supabaseServer
      .from("agents")
      .select("id, name")
      .eq("name", "commander");

    if (fetchError) {
      console.error("Error checking 'commander' agent in Supabase:", fetchError);
    } else if (!agents || agents.length === 0) {
      console.log("Commander agent not found. Creating 'commander' agent...");
      const { data: newAgent, error: insertError } = await supabaseServer
        .from("agents")
        .insert({
          name: "commander",
          display_name: "Commander",
          role: "admin",
          status: "active",
          soul: "You are the primary commander of the AutoClaw ecosystem. You help coordinate agents, manage projects, and answer user queries.",
          identity: { type: "system_commander", version: "1.0" },
          configuration: { max_agents: 10 },
          metadata: { created_by_system: true }
        })
        .select();

      if (insertError) {
        console.error("Failed to create 'commander' agent:", insertError);
      } else {
        console.log("Successfully created 'commander' agent:", newAgent);
      }
    } else {
      console.log("Commander agent already exists. ID:", agents[0].id);
    }

    // 2. Perform database schema validation
    // Let's check if the skills table has the required columns
    console.log("Verifying 'skills' table schema...");
    const { data: skillTest, error: skillTestError } = await supabaseServer
      .from("skills")
      .select("id, long_description, usage_examples, category")
      .limit(1);

    if (skillTestError) {
      console.log("Note about 'skills' schema:", skillTestError.message);
      console.log("If columns are missing, please execute the following in your Supabase SQL Editor:");
      console.log(`
        ALTER TABLE public.skills ADD COLUMN IF NOT EXISTS long_description TEXT;
        ALTER TABLE public.skills ADD COLUMN IF NOT EXISTS usage_examples JSONB DEFAULT '[]'::jsonb;
        ALTER TABLE public.skills ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general';
      `);
    } else {
      console.log("Verified: 'skills' table contains the correct columns.");
    }

    // 2.5. Verify 'hermes_capabilities' table
    console.log("Verifying 'hermes_capabilities' table schema...");
    const { error: hermesTestError } = await supabaseServer
      .from("hermes_capabilities")
      .select("id")
      .limit(1);

    if (hermesTestError) {
      console.log("Note about 'hermes_capabilities' schema:", hermesTestError.message);
      console.log("To fully enable database-backed capabilities for Hermes agents, execute the following SQL in your Supabase SQL Editor:");
      console.log(`
        CREATE TABLE IF NOT EXISTS public.hermes_capabilities (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
          capability TEXT NOT NULL,
          config JSONB DEFAULT '{}',
          is_active BOOLEAN DEFAULT true,
          last_used TIMESTAMPTZ,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          UNIQUE(agent_id, capability)
        );
      `);
    } else {
      console.log("Verified: 'hermes_capabilities' table is active and accessible.");
    }

    // 3. Verify 'agent_notifications' table
    await initNotifications();

    console.log("=== INITIALIZATION COMPLETE ===");
  } catch (err: any) {
    console.error("Critical error during initialization:", err);
  }
}

