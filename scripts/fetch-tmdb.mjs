/**
 * Multiverse Tracker - TMDB Poster Fetcher
 * Fetches movie and TV series poster paths from The Movie Database (TMDB) API v4.
 *
 * Requirements:
 * - Node 18+ (uses built-in fetch)
 * - Zero npm dependencies
 * - TMDB v4 Read-Access Token in environment variable: TMDB_TOKEN
 *
 * Usage:
 *   # Fetch missing posters only (default):
 *   node scripts/fetch-posters.mjs
 *
 *   # Force re-fetch all posters:
 *   node scripts/fetch-posters.mjs --refresh
 *
 *   # Fetch specific titles by ID:
 *   node scripts/fetch-posters.mjs --only=iron-man-2008,loki-seasons-1-2-2021
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const ROOT_DIR = resolve(__dirname, '..');
const DATA_JS_PATH = resolve(ROOT_DIR, 'js', 'data.js');
const POSTERS_JS_PATH = resolve(ROOT_DIR, 'js', 'posters.js');
const RUNTIMES_JS_PATH = resolve(ROOT_DIR, 'js', 'runtimes.js');
const OVERRIDES_PATH = resolve(ROOT_DIR, 'data', 'tmdb-overrides.json');
const REPORT_PATH = resolve(ROOT_DIR, 'data', 'poster-report.md');

// 1. Validate TMDB_TOKEN environment variable
const TMDB_TOKEN = process.env.TMDB_TOKEN?.trim();

if (!TMDB_TOKEN) {
  console.log('Skipped fetching from TMDB: TMDB_TOKEN not provided.');
  process.exit(0);
}

// 2. Parse CLI flags
const args = process.argv.slice(2);
const isRefresh = args.includes('--refresh');
const onlyArg = args.find((a) => a.startsWith('--only='));
const onlyIds = onlyArg ? new Set(onlyArg.replace('--only=', '').split(',').map((s) => s.trim()).filter(Boolean)) : null;

// Helper: Sleep to respect TMDB rate limits (~40 requests per 10s)
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Helper: Fetch with retry on 429
async function fetchTmdb(url, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${TMDB_TOKEN}`,
          Accept: 'application/json'
        }
      });

      if (res.status === 429) {
        const retryAfter = parseInt(res.headers.get('retry-after') || '2', 10);
        console.warn(`  [Rate Limit 429] Backing off for ${retryAfter}s (attempt ${attempt}/${retries})...`);
        await sleep(retryAfter * 1000 + 500);
        continue;
      }

      if (!res.ok) {
        if (res.status === 404) return null;
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      return await res.json();
    } catch (err) {
      if (attempt === retries) throw err;
      await sleep(1000 * attempt);
    }
  }
  return null;
}

// Helper: Clean title for TMDB search
function cleanSearchTitle(title) {
  if (!title) return '';
  return title
    .replace(/\s*\(Seasons?\s*\d+(?:-\d+)?\)/gi, '') // "(Seasons 1-2)"
    .replace(/\s*\(Season\s*\d+\)/gi, '')          // "(Season 1)"
    .replace(/\s*\(non-MCU\)/gi, '')
    .replace(/\s*\(Snyderverse era\)/gi, '')
    .replace(/\s*\(Chapter One\)/gi, '')
    .replace(/\s*\(Burton\/Schumacher\)/gi, '')
    .replace(/\s*\(Legacy\)/gi, '')
    .replace(/\s*\(Classic\)/gi, '')
    .replace(/\s*\(Ang Lee\)/gi, '')
    .replace(/\s*\(Fox\)/gi, '')
    .replace(/\s*\(Reeve\)/gi, '')
    .replace(/\s*\(Raimi\)/gi, '')
    .replace(/\s*\(New Line\)/gi, '')
    .replace(/\s*\(2003\)/gi, '')
    .replace(/\s*\(DCU\)/gi, '')
    .replace(/\*+$/g, '')                          // Trailing asterisk in "Thunderbolts*"
    .replace(/\s+/g, ' ')
    .trim();
}

// Helper: Extract 4-digit release year
function extractReleaseYear(releaseStr) {
  if (!releaseStr) return null;
  const match = String(releaseStr).match(/\d{4}/);
  return match ? parseInt(match[0], 10) : null;
}

async function main() {
  console.log(`Starting TMDB Poster acquisition...`);
  if (isRefresh) console.log(`  Flag: --refresh (will re-fetch all titles)`);
  if (onlyIds) console.log(`  Flag: --only (${onlyIds.size} specific titles)`);

  // Import catalog
  const { MOVIES } = await import(`file://${DATA_JS_PATH}`);
  console.log(`Loaded catalog with ${MOVIES.length} titles.`);

  // Load manual overrides
  let overrides = {};
  if (existsSync(OVERRIDES_PATH)) {
    try {
      overrides = JSON.parse(readFileSync(OVERRIDES_PATH, 'utf8'));
    } catch (e) {
      console.warn(`Could not parse data/tmdb-overrides.json, using empty object.`);
    }
  }

  // Load existing posters
  let existingPosters = {};
  if (existsSync(POSTERS_JS_PATH) && !isRefresh) {
    try {
      const fileContent = readFileSync(POSTERS_JS_PATH, 'utf8');
      const match = fileContent.match(/export\s+const\s+POSTERS\s*=\s*(\{[\s\S]*\});?/);
      if (match) {
        existingPosters = Function(`"use strict"; return (${match[1]});`)();
      }
    } catch (e) {
      console.warn(`Could not parse existing js/posters.js, starting fresh.`);
    }
  }

  const results = { ...existingPosters };
  let existingRuntimes = {};
  if (existsSync(RUNTIMES_JS_PATH) && !isRefresh) {
    try {
      const fileContent = readFileSync(RUNTIMES_JS_PATH, 'utf8');
      const match = fileContent.match(/export\s+const\s+RUNTIMES\s*=\s*(\{[\s\S]*\});?/);
      if (match) {
        existingRuntimes = Function('"use strict"; return (' + match[1] + ');')();
      }
    } catch (e) {
      console.warn('Could not parse existing js/runtimes.js, starting fresh.');
    }
  }
  const runtimesResults = { ...existingRuntimes };
  const reportData = {
    matched: [],
    lowConfidence: [],
    unmatched: [],
    yearMismatch: []
  };

  let fetchedCount = 0;
  let skippedCount = 0;

  for (let i = 0; i < MOVIES.length; i++) {
    const movie = MOVIES[i];
    const { id, title, type, release } = movie;

    if (onlyIds && !onlyIds.has(id)) {
      continue;
    }

    // Skip if already fetched and not refreshing
    if (!isRefresh && results[id] && results[id].posterPath !== undefined && runtimesResults[id]) {
      skippedCount++;
      // Still log to report
      if (results[id].posterPath) {
        reportData.matched.push({
          id,
          title,
          tmdbId: results[id].tmdbId,
          tmdbTitle: results[id].tmdbTitle || title,
          year: extractReleaseYear(release),
          tmdbYear: extractReleaseYear(results[id].releaseDate),
          posterPath: results[id].posterPath,
          confidence: results[id].confidence || 'high'
        });
      } else {
        reportData.unmatched.push({ id, title, year: extractReleaseYear(release), reason: 'Previously unmatched' });
      }
      continue;
    }

    const isTv = type === 'TV Series';
    const targetTmdbType = isTv ? 'tv' : 'movie';
    const expectedYear = extractReleaseYear(release);
    const cleanTitle = cleanSearchTitle(title);

    console.log(`[${i + 1}/${MOVIES.length}] Fetching "${title}" (${expectedYear || 'TBD'}, ${targetTmdbType})...`);

    let matchRecord = null;
    let confidence = 'high';

    // A. Check Override first
    const override = overrides[id];
    if (override && override.tmdbId) {
      const oType = override.type || targetTmdbType;
      const detail = await fetchTmdb(`https://api.themoviedb.org/3/${oType}/${override.tmdbId}`);
      await sleep(250);
      if (detail) {
        const releaseDate = detail.release_date || detail.first_air_date || null;
        matchRecord = {
          tmdbId: detail.id,
          type: oType,
          posterPath: detail.poster_path || null,
          releaseDate,
          tmdbTitle: detail.title || detail.name || title
        };
        confidence = 'override';
      }
    }

    // B. Check movie.tmdbId if present in data.js
    if (!matchRecord && movie.tmdbId) {
      const mType = movie.tmdbType || targetTmdbType;
      const detail = await fetchTmdb(`https://api.themoviedb.org/3/${mType}/${movie.tmdbId}`);
      await sleep(250);
      if (detail) {
        const releaseDate = detail.release_date || detail.first_air_date || null;
        matchRecord = {
          tmdbId: detail.id,
          type: mType,
          posterPath: detail.poster_path || null,
          releaseDate,
          tmdbTitle: detail.title || detail.name || title
        };
      }
    }

    // C. Search TMDB
    if (!matchRecord) {
      const searchEndpoint = isTv ? 'search/tv' : 'search/movie';
      let searchUrl = `https://api.themoviedb.org/3/${searchEndpoint}?query=${encodeURIComponent(cleanTitle)}&include_adult=false`;
      if (expectedYear) {
        searchUrl += isTv ? `&first_air_date_year=${expectedYear}` : `&year=${expectedYear}`;
      }

      let searchRes = await fetchTmdb(searchUrl);
      await sleep(250);

      // If no results and year was restricted, try searching without year constraint
      if ((!searchRes || !searchRes.results || searchRes.results.length === 0) && expectedYear) {
        const fallbackUrl = `https://api.themoviedb.org/3/${searchEndpoint}?query=${encodeURIComponent(cleanTitle)}&include_adult=false`;
        searchRes = await fetchTmdb(fallbackUrl);
        await sleep(250);
      }

      const candidates = searchRes?.results || [];

      if (candidates.length > 0) {
        // Find best candidate
        // 1. Exact title match
        const exactMatches = candidates.filter((c) => {
          const candTitle = (c.title || c.name || '').toLowerCase();
          return candTitle === cleanTitle.toLowerCase();
        });

        let chosen = null;
        if (exactMatches.length > 0) {
          if (expectedYear) {
            // Sort by proximity to expected year
            exactMatches.sort((a, b) => {
              const yA = extractReleaseYear(a.release_date || a.first_air_date) || 9999;
              const yB = extractReleaseYear(b.release_date || b.first_air_date) || 9999;
              const diffA = Math.abs(yA - expectedYear);
              const diffB = Math.abs(yB - expectedYear);
              if (diffA !== diffB) return diffA - diffB;
              return (b.popularity || 0) - (a.popularity || 0);
            });
          } else {
            exactMatches.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
          }
          chosen = exactMatches[0];
          confidence = 'high';
        } else {
          // If no exact match, filter within ±1 year of expected year if available
          let viable = candidates;
          if (expectedYear) {
            const nearYear = candidates.filter((c) => {
              const y = extractReleaseYear(c.release_date || c.first_air_date);
              return y && Math.abs(y - expectedYear) <= 1;
            });
            if (nearYear.length > 0) viable = nearYear;
          }
          // Sort by popularity
          viable.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
          chosen = viable[0];
          confidence = 'low';
        }

        if (chosen) {
          const tmdbDate = chosen.release_date || chosen.first_air_date || null;
          matchRecord = {
            tmdbId: chosen.id,
            type: targetTmdbType,
            posterPath: chosen.poster_path || null,
            releaseDate: tmdbDate,
            tmdbTitle: chosen.title || chosen.name || cleanTitle
          };

          const tmdbYear = extractReleaseYear(tmdbDate);
          if (expectedYear && tmdbYear && expectedYear !== tmdbYear) {
            if (Math.abs(expectedYear - tmdbYear) > 1) {
              confidence = 'low';
            }
          }
        }
      }
    }

    fetchedCount++;

    if (matchRecord && matchRecord.posterPath) {
      results[id] = {
        tmdbId: matchRecord.tmdbId,
        type: matchRecord.type,
        posterPath: matchRecord.posterPath,
        releaseDate: matchRecord.releaseDate
      };

      const tmdbYear = extractReleaseYear(matchRecord.releaseDate);
      console.log(`  ✓ Matched: "${matchRecord.tmdbTitle}" (${tmdbYear}) -> ${matchRecord.posterPath}`);

      reportData.matched.push({
        id,
        title,
        tmdbId: matchRecord.tmdbId,
        tmdbTitle: matchRecord.tmdbTitle,
        year: expectedYear,
        tmdbYear,
        posterPath: matchRecord.posterPath,
        confidence
      });

      if (expectedYear && tmdbYear && expectedYear !== tmdbYear) {
        reportData.yearMismatch.push({
          id,
          title,
          expectedYear,
          tmdbYear,
          tmdbId: matchRecord.tmdbId,
          diff: tmdbYear - expectedYear
        });
      }

      if (confidence === 'low') {
        reportData.lowConfidence.push({
          id,
          title,
          tmdbTitle: matchRecord.tmdbTitle,
          expectedYear,
          tmdbYear,
          tmdbId: matchRecord.tmdbId
        });
      }
      // ---- NEW: Fetch Runtime Data ----
      try {
        if (targetTmdbType === 'movie') {
          const detail = await fetchTmdb(`https://api.themoviedb.org/3/movie/${matchRecord.tmdbId}?language=en-US`);
          await sleep(250);
          runtimesResults[id] = {
            runtimeMin: detail?.runtime || null,
            totalMin: detail?.runtime || null,
            episodes: null,
            seasons: null,
            source: 'tmdb',
            fetchedAt: new Date().toISOString()
          };
        } else {
          const detail = await fetchTmdb(`https://api.themoviedb.org/3/tv/${matchRecord.tmdbId}?language=en-US`);
          await sleep(250);
          let totalMin = 0;
          let episodeCount = 0;
          const seasonsData = [];
          if (detail && detail.seasons) {
            for (const season of detail.seasons) {
              if (season.season_number === 0) continue;
              const sDetail = await fetchTmdb(`https://api.themoviedb.org/3/tv/${matchRecord.tmdbId}/season/${season.season_number}?language=en-US`);
              await sleep(250);
              if (sDetail && sDetail.episodes) {
                const airedEps = sDetail.episodes.filter(ep => {
                  if (!ep.air_date) return false;
                  return new Date(ep.air_date) <= new Date();
                });
                if (airedEps.length > 0) {
                  let sTotal = 0;
                  let epRunTime = detail.episode_run_time?.[0] || 0;
                  airedEps.forEach(ep => { sTotal += (ep.runtime || epRunTime); });
                  seasonsData.push({ n: season.season_number, episodes: airedEps.length, totalMin: sTotal });
                  totalMin += sTotal;
                  episodeCount += airedEps.length;
                }
              }
            }
          }
          runtimesResults[id] = {
            runtimeMin: null,
            totalMin: totalMin > 0 ? totalMin : null,
            episodes: episodeCount > 0 ? episodeCount : null,
            seasons: seasonsData.length > 0 ? seasonsData : null,
            source: 'tmdb',
            fetchedAt: new Date().toISOString()
          };
        }
      } catch (err) {
         console.error('Error fetching runtime for', id, err);
         runtimesResults[id] = { source: 'error' };
      }
      // ---------------------------------

    } else {
      console.log(`  ✗ Unmatched: No poster found.`);
      results[id] = {
        tmdbId: matchRecord?.tmdbId || null,
        type: targetTmdbType,
        posterPath: null,
        releaseDate: matchRecord?.releaseDate || null
      };

      reportData.unmatched.push({
        id,
        title,
        year: expectedYear,
        cleanTitle
      });
    }
  }

  // 4. Output js/posters.js
  const sortedIds = Object.keys(results).sort();
  const sortedPosters = {};
  for (const k of sortedIds) {
    sortedPosters[k] = results[k];
  }

  const jsContent = `/**
 * Multiverse Tracker - TMDB Movie & Series Posters
 * Generated automatically by scripts/fetch-posters.mjs
 * Keyed by catalog item id.
 * Format: { [id]: { tmdbId, type, posterPath, releaseDate } }
 */

