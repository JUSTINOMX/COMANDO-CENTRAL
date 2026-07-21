import { supabaseServer } from "./supabase/server.js";
import { insertNotification, deleteByAgentId } from "./notifications.js";
import { aiRegistry } from "./ai/registry.js";
import { getMcpServers, installMcpServer, assignMcpToAgent } from "./mcpDb.js";
import { PREDEFINED_MCPS } from "../config/predefinedMcps.js";

interface CommanderResult {
  text: string;
  actions_taken: string[];
}

function cleanAndParseJSON(text: string): any {
  let cleanText = text.trim();
  
  // Strip markdown code block wrappers if present
  if (cleanText.startsWith("```json")) {
    cleanText = cleanText.substring(7);
  } else if (cleanText.startsWith("```")) {
    cleanText = cleanText.substring(3);
  }
  if (cleanText.endsWith("```")) {
    cleanText = cleanText.substring(0, cleanText.length - 3);
  }
  cleanText = cleanText.trim();
  
  try {
    return JSON.parse(cleanText);
  } catch (err) {
    console.error("Failed to parse clean JSON:", cleanText, err);
    throw err;
  }
}

export async function processCommanderCommand(message: string): Promise<CommanderResult> {
  const actionsTaken: string[] = [];
  
  // Get provider and config for Commander agent
  const provider = aiRegistry.getProviderForAgent('commander');
  const agentConfig = aiRegistry.getAgentConfig('commander');

  const isAvailable = await provider.isAvailable();
  if (!isAvailable) {
    return {
      text: `⚠️ El proveedor de IA configurado para Commander (${provider.displayName}) no está configurado o no tiene API Key. Por favor, añada la API Key en el panel de Ajustes / Secretos.`,
      actions_taken: ["Provider not configured"]
    };
  }

  try {
    // Phase 1: Fetch metadata from DB to give context (agents list, projects list, skills list)
    const { data: dbAgents } = await supabaseServer.from("agents").select("id, name, display_name, role");
    const { data: dbProjects } = await supabaseServer.from("projects").select("id, name, description");
    const { data: dbSkills } = await supabaseServer.from("skills").select("id, name, description");

    const contextAgents = dbAgents ? dbAgents.map(a => `${a.name} (${a.role})`).join(", ") : "None";
    const contextProjects = dbProjects ? dbProjects.map(p => p.name).join(", ") : "None";
    const contextSkills = dbSkills ? dbSkills.map(s => s.name).join(", ") : "None";

    // Phase 2: Call configured AI to parse the user request into an action
    const systemInstruction = `
You are the Commander Assistant, the administrative AI of the AutoClaw AI agent ecosystem.
Your job is to interpret user commands, map them to administrative actions, and return a JSON object representing the action to execute.

Available agents in the ecosystem: [${contextAgents}]
Available projects in the ecosystem: [${contextProjects}]
Available skills in the ecosystem: [${contextSkills}]

You MUST parse the user's message into one of the following schemas:

1. Create a project:
   { "action": "create_project", "parameters": { "name": "NEURON", "description": "...", "tags": ["IA", "redes-neuronales"], "agents": [{"agentName": "STEVE", "role": "arquitectura"}, {"agentName": "ELON", "role": "análisis de mercado"}] } }

2. Dile a un agente que haga algo (creates notification & chat message):
   { "action": "send_agent_message", "parameters": { "projectName": "OPTIKR", "agentName": "STEVE", "text": "Revisa los antecedentes" } }

3. Registrar nuevo agente:
   { "action": "create_agent", "parameters": { "name": "ANALYST", "display_name": "Data Analyst", "role": "data-analyst", "status": "active" } }

4. Eliminar agentes:
   { "action": "delete_agents", "parameters": { "names": ["auto-legal", "auto-smb"] } }

5. Asignar agente a proyecto:
   { "action": "assign_agent_to_project", "parameters": { "agentName": "NIKITTA", "projectName": "FIXLY" } }

6. Quitar agente de proyecto:
   { "action": "remove_agent_from_project", "parameters": { "agentName": "STEVE", "projectName": "SUPAKEEPER" } }

7. Crear memoria:
   { "action": "create_memory", "parameters": { "agentName": "STEVE", "memory_type": "preference", "title": "Preferencia de Edwin", "content": "A Edwin le gusta el modo claro", "tags": ["Edwin", "preferencia"] } }

8. Mostrar reportes o información de proyecto:
   { "action": "show_project_reports", "parameters": { "projectName": "OPTIKR" } }

9. Guardar skill:
   { "action": "create_skill", "parameters": { "name": "PROTOCOLO_REVISION", "description": "Protocolo estándar", "long_description": "...", "usage_examples": "...", "category": "general", "tags": ["review"], "assignToAgentName": "STEVE" } }

10. Listar/buscar skills:
    { "action": "list_skills", "parameters": { "query": "..." } }

11. Mostrar skill específico:
    { "action": "show_skill", "parameters": { "name": "SREMEngine" } }

12. Asignar skill a agente:
    { "action": "assign_skill", "parameters": { "skillName": "GENESIS", "agentName": "NIKITTA" } }

13. Listar skills de agente:
    { "action": "list_agent_skills", "parameters": { "agentName": "STEVE" } }

14. General query or search conversations (e.g. "¿Qué conversaciones hubo hoy sobre ChromaShield?"):
    { "action": "general_query", "parameters": { "question": "..." } }

15. Registrar nuevo agente Hermes (agentes de ejecución con identity.type = 'hermes' y capacidades como 'browser', 'powershell', 'nodejs', 'filesystem'):
    { "action": "create_hermes_agent", "parameters": { "name": "hermes-browser", "displayName": "Hermes Browser", "description": "Automatización con navegador", "capabilities": ["browser", "filesystem"], "cdpPort": 9222, "projectName": "OPTIKR" } }

16. Listar agentes Hermes activos:
    { "action": "list_hermes_agents", "parameters": {} }

17. Instalar o registrar un MCP Server (de npm, github o local):
    { "action": "install_mcp_server", "parameters": { "name": "supabase-mcp", "displayName": "Supabase MCP", "description": "Acceso a base de datos", "source": "npm", "command": "npx @anthropic/supabase-mcp", "category": "database", "capabilities": ["query_db", "list_tables"] } }

18. Listar todos los MCP Servers instalados:
    { "action": "list_mcp_servers", "parameters": {} }

19. Asignar un MCP Server a un agente:
    { "action": "assign_mcp_server", "parameters": { "mcpName": "supabase-mcp", "agentName": "STEVE" } }

20. Listar MCPs asignados a un agente específico:
    { "action": "list_agent_mcps", "parameters": { "agentName": "STEVE" } }

21. Mostrar el catálogo de MCPs predefinidos disponibles:
    { "action": "show_predefined_mcps", "parameters": {} }

Return ONLY a raw JSON object matching one of these formats. Do not wrap in markdown blocks unless it is clean json.
`;

    const chatResponse = await provider.chat(
      [{ role: 'user', content: message }],
      {
        model: agentConfig.model,
        temperature: agentConfig.temperature || 0.1,
        systemPrompt: systemInstruction
      }
    );

    const parsedJson = cleanAndParseJSON(chatResponse.content || "{}");
    const { action, parameters } = parsedJson;

    console.log("Commander Parsed Action:", action, "Parameters:", parameters);

    if (!action) {
      return {
        text: "I analyzed your request, but I couldn't identify a specific administrative command to execute. How else can I assist with the AutoClaw ecosystem?",
        actions_taken: ["No action recognized"]
      };
    }

    // Helper functions to map names to database IDs
    const findAgentByName = async (name: string) => {
      if (!name) return null;
      const { data } = await supabaseServer
        .from("agents")
        .select("id, name, display_name, role")
        .ilike("name", `%${name.trim()}%`)
        .limit(1);
      return data && data.length > 0 ? data[0] : null;
    };

    const findProjectByName = async (name: string) => {
      if (!name) return null;
      const { data } = await supabaseServer
        .from("projects")
        .select("id, name")
        .ilike("name", `%${name.trim()}%`)
        .limit(1);
      return data && data.length > 0 ? data[0] : null;
    };

    const findSkillByName = async (name: string) => {
      if (!name) return null;
      const { data } = await supabaseServer
        .from("skills")
        .select("id, name")
        .ilike("name", `%${name.trim()}%`)
        .limit(1);
      return data && data.length > 0 ? data[0] : null;
    };

    // Execution routing
    switch (action) {
      case "create_project": {
        const { name, description, tags, agents } = parameters;
        
        // 1. Create project
        const { data: project, error: pErr } = await supabaseServer
          .from("projects")
          .insert({ name, description, tags, status: "active" })
          .select()
          .single();

        if (pErr) throw pErr;
        actionsTaken.push(`Created project "${name}"`);

        // 2. Create standard chat conversation for project
        const { data: convo, error: cErr } = await supabaseServer
          .from("conversations")
          .insert({
            project_id: project.id,
            title: `Chat ${name}`,
            conversation_type: "project_chat",
            status: "active"
          })
          .select()
          .single();

        if (cErr) throw cErr;
        actionsTaken.push(`Created chat conversation for project "${name}"`);

        // 3. Assign agents and create participants / notifications
        let instructionsText = `Project "${name}" has been initiated. Roles assigned:\n`;

        if (agents && Array.isArray(agents)) {
          for (const item of agents) {
            const dbAgent = await findAgentByName(item.agentName);
            if (dbAgent) {
              // Assign agent to project
              await supabaseServer.from("project_agents").insert({
                project_id: project.id,
                agent_id: dbAgent.id,
                role: item.role
              });

              // Add agent as conversation participant
              await supabaseServer.from("conversation_participants").insert({
                conversation_id: convo.id,
                agent_id: dbAgent.id,
                role: item.role
              });

              // Send system message in the chat
              const messageContent = `[SYSTEM] Agent ${dbAgent.display_name} has been assigned to project "${name}" with role: "${item.role}"`;
              const { data: msg } = await supabaseServer.from("conversation_messages").insert({
                conversation_id: convo.id,
                sender: "System",
                content: messageContent,
                message_type: "system"
              }).select().single();

              // Create notification
              await insertNotification({
                target_agent_id: dbAgent.id,
                notification_type: "new_project",
                conversation_id: convo.id,
                message_id: msg?.id,
                title: `New Project Assigned: ${name}`,
                content: `You have been assigned to project "${name}" as "${item.role}". Let's start!`,
                priority: "high"
              });

              actionsTaken.push(`Assigned agent ${dbAgent.display_name} as ${item.role}`);
              instructionsText += `- **${dbAgent.display_name}**: ${item.role}\n`;
            }
          }
        }

        // Add Commander and Edwin as participants in conversation
        // Let's find Edwin if exists, or just add Commander
        const commanderAgent = await findAgentByName("commander");
        if (commanderAgent) {
          await supabaseServer.from("conversation_participants").insert({
            conversation_id: convo.id,
            agent_id: commanderAgent.id,
            role: "assistant"
          });
        }

        // Send instructions message
        await supabaseServer.from("conversation_messages").insert({
          conversation_id: convo.id,
          sender: "Commander",
          sender_agent_id: commanderAgent?.id,
          content: instructionsText,
          message_type: "text"
        });

        // Check if there are skills in the request to suggest saving
        let finalResponse = `✅ **Project "${name}" successfully created!**\n\n`;
        finalResponse += `I have created the project record, set up the **Chat ${name}** room, assigned the participants, and sent high-priority notifications to them.\n\n`;
        finalResponse += `*Assigned roles:*\n${agents.map((a: any) => `- **${a.agentName}**: ${a.role}`).join("\n")}\n\n`;
        finalResponse += `Would you like me to save these methodologies as a reusable **Skill** for other agents in the future?`;

        return { text: finalResponse, actions_taken: actionsTaken };
      }

      case "send_agent_message": {
        const { projectName, agentName, text } = parameters;
        const dbProject = await findProjectByName(projectName);
        const dbAgent = await findAgentByName(agentName);

        if (!dbProject) {
          return {
            text: `❌ Project "${projectName}" not found. Please verify the name.`,
            actions_taken: ["Failed: Project not found"]
          };
        }
        if (!dbAgent) {
          return {
            text: `❌ Agent "${agentName}" not found. Please verify the name.`,
            actions_taken: ["Failed: Agent not found"]
          };
        }

        // Get project chat conversation
        const { data: convos } = await supabaseServer
          .from("conversations")
          .select("id")
          .eq("project_id", dbProject.id)
          .eq("conversation_type", "project_chat")
          .limit(1);

        let convoId = convos && convos.length > 0 ? convos[0].id : null;
        if (!convoId) {
          // Create chat
          const { data: newC } = await supabaseServer
            .from("conversations")
            .insert({ project_id: dbProject.id, title: `Chat ${dbProject.name}`, conversation_type: "project_chat" })
            .select()
            .single();
          convoId = newC.id;
        }

        // Send message from Commander on behalf of user
        const { data: msg } = await supabaseServer
          .from("conversation_messages")
          .insert({
            conversation_id: convoId,
            sender: "Commander",
            content: `📢 **[Command to ${dbAgent.display_name}]**: ${text}`,
            message_type: "text"
          })
          .select()
          .single();

        // Create high-priority notification for target agent
        await insertNotification({
          target_agent_id: dbAgent.id,
          notification_type: "instruction",
          conversation_id: convoId,
          message_id: msg.id,
          title: `Instruction from Command Center`,
          content: text,
          priority: "high"
        });

        actionsTaken.push(`Sent instruction to ${dbAgent.display_name} in project "${dbProject.name}"`);

        return {
          text: `✅ Direct message and high-priority notification successfully sent to **${dbAgent.display_name}** in the context of project **${dbProject.name}**.\n\nMessage sent: *"${text}"*`,
          actions_taken: actionsTaken
        };
      }

      case "create_agent": {
        const { name, display_name, role, status } = parameters;
        const { data: existing } = await supabaseServer.from("agents").select("id").eq("name", name).limit(1);
        if (existing && existing.length > 0) {
          return {
            text: `⚠️ An agent named **${name}** already exists in the system.`,
            actions_taken: ["Agent already exists"]
          };
        }

        const { data: agent, error } = await supabaseServer
          .from("agents")
          .insert({ name, display_name, role, status: status || "active" })
          .select()
          .single();

        if (error) throw error;
        actionsTaken.push(`Created agent "${display_name}"`);

        return {
          text: `✅ **Agent "${display_name}" created successfully!**\n\n- **System Name**: ${name}\n- **Role**: ${role}\n- **Status**: ${status || "active"}\n\nThe agent is now ready to be assigned to projects or equipped with skills.`,
          actions_taken: actionsTaken
        };
      }

      case "delete_agents": {
        const { names } = parameters;
        if (!names || !Array.isArray(names) || names.length === 0) {
          return { text: "No agents specified for deletion.", actions_taken: [] };
        }

        const deletedList: string[] = [];
        for (const n of names) {
          const dbAgent = await findAgentByName(n);
          if (dbAgent) {
            // Delete project assignments
            await supabaseServer.from("project_agents").delete().eq("agent_id", dbAgent.id);
            // Delete agent skills
            await supabaseServer.from("agent_skills").delete().eq("agent_id", dbAgent.id);
            // Delete agent notifications
            await deleteByAgentId(dbAgent.id);
            // Delete agent
            const { error } = await supabaseServer.from("agents").delete().eq("id", dbAgent.id);
            if (!error) {
              deletedList.push(dbAgent.display_name);
              actionsTaken.push(`Deleted agent ${dbAgent.display_name}`);
            }
          }
        }

        if (deletedList.length === 0) {
          return { text: "No matching agents could be found to delete.", actions_taken: [] };
        }

        return {
          text: `✅ **Successfully deleted the following agents** and cleaned up all their references, project associations, and skills:\n${deletedList.map(name => `- **${name}**`).join("\n")}`,
          actions_taken: actionsTaken
        };
      }

      case "create_hermes_agent": {
        const { name, displayName, description, capabilities, cdpPort, projectName } = parameters;
        
        const trimmedName = name.trim().toLowerCase();
        const { data: existing } = await supabaseServer.from("agents").select("id").eq("name", trimmedName).eq("status", "active").limit(1);
        if (existing && existing.length > 0) {
          return {
            text: `⚠️ El agente Hermes **${trimmedName}** ya existe en el sistema.`,
            actions_taken: ["Agent already exists"]
          };
        }

        const cPort = cdpPort || 9222;
        const workingDir = `C:\\Users\\edwin\\.openclaw-autoclaw\\agents\\${trimmedName}`;

        const { data: agent, error: agentError } = await supabaseServer
          .from("agents")
          .insert({
            name: trimmedName,
            display_name: displayName || trimmedName,
            role: "executor",
            status: "active",
            soul: description || "Agente ejecutor autónomo especializado en tareas de automatización nativas de Windows.",
            identity: {
              type: "hermes",
              capabilities: capabilities || ["browser", "nodejs"],
              connection: {
                type: "cdp",
                endpoint: `http://127.0.0.1:${cPort}`,
                autoReconnect: true
              },
              platform: "windows",
              version: "1.0.0"
            },
            configuration: {
              allowedActions: ["navigate", "click", "type", "extract", "screenshot", "exec"],
              timeout: 120000,
              workingDir
            },
            metadata: {
              type: "hermes",
              isOnline: false,
              lastPing: null,
              createdBy: "commander"
            }
          })
          .select()
          .single();

        if (agentError) throw agentError;
        actionsTaken.push(`Created Hermes Agent "${trimmedName}"`);

        // Add capabilities
        const { addCapability } = await import("./hermesDb.js");
        for (const cap of (capabilities || ["browser", "nodejs"])) {
          await addCapability(agent.id, cap, cap === 'browser' ? { cdpPort: cPort } : {});
        }

        let assignedText = "";
        if (projectName) {
          const dbProject = await findProjectByName(projectName);
          if (dbProject) {
            await supabaseServer.from("project_agents").insert({
              project_id: dbProject.id,
              agent_id: agent.id,
              role: "executor"
            });

            const { data: convos } = await supabaseServer
              .from("conversations")
              .select("id")
              .eq("project_id", dbProject.id)
              .eq("conversation_type", "project_chat")
              .limit(1);

            if (convos && convos.length > 0) {
              await supabaseServer.from("conversation_participants").insert({
                conversation_id: convos[0].id,
                agent_id: agent.id,
                role: "executor"
              });
            }
            assignedText = ` y asignado al proyecto **${dbProject.name}**`;
            actionsTaken.push(`Assigned ${trimmedName} to project "${dbProject.name}"`);
          }
        }

        // Welcome notification
        await insertNotification({
          target_agent_id: agent.id,
          notification_type: "welcome",
          title: "Nuevo Agente Hermes Registrado",
          content: `El ejecutor '${displayName || trimmedName}' ha sido dado de alta correctamente.`,
          priority: "normal"
        });

        return {
          text: `✅ **Agente Hermes registrado exitosamente!**\n\n- **Nombre**: \`${trimmedName}\`\n- **Rol**: \`executor\`\n- **Capacidades**: ${capabilities ? capabilities.join(", ") : "browser, nodejs"}${assignedText}\n\nEl proceso ahora puede conectarse y reportar ping desde Windows.`,
          actions_taken: actionsTaken
        };
      }

      case "list_hermes_agents": {
        const { data: agents, error } = await supabaseServer
          .from("agents")
          .select("*")
          .eq("status", "active");

        if (error) throw error;

        const hermesAgents = (agents || []).filter(a => a.identity?.type === "hermes");
        if (hermesAgents.length === 0) {
          return {
            text: "No se encontraron agentes Hermes activos registrados en el ecosistema en este momento. Puedes crear uno diciendo: *'da de alta un agente Hermes llamado hermes-browser'*",
            actions_taken: ["Listed Hermes agents (empty)"]
          };
        }

        let responseText = "### ⚡ Agentes Hermes Activos:\n\n";
        for (const a of hermesAgents) {
          const isOnline = a.metadata?.lastPing && (Date.now() - new Date(a.metadata.lastPing).getTime() < 5 * 60 * 1000);
          const pingStatus = isOnline ? "🟢 **Online**" : "⚪ *Offline*";
          const caps = a.identity?.capabilities?.join(", ") || "ninguna";
          responseText += `- **${a.display_name}** (\`@${a.name}\`) - ${pingStatus}\n  - **Capacidades**: ${caps}\n  - **Directorio de trabajo**: \`${a.configuration?.workingDir || "N/A"}\`\n`;
        }

        actionsTaken.push("Listed Hermes agents");
        return {
          text: responseText,
          actions_taken: actionsTaken
        };
      }

      case "assign_agent_to_project": {
        const { agentName, projectName } = parameters;
        const dbAgent = await findAgentByName(agentName);
        const dbProject = await findProjectByName(projectName);

        if (!dbAgent) return { text: `❌ Agent "${agentName}" not found.`, actions_taken: [] };
        if (!dbProject) return { text: `❌ Project "${projectName}" not found.`, actions_taken: [] };

        // Check if already assigned
        const { data: exists } = await supabaseServer
          .from("project_agents")
          .select("id")
          .eq("project_id", dbProject.id)
          .eq("agent_id", dbAgent.id)
          .limit(1);

        if (exists && exists.length > 0) {
          return { text: `⚠️ **${dbAgent.display_name}** is already assigned to project **${dbProject.name}**.`, actions_taken: [] };
        }

        // Insert assignment
        await supabaseServer.from("project_agents").insert({
          project_id: dbProject.id,
          agent_id: dbAgent.id,
          role: dbAgent.role
        });

        // Add to conversation
        const { data: convos } = await supabaseServer
          .from("conversations")
          .select("id")
          .eq("project_id", dbProject.id)
          .limit(1);

        if (convos && convos.length > 0) {
          await supabaseServer.from("conversation_participants").insert({
            conversation_id: convos[0].id,
            agent_id: dbAgent.id,
            role: dbAgent.role
          });

          // Send message
          const { data: msg } = await supabaseServer.from("conversation_messages").insert({
            conversation_id: convos[0].id,
            sender: "System",
            content: `[SYSTEM] ${dbAgent.display_name} has joined the project.`,
            message_type: "system"
          }).select().single();

          // Notify
          await insertNotification({
            target_agent_id: dbAgent.id,
            notification_type: "new_project",
            conversation_id: convos[0].id,
            message_id: msg?.id,
            title: `Assigned to ${dbProject.name}`,
            content: `Edwin has assigned you to project "${dbProject.name}".`,
            priority: "high"
          });
        }

        actionsTaken.push(`Assigned ${dbAgent.display_name} to "${dbProject.name}"`);

        return {
          text: `✅ **${dbAgent.display_name}** is now assigned to project **${dbProject.name}** as **${dbAgent.role}** and has been added to the project chat conversation.`,
          actions_taken: actionsTaken
        };
      }

      case "remove_agent_from_project": {
        const { agentName, projectName } = parameters;
        const dbAgent = await findAgentByName(agentName);
        const dbProject = await findProjectByName(projectName);

        if (!dbAgent) return { text: `❌ Agent "${agentName}" not found.`, actions_taken: [] };
        if (!dbProject) return { text: `❌ Project "${projectName}" not found.`, actions_taken: [] };

        const { error } = await supabaseServer
          .from("project_agents")
          .delete()
          .eq("project_id", dbProject.id)
          .eq("agent_id", dbAgent.id);

        if (error) throw error;

        // Add departure notification
        const { data: convos } = await supabaseServer
          .from("conversations")
          .select("id")
          .eq("project_id", dbProject.id)
          .limit(1);

        if (convos && convos.length > 0) {
          // Remove participant
          await supabaseServer.from("conversation_participants").delete().eq("conversation_id", convos[0].id).eq("agent_id", dbAgent.id);

          await supabaseServer.from("conversation_messages").insert({
            conversation_id: convos[0].id,
            sender: "System",
            content: `[SYSTEM] ${dbAgent.display_name} has left the project.`,
            message_type: "system"
          });
        }

        actionsTaken.push(`Removed ${dbAgent.display_name} from "${dbProject.name}"`);

        return {
          text: `✅ Removed **${dbAgent.display_name}** from project **${dbProject.name}**. Their role assignment and chat participant status have been successfully revoked.`,
          actions_taken: actionsTaken
        };
      }

      case "create_memory": {
        const { agentName, memory_type, title, content, tags } = parameters;
        const dbAgent = await findAgentByName(agentName);

        const { data: memo, error } = await supabaseServer
          .from("memories")
          .insert({
            agent_id: dbAgent ? dbAgent.id : null,
            memory_type: memory_type || "preference",
            title: title || "Edwin Preference",
            content: content,
            tags: tags || ["preference"],
            source: "Edwin via Commander",
            importance: 5,
            is_shared: true
          })
          .select()
          .single();

        if (error) throw error;
        actionsTaken.push(`Saved memory: "${title}"`);

        return {
          text: `✅ **Memory stored successfully!**\n\n- **Title**: ${title || "Edwin Preference"}\n- **Agent**: ${dbAgent ? dbAgent.display_name : "Global"}\n- **Type**: ${memory_type || "preference"}\n- **Content**: *"${content}"*\n\nThis memory has been registered and is now part of the active agent context matrix.`,
          actions_taken: actionsTaken
        };
      }

      case "show_project_reports": {
        const { projectName } = parameters;
        const dbProject = await findProjectByName(projectName);
        if (!dbProject) return { text: `❌ Project "${projectName}" not found.`, actions_taken: [] };

        const { data: reports } = await supabaseServer
          .from("project_reportes")
          .select("id, title, file_name, tags")
          .eq("project_id", dbProject.id);

        if (!reports || reports.length === 0) {
          return {
            text: `📊 **Project ${dbProject.name}** currently has no reports registered. Use the project panel to write or generate one!`,
            actions_taken: ["Queried reports (none found)"]
          };
        }

        let resp = `📊 **Reports found for project "${dbProject.name}":**\n\n`;
        reports.forEach((r, idx) => {
          resp += `${idx + 1}. **${r.title}** (File: \`${r.file_name}\`) ${r.tags ? ` - Tags: ${r.tags.join(", ")}` : ""}\n`;
        });

        actionsTaken.push(`Listed reports for ${dbProject.name}`);
        return { text: resp, actions_taken: actionsTaken };
      }

      case "create_skill": {
        const { name, description, long_description, usage_examples, category, tags, assignToAgentName } = parameters;
        
        // Let's create skill
        const { data: skill, error } = await supabaseServer
          .from("skills")
          .insert({
            name,
            version: "1.0.0",
            description,
            long_description: long_description || "",
            usage_examples: usage_examples ? (typeof usage_examples === 'string' ? [{ code: usage_examples }] : usage_examples) : [],
            category: category || "general",
            status: "active",
            tags: tags || ["utility"]
          })
          .select()
          .single();

        if (error) throw error;
        actionsTaken.push(`Created skill "${name}"`);

        let assignmentText = "";
        if (assignToAgentName) {
          const dbAgent = await findAgentByName(assignToAgentName);
          if (dbAgent) {
            await supabaseServer.from("agent_skills").insert({
              agent_id: dbAgent.id,
              skill_id: skill.id
            });
            assignmentText = ` and assigned it to agent **${dbAgent.display_name}**`;
            actionsTaken.push(`Assigned skill "${name}" to ${dbAgent.display_name}`);
          }
        }

        return {
          text: `✅ **Skill "${name}" successfully registered!**${assignmentText}\n\n- **Short Description**: ${description}\n- **Category**: ${category || "general"}\n\nOther agents can now install or reference this skill in their automation tasks.`,
          actions_taken: actionsTaken
        };
      }

      case "list_skills": {
        const { data: skills } = await supabaseServer.from("skills").select("name, description, category");
        if (!skills || skills.length === 0) {
          return { text: "No skills are currently registered in the database.", actions_taken: [] };
        }

        let resp = `🛠️ **Available Skills in the AutoClaw Ecosytem:**\n\n`;
        skills.forEach(s => {
          resp += `- **${s.name}** [${s.category}]: ${s.description}\n`;
        });

        actionsTaken.push("Listed skills");
        return { text: resp, actions_taken: actionsTaken };
      }

      case "show_skill": {
        const { name } = parameters;
        const { data: skill } = await supabaseServer
          .from("skills")
          .select("*")
          .ilike("name", `%${name}%`)
          .limit(1);

        if (!skill || skill.length === 0) {
          return { text: `❌ Skill "${name}" not found.`, actions_taken: [] };
        }

        const s = skill[0];
        
        // Get agents that have this skill installed
        const { data: agentsJoined } = await supabaseServer
          .from("agent_skills")
          .select("agents (display_name)")
          .eq("skill_id", s.id);

        const installedAgents = agentsJoined 
          ? agentsJoined.map((aj: any) => aj.agents?.display_name).filter(Boolean).join(", ") 
          : "None";

        let resp = `⚙️ **Skill Details: ${s.name}** (v${s.version})\n\n`;
        resp += `- **Category**: \`${s.category}\` | **Status**: \`${s.status}\`\n`;
        resp += `- **Description**: ${s.description}\n`;
        if (s.long_description) {
          resp += `- **Detailed Guide**:\n> ${s.long_description.split('\n').join('\n> ')}\n`;
        }
        resp += `- **Active Installations**: ${installedAgents || "None"}\n`;

        actionsTaken.push(`Displayed skill "${s.name}"`);
        return { text: resp, actions_taken: actionsTaken };
      }

      case "assign_skill": {
        const { skillName, agentName } = parameters;
        const dbAgent = await findAgentByName(agentName);
        const dbSkill = await findSkillByName(skillName);

        if (!dbAgent) return { text: `❌ Agent "${agentName}" not found.`, actions_taken: [] };
        if (!dbSkill) return { text: `❌ Skill "${skillName}" not found.`, actions_taken: [] };

        // Verify assignment
        const { data: exists } = await supabaseServer
          .from("agent_skills")
          .select("id")
          .eq("agent_id", dbAgent.id)
          .eq("skill_id", dbSkill.id);

        if (exists && exists.length > 0) {
          return { text: `⚠️ Agent **${dbAgent.display_name}** already has **${dbSkill.name}** installed.`, actions_taken: [] };
        }

        await supabaseServer.from("agent_skills").insert({
          agent_id: dbAgent.id,
          skill_id: dbSkill.id
        });

        actionsTaken.push(`Assigned skill "${dbSkill.name}" to ${dbAgent.display_name}`);
        return {
          text: `✅ **Skill Assignment Successful!**\n\nAgent **${dbAgent.display_name}** has been successfully equipped with the **${dbSkill.name}** skill.`,
          actions_taken: actionsTaken
        };
      }

      case "list_agent_skills": {
        const { agentName } = parameters;
        const dbAgent = await findAgentByName(agentName);
        if (!dbAgent) return { text: `❌ Agent "${agentName}" not found.`, actions_taken: [] };

        const { data: relations } = await supabaseServer
          .from("agent_skills")
          .select("skills (name, description)")
          .eq("agent_id", dbAgent.id);

        if (!relations || relations.length === 0) {
          return { text: `🛠️ **${dbAgent.display_name}** currently has no installed skills.`, actions_taken: [] };
        }

        let resp = `🛠️ **Skills installed for ${dbAgent.display_name}:**\n\n`;
        relations.forEach((r: any) => {
          if (r.skills) {
            resp += `- **${r.skills.name}**: ${r.skills.description}\n`;
          }
        });

        actionsTaken.push(`Listed skills for ${dbAgent.display_name}`);
        return { text: resp, actions_taken: actionsTaken };
      }

      case "install_mcp_server": {
        const { name, displayName, description, source, sourceUrl, command, args, envVars, capabilities, category } = parameters;
        const mcp = await installMcpServer({
          name,
          displayName: displayName || name,
          description,
          source: source || "npm",
          sourceUrl: sourceUrl || "",
          command,
          args: args || [],
          envVars: envVars || {},
          capabilities: capabilities || [],
          category: category || "general"
        });
        actionsTaken.push(`Instalado servidor MCP "${name}"`);
        return {
          text: `✅ **¡Servidor MCP "${displayName || name}" instalado con éxito!**\n\nEl driver ha sido registrado y está listo para ser asignado a los agentes de tu ecosistema.\n\n* **Comando:** \`${command}\`\n* **Source:** \`${source || "npm"}\`\n* **Capacidades:** ${capabilities && capabilities.length > 0 ? capabilities.join(", ") : "Ninguna"}\n\n¿Deseas que asigne este driver a algún agente como STEVE?`,
          actions_taken: actionsTaken
        };
      }

      case "list_mcp_servers": {
        const servers = await getMcpServers();
        if (servers.length === 0) {
          return {
            text: `🔌 **Servidores MCP:**\n\nActualmente no hay ningún servidor MCP instalado en el ecosistema. Puedes instalar uno desde el panel o pidiéndomelo directamente.`,
            actions_taken: ["Listed MCP servers (empty)"]
          };
        }
        let responseText = `🔌 **Servidores MCP Instalados en el Ecosistema:**\n\n`;
        servers.forEach((s) => {
          const statusDot = s.status === "installed" ? "🟢" : "🔴";
          const agentsStr = s.assignedAgents && s.assignedAgents.length > 0 
            ? s.assignedAgents.map((a: any) => `**${a.displayName}**`).join(", ")
            : "_Ninguno_";
          responseText += `${statusDot} **${s.displayName}** (\`${s.name}\`)\n`;
          responseText += `   * **Source:** \`${s.source}\`\n`;
          responseText += `   * **Comando:** \`${s.command} ${(s.args || []).join(" ")}\`\n`;
          responseText += `   * **Agentes Asignados:** ${agentsStr}\n`;
          responseText += `   * **Capacidades:** ${s.capabilities && s.capabilities.length > 0 ? s.capabilities.join(", ") : "Ninguna"}\n\n`;
        });
        actionsTaken.push("Listed MCP servers");
        return {
          text: responseText,
          actions_taken: actionsTaken
        };
      }

      case "assign_mcp_server": {
        const { mcpName, agentName } = parameters;
        const dbAgent = await findAgentByName(agentName);
        if (!dbAgent) {
          return { text: `❌ Agente "${agentName}" no encontrado.`, actions_taken: [] };
        }
        const servers = await getMcpServers();
        const server = servers.find((s: any) => s.name.toLowerCase() === mcpName.toLowerCase() || s.displayName.toLowerCase() === mcpName.toLowerCase());
        if (!server) {
          return { text: `❌ Servidor MCP "${mcpName}" no encontrado. Verifica si está instalado.`, actions_taken: [] };
        }
        await assignMcpToAgent(server.id, dbAgent.id);
        actionsTaken.push(`Asignado MCP "${server.displayName}" al agente ${dbAgent.display_name}`);
        return {
          text: `🔌 **Asignación de MCP exitosa:**\n\nHe asignado el driver **${server.displayName}** al agente **${dbAgent.display_name}** con éxito. Ahora el agente tiene acceso a estas capacidades: ${server.capabilities && server.capabilities.length > 0 ? server.capabilities.join(", ") : "Ninguna"}.`,
          actions_taken: actionsTaken
        };
      }

      case "list_agent_mcps": {
        const { agentName } = parameters;
        const dbAgent = await findAgentByName(agentName);
        if (!dbAgent) {
          return { text: `❌ Agente "${agentName}" no encontrado.`, actions_taken: [] };
        }
        const servers = await getMcpServers();
        const assigned = servers.filter((s: any) => s.assignedAgents && s.assignedAgents.some((a: any) => a.id === dbAgent.id));
        if (assigned.length === 0) {
          return {
            text: `🔌 El agente **${dbAgent.display_name}** actualmente no tiene ningún servidor MCP asignado.`,
            actions_taken: [`Listed MCPs for ${dbAgent.display_name} (empty)`]
          };
        }
        let resp = `🔌 **Servidores MCP asignados a ${dbAgent.display_name}:**\n\n`;
        assigned.forEach((s) => {
          const statusDot = s.status === "installed" ? "🟢" : "🔴";
          resp += `${statusDot} **${s.displayName}** (\`${s.name}\`) - ${s.description || "Sin descripción"}\n`;
        });
        actionsTaken.push(`Listed MCPs for ${dbAgent.display_name}`);
        return { text: resp, actions_taken: actionsTaken };
      }

      case "show_predefined_mcps": {
        let resp = `✨ **Catálogo de MCP Servers Predefinidos Disponibles:**\n\n`;
        PREDEFINED_MCPS.forEach((mcp) => {
          resp += `* **${mcp.displayName}** (\`${mcp.name}\`)\n`;
          resp += `  * **Descripción:** ${mcp.description}\n`;
          resp += `  * **Comando base:** \`${mcp.command}\`\n`;
          resp += `  * **Capacidades:** ${mcp.capabilities.join(", ")}\n\n`;
        });
        resp += `Puedes pedirme instalar cualquiera de ellos diciendo algo como *"Commander, instala el MCP de Supabase"* o configurarlo desde el panel de **🔌 MCPs**.`;
        actionsTaken.push("Listed predefined MCP catalog");
        return { text: resp, actions_taken: actionsTaken };
      }

      case "general_query":
      default: {
        // Run a semantic helper to answer questions using DB context
        // Fetch last messages to see if there's any mention
        const { data: recentMsgs } = await supabaseServer
          .from("conversation_messages")
          .select("sender, content, created_at")
          .order("created_at", { ascending: false })
          .limit(30);

        const messagesContext = recentMsgs 
          ? recentMsgs.map(m => `[${m.created_at}] ${m.sender}: ${m.content}`).join("\n")
          : "No recent messages.";

        const queryPrompt = `
The user is asking a question about the AutoClaw ecosystem:
"${message}"

Here is some live context from the database:
- Registered Agents: [${contextAgents}]
- Active Projects: [${contextProjects}]
- Active Skills: [${contextSkills}]

Recent Chat Messages in Ecosytem:
${messagesContext}

Please write a highly helpful, comprehensive, friendly answer to the user's question, using the live context provided. Keep your response clear and professional.
`;

        const queryResponse = await provider.chat(
          [{ role: 'user', content: queryPrompt }],
          {
            model: agentConfig.model,
            temperature: agentConfig.temperature || 0.7
          }
        );

        actionsTaken.push("Answered general query using database context");
        return {
          text: queryResponse.content || "I processed your request but could not generate an answer.",
          actions_taken: actionsTaken
        };
      }
    }
  } catch (err: any) {
    console.error("Error inside processCommanderCommand:", err);
    return {
      text: `❌ **Error executing command:** ${err.message || err}\n\nI was trying to perform an action but encountered a problem. Please make sure the database is configured and schemas are up to date!`,
      actions_taken: [`Error: ${err.message || "Unknown error"}`]
    };
  }
}
