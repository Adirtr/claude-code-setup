import type { MCPConfig, DetectedProject } from '../types/index.js';

export function recommendMCPs(project: DetectedProject): MCPConfig[] {
  const mcps: MCPConfig[] = [];

  // GitHub MCP - if CI/CD detected
  if (project.cicd === 'github-actions') {
    mcps.push({
      name: 'github',
      package: '@modelcontextprotocol/server-github',
      reason: 'GitHub Actions CI/CD detected',
      env: {
        GITHUB_TOKEN: '${GITHUB_TOKEN}',
      },
    });
  }

  // Supabase MCP
  if (project.database?.provider === 'supabase') {
    mcps.push({
      name: 'supabase',
      package: 'mcp-server-supabase',
      reason: 'Supabase database detected',
      env: {
        SUPABASE_URL: '${SUPABASE_URL}',
        SUPABASE_SERVICE_ROLE_KEY: '${SUPABASE_SERVICE_ROLE_KEY}',
      },
    });
  }

  // PostgreSQL MCP (if not Supabase)
  if (
    project.database?.type === 'postgresql' &&
    project.database?.provider !== 'supabase'
  ) {
    mcps.push({
      name: 'postgres',
      package: '@modelcontextprotocol/server-postgres',
      reason: 'PostgreSQL database detected',
      env: {
        DATABASE_URL: '${DATABASE_URL}',
      },
    });
  }

  // Memory MCP for large projects
  if (project.fileCount > 100) {
    mcps.push({
      name: 'memory',
      package: '@modelcontextprotocol/server-memory',
      reason: 'Large project - memory helps track context',
    });
  }

  return mcps;
}

export function generateSettingsJson(mcps: MCPConfig[]): string {
  if (mcps.length === 0) {
    return JSON.stringify({ mcpServers: {} }, null, 2);
  }

  const config: any = {
    mcpServers: {},
  };

  mcps.forEach(mcp => {
    const serverConfig: any = {
      command: 'npx',
      args: ['-y', mcp.package],
    };

    // Add arguments for specific MCPs
    if (mcp.name === 'supabase' && mcp.env) {
      serverConfig.args.push('--supabase-url', mcp.env.SUPABASE_URL);
      serverConfig.args.push('--service-role-key', mcp.env.SUPABASE_SERVICE_ROLE_KEY);
    }

    if (mcp.env && Object.keys(mcp.env).length > 0) {
      serverConfig.env = mcp.env;
    }

    config.mcpServers[mcp.name] = serverConfig;
  });

  return JSON.stringify(config, null, 2);
}
