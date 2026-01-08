// Core type definitions for Claude Setup CLI

export type PackageManager = 'pnpm' | 'npm' | 'yarn' | 'bun';
export type Language = 'typescript' | 'javascript' | 'python' | 'go' | 'other';
export type ProjectState = 'new' | 'existing';
export type BuildStatus = 'passing' | 'failing' | 'unknown';
export type SetupMode = 'light' | 'automatic' | 'custom';

export interface DatabaseConfig {
  type: string; // postgresql, mysql, mongodb
  provider: string; // supabase, planetscale, mongodb-atlas
  orm?: string; // prisma, drizzle, mongoose
}

export interface AuthConfig {
  provider: string; // supabase, firebase, clerk, auth0, nextauth
  methods: string[]; // email, oauth, magic-link
}

export interface TestingConfig {
  unit?: string; // vitest, jest, pytest
  e2e?: string; // playwright, cypress
}

export interface ProjectParams {
  projectName: string;
  projectDescription: string;
  projectState: ProjectState;
  framework: string | null;
  language: Language;
  database: DatabaseConfig | null;
  auth: AuthConfig | null;
  isMultiTenant: boolean | 'maybe';
  tenantField: string | null;
  externalApis: string[];
  testing: TestingConfig | null;
}

export interface DetectedProject extends ProjectParams {
  fileCount: number;
  hasTests: boolean;
  buildStatus: BuildStatus;
  buildErrors: string[];
  packageManager: PackageManager | null;
  monorepo: boolean;
  cicd: string | null;
}

export interface MCPConfig {
  name: string;
  package: string;
  reason: string;
  env?: Record<string, string>;
}

export interface GuardrailConfig {
  permissions: {
    allow: string[];
    deny: string[];
  };
  commands: {
    allow: string[];
    deny: string[];
    requireConfirmation: string[];
  };
}

export interface SetupConfig {
  mode: SetupMode;
  components: {
    agents: string[];
    commands: string[];
    mcps: MCPConfig[];
  };
  guardrails: GuardrailConfig;
}

export interface GeneratedFile {
  path: string;
  content: string;
  created: boolean;
}

export interface GenerationResult {
  files: GeneratedFile[];
  summary: string;
  warnings: string[];
  nextSteps: string[];
}

export interface GenerationPrompt {
  context: {
    project: DetectedProject;
    mode: SetupMode;
  };
  instruction: string;
  constraints: string[];
  examples?: string[];
}

export interface InitOptions {
  yes?: boolean;
  mode?: SetupMode;
  dryRun?: boolean;
  force?: boolean;
}

export interface AddOptions {
  list?: boolean;
  force?: boolean;
}

export interface ExportOptions {
  format?: 'json' | 'yaml';
  output?: string;
}

// Agent and Command Types
export interface AgentDefinition {
  id: string;
  name: string;
  description: string;
  model: string;
  applicableFor: (project: DetectedProject) => boolean;
  priority: number;
}

export interface CommandDefinition {
  id: string;
  name: string;
  description: string;
  applicableFor: (project: DetectedProject) => boolean;
  priority: number;
}

// Detection Constants Types
export interface FrameworkDetection {
  [key: string]: string;
}

export interface DatabaseDetection {
  [key: string]: Partial<DatabaseConfig>;
}

export interface AuthDetection {
  [key: string]: string;
}

export interface ExternalAPIDetection {
  [key: string]: string[];
}
