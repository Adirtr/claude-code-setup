// Main exports for programmatic usage

export * from './types/index.js';
export * from './utils/logger.js';
export * from './utils/fs.js';
export * from './utils/git.js';

// Export detector
export { detectProject } from './detector/index.js';

// Export generator
export { generateAll, generateClaudeMd, generateGuardrails } from './generator/index.js';

// Export UI components
export { screens } from './ui/screens.js';
export { prompts } from './ui/prompts.js';

// Export command functions for programmatic usage
export { initCommand } from './commands/init.js';
export { addCommand } from './commands/add.js';
export { doctorCommand } from './commands/doctor.js';
export { exportCommand } from './commands/export.js';