export const POSTERS = ${JSON.stringify(sortedPosters, null, 2)};
`;

  writeFileSync(POSTERS_JS_PATH, jsContent, 'utf8');
  console.log(`\nSuccessfully updated ${POSTERS_JS_PATH} (${sortedIds.length} titles).`);

  // 5. Output data/poster-report.md
  let reportMd = `# TMDB Poster Acquisition Report\n\n`;
  reportMd += `Generated on **${new Date().toISOString().split('T')[0]}** via \`scripts/fetch-posters.mjs\`.\n\n`;
  reportMd += `## Summary\n`;
  reportMd += `- **Total Titles Processed**: ${MOVIES.length}\n`;
  reportMd += `- **Matched with Poster**: ${reportData.matched.length}\n`;
  reportMd += `- **Low-Confidence Matches**: ${reportData.lowConfidence.length}\n`;
  reportMd += `- **Year Mismatches**: ${reportData.yearMismatch.length}\n`;
  reportMd += `- **Unmatched Titles**: ${reportData.unmatched.length}\n`;
  reportMd += `- **Skipped (Already cached)**: ${skippedCount}\n\n`;

  if (reportData.lowConfidence.length > 0) {
    reportMd += `## Low-Confidence Matches\n`;
    reportMd += `*These titles had slight title or year discrepancies. If a match is incorrect, add an entry to \`data/tmdb-overrides.json\`.*\n\n`;
    reportMd += `| ID | Catalog Title | TMDB Title | Catalog Year | TMDB Year | TMDB ID |\n`;
    reportMd += `|---|---|---|---|---|---|\n`;
    for (const item of reportData.lowConfidence) {
      reportMd += `| \`${item.id}\` | ${item.title} | ${item.tmdbTitle} | ${item.expectedYear || 'TBD'} | ${item.tmdbYear || 'TBD'} | [${item.tmdbId}](https://www.themoviedb.org/${item.targetTmdbType || 'movie'}/${item.tmdbId}) |\n`;
    }
    reportMd += `\n`;
  }

  if (reportData.yearMismatch.length > 0) {
    reportMd += `## Year Mismatches\n`;
    reportMd += `*Differences between catalog release year and TMDB release/first-air year. Useful for detecting inaccurate dates in data.js.*\n\n`;
    reportMd += `| ID | Title | Catalog Year | TMDB Year | Diff | TMDB ID |\n`;
    reportMd += `|---|---|---|---|---|---|\n`;
    for (const item of reportData.yearMismatch) {
      reportMd += `| \`${item.id}\` | ${item.title} | ${item.expectedYear} | ${item.tmdbYear} | ${item.diff > 0 ? `+${item.diff}` : item.diff} | [${item.tmdbId}](https://www.themoviedb.org/movie/${item.tmdbId}) |\n`;
    }
    reportMd += `\n`;
  }

  if (reportData.unmatched.length > 0) {
    reportMd += `## Unmatched Titles\n`;
    reportMd += `*Titles that could not be found automatically. Override them in \`data/tmdb-overrides.json\`.*\n\n`;
    reportMd += `| ID | Catalog Title | Year | Search Query |\n`;
    reportMd += `|---|---|---|---|\n`;
    for (const item of reportData.unmatched) {
      reportMd += `| \`${item.id}\` | ${item.title} | ${item.year || 'TBD'} | \`${item.cleanTitle || item.title}\` |\n`;
    }
    reportMd += `\n`;
  }

  reportMd += `## Matched Titles (${reportData.matched.length})\n\n`;
  reportMd += `| ID | Catalog Title | TMDB Title | Year | TMDB ID | Poster Path |\n`;
  reportMd += `|---|---|---|---|---|---|\n`;
  for (const item of reportData.matched) {
    reportMd += `| \`${item.id}\` | ${item.title} | ${item.tmdbTitle} | ${item.tmdbYear || item.year || 'TBD'} | ${item.tmdbId} | \`${item.posterPath}\` |\n`;
  }
  reportMd += `\n`;

  writeFileSync(REPORT_PATH, reportMd, 'utf8');
  console.log(`Updated ${REPORT_PATH}.\nDone!`);
}

main().catch((err) => {
  console.error(`Fatal error:`, err);
  process.exit(1);
});

