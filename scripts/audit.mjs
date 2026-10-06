import fs from 'node:fs';
import path from 'node:path';

function scanDir(dir) {
  const files = fs.readdirSync(dir);
  let warnings = 0;
  for (const f of files) {
    if (f === 'node_modules' || f.startsWith('.')) continue;
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) {
      warnings += scanDir(full);
    } else if (f.endsWith('.html') || f.endsWith('.js') || f.endsWith('.css')) {
      const content = fs.readFileSync(full, 'utf-8');
      
      // Check for absolute root paths in src or href
      const absMatches = content.match(/(?:href|src)=["']\/(?!\/)[^"']*/g);
      if (absMatches) {
        console.warn(`[WARN] Absolute root path found in ${full}:`, absMatches);
        warnings++;
      }

      // Check for third-party network URLs (excluding xmlns and standard local schemas)
      const urls = content.match(/https?:\/\/[^\s"'`<>]+/g) || [];
      const remoteUrls = urls.filter(u => !u.includes('w3.org'));
      if (remoteUrls.length > 0) {
        console.warn(`[WARN] External URL found in ${full}:`, remoteUrls);
        warnings++;
      }
    }
  }
  return warnings;
}

const totalWarnings = scanDir('.');
if (totalWarnings === 0) {
  console.log('✓ AUDIT PASSED: Zero absolute paths and zero external network requests detected.');
} else {
  console.warn(`Audit completed with ${totalWarnings} warnings.`);
}
