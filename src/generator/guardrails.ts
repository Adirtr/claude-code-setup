import type { DetectedProject, GuardrailConfig } from '../types/index.js';

export function generateGuardrails(detected: DetectedProject): GuardrailConfig {
  const pm = detected.packageManager || 'npm';

  return {
    permissions: generatePermissions(detected),
    commands: generateCommandRestrictions(detected, pm),
  };
}

function generatePermissions(_detected: DetectedProject): {
  allow: string[];
  deny: string[];
} {
  const allow = [
    // Read permissions
    'read:**',

    // Write permissions for source code
    'write:src/**',
    'write:app/**',
    'write:pages/**',
    'write:components/**',
    'write:lib/**',
    'write:utils/**',
    'write:hooks/**',
    'write:types/**',
    'write:styles/**',

    // Write permissions for tests
    'write:tests/**',
    'write:test/**',
    'write:__tests__/**',
    'write:**/*.test.ts',
    'write:**/*.test.tsx',
    'write:**/*.test.js',
    'write:**/*.test.jsx',
    'write:**/*.spec.ts',
    'write:**/*.spec.js',

    // Write permissions for docs
    'write:docs/**',
    'write:*.md',

    // Write permissions for Claude configuration
    'write:.claude/**',
    'write:CLAUDE.md',

    // Write permissions for config files
    'write:tsconfig.json',
    'write:package.json',
    'write:.eslintrc*',
    'write:.prettierrc*',
  ];

  const deny = [
    // Secrets and credentials
    'write:.env',
    'write:.env.*',
    'write:**/*.key',
    'write:**/*.pem',
    'write:**/*.p12',
    'write:**/*.pfx',
    'write:secrets/**',
    'write:credentials.json',

    // System files
    'write:.git/**',
    'write:node_modules/**',

    // Build output
    'write:dist/**',
    'write:build/**',
    'write:.next/**',
    'write:out/**',
  ];

  return { allow, deny };
}

function generateCommandRestrictions(
  detected: DetectedProject,
  pm: string
): {
  allow: string[];
  deny: string[];
  requireConfirmation: string[];
} {
  const allow = [
    // Package manager commands
    `${pm}:install`,
    `${pm}:add`,
    `${pm}:remove`,
    `${pm}:update`,
    `${pm}:run`,
    `${pm}:test`,
    `${pm}:build`,
    `${pm}:dev`,
    `${pm}:start`,
    `${pm}:lint`,
    `${pm}:format`,

    // Git commands (read-only)
    'git:status',
    'git:diff',
    'git:log',
    'git:show',
    'git:branch',
    'git:add',
    'git:commit',
    'git:stash',

    // Utility commands
    'npx:*',
    'node:*',
    'ls:*',
    'cat:*',
    'grep:*',
    'find:*',
  ];

  const deny = [
    // Destructive git operations
    'git:push --force',
    'git:reset --hard',
    'git:clean -fd',

    // Destructive file operations
    'rm:-rf',
    'rm:-r *',

    // System administration
    'sudo:*',
    'su:*',

    // Dangerous permissions
    'chmod:777',
    'chmod:666',

    // Process management
    'kill:*',
    'killall:*',
  ];

  const requireConfirmation = [
    // Git operations that affect remote
    'git:push',
    'git:pull',
    'git:fetch',
    'git:merge',
    'git:rebase',

    // Database operations
    'db:migrate',
    'db:seed',
    'db:reset',
    'db:drop',

    // Package operations
    `${pm}:publish`,

    // File deletions
    'rm:*',
  ];

  // Add database-specific confirmations
  if (detected.database) {
    if (detected.database.orm === 'prisma') {
      requireConfirmation.push('npx:prisma migrate deploy');
      requireConfirmation.push('npx:prisma db push');
      requireConfirmation.push('npx:prisma db execute');
    } else if (detected.database.orm === 'drizzle') {
      requireConfirmation.push('npx:drizzle-kit push');
      requireConfirmation.push('npx:drizzle-kit migrate');
    }
  }

  return { allow, deny, requireConfirmation };
}

export function generateSettingsLocalJson(guardrails: GuardrailConfig): string {
  const config = {
    permissions: guardrails.permissions,
    commands: guardrails.commands,
  };

  return JSON.stringify(config, null, 2);
}
