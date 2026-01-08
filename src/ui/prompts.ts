import Enquirer from 'enquirer';
import type { SetupMode, DetectedProject, AgentDefinition, CommandDefinition, MCPConfig } from '../types/index.js';
import { AGENT_DEFINITIONS } from '../constants/agents.js';
import { COMMAND_DEFINITIONS } from '../constants/commands.js';
import { recommendMCPs } from '../constants/mcps.js';

export class UIPrompts {
  /**
   * Ask user to press Enter to continue
   */
  async pressEnterToContinue(): Promise<void> {
    await (Enquirer.prompt as any)({
      type: 'confirm',
      name: 'continue',
      message: 'Press Enter to continue',
      initial: true,
    });
  }

  /**
   * Ask user to select setup mode
   */
  async askMode(detected: DetectedProject): Promise<SetupMode> {
    const recommended = detected.projectState === 'existing' ? 'automatic' : 'light';

    const choices = ['light', 'automatic', 'custom'];

    try {
      const response: any = await (Enquirer.prompt as any)({
        type: 'select',
        name: 'mode',
        message: 'How would you like to set up Claude Code?',
        choices: [
          { name: 'light', message: '⚡ Light - Basic CLAUDE.md only (2 minutes)' },
          { name: 'automatic', message: '🚀 Automatic - Full setup (3 minutes) ⭐ Recommended' },
          { name: 'custom', message: '⚙️  Custom - Choose components (5+ minutes)' },
        ],
        initial: choices.indexOf(recommended),
      });

      return response.mode as SetupMode;
    } catch (error) {
      // User cancelled (Ctrl+C)
      process.exit(0);
    }
  }

  /**
   * Confirm multi-tenant detection
   */
  async confirmMultiTenant(tenantField: string | null): Promise<boolean> {
    try {
      const message = tenantField
        ? `Detected multi-tenant patterns with field "${tenantField}". Is this correct?`
        : 'Detected possible multi-tenant patterns. Is this a multi-tenant application?';

      const response: any = await (Enquirer.prompt as any)({
        type: 'confirm',
        name: 'multiTenant',
        message,
        initial: true,
      });

      return response.multiTenant;
    } catch (error) {
      return false;
    }
  }

  /**
   * Ask for custom tenant field name
   */
  async askTenantField(): Promise<string> {
    try {
      const response: any = await (Enquirer.prompt as any)({
        type: 'input',
        name: 'tenantField',
        message: 'What is the tenant field name?',
        initial: 'user_id',
        validate: (value: string) => {
          if (!value.trim()) {
            return 'Tenant field cannot be empty';
          }
          return true;
        },
      });

      return response.tenantField;
    } catch (error) {
      return 'user_id';
    }
  }

  /**
   * Ask user to select agents (multi-select)
   */
  async selectAgents(detected: DetectedProject): Promise<AgentDefinition[]> {
    const recommended = AGENT_DEFINITIONS.filter(agent => agent.applicableFor(detected));
    const recommendedIds = recommended.map(a => a.id);

    const choices = AGENT_DEFINITIONS.map(agent => ({
      name: agent.id,
      message: `${agent.name} - ${agent.description}`,
      enabled: recommendedIds.includes(agent.id),
    }));

    try {
      const response: any = await (Enquirer.prompt as any)({
        type: 'multiselect',
        name: 'agents',
        message: 'Select agents to include (recommended items pre-selected)',
        choices,
        hint: '(Use <space> to toggle, <return> to submit)',
      });

      const selectedIds = response.agents as string[];
      return AGENT_DEFINITIONS.filter(agent => selectedIds.includes(agent.id));
    } catch (error) {
      // User cancelled
      process.exit(0);
    }
  }

  /**
   * Ask user to select commands (multi-select)
   */
  async selectCommands(detected: DetectedProject): Promise<CommandDefinition[]> {
    const recommended = COMMAND_DEFINITIONS.filter(cmd => cmd.applicableFor(detected));
    const recommendedIds = recommended.map(c => c.id);

    const choices = COMMAND_DEFINITIONS.map(cmd => ({
      name: cmd.id,
      message: `${cmd.name} - ${cmd.description}`,
      enabled: recommendedIds.includes(cmd.id),
    }));

    try {
      const response: any = await (Enquirer.prompt as any)({
        type: 'multiselect',
        name: 'commands',
        message: 'Select commands to include (recommended items pre-selected)',
        choices,
        hint: '(Use <space> to toggle, <return> to submit)',
      });

      const selectedIds = response.commands as string[];
      return COMMAND_DEFINITIONS.filter(cmd => selectedIds.includes(cmd.id));
    } catch (error) {
      // User cancelled
      process.exit(0);
    }
  }

  /**
   * Ask user to select MCPs (multi-select)
   */
  async selectMCPs(detected: DetectedProject): Promise<MCPConfig[]> {
    const recommended = recommendMCPs(detected);
    const recommendedNames = recommended.map(m => m.name);

    // Get all possible MCPs
    const allMCPs: MCPConfig[] = [
      { name: 'github', package: '@modelcontextprotocol/server-github', reason: 'GitHub integration for issues and PRs' },
      { name: 'supabase', package: 'mcp-server-supabase', reason: 'Supabase database management' },
      { name: 'postgres', package: '@modelcontextprotocol/server-postgres', reason: 'PostgreSQL database access' },
      { name: 'memory', package: '@modelcontextprotocol/server-memory', reason: 'Long-term memory storage' },
    ];

    const choices = allMCPs.map(mcp => ({
      name: mcp.name,
      message: `${mcp.name} - ${mcp.reason}`,
      enabled: recommendedNames.includes(mcp.name),
    }));

    try {
      const response: any = await (Enquirer.prompt as any)({
        type: 'multiselect',
        name: 'mcps',
        message: 'Select MCPs to configure (recommended items pre-selected)',
        choices,
        hint: '(Use <space> to toggle, <return> to submit)',
      });

      const selectedNames = response.mcps as string[];
      return allMCPs.filter(mcp => selectedNames.includes(mcp.name));
    } catch (error) {
      // User cancelled
      process.exit(0);
    }
  }

  /**
   * Show review screen and confirm
   */
  async confirmCustomSelection(
    agents: AgentDefinition[],
    commands: CommandDefinition[],
    mcps: MCPConfig[]
  ): Promise<boolean> {
    console.log('\n📋 Review Your Selection:\n');

    console.log('Agents:');
    if (agents.length === 0) {
      console.log('  (none)');
    } else {
      agents.forEach(agent => console.log(`  ✓ ${agent.name}`));
    }

    console.log('\nCommands:');
    if (commands.length === 0) {
      console.log('  (none)');
    } else {
      commands.forEach(cmd => console.log(`  ✓ ${cmd.name}`));
    }

    console.log('\nMCPs:');
    if (mcps.length === 0) {
      console.log('  (none)');
    } else {
      mcps.forEach(mcp => console.log(`  ✓ ${mcp.name}`));
    }

    console.log('');

    try {
      const response: any = await (Enquirer.prompt as any)({
        type: 'confirm',
        name: 'confirm',
        message: 'Proceed with this configuration?',
        initial: true,
      });

      return response.confirm;
    } catch (error) {
      return false;
    }
  }
}

// Export singleton
export const prompts = new UIPrompts();
