import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const SUSPICIOUS_PATTERNS = [
  /TMDB_TOKEN\s*=\s*['"]?(?!(?:your_token_here|your_v4_read_access_token_here|process\.env\.TMDB_TOKEN)['"]?)[A-Za-z0-9_.-]{10,}/,
  /eyJhbGciOiJ[A-Za-z0-9-_]+/, // Common JWT start
  /api[_-]?key\s*=\s*['"]?(?!your_api_key|process\.env)['"]?[A-Za-z0-9_.-]{10,}/i
];

try {
  const filesOutput = execSync('git ls-files', { encoding: 'utf-8' });
  const files = filesOutput.split('\n').filter(Boolean);

  let hasSecrets = false;

  for (const file of files) {
    // Skip binary extensions or known safe files
    if (file.match(/\.(svg|png|jpg|jpeg|gif|ico|csv)$/i) || file.includes('check-secrets.mjs')) {
      continue;
    }
    const content = readFileSync(resolve(process.cwd(), file), 'utf-8');
    for (const pattern of SUSPICIOUS_PATTERNS) {
      if (pattern.test(content)) {
        console.error(`\n[ERROR] Secret detected in file: ${file}`);
        console.error(`Pattern matched: ${pattern}`);
        hasSecrets = true;
      }
    }
  }

  if (hasSecrets) {
    console.error('\n[FATAL] Secrets found! Please remove them from tracked files before committing.');
    process.exit(1);
  } else {
    console.log('[OK] No obvious secrets found in tracked files.');
  }
} catch (err) {
  // If not a git repo yet, just skip gracefully or log
  console.log('[INFO] Skipping secret check, might not be a git repo yet.');
}
