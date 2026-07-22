import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// comando-creador.js - Herramientas de Commander para gestionar el ecosistema Neuron Connect
//
// Commander ejecuta este script via Node.js para:
//   - Crear agentes (workspace + Supabase + runtime OpenClaw)
//   - Crear proyectos/salas con conversaciones individuales por agente
//   - Asignar tareas a agentes
//   - Monitorear el puente Command Center
//
// INSPIRACIÓN: Proyectos como SupaKeeper, OptiKR donde cada agente tenía
// su propia carpeta/archivo .txt y trabajaban colaborativamente.
//
// USO:
//   node comando-creador.js create-agent <nombre> <rol> <alma>
//   node comando-creador.js create-project <nombre-proyecto> <objetivo> <participantes...>
//   node comando-creador.js assign-task <agente> <instruccion>
//   node comando-creador.js monitor
//   node comando-creador.js respond <convId> <agente> <respuesta>
//   node comando-creador.js list-agents
//   node comando-creador.js list-projects
//   node comando-creador.js project-status <nombre-proyecto>

const SUPABASE_URL = 'https://iwucolryqetsyjeompmq.supabase.co';
const AGENTS_BASE = 'C:\\Users\\edwin\\.openclaw-autoclaw\\agents';
const PROJECTS_BASE = 'C:\\Users\\edwin\\OneDrive\\Desktop\\DESARROLLO ENTRE AGENTES\\PROYECTOS';
const RUNTIME_JSON = 'C:\\Users\\edwin\\.openclaw-autoclaw\\openclaw.runtime.json';
const DESKTOP_CACHE = 'C:\\Users\\edwin\\AppData\\Roaming\\AutoClaw\\settings.json';
const fs = require('fs');
const path = require('path');
const exec = require('child_process').execSync;

// ============================================================
// HELPERS
// ============================================================

function getKey() {
    const f = 'C:\\Users\\edwin\\OneDrive\\Desktop\\DESARROLLO ENTRE AGENTES\\PROYECTOS\\AUTOCLAW\\ANTECEDENTES\\SUPABASE AUTOCLAW.txt';
    const raw = fs.readFileSync(f, 'utf8');
    const m = raw.match(/SERVICE ROL KEY:\s*(\S+)/);
    return m ? m[1].trim() : null;
}

const K = getKey();
if (!K) { console.error('FATAL: No Supabase key'); process.exit(1); }

const H = { 'apikey': K, 'Authorization': 'Bearer ' + K, 'Content-Type': 'application/json', 'Prefer': 'return=representation' };

async function api(method, path, body) {
    const opts = { method, headers: H };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(SUPABASE_URL + '/rest/v1/' + path, opts);
    if (!res.ok) { const t = await res.text(); throw new Error(res.status + ': ' + t.substring(0,120)); }
    if (res.status === 204) return null;
    return res.json();
}

function readJSON(path) {
    try { return JSON.parse(fs.readFileSync(path, 'utf8')); } catch { return null; }
}

