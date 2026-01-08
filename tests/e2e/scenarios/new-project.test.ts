import os from 'os';
import path from 'path';
import fs from 'fs-extra';
import type { TestScenario } from '../../types.js';

let testDirPath: string | null = null;

export const newProjectScenario: TestScenario = {
  name: 'new-empty-project',
  description: 'Empty directory, new project flow',
  expectedMode: 'light',
  expectedFileCount: 2,
  context: {
    name: 'new-project',
    framework: '',
    packageManager: 'npm',
    isMultiTenant: false,
    externalApis: [],
    techStack: [],
    existingPaths: [],
    packageJsonScripts: {},
  },

  setup: async () => {
    testDirPath = path.join(os.tmpdir(), `claude-test-new-${Date.now()}`);
    await fs.ensureDir(testDirPath);
    // Empty directory - nothing to add
    return testDirPath;
  },

  cleanup: async () => {
    if (testDirPath && await fs.pathExists(testDirPath)) {
      await fs.remove(testDirPath);
    }
  },
};
