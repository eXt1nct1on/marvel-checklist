import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CSV_PATH = path.resolve(__dirname, '../data/catalog.csv');

function parseCSV(content) {
  const lines = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < content.length; i++) {
    const char = content[i];

    if (inQuotes) {
      if (char === '"') {
        if (i + 1 < content.length && content[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        row.push(field.trim());
        field = '';
      } else if (char === '\r') {
        // Ignore CR
      } else if (char === '\n') {
        row.push(field.trim());
        if (row.length > 1 || (row.length === 1 && row[0] !== '')) {
          lines.push(row);
        }
        row = [];
        field = '';
      } else {
        field += char;
      }
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field.trim());
    lines.push(row);
  }

  if (lines.length === 0) return [];
  const headers = lines[0];
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const r = {};
    headers.forEach((h, idx) => { r[h] = lines[i][idx] || ''; });
    rows.push(r);
  }
  return rows;
}

function parseNumberOrNull(str) {
  if (!str) return null;
  const num = Number(str);
  return isNaN(num) ? null : num;
}

function validate() {
  const content = fs.readFileSync(CSV_PATH, 'utf8');
  const rows = parseCSV(content);

  let errors = 0;
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const rowNum = i + 2; // header is 1
    const runtimeMin = parseNumberOrNull(r.runtimeMin);
    const episodes = parseNumberOrNull(r.episodes);
    const episodeRuntimeMin = parseNumberOrNull(r.episodeRuntimeMin);
    const totalRuntimeMin = parseNumberOrNull(r.totalRuntimeMin);
    
    if (r.runtimeMin !== '' && runtimeMin === null) {
      console.error(`Row ${rowNum} (${r.id}): runtimeMin is not numeric`);
      errors++;
    }
    
    if (r.episodes !== '' && (episodes === null || !Number.isInteger(episodes))) {
      console.error(`Row ${rowNum} (${r.id}): episodes is not an integer`);
      errors++;
    }
    
    if (r.episodeRuntimeMin !== '' && episodeRuntimeMin === null) {
      console.error(`Row ${rowNum} (${r.id}): episodeRuntimeMin is not numeric`);
      errors++;
    }
    
    if (r.totalRuntimeMin !== '' && totalRuntimeMin === null) {
      console.error(`Row ${rowNum} (${r.id}): totalRuntimeMin is not numeric`);
      errors++;
    }
    
    if (totalRuntimeMin !== null && runtimeMin !== null) {
      if (totalRuntimeMin < runtimeMin) {
        console.error(`Row ${rowNum} (${r.id}): totalRuntimeMin (${totalRuntimeMin}) < runtimeMin (${runtimeMin})`);
        errors++;
      }
    }
    
    if (r.runtimeApprox !== '' && !['TRUE', 'FALSE'].includes(r.runtimeApprox.toUpperCase())) {
      console.error(`Row ${rowNum} (${r.id}): runtimeApprox must be TRUE, FALSE, or empty`);
      errors++;
    }
  }

  if (errors > 0) {
    console.error(`Validation failed with ${errors} errors.`);
    process.exit(1);
  } else {
    console.log('Validation passed: all runtime fields are correct.');
  }
}

validate();
