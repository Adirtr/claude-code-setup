import type { AgentDefinition, DetectedProject } from '../types/index.js';

// Agent definitions with selection logic
export const AGENT_DEFINITIONS: AgentDefinition[] = [
  {
    id: 'security-reviewer',
    name: 'Security Reviewer',
    description: 'Reviews code for security vulnerabilities and compliance',
    model: 'claude-sonnet-4-20250514',
    applicableFor: (project) => project.projectState === 'existing',
    priority: 1,
  },
  {
    id: 'test-quality',
    name: 'Test Quality Analyzer',
    description: 'Analyzes test effectiveness and coverage',
    model: 'claude-sonnet-4-20250514',
    applicableFor: (project) => project.hasTests,
    priority: 2,
  },
  {
    id: 'tenant-security',
    name: 'Tenant Security Auditor',
    description: 'Ensures proper multi-tenant data isolation',
    model: 'claude-sonnet-4-20250514',
    applicableFor: (project) => !!project.isMultiTenant,
    priority: 1,
  },
  {
    id: 'api-compliance',
    name: 'API Compliance Checker',
    description: 'Ensures external API integrations follow best practices',
    model: 'claude-sonnet-4-20250514',
    applicableFor: (project) => project.externalApis.length > 0,
    priority: 3,
  },
  {
    id: 'build-fixer',
    name: 'Build Error Resolver',
    description: 'Diagnoses and fixes build failures',
    model: 'claude-sonnet-4-20250514',
    applicableFor: (project) => project.buildStatus === 'failing',
    priority: 1,
  },
];

export function selectAgents(project: DetectedProject): AgentDefinition[] {
  return AGENT_DEFINITIONS
    .filter(agent => agent.applicableFor(project))
    .sort((a, b) => a.priority - b.priority);
}
