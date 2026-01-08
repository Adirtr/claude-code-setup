import os from 'os';
import path from 'path';
import fs from 'fs-extra';
import type { TestScenario } from '../../types.js';

let testDirPath: string | null = null;

export const expressApiScenario: TestScenario = {
  name: 'express-api',
  description: 'Backend-only Express API with PostgreSQL',
  expectedMode: 'automatic',
  expectedFileCount: 5,
  context: {
    name: 'test-express-api',
    framework: 'Express',
    database: 'PostgreSQL',
    packageManager: 'pnpm',
    isMultiTenant: false,
    externalApis: [],
    techStack: ['Express', 'TypeScript', 'PostgreSQL', 'Drizzle'],
    existingPaths: ['src', 'src/routes', 'src/db'],
    packageJsonScripts: {
      dev: 'tsx watch src/index.ts',
      build: 'tsc',
      test: 'vitest',
    },
  },

  setup: async () => {
    testDirPath = path.join(os.tmpdir(), `claude-test-express-${Date.now()}`);
    await fs.ensureDir(testDirPath);

    // Create package.json
    const packageJson = {
      name: 'test-express-api',
      version: '1.0.0',
      type: 'module',
      scripts: {
        dev: 'tsx watch src/index.ts',
        build: 'tsc',
        test: 'vitest',
      },
      dependencies: {
        'express': '^4.18.2',
        'pg': '^8.11.3',
        'drizzle-orm': '^0.29.0',
        'zod': '^3.22.4',
      },
      devDependencies: {
        'typescript': '^5.3.3',
        'tsx': '^4.7.0',
        '@types/express': '^4.17.21',
        '@types/node': '^20.11.0',
        'vitest': '^1.2.0',
        'drizzle-kit': '^0.20.0',
      },
    };

    await fs.writeJson(path.join(testDirPath, 'package.json'), packageJson, { spaces: 2 });

    // Create src structure
    await fs.ensureDir(path.join(testDirPath, 'src'));
    await fs.ensureDir(path.join(testDirPath, 'src/routes'));
    await fs.ensureDir(path.join(testDirPath, 'src/db'));

    // Create main index.ts
    await fs.writeFile(
      path.join(testDirPath, 'src/index.ts'),
      `import express from 'express';
import { userRoutes } from './routes/users.js';

const app = express();

app.use(express.json());
app.use('/api/users', userRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(\`Server running on port \${PORT}\`);
});
`
    );

    // Create user routes
    await fs.writeFile(
      path.join(testDirPath, 'src/routes/users.ts'),
      `import { Router } from 'express';
import { db } from '../db/index.js';

export const userRoutes = Router();

userRoutes.get('/', async (req, res) => {
  try {
    const users = await db.query.users.findMany();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

userRoutes.get('/:id', async (req, res) => {
  try {
    const user = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.id, req.params.id),
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});
`
    );

    // Create database connection
    await fs.writeFile(
      path.join(testDirPath, 'src/db/index.ts'),
      `import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.js';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool, { schema });
`
    );

    // Create schema
    await fs.writeFile(
      path.join(testDirPath, 'src/db/schema.ts'),
      `import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  name: text('name'),
  createdAt: timestamp('created_at').defaultNow(),
});
`
    );

    // Create tsconfig.json
    const tsConfig = {
      compilerOptions: {
        target: 'ES2022',
        module: 'ES2022',
        moduleResolution: 'node',
        esModuleInterop: true,
        skipLibCheck: true,
        strict: true,
        outDir: './dist',
        rootDir: './src',
      },
      include: ['src/**/*'],
      exclude: ['node_modules', 'dist'],
    };

    await fs.writeJson(path.join(testDirPath, 'tsconfig.json'), tsConfig, { spaces: 2 });

    // Create pnpm-lock.yaml to indicate package manager
    await fs.writeFile(path.join(testDirPath, 'pnpm-lock.yaml'), '');

    // Create .env.example
    await fs.writeFile(
      path.join(testDirPath, '.env.example'),
      `DATABASE_URL=postgresql://user:password@localhost:5432/dbname
PORT=3000
`
    );

    return testDirPath;
  },

  cleanup: async () => {
    if (testDirPath && await fs.pathExists(testDirPath)) {
      await fs.remove(testDirPath);
    }
  },
};
