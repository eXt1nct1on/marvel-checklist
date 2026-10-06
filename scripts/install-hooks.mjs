import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve } from 'path';

const gitHookDir = resolve(process.cwd(), '.git', 'hooks');

if (existsSync(gitHookDir)) {
  const preCommitPath = resolve(gitHookDir, 'pre-commit');
  const hookContent = `#!/bin/sh
node scripts/check-secrets.mjs
if [ $? -ne 0 ]; then
  exit 1
fi
node scripts/validate-data.mjs
if [ $? -ne 0 ]; then
  exit 1
fi
`;
  writeFileSync(preCommitPath, hookContent, { mode: 0o755 });
  console.log('Successfully installed git pre-commit hook.');
} else {
  console.log('.git/hooks directory not found. Initialize git first.');
}
