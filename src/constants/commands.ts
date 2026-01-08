import type { CommandDefinition, DetectedProject } from '../types/index.js';

// Command definitions with selection logic
export const COMMAND_DEFINITIONS: CommandDefinition[] = [
  {
    id: 'pre-commit',
    name: 'Pre-commit Checks',
    description: 'Run pre-commit checks on staged files',
    applicableFor: () => true, // Always applicable
    priority: 1,
  },
  {
    id: 'security-scan',
    name: 'Security Scan',
    description: 'Quick security vulnerability scan',
    applicableFor: () => true, // Always applicable
    priority: 2,
  },
  {
    id: 'fix-build',
    name: 'Fix Build Errors',
    description: 'Diagnose and fix build failures',
    applicableFor: (project) => project.buildStatus === 'failing',
    priority: 1,
  },
  {
    id: 'tenant-check',
    name: 'Tenant Isolation Check',
    description: 'Verify tenant isolation in database queries',
    applicableFor: (project) => !!project.isMultiTenant,
    priority: 2,
  },
  {
    id: 'test-review',
    name: 'Test Quality Review',
    description: 'Review test quality and coverage',
    applicableFor: (project) => project.hasTests,
    priority: 3,
  },
];

export function selectCommands(project: DetectedProject): CommandDefinition[] {
  return COMMAND_DEFINITIONS
    .filter(command => command.applicableFor(project))
    .sort((a, b) => a.priority - b.priority);
}
