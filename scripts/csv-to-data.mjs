import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CSV_PATH = path.resolve(__dirname, '../data/catalog.csv');
const OUTPUT_PATH = path.resolve(__dirname, '../js/data.js');

// Parse CSV with standard RFC-4180 quotation handling
export function parseCSV(text) {
  const lines = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        field += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
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

  return lines;
}

// Convert release date string to timestamp for global releaseOrder
function getReleaseTimestamp(release, title) {
  if (!release || release.toUpperCase() === 'TBD') {
    return { time: 9999999999999, title };
  }
  let dateStr = release;
  if (/^\d{4}$/.test(release)) {
    dateStr = `${release}-01-01`;
  } else if (/^\d{4}-\d{4}$/.test(release)) {
    const startYear = release.split('-')[0];
    dateStr = `${startYear}-01-01`;
  } else if (/^\d{4}-\d{2}$/.test(release)) {
    dateStr = `${release}-01`;
  }
  const date = new Date(dateStr);
  const time = isNaN(date.getTime()) ? 9999999999999 : date.getTime();
  return { time, title };
}

// Canonical MCU in-universe timeline order (interleaving films, series, and specials)
const MCU_CANON_CHRONO_ORDER = [
  "Captain America: The First Avenger",
  "Marvel One-Shot: Agent Carter",
  "Agent Carter",
  "Captain Marvel",
  "Iron Man",
  "Iron Man 2",
  "The Incredible Hulk",
  "Marvel One-Shot: The Consultant",
  "Marvel One-Shot: A Funny Thing Happened on the Way to Thor's Hammer",
  "Thor",
  "The Avengers",
  "Marvel One-Shot: Item 47",
  "Thor: The Dark World",
  "Iron Man 3",
  "Marvel One-Shot: All Hail the King",
  "Agents of S.H.I.E.L.D.",
  "Captain America: The Winter Soldier",
  "Guardians of the Galaxy",
  "I Am Groot",
  "Guardians of the Galaxy Vol. 2",
  "Daredevil",
  "Jessica Jones",
  "Avengers: Age of Ultron",
  "Ant-Man",
  "Luke Cage",
  "Iron Fist",
  "The Defenders",
  "Captain America: Civil War",
  "Marvel One-Shot: Team Thor",
  "Black Widow",
  "Black Panther",
  "Spider-Man: Homecoming",
  "The Punisher",
  "Doctor Strange",
  "Cloak & Dagger",
  "Runaways",
  "Inhumans",
  "Thor: Ragnarok",
  "Ant-Man and the Wasp",
  "Avengers: Infinity War",
  "Avengers: Endgame",
  "Loki (Seasons 1-2)",
  "What If...?",
  "WandaVision",
  "Shang-Chi and the Legend of the Ten Rings",
  "The Falcon and the Winter Soldier",
  "Spider-Man: Far From Home",
  "Eternals",
  "Spider-Man: No Way Home",
  "Doctor Strange in the Multiverse of Madness",
  "Hawkeye",
  "Moon Knight",
  "Black Panther: Wakanda Forever",
  "Echo",
  "She-Hulk: Attorney at Law",
  "Ms. Marvel",
  "Thor: Love and Thunder",
  "Werewolf by Night",
  "The Guardians of the Galaxy Holiday Special",
  "Ant-Man and the Wasp: Quantumania",
  "Guardians of the Galaxy Vol. 3",
  "Secret Invasion",
  "The Marvels",
  "Deadpool & Wolverine",
  "Agatha All Along",
  "Daredevil: Born Again",
  "Captain America: Brave New World",
  "Thunderbolts*",
  "Ironheart",
  "The Fantastic Four: First Steps",
  "Wonder Man",
  "Eyes of Wakanda",
  "Marvel Zombies",
  "Marvel Studios: Legends",
  "Spider-Man: Brand New Day",
  "Vision Quest",
  "Blade",
  "Armor Wars",
  "Shang-Chi 2",
  "Avengers: Doomsday",
  "Avengers: Secret Wars"
];

// Fox X-Men in-universe timeline order
const FOX_XMEN_CHRONO_ORDER = [
  "X-Men: First Class",
  "X-Men Origins: Wolverine",
  "X-Men: Days of Future Past",
  "X-Men: Apocalypse",
  "Dark Phoenix",
  "X-Men",
  "X2: X-Men United",
  "X-Men: The Last Stand",
  "The New Mutants",
  "The Wolverine",
  "Deadpool",
  "Deadpool 2",
  "Logan"
];

