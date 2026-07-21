export interface PredefinedMcp {
  name: string;
  displayName: string;
  description: string;
  source: 'local' | 'github' | 'npm';
  command: string;
  category: string;
  capabilities: string[];
  requiredEnvVars?: string[];
}

export const PREDEFINED_MCPS: PredefinedMcp[] = [
  {
    name: 'supabase-mcp',
    displayName: 'Supabase MCP',
    description: 'Acceso directo a Supabase: consultas SQL, gestión de tablas, Row Level Security',
    source: 'npm',
    command: 'npx @anthropic/supabase-mcp',
    category: 'database',
    capabilities: ['query_db', 'list_tables', 'run_sql', 'manage_rls'],
    requiredEnvVars: ['SUPABASE_URL', 'SUPABASE_KEY']
  },
  {
    name: 'github-mcp',
    displayName: 'GitHub MCP',
    description: 'Gestión de repositorios: issues, PRs, code review, búsqueda de código',
    source: 'npm',
    command: 'npx @anthropic/github-mcp',
    category: 'github',
    capabilities: ['list_issues', 'create_pr', 'search_code', 'review_code'],
    requiredEnvVars: ['GITHUB_PERSONAL_ACCESS_TOKEN']
  },
  {
    name: 'filesystem-mcp',
    displayName: 'File System MCP',
    description: 'Lectura y escritura de archivos locales en el sistema',
    source: 'npm',
    command: 'npx @anthropic/filesystem-mcp',
    category: 'filesystem',
    capabilities: ['read_file', 'write_file', 'list_dir', 'search_files'],
    requiredEnvVars: ['ALLOWED_DIRECTORIES']
  },
  {
    name: 'puppeteer-mcp',
    displayName: 'Puppeteer MCP',
    description: 'Automatización de navegador: navegar, hacer clic, extraer, screenshots',
    source: 'npm',
    command: 'npx @anthropic/puppeteer-mcp',
    category: 'browser',
    capabilities: ['navigate', 'click', 'extract', 'screenshot', 'pdf']
  },
  {
    name: 'notion-mcp',
    displayName: 'Notion MCP',
    description: 'Gestión de bases de datos y páginas de Notion',
    source: 'npm',
    command: 'npx @anthropic/notion-mcp',
    category: 'api',
    capabilities: ['query_db', 'create_page', 'update_page', 'search'],
    requiredEnvVars: ['NOTION_API_KEY']
  }
];
