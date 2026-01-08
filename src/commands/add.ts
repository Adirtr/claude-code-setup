import fs from 'fs-extra';
import path from 'path';
import { AddOptions } from '../types/index.js';
import { logger } from '../utils/logger.js';
import { detectProject } from '../detector/index.js';
import { AGENT_DEFINITIONS } from '../constants/agents.js';
import { COMMAND_DEFINITIONS } from '../constants/commands.js';
import { generateAgentFile } from '../generator/agents.js';
import { generateCommandFile } from '../generator/commands.js';
import Enquirer from 'enquirer';

export async function addCommand(
  type: string,
  name: string | undefined,
  options: AddOptions
): Promise<void> {
  try {
    const cwd = process.cwd();

    // Check if .claude directory exists
    const claudeDir = path.join(cwd, '.claude');
    if (!await fs.pathExists(claudeDir)) {
      logger.error('No Claude Code setup found in this directory.');
      logger.info('Run "claude-setup init" first to initialize the project.');
      process.exit(1);
    }

    // List mode
    if (options.list) {
      await listAvailable(type);
      return;
    }

    // Detect project for context
    logger.startSpinner('Analyzing project...');
    const detected = await detectProject(cwd, { skipHealthCheck: true });
    logger.succeedSpinner('Project analysis complete');
    console.log();

    // Handle different types
    switch (type) {
      case 'agent':
        await addAgent(detected, name, cwd, options);
        break;
      case 'command':
        await addCommandComponent(detected, name, cwd, options);
        break;
      case 'mcp':
        await addMCP(detected, name, cwd, options);
        break;
      default:
        logger.error(`Unknown component type: ${type}`);
        logger.info('Valid types: agent, command, mcp');
        process.exit(1);
    }

  } catch (error) {
    logger.error(`Failed to add component: ${error instanceof Error ? error.message : 'Unknown error'}`);
    process.exit(1);
  }
}

async function listAvailable(type: string): Promise<void> {
  logger.header(`Available ${type}s`);
  console.log();

  switch (type) {
    case 'agent':
      AGENT_DEFINITIONS.forEach(agent => {
        console.log(`  ${agent.id}`);
        console.log(`    ${agent.description}`);
        console.log();
      });
      break;
    case 'command':
      COMMAND_DEFINITIONS.forEach(cmd => {
        console.log(`  ${cmd.id}`);
        console.log(`    ${cmd.description}`);
        console.log();
      });
      break;
    case 'mcp':
      const mcps = [
        { name: 'github', description: 'GitHub integration for issues and PRs' },
        { name: 'supabase', description: 'Supabase database management' },
        { name: 'postgres', description: 'PostgreSQL database access' },
        { name: 'memory', description: 'Long-term memory storage' },
      ];
      mcps.forEach(mcp => {
        console.log(`  ${mcp.name}`);
        console.log(`    ${mcp.description}`);
        console.log();
      });
      break;
  }
}

async function addAgent(
  detected: any,
  name: string | undefined,
  cwd: string,
  options: AddOptions
): Promise<void> {
  let agentToAdd;

  if (name) {
    // Find agent by name
    agentToAdd = AGENT_DEFINITIONS.find(a => a.id === name);
    if (!agentToAdd) {
      logger.error(`Agent "${name}" not found.`);
      logger.info('Run "claude-setup add agent --list" to see available agents.');
      process.exit(1);
    }
  } else {
    // Interactive selection
    const choices = AGENT_DEFINITIONS.map(agent => ({
      name: agent.id,
      message: `${agent.name} - ${agent.description}`,
    }));

    try {
      const response: any = await (Enquirer.prompt as any)({
        type: 'select',
        name: 'agent',
        message: 'Select an agent to add:',
        choices,
      });

      agentToAdd = AGENT_DEFINITIONS.find(a => a.id === response.agent);
    } catch (error) {
      // User cancelled
      process.exit(0);
    }
  }

  if (!agentToAdd) {
    logger.error('No agent selected');
    process.exit(1);
  }

  // Check if agent already exists
  const agentPath = path.join(cwd, '.claude', 'agents', `${agentToAdd.id}.md`);
  if (await fs.pathExists(agentPath) && !options.force) {
    logger.error(`Agent "${agentToAdd.id}" already exists.`);
    logger.info('Use --force to overwrite.');
    process.exit(1);
  }

  // Generate agent file
  logger.startSpinner(`Generating ${agentToAdd.name}...`);
  const content = generateAgentFile(agentToAdd, detected);
  await fs.ensureDir(path.join(cwd, '.claude', 'agents'));
  await fs.writeFile(agentPath, content);
  logger.succeedSpinner(`Added agent: ${agentToAdd.name}`);

  console.log();
  logger.success(`✓ Created: .claude/agents/${agentToAdd.id}.md`);
  console.log();
  logger.info('Next steps:');
  console.log(`  1. Review the agent file and customize if needed`);
  console.log(`  2. Test the agent with Claude Code`);
}

