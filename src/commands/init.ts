import { InitOptions, SetupMode } from '../types/index.js';
import { logger } from '../utils/logger.js';
import { detectProject } from '../detector/index.js';
import { screens } from '../ui/screens.js';
import { prompts } from '../ui/prompts.js';
import { generateAll } from '../generator/index.js';

export async function initCommand(options: InitOptions): Promise<void> {
  try {
    // Step 1: Welcome screen
    screens.showWelcome();

    if (!options.yes) {
      await prompts.pressEnterToContinue();
    }

    console.log();

    // Step 2: Detect project
    logger.startSpinner('Analyzing your project...');

    const detected = await detectProject(process.cwd(), {
      skipHealthCheck: true,
      verbose: false,
    });

    logger.succeedSpinner('Project analysis complete!');
    console.log();

    // Step 3: Show detection summary
    screens.showDetectionSummary(detected);

    // Step 4: Mode selection
    let mode: SetupMode;
    if (options.mode) {
      mode = options.mode;
      logger.info(`Using ${mode} mode (from --mode flag)`);
      console.log();
    } else if (options.yes) {
      // Auto-select based on project type
      mode = detected.projectState === 'existing' ? 'automatic' : 'light';
      logger.info(`Auto-selected ${mode} mode`);
      console.log();
    } else {
      // Ask user
      screens.showModeOptions();
      mode = await prompts.askMode(detected);
      console.log();
    }

    // Step 5: Confirm multi-tenant if detected as 'maybe'
    let confirmedMultiTenant = detected.isMultiTenant === true;
    let confirmedTenantField = detected.tenantField;

    if (detected.isMultiTenant === 'maybe' && !options.yes) {
      confirmedMultiTenant = await prompts.confirmMultiTenant(detected.tenantField);

      if (confirmedMultiTenant && !detected.tenantField) {
        confirmedTenantField = await prompts.askTenantField();
      }
      console.log();
    }

    // Update detected project with confirmed values
    detected.isMultiTenant = confirmedMultiTenant;
    detected.tenantField = confirmedTenantField;

    // Step 6: Custom mode - select components
    let customAgents;
    let customCommands;
    let customMCPs;

    if (mode === 'custom' && !options.yes) {
      // Ask user to select agents
      customAgents = await prompts.selectAgents(detected);
      console.log();

      // Ask user to select commands
      customCommands = await prompts.selectCommands(detected);
      console.log();

      // Ask user to select MCPs
      customMCPs = await prompts.selectMCPs(detected);
      console.log();

      // Show review screen and confirm
      const confirmed = await prompts.confirmCustomSelection(
        customAgents,
        customCommands,
        customMCPs
      );

      if (!confirmed) {
        logger.info('Setup cancelled.');
        return;
      }

      console.log();
    }

    // Step 7: Generate files
    console.log();

    const result = await generateAll(detected, {
      mode,
      force: options.force,
      dryRun: options.dryRun,
      cwd: process.cwd(),
      customAgents,
      customCommands,
      customMCPs,
    });

    // Step 8: Show completion
    console.log();
    screens.showCompletion(result);

  } catch (error) {
    screens.showError(
      error instanceof Error ? error.message : 'Unknown error occurred',
      'Run with --debug for more details'
    );
    process.exit(1);
  }
}