export function convertCSVToData() {
  const content = fs.readFileSync(CSV_PATH, 'utf-8');
  const rows = parseCSV(content);

  const headers = rows[0];
  const dataRows = rows.slice(1);

  // Parse raw rows into objects
  const rawItems = dataRows.map((cols) => {
    const item = {};
    headers.forEach((h, idx) => {
      let val = cols[idx] !== undefined ? cols[idx] : '';
      if (h === 'chronoApprox' || h === 'needsReview') {
        val = val === 'true';
      } else if (h === 'seasons' || h === 'runtimeMin' || h === 'doomsdayOrder') {
        val = val ? parseInt(val, 10) : null;
      } else if (h === 'tmdbId') {
        val = val ? parseInt(val, 10) : null;
      }
      item[h] = val;
    });

    // Derive upcoming boolean
    const isUpcoming =
      item.status === 'upcoming' ||
      item.status === 'tbd' ||
      (item.release && item.release.startsWith('2026') && !item.release.startsWith('2026-07')) ||
      (item.release && item.release.startsWith('2027'));

    item.upcoming = isUpcoming;
    return item;
  });

  // Calculate releaseOrder: globally across the WHOLE catalog
  // Sort by release date ascending, ties broken alphabetically by title
  const sortedByRelease = [...rawItems].sort((a, b) => {
    const aTime = getReleaseTimestamp(a.release, a.title);
    const bTime = getReleaseTimestamp(b.release, b.title);
    if (aTime.time !== bTime.time) {
      return aTime.time - bTime.time;
    }
    return a.title.localeCompare(b.title);
  });

  const releaseOrderMap = new Map();
  sortedByRelease.forEach((item, index) => {
    releaseOrderMap.set(item.id, index + 1);
  });

  // Attach releaseOrder to items
  rawItems.forEach((item) => {
    item.releaseOrder = releaseOrderMap.get(item.id);
  });

  // Calculate chronoOrder: unique integer (1..M) within each `canon` block
  const canonGroups = {};
  for (const item of rawItems) {
    const c = item.canon;
    if (!canonGroups[c]) canonGroups[c] = [];
    canonGroups[c].push(item);
  }

  for (const [canonName, group] of Object.entries(canonGroups)) {
    if (canonName === 'MCU canon') {
      // Sort using canonical MCU timeline list, falling back to releaseOrder
      group.sort((a, b) => {
        let idxA = MCU_CANON_CHRONO_ORDER.indexOf(a.title);
        let idxB = MCU_CANON_CHRONO_ORDER.indexOf(b.title);
        if (idxA === -1) idxA = 1000 + a.releaseOrder;
        if (idxB === -1) idxB = 1000 + b.releaseOrder;
        if (idxA !== idxB) return idxA - idxB;
        return a.releaseOrder - b.releaseOrder;
      });
    } else if (canonName === 'Non-MCU Marvel') {
      // Fox X-Men block first by in-universe order, then other non-MCU Marvel by releaseOrder
      group.sort((a, b) => {
        const isFoxA = a.franchise === 'Fox X-Men (non-MCU)';
        const isFoxB = b.franchise === 'Fox X-Men (non-MCU)';
        if (isFoxA && isFoxB) {
          let idxA = FOX_XMEN_CHRONO_ORDER.indexOf(a.title);
          let idxB = FOX_XMEN_CHRONO_ORDER.indexOf(b.title);
          if (idxA === -1) idxA = 100 + a.releaseOrder;
          if (idxB === -1) idxB = 100 + b.releaseOrder;
          return idxA - idxB;
        }
        if (isFoxA && !isFoxB) return -1;
        if (!isFoxA && isFoxB) return 1;
        return a.releaseOrder - b.releaseOrder;
      });
    } else {
      // Other canon blocks (DCU, DCEU, Elseworlds, Legacy DC, Arrowverse, Other)
      // Sort by releaseOrder approximation within block
      group.sort((a, b) => a.releaseOrder - b.releaseOrder);
    }

    // Assign sequential 1..M chronoOrder within the canon block
    group.forEach((item, idx) => {
      item.chronoOrder = idx + 1;
    });
  }

  // Sort rawItems by global releaseOrder for the exported data.js
  rawItems.sort((a, b) => a.releaseOrder - b.releaseOrder);

  // Generate JavaScript content
  const jsContent = `/**
 * MARVEL & DC MOVIE CHECKLIST TRACKER DATA
 * Auto-generated from data/catalog.csv via scripts/csv-to-data.mjs
 *
 * Total titles: ${rawItems.length}
 * Official Doomsday watch count: ${rawItems.filter((i) => i.doomsday === 'official').length}
 *
 * To add a new movie/series:
 * 1. Add row to data/catalog.csv
 * 2. Run: node scripts/csv-to-data.mjs && node scripts/validate-data.mjs
 */

export const DATA_VERSION = 2;

/**
 * @typedef {Object} MediaItem
 * @property {string} id - Stable unique slug
 * @property {"Marvel"|"DC"} universe - Primary comic universe
 * @property {string} franchise - Franchise category
 * @property {string} collection - Narrative collection or saga
 * @property {"MCU canon"|"Non-MCU Marvel"|"DCU"|"DCEU"|"Elseworlds"|"Legacy DC"|"Arrowverse"|"Other"} canon - Canonical storyline
 * @property {"Movie"|"TV Series"|"Special"|"Short"} type - Media format
 * @property {string} title - Full release title
 * @property {string} release - ISO date or year string
 * @property {"released"|"upcoming"|"tbd"} status - Release status
 * @property {number} releaseOrder - Global sequential release order (1..N)
 * @property {number} chronoOrder - Sequential story order within canon block (1..M)
 * @property {boolean} chronoApprox - True if chronological placement is approximate
 * @property {string} era - Phase or narrative era
 * @property {string} platform - Primary viewing platform
 * @property {number|null} seasons - Total seasons for TV series
 * @property {number|null} runtimeMin - Movie runtime in minutes
 * @property {"core"|"extended"|"fringe"} tier - Catalog breadth tier
 * @property {"official"|"optional"|"no"|"na"} doomsday - Relevance to Avengers: Doomsday
 * @property {number|null} doomsdayOrder - Official Disney+ sequence (1..15) or null
 * @property {string} doomsdayReason - Context line for optional picks
 * @property {string} notes - Curator background details
 * @property {number|null} tmdbId - TMDB reference ID
 * @property {"movie"|"tv"|null} tmdbType - TMDB media type
 * @property {boolean} needsReview - True if date or facts need verification
 * @property {boolean} upcoming - True if unreleased
 */

export const MOVIES = ${JSON.stringify(rawItems, null, 2)};

export default MOVIES;
`;

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, jsContent, 'utf-8');
  console.log(`Successfully generated ${OUTPUT_PATH} with ${rawItems.length} titles.`);
  return rawItems;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  convertCSVToData();
}