async function addCommandComponent(
  detected: any,
  name: string | undefined,
  cwd: string,
  options: AddOptions
): Promise<void> {
  let commandToAdd;

  if (name) {
    // Find command by name
    commandToAdd = COMMAND_DEFINITIONS.find(c => c.id === name);
    if (!commandToAdd) {
      logger.error(`Command "${name}" not found.`);
      logger.info('Run "claude-setup add command --list" to see available commands.');
      process.exit(1);
    }
  } else {
    // Interactive selection
    const choices = COMMAND_DEFINITIONS.map(cmd => ({
      name: cmd.id,
      message: `${cmd.name} - ${cmd.description}`,
    }));

    try {
      const response: any = await (Enquirer.prompt as any)({
        type: 'select',
        name: 'command',
        message: 'Select a command to add:',
        choices,
      });

      commandToAdd = COMMAND_DEFINITIONS.find(c => c.id === response.command);
    } catch (error) {
      // User cancelled
      process.exit(0);
    }
  }

  if (!commandToAdd) {
    logger.error('No command selected');
    process.exit(1);
  }

  // Check if command already exists
  const commandPath = path.join(cwd, '.claude', 'commands', `${commandToAdd.id}.md`);
  if (await fs.pathExists(commandPath) && !options.force) {
    logger.error(`Command "${commandToAdd.id}" already exists.`);
    logger.info('Use --force to overwrite.');
    process.exit(1);
  }

  // Generate command file
  logger.startSpinner(`Generating ${commandToAdd.name}...`);
  const content = generateCommandFile(commandToAdd, detected);
  await fs.ensureDir(path.join(cwd, '.claude', 'commands'));
  await fs.writeFile(commandPath, content);
  logger.succeedSpinner(`Added command: ${commandToAdd.name}`);

  console.log();
  logger.success(`✓ Created: .claude/commands/${commandToAdd.id}.md`);
  console.log();
  logger.info('Next steps:');
  console.log(`  1. Review the command file and customize if needed`);
  console.log(`  2. Try running: /${commandToAdd.id}`);
}

async function addMCP(
  _detected: any,
  name: string | undefined,
  cwd: string,
  options: AddOptions
): Promise<void> {
  const availableMCPs = [
    { name: 'github', package: '@modelcontextprotocol/server-github', reason: 'GitHub integration for issues and PRs' },
    { name: 'supabase', package: 'mcp-server-supabase', reason: 'Supabase database management' },
    { name: 'postgres', package: '@modelcontextprotocol/server-postgres', reason: 'PostgreSQL database access' },
    { name: 'memory', package: '@modelcontextprotocol/server-memory', reason: 'Long-term memory storage' },
  ];

  let mcpToAdd;

  if (name) {
    // Find MCP by name
    mcpToAdd = availableMCPs.find(m => m.name === name);
    if (!mcpToAdd) {
      logger.error(`MCP "${name}" not found.`);
      logger.info('Run "claude-setup add mcp --list" to see available MCPs.');
      process.exit(1);
    }
  } else {
    // Interactive selection
    const choices = availableMCPs.map(mcp => ({
      name: mcp.name,
      message: `${mcp.name} - ${mcp.reason}`,
    }));

    try {
      const response: any = await (Enquirer.prompt as any)({
        type: 'select',
        name: 'mcp',
        message: 'Select an MCP to add:',
        choices,
      });

      mcpToAdd = availableMCPs.find(m => m.name === response.mcp);
    } catch (error) {
      // User cancelled
      process.exit(0);
    }
  }

  if (!mcpToAdd) {
    logger.error('No MCP selected');
    process.exit(1);
  }

  // Read existing settings.json or create new
  const settingsPath = path.join(cwd, '.claude', 'settings.json');
  let existingSettings: any = { mcpServers: {} };

  if (await fs.pathExists(settingsPath)) {
    try {
      existingSettings = await fs.readJson(settingsPath);
    } catch (error) {
      logger.warning('Could not parse existing settings.json, will create new one');
    }
  }

  // Check if MCP already exists
  if (existingSettings.mcpServers && existingSettings.mcpServers[mcpToAdd.name] && !options.force) {
    logger.error(`MCP "${mcpToAdd.name}" already configured.`);
    logger.info('Use --force to overwrite.');
    process.exit(1);
  }

  // Add the new MCP
  if (!existingSettings.mcpServers) {
    existingSettings.mcpServers = {};
  }

  existingSettings.mcpServers[mcpToAdd.name] = {
    command: 'npx',
    args: ['-y', mcpToAdd.package],
  };

  // Add env placeholder if needed
  if (mcpToAdd.name === 'github') {
    existingSettings.mcpServers[mcpToAdd.name].env = {
      GITHUB_TOKEN: '${GITHUB_TOKEN}',
    };
  } else if (mcpToAdd.name === 'supabase') {
    existingSettings.mcpServers[mcpToAdd.name].env = {
      SUPABASE_URL: '${SUPABASE_URL}',
      SUPABASE_KEY: '${SUPABASE_KEY}',
    };
  } else if (mcpToAdd.name === 'postgres') {
    existingSettings.mcpServers[mcpToAdd.name].env = {
      DATABASE_URL: '${DATABASE_URL}',
    };
  }

  // Write settings.json
  logger.startSpinner(`Adding ${mcpToAdd.name} MCP...`);
  await fs.ensureDir(path.join(cwd, '.claude'));
  await fs.writeJson(settingsPath, existingSettings, { spaces: 2 });
  logger.succeedSpinner(`Added MCP: ${mcpToAdd.name}`);

  console.log();
  logger.success(`✓ Updated: .claude/settings.json`);
  console.log();
  logger.info('Next steps:');
  console.log(`  1. Add required environment variables to your .env file`);
  if (mcpToAdd.name === 'github') {
    console.log(`     - GITHUB_TOKEN=your_token_here`);
  } else if (mcpToAdd.name === 'supabase') {
    console.log(`     - SUPABASE_URL=your_url_here`);
    console.log(`     - SUPABASE_KEY=your_key_here`);
  } else if (mcpToAdd.name === 'postgres') {
    console.log(`     - DATABASE_URL=your_connection_string_here`);
  }
  console.log(`  2. Restart Claude Code to activate the MCP`);
}
