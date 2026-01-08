// Test types and interfaces

export interface ProjectContext {
  name: string;
  framework: string;
  database?: string;
  packageManager: string;
  isMultiTenant: boolean;
  tenantField?: string;
  externalApis: string[];
  techStack: string[];
  existingPaths: string[];
  packageJsonScripts: Record<string, string>;
}

export interface QualityIssue {
  severity: 'critical' | 'major' | 'minor';
  category: string;
  message: string;
  line?: number;
}

export interface QualityBreakdown {
  structure: number;
  specificity: number;
  actionability?: number;
  usefulness?: number;
  professional: number;
}

export interface AgentQualityResult {
  score: number;
  breakdown: QualityBreakdown & { actionability: number };
  issues: QualityIssue[];
  suggestions: string[];
}

export interface CommandValidation {
  command: string;
  isValid: boolean;
  error?: string;
}

export interface CommandQualityResult {
  score: number;
  breakdown: QualityBreakdown & { usefulness: number };
  issues: QualityIssue[];
  suggestions: string[];
  runnableCommands: CommandValidation[];
}

export interface TestScenario {
  name: string;
  description: string;
  setup: () => Promise<string>; // Returns test directory path
  cleanup: () => Promise<void>;
  expectedMode: 'light' | 'automatic' | 'custom';
  expectedFileCount: number;
  context: ProjectContext;
}

export interface TestResult {
  scenario: string;
  passed: boolean;
  filesGenerated: string[];
  errors: string[];
  quality?: QualityAssessment;
}

export interface QualityAssessment {
  agents: AgentAssessment[];
  commands: CommandAssessment[];
  overall: {
    score: number;
    passed: boolean;
    issues: QualityIssue[];
  };
}

export interface AgentAssessment {
  name: string;
  path: string;
  autoScore: number;
  llmScore?: number;
  finalScore: number;
  breakdown: QualityBreakdown & { actionability: number };
  issues: QualityIssue[];
  suggestions: string[];
  isProductionReady: boolean;
}

export interface CommandAssessment {
  name: string;
  path: string;
  autoScore: number;
  llmScore?: number;
  finalScore: number;
  breakdown: QualityBreakdown & { usefulness: number };
  issues: QualityIssue[];
  suggestions: string[];
  runnableCommands: CommandValidation[];
  isProductionReady: boolean;
}

export interface TestReport {
  timestamp: string;
  scenarios: TestResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    averageQuality: number;
  };
}