function esc(str) {
    return str.replace(/'/g, "''").replace(/`/g, '``');
}

function sh(cmd, timeoutMs = 10000) {
    return exec(cmd, { shell: 'powershell', timeout: timeoutMs, stdio: 'pipe' }).toString().trim();
}

function sanitize(name) {
    return name.replace(/[<>:"\/\\|?*]/g, '_').replace(/\s+/g, ' ').trim();
}

function shortId(id) {
    return id ? id.substring(0, 8) : 'unknown';
}

// ============================================================
// REGISTRAR AGENTE EN RUNTIME DE OPENCLAW
// ============================================================
function registerInRuntime(nombre, rol) {
    const nameLower = nombre.toLowerCase();
    const nameUpper = nombre.charAt(0).toUpperCase() + nombre.slice(1);

    console.log(`[Runtime] Registrando ${nombre} en OpenClaw...`);

    const runtime = readJSON(RUNTIME_JSON) || { agents: [] };
    if (!runtime.agents) runtime.agents = [];

    const exists = runtime.agents.find(a => a.name === nameLower);
    if (exists) {
        console.log(`[Runtime] ${nombre} ya estaba en runtime.`);
    } else {
        runtime.agents.push({
            name: nameLower, enabled: true,
            model: "deepseek__522e8bf2-6dba-4667-8bef-afa2e7dafeb7/deepseek-chat",
            provider: "deepseek__522e8bf2-6dba-4667-8bef-afa2e7dafeb7",
            description: `${rol} - Neuron Connect`,
            displayName: nameUpper
        });
        fs.writeFileSync(RUNTIME_JSON, JSON.stringify(runtime, null, 2), 'utf8');
        console.log(`[Runtime] ✅ ${nombre} agregado a openclaw.runtime.json`);
    }

    const settings = readJSON(DESKTOP_CACHE) || {};
    if (!settings.agents) settings.agents = [];

    const existsInDesktop = settings.agents.find(a => a.id === nameLower);
    if (existsInDesktop) {
        console.log(`[Desktop] ${nombre} ya estaba en settings.`);
    } else {
        settings.agents.push({
            id: nameLower, name: nameUpper, description: rol,
            config: { model: "deepseek__522e8bf2-6dba-4667-8bef-afa2e7dafeb7/deepseek-chat", provider: "deepseek__522e8bf2-6dba-4667-8bef-afa2e7dafeb7" }
        });
        fs.writeFileSync(DESKTOP_CACHE, JSON.stringify(settings, null, 2), 'utf8');
        console.log(`[Desktop] ✅ ${nombre} agregado a settings.json`);
    }

    console.log(`[Runtime] ⚠️  REINICIAR AutoClaw para que ${nombre} aparezca en la desktop app.`);
    return true;
}

// ============================================================
// 1. CREAR AGENTE
// ============================================================
async function createAgent(nombre, rol, alma) {
    console.log(`\n========================================`);
    console.log(`  CREANDO AGENTE: ${nombre}`);
    console.log(`========================================\n`);

    const nameLower = nombre.toLowerCase();
    const ws = `${AGENTS_BASE}\\${nameLower}\\workspace`;

    try {
        console.log('[1/6] Creando directorios...');
        sh(`mkdir "${ws}\\skills" "${ws}\\memory" "${ws}\\config" 2>$null`, 5000);
        console.log(`       ✅ ${ws}`);

        console.log('[2/6] Escribiendo SOUL.md...');
        const soulContent = `# SOUL.md - ${nombre.toUpperCase()}\n\n${alma}\n\n---\n**Reporta a:** Commander (CEO) · TRISMEGISTO (Edwin)\n**Ecosistema:** Neuron Connect\n`;
        sh(`Set-Content -Path "${ws}\\SOUL.md" -Value '${esc(soulContent)}' -Encoding utf8`, 3000);

        console.log('[3/6] Escribiendo IDENTITY.md...');
        const identContent = `---\nsummary: "Agent identity record for ${nombre}"\n---\n# IDENTITY.md - ${nombre}\n- **Name:** ${nombre}\n- **Role:** ${rol}\n- **Reports to:** Commander\n- **Ecosystem:** Neuron Connect\n- **Comm:** via Supabase bridge\n`;
        sh(`Set-Content -Path "${ws}\\IDENTITY.md" -Value '${esc(identContent)}' -Encoding utf8`, 3000);

        console.log('[4/6] Escribiendo AGENTS.md...');
        const agentsContent = `# AGENTS.md - ${nombre.toUpperCase()}\n\nWorkspace de ${nombre} en Neuron Connect.\n\nTrabaja en proyectos colaborativos via salas multiusuario.\n`;
        sh(`Set-Content -Path "${ws}\\AGENTS.md" -Value '${esc(agentsContent)}' -Encoding utf8`, 3000);

        console.log('[5/6] Registrando en Supabase...');
        const agent = await api('POST', 'agents', {
            name: nameLower,
            display_name: nombre.charAt(0).toUpperCase() + nombre.slice(1),
            role: rol, soul: alma, status: 'active',
            model_config: { provider: 'deepseek', model: 'deepseek-chat' },
            source: 'commander_create'
        });
        const agentId = agent ? agent[0]?.id : 'unknown';

        console.log('[6/6] Registrando en runtime OpenClaw...');
        registerInRuntime(nameLower, rol);

        console.log(`\n✅ AGENTE "${nombre}" CREADO`);
        console.log(`   ID: ${agentId}  |  Workspace: ${ws}`);
        console.log(`   📌 REINICIAR AutoClaw para verlo en desktop app`);

    } catch (err) {
        console.error(`\n❌ Error: ${err.message}`);
    }
}

// ============================================================
// 2. CREAR PROYECTO (antes "create-room")
// ============================================================
//
// Esto replica el flujo de proyectos anteriores (SupaKeeper, OptiKR):
//   - Crea carpeta física del proyecto
//   - Crea una sala multiusuario en Supabase
//   - Para CADA participante, crea una conversación dedicada
//   - Inicializa archivos de trabajo en la carpeta del proyecto
//
async function createProject(nombreProyecto, objetivo, ...participantes) {
    console.log(`\n===================================================`);
    console.log(`  🏗️  NUEVO PROYECTO: ${nombreProyecto}`);
    console.log(`  Objetivo: ${objetivo}`);
    console.log(`  Participantes: ${participantes.join(', ')}`);
    console.log(`===================================================\n`);

    const projectFolderName = sanitize(nombreProyecto.toUpperCase());
    const projectPath = `${PROJECTS_BASE}\\${projectFolderName}`;
    const timestamp = new Date().toISOString();

    try {
        // ============================================================
        // PASO 1: Crear carpeta física del proyecto
        // ============================================================
        console.log('[1/5] Creando carpeta física del proyecto...');
        sh(`New-Item -ItemType Directory -Path "${projectPath}\\ANTECEDENTES","${projectPath}\\EXTRACCIONES","${projectPath}\\REPORTES","${projectPath}\\CONCLUSIONES","${projectPath}\\CONVERSACIONES","${projectPath}\\MARKETING" -Force 2>$null | Out-Null`, 5000);
        console.log(`       📁 ${projectPath}`);

        // ============================================================
        // PASO 2: Crear README del proyecto
        // ============================================================
        console.log('[2/5] Escribiendo README.md del proyecto...');
        const readmeContent = `# ${projectFolderName}\n\n**Objetivo:** ${objetivo}\n**Creado por:** Commander\n**Fecha:** ${timestamp}\n**Participantes:** ${participantes.join(', ')}\n\n---\n\n## Antecedentes\nDocumentos e información de partida.\n\n## Extracciones\nAnálisis y datos extraídos.\n\n## Reportes\nInformes generados.\n\n## Conclusiones\nDecisiones y acuerdos finales.\n\n## Conversaciones\nRegistro de la comunicación entre agentes.\n\n## Marketing\nMaterial promocional y estrategias.\n`;
        sh(`Set-Content -Path "${projectPath}\\README.md" -Value '${esc(readmeContent)}' -Encoding utf8`, 3000);

        // ============================================================
        // PASO 3: Crear sala multiusuario en Supabase
        // ============================================================
        console.log('[3/5] Creando sala en Supabase...');
        const roomConv = await api('POST', 'conversations', {
            title: `${nombreProyecto}`,
            conversation_type: 'agent_chat',
            status: 'active',
            metadata: {
                is_project: true,
                project_name: projectFolderName,
                project_objective: objetivo,
                created_by: 'commander',
                participants: participantes,
                autoclaw_bridge: true,
                created_at: timestamp
            }
        });
        const roomConvId = roomConv ? roomConv[0]?.id : null;
        if (!roomConvId) throw new Error('No se pudo crear la sala del proyecto');
        console.log(`       🏛️  Sala del proyecto: ${roomConvId}`);

        // Mensaje de bienvenida en la sala
        await api('POST', 'conversation_messages', {
            conversation_id: roomConvId,
            sender: '🤖 Commander',
            content: `🏗️ **Proyecto "${nombreProyecto}" iniciado.**\n\n**Objetivo:** ${objetivo}\n**Participantes:** ${participantes.join(', ')}\n\n---\n\nEsta es la sala central del proyecto. Todos los participantes pueden ver y responder aquí.\nCada participante también tiene su conversación individual para trabajar en sus tareas específicas.`,
            message_type: 'system',
            metadata: { is_project_welcome: true, project_name: projectFolderName }
        });

        // ============================================================
        // PASO 4: Para CADA participante, crear su conversación individual
        // ============================================================
        console.log('[4/5] Creando conversaciones individuales por participante...');

        for (const p of participantes) {
            const pLower = p.toLowerCase();
            const isHuman = (pLower === 'edwin' || pLower === 'trismegisto');

            // Crear conversación individual para este participante
            const indConv = await api('POST', 'conversations', {
                title: `${nombreProyecto} - ${p}`,
                conversation_type: 'agent_chat',
                status: 'active',
                metadata: {
                    is_individual: true,
                    project_name: projectFolderName,
                    project_conversation_id: roomConvId,
                    agent_name: pLower,
                    participant: p,
                    created_by: 'commander',
                    autoclaw_bridge: true
                }
            });
            const indConvId = indConv ? indConv[0]?.id : null;
            console.log(`       💬 ${p}: ${shortId(indConvId)}`);

            // Archivo .txt en la carpeta CONVERSACIONES del proyecto
            const convLogFile = `${projectPath}\\CONVERSACIONES\\${p}.txt`;
            const convHeader = `=== CONVERSACIÓN: ${nombreProyecto} - ${p} ===\nConversation ID: ${indConvId || 'N/A'}\nProyecto: ${projectFolderName}\nIniciado: ${timestamp}\n\n`;
            sh(`Set-Content -Path "${convLogFile}" -Value '${esc(convHeader)}' -Encoding utf8`, 3000);

            // Mensaje de bienvenida individual
            const welcomeMsg = isHuman
                ? `${p}, has sido invitado al proyecto "${nombreProyecto}". Objetivo: ${objetivo}. Participantes: ${participantes.join(', ')}.`
                : `[ASIGNACIÓN] ${p}, has sido asignado al proyecto "${nombreProyecto}".\n\n**Objetivo:** ${objetivo}\n**Sala del proyecto:** ${roomConvId}\n**Participantes:** ${participantes.join(', ')}\n\nRevisa la sala central y contribuye según tu especialidad.`;

            await api('POST', 'conversation_messages', {
                conversation_id: roomConvId,
                sender: '🤖 Commander',
                content: welcomeMsg,
                message_type: 'text',
                metadata: {
                    autoclaw_pending: true,
                    autoclaw_agent: pLower,
                    autoclaw_project: projectFolderName,
                    is_assignment: true,
                    is_individual: true,
                    individual_conversation_id: indConvId,
                    project_conversation_id: roomConvId
                }
            });
        }

        // ============================================================
        // PASO 5: Registrar el proyecto en la metadata de Commander
        // ============================================================
        console.log('[5/5] Registrando proyecto en metacognicion...');
        await api('POST', 'memories', {
            agent_id: null,
            memory_type: 'proyecto',
            title: `Proyecto: ${nombreProyecto}`,
            content: `Proyecto "${nombreProyecto}" creado por Commander.\nObjetivo: ${objetivo}\nParticipantes: ${participantes.join(', ')}\nSala ID: ${roomConvId}\nCarpeta: ${projectPath}`,
            importance: 8,
            is_shared: true,
            tags: [projectFolderName.toLowerCase(), ...participantes.map(p => p.toLowerCase()), 'proyecto', 'commander'],
            source: 'commander_create'
        });

        // ============================================================
        // RESUMEN
        // ============================================================
        console.log(`\n===================================================`);
        console.log(`  ✅ PROYECTO "${nombreProyecto}" CREADO`);
        console.log(`===================================================\n`);
        console.log(`  📁 ${projectPath}`);
        console.log(`  🏛️  Sala del proyecto:  ${roomConvId}`);
        console.log(`  👥 Participantes:      ${participantes.join(', ')}`);
        console.log(`  💬 Conversaciones:`);
        for (const p of participantes) {
            console.log(`     - ${p}`);
        }
        console.log(`\n📌 Los agentes recibirán su asignación via pending flag.`);
        console.log(`📌 Edwin ve la sala en Command Center.`);
        console.log(`📌 Cada agente trabajara desde su conversacion individual.`);

    } catch (err) {
        console.error(`\n❌ Error creando proyecto: ${err.message}`);
    }
}

// ============================================================
// 3. ASIGNAR TAREA A UN AGENTE
// ============================================================
async function assignTask(agente, instruccion) {
    console.log(`\n========================================`);
    console.log(`  ASIGNANDO TAREA A: ${agente}`);
    console.log(`========================================\n`);

    try {
        const agent = await api('GET', `agents?name=eq.${agente.toLowerCase()}&select=id,display_name`);
        if (!agent || agent.length === 0) {
            throw new Error(`Agente "${agente}" no encontrado en Supabase.`);
        }

        let convs = await api('GET', 'conversations?title=eq.Comando%20Central%20-%20Chat%20Principal&select=id');
        let convId = convs && convs.length > 0 ? convs[0].id : null;

        if (!convId) {
            const newConv = await api('POST', 'conversations', {
                title: 'Comando Central - Chat Principal',
                conversation_type: 'agent_chat', status: 'active',
                metadata: { autoclaw_bridge: true, is_main_channel: true }
            });
            convId = newConv ? newConv[0]?.id : null;
        }

        await api('POST', 'conversation_messages', {
            conversation_id: convId,
            sender: 'Commander',
            content: `[TAREA DE COMMANDER]\n\n${instruccion}`,
            message_type: 'task',
            metadata: {
                autoclaw_pending: true, autoclaw_agent: agente.toLowerCase(),
                is_task: true, source: 'commander',
                assigned_at: new Date().toISOString()
            }
        });

        console.log(`✅ Tarea asignada a ${agent[0].display_name}`);

    } catch (err) {
        console.error(`❌ Error: ${err.message}`);
    }
}

// ============================================================
// 4. MONITOREAR PUENTE
// ============================================================
async function monitorBridge() {
    try {
        const msgs = await api('GET',
            "conversation_messages?metadata->>autoclaw_pending=eq.true&order=created_at.asc&limit=10&select=id,conversation_id,sender,content,metadata");

        if (!msgs || msgs.length === 0) {
            console.log('OK no pending');
            return;
        }

        console.log(`\n📬 MENSAJES PENDIENTES: ${msgs.length}\n`);
        for (const msg of msgs) {
            const target = msg.metadata?.autoclaw_agent || 'unknown';
            const project = msg.metadata?.autoclaw_project || '';
            const isTask = msg.metadata?.is_task ? '🔴' : '📬';
            console.log(`  ${isTask} ${shortId(msg.id)} → ${target}`);
            if (project) console.log(`     Proyecto: ${project}`);
            console.log(`     Msg: ${(msg.content || '').substring(0, 120)}`);
            console.log(`     Conv: ${shortId(msg.conversation_id)}`);
            console.log('');
        }

    } catch (err) {
        console.error(`❌ Error: ${err.message}`);
    }
}

// ============================================================
// 5. RESPONDER EN CONVERSACIÓN
// ============================================================
async function respond(agente, convId, respuesta) {
    console.log(`\n========================================`);
    console.log(`  RESPONDIENDO COMO: ${agente}`);
    console.log(`  En conversación: ${convId}`);
    console.log(`========================================\n`);

    try {
        const agent = await api('GET', `agents?name=eq.${agente.toLowerCase()}&select=id,display_name`);
        const a = agent ? agent[0] : null;

        await api('POST', 'conversation_messages', {
            conversation_id: convId,
            sender: a?.display_name || agente,
            sender_agent_id: a?.id || null,
            content: respuesta,
            message_type: 'text',
            metadata: {
                autoclaw_response: true,
                autoclaw_agent: agente.toLowerCase(),
                responded_at: new Date().toISOString()
            }
        });

        console.log(`✅ Respuesta guardada en ${shortId(convId)}`);

        // También guardar en el archivo .txt de la conversación si es un proyecto
        try {
            const convsDir = PROJECTS_BASE;
            if (fs.existsSync(convsDir)) {
                const files = fs.readdirSync(convsDir).filter(f => fs.statSync(path.join(convsDir, f)).isDirectory());
                for (const dir of files) {
                    const convFile = path.join(convsDir, dir, 'CONVERSACIONES', `${agente}.txt`);
                    if (fs.existsSync(convFile)) {
                        const entry = `\n[${new Date().toISOString()}] ${a?.display_name || agente}: ${respuesta.substring(0, 200)}\n`;
                        fs.appendFileSync(convFile, entry, 'utf8');
                        console.log(`       ✍️ También guardado en: ${convFile}`);
                        break;
                    }
                }
            }
        } catch (e) {
            // No es crítico si no se puede escribir el archivo
        }

    } catch (err) {
        console.error(`❌ Error: ${err.message}`);
    }
}

// ============================================================
// 6. LISTAR AGENTES
// ============================================================
async function listAgents() {
    console.log(`\n========================================`);
    console.log(`  AGENTES DEL ECOSISTEMA`);
    console.log(`========================================\n`);

    try {
        const agents = await api('GET', 'agents?select=id,name,display_name,role,status&order=created_at.asc');
        if (!agents || agents.length === 0) {
            console.log('No hay agentes registrados.');
            return;
        }
        console.log(`${'NOMBRE'.padEnd(15)} ${'ROL'.padEnd(25)} STATUS`);
        console.log(`${''.padEnd(15,'—')} ${''.padEnd(25,'—')} ——————`);
        for (const a of agents) {
            console.log(`${(a.display_name || a.name).padEnd(15)} ${(a.role || '-').padEnd(25)} ${a.status || 'active'}`);
        }
        console.log(`\nTotal: ${agents.length} agente(s)`);
    } catch (err) {
        console.error(`❌ Error: ${err.message}`);
    }
}

// ============================================================
// 7. LISTAR PROYECTOS
// ============================================================
async function listProjects() {
    console.log(`\n========================================`);
    console.log(`  PROYECTOS ACTIVOS`);
    console.log(`========================================\n`);

    try {
        const projects = await api('GET',
            "conversations?metadata->>is_project=eq.true&order=created_at.desc&select=id,title,status,created_at,metadata");

        if (!projects || projects.length === 0) {
            console.log('No hay proyectos activos.');
            return;
        }

        for (const p of projects) {
            const meta = p.metadata || {};
            const date = p.created_at ? new Date(p.created_at).toLocaleDateString('es-MX') : '?';
            console.log(`  📁 ${p.title || 'Sin nombre'}`);
            console.log(`     ID: ${shortId(p.id)}  |  Estado: ${p.status}  |  Creado: ${date}`);
            console.log(`     Participantes: ${(meta.participants || []).join(', ')}`);
            console.log(`     Objetivo: ${(meta.project_objective || '').substring(0, 100)}`);
            console.log('');
        }

    } catch (err) {
        console.error(`❌ Error: ${err.message}`);
    }
}

// ============================================================
// 8. STATUS DE PROYECTO
// ============================================================
async function projectStatus(nombreProyecto) {
    console.log(`\n========================================`);
    console.log(`  STATUS: ${nombreProyecto}`);
    console.log(`========================================\n`);

    try {
        // Buscar en Supabase
        const encodedTitle = encodeURIComponent(nombreProyecto);
        const convs = await api('GET', `conversations?title=eq.${encodedTitle}&select=id,title,status,created_at,metadata`);

        if (!convs || convs.length === 0) {
            console.log(`Proyecto "${nombreProyecto}" no encontrado.`);
            return;
        }

        const project = convs[0];
        const meta = project.metadata || {};

        console.log(`  📁 ${project.title}`);
        console.log(`  ID: ${project.id}`);
        console.log(`  Estado: ${project.status}`);
        console.log(`  Participantes: ${(meta.participants || []).join(', ')}`);
        console.log(`  Objetivo: ${meta.project_objective || 'N/A'}`);

        // Buscar mensajes recientes
        const msgs = await api('GET',
            `conversation_messages?conversation_id=eq.${project.id}&order=created_at.desc&limit=5&select=sender,content,created_at,message_type`);

        if (msgs && msgs.length > 0) {
            console.log(`\n  Últimos mensajes:`);
            for (const m of msgs.reverse()) {
                const d = new Date(m.created_at).toLocaleTimeString('es-MX');
                console.log(`  [${d}] ${m.sender}: ${(m.content || '').substring(0, 80)}`);
            }
        }

        // Buscar carpeta física
        const folderName = sanitize(nombreProyecto.toUpperCase());
        const projectPath = `${PROJECTS_BASE}\\${folderName}`;
        if (fs.existsSync(projectPath)) {
            console.log(`\n  📁 Carpeta física: ${projectPath}`);
            const files = fs.readdirSync(projectPath).filter(f => fs.statSync(path.join(projectPath, f)).isDirectory());
            console.log(`  Subdirectorios: ${files.join(', ')}`);
        } else {
            console.log(`\n  ⚠️  Carpeta física no encontrada: ${projectPath}`);
        }

    } catch (err) {
        console.error(`❌ Error: ${err.message}`);
    }
}

// ============================================================
// MAIN
// ============================================================
async function main() {
    const cmd = process.argv[2];

    switch(cmd) {
        case 'create-agent':
            await createAgent(process.argv[3], process.argv[4], process.argv[5]);
            break;
        case 'create-project':
            await createProject(process.argv[3], process.argv[4], ...process.argv.slice(5));
            break;
        case 'assign-task':
            await assignTask(process.argv[3], process.argv.slice(4).join(' '));
            break;
        case 'monitor':
            await monitorBridge();
            break;
        case 'respond':
            await respond(process.argv[3], process.argv[4], process.argv.slice(5).join(' '));
            break;
        case 'list-agents':
            await listAgents();
            break;
        case 'list-projects':
            await listProjects();
            break;
        case 'project-status':
            await projectStatus(process.argv[3]);
            break;
        default:
            console.log('\n📋 COMANDOS DISPONIBLES:\n');
            console.log('  create-agent <nombre> <rol> <alma>');
            console.log('  create-project <nombre> <objetivo> <participante1> [participante2...]');
            console.log('  assign-task <agente> <instruccion>');
            console.log('  monitor');
            console.log('  respond <agente> <convId> <respuesta>');
            console.log('  list-agents');
            console.log('  list-projects');
            console.log('  project-status <nombre>');
    }
}

main().catch(e => { console.error('\n❌ FATAL:', e.message); process.exit(1); });
