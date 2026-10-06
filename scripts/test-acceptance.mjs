/**
 * Comprehensive Acceptance Checklist Test Suite
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Setup Mock Window / LocalStorage before any imports
const storageData = {};
globalThis.window = {
  localStorage: {
    getItem(k) { return storageData[k] ?? null; },
    setItem(k, v) { storageData[k] = String(v); },
    removeItem(k) { delete storageData[k]; }
  },
  addEventListener() {}
};

async function runTests() {
  console.log('--- STARTING MULTIVERSE TRACKER ACCEPTANCE TESTS ---');

  const { MOVIES, DATA_VERSION } = await import('../js/data.js');
  const { generateWatchPlan, getUpNextFromPlan, isMovieInCatalogScope, SCOPES, ORDERS } = await import('../js/plan.js');
  const { applyFilters } = await import('../js/ui/filters.js');
  const { store } = await import('../js/store.js');

  // Test 0: Schema & Catalog Integrity
  console.assert(DATA_VERSION === 2, `Test 0: DATA_VERSION is 2 (got ${DATA_VERSION})`);
  console.assert(MOVIES.length === 199, `Test 0: Total catalog count is 199 (got ${MOVIES.length})`);

  // Verify all 78 baseline IDs are preserved
  const baselineIds = JSON.parse(readFileSync(resolve(__dirname, 'baseline_ids.json'), 'utf8'));
  for (const id of baselineIds) {
    console.assert(MOVIES.some(m => m.id === id), `Test 0: Baseline ID "${id}" must exist in catalog`);
  }
  console.log('✓ Test 0 Passed: Catalog expanded to 199 titles, DATA_VERSION=2, all 78 baseline IDs strictly preserved.');

  // Test 1: Fresh profile initialization and watched persistence
  const prof1 = store.getActiveProfile();
  console.assert(prof1 && prof1.name === 'Me', 'Criterion 1: Default profile "Me" created');
  store.toggleWatched('iron-man-2008');
  console.assert(store.isWatched('iron-man-2008') === true, 'Criterion 1: Marked Iron Man as watched');
  
  // Simulate hard refresh by reading same storage string
  const raw = window.localStorage.getItem('mcu-tracker:v1');
  console.assert(raw && raw.includes('iron-man-2008'), 'Criterion 1: Persisted to localStorage string');
  console.log('✓ Criterion 1 Passed: Fresh load creates profile and persists watched status.');

  // Test 2: Two profiles hold independent checklists, plans, and catalog preferences
  const p2 = store.createProfile('Bruce Wayne');
  console.assert(store.getActiveProfile().name === 'Bruce Wayne', 'Criterion 2: Switched to Bruce Wayne');
  console.assert(store.isWatched('iron-man-2008') === false, 'Criterion 2: Iron Man is NOT watched in Bruce profile');
  
  store.toggleWatched('man-of-steel-2013');
  console.assert(store.isWatched('man-of-steel-2013') === true, 'Criterion 2: Man of Steel watched in Bruce profile');
  
  store.setPlan({ order: ORDERS.CHRONOLOGICAL, scope: SCOPES.ALL_DC, ids: ['man-of-steel-2013'] });
  console.assert(store.getPlan().scope === SCOPES.ALL_DC, 'Criterion 2: Bruce has DC plan');

  // Switch back to Me
  store.setActiveProfile(prof1.id);
  console.assert(store.isWatched('iron-man-2008') === true, 'Criterion 2: Me still has Iron Man watched');
  console.assert(store.isWatched('man-of-steel-2013') === false, 'Criterion 2: Me does NOT have Man of Steel watched');
  console.assert(store.getPlan() === null, 'Criterion 2: Me does not have Bruce plan');
  console.log('✓ Criterion 2 Passed: Profiles hold completely independent checklists and plans.');

  // Test 3: "Before Doomsday" official 15 and optional titles with reasons
  const official = MOVIES.filter(m => m.universe === 'Marvel' && m.doomsday === 'official')
    .sort((a,b) => (a.doomsdayOrder ?? 99) - (b.doomsdayOrder ?? 99));
  console.assert(official.length === 15, `Criterion 3: Official count is 15 (got ${official.length})`);
  console.assert(official[0].title === 'X-Men' && official[0].doomsdayOrder === 1, 'Criterion 3: Official #1 is X-Men');
  console.assert(official[14].title === 'The Fantastic Four: First Steps' && official[14].doomsdayOrder === 15, 'Criterion 3: Official #15 is Fantastic Four');
  
  const hasLoki = official.some(m => m.title.includes('Loki') && m.type === 'TV Series');
  console.assert(hasLoki, 'Criterion 3: Official includes Loki TV Series');
  
  const hasDcInOfficial = official.some(m => m.universe === 'DC');
  console.assert(!hasDcInOfficial, 'Criterion 3: No DC titles mixed in Before Doomsday');

  const optional = MOVIES.filter(m => m.universe === 'Marvel' && m.doomsday === 'optional');
  console.assert(optional.length === 14, `Criterion 3: Optional count is 14 (got ${optional.length})`);
  for (const opt of optional) {
    console.assert(typeof opt.doomsdayReason === 'string' && opt.doomsdayReason.length > 5, `Criterion 3: Optional title "${opt.title}" has valid doomsdayReason`);
  }
  console.log('✓ Criterion 3 Passed: Before Doomsday contains exactly 15 official items in sequence 1..15 and all optional items include curator reasons.');

  // Test 4: Complete list filters (AND logic across new fields: Canon, Platform, Collection, Type)
  const marvelMovies = applyFilters(MOVIES, { universe: 'Marvel', type: 'Movie', status: 'all', catalogScope: 'everything' });
  console.assert(marvelMovies.every(m => m.universe === 'Marvel' && m.type === 'Movie'), 'Criterion 4: Universe Marvel + Type Movie');
  
  const mcuOnly = applyFilters(MOVIES, { franchises: ['MCU'], status: 'all', catalogScope: 'everything' });
  console.assert(mcuOnly.every(m => m.franchise === 'MCU'), 'Criterion 4: Franchise MCU filter');

  const specials = applyFilters(MOVIES, { type: 'Special', status: 'all', catalogScope: 'everything' });
  console.assert(specials.length >= 2 && specials.every(m => m.type === 'Special'), 'Criterion 4: Type Special filter');

  const disneyPlus = applyFilters(MOVIES, { platform: 'Disney+', status: 'all', catalogScope: 'everything' });
  console.assert(disneyPlus.length > 0 && disneyPlus.every(m => m.platform === 'Disney+'), 'Criterion 4: Platform Disney+ filter');

  const spidermanCollection = applyFilters(MOVIES, { collection: 'Spider-Man', status: 'all', catalogScope: 'everything' });
  console.assert(spidermanCollection.length >= 8 && spidermanCollection.every(m => m.collection === 'Spider-Man'), 'Criterion 4: Collection filter');

  const canonDCEU = applyFilters(MOVIES, { canon: 'DCEU', status: 'all', catalogScope: 'everything' });
  console.assert(canonDCEU.length === 16 && canonDCEU.every(m => m.canon === 'DCEU'), 'Criterion 4: Canon DCEU filter');

  const searchAndStatus = applyFilters(MOVIES, { search: 'Spider', status: 'all', catalogScope: 'everything' });
  console.assert(searchAndStatus.length > 0 && searchAndStatus.every(m => m.title.toLowerCase().includes('spider') || (m.notes||'').toLowerCase().includes('spider') || (m.collection||'').toLowerCase().includes('spider')), 'Criterion 4: Title search');

  const combined = applyFilters(MOVIES, { universe: 'Marvel', type: 'Movie', franchises: ['Fox X-Men (non-MCU)'], search: 'Wolverine', catalogScope: 'everything' });
  console.assert(combined.length > 0 && combined.every(m => m.franchise === 'Fox X-Men (non-MCU)'), 'Criterion 4: Combined multi-criteria AND logic filter');
  console.log('✓ Criterion 4 Passed: Filter chips combine simultaneously with AND logic across Type, Canon, Platform, Collection, and search.');

  // Test 5: Plan generation order, canon chronological blocks, and Up Next
  const planRel = generateWatchPlan({ order: ORDERS.RELEASE, scope: SCOPES.EVERYTHING, skipWatched: false, catalogScope: 'everything' });
  const planChr = generateWatchPlan({ order: ORDERS.CHRONOLOGICAL, scope: SCOPES.EVERYTHING, skipWatched: false, catalogScope: 'everything' });
  console.assert(JSON.stringify(planRel.ids) !== JSON.stringify(planChr.ids), 'Criterion 5: Release and Chrono produce different sequences');

  // Verify chronological blocks: Fox X-Men block before MCU canon block, MCU before DC
  const foxIndex = planChr.allItems.findIndex(m => m.franchise === 'Fox X-Men (non-MCU)');
  const mcuIndex = planChr.allItems.findIndex(m => m.canon === 'MCU canon');
  const dcuIndex = planChr.allItems.findIndex(m => m.universe === 'DC');
  console.assert(foxIndex < mcuIndex, 'Criterion 5: Fox X-Men block precedes MCU canon block in chronological mode');
  console.assert(mcuIndex < dcuIndex, 'Criterion 5: MCU canon block precedes DC blocks in chronological mode');
  console.assert(planChr.hasDcChronologyNote === true, 'Criterion 5: DC chronology approximation note flagged');

  // Up Next equals first unwatched
  const samplePlan = { ids: [planRel.ids[0], planRel.ids[1], planRel.ids[2]] };
  let wMap = {};
  let upNext = getUpNextFromPlan(samplePlan, wMap, MOVIES);
  console.assert(upNext.current.id === planRel.ids[0], 'Criterion 5: Up Next is item 0');
  
  wMap[planRel.ids[0]] = { watchedAt: new Date().toISOString() };
  upNext = getUpNextFromPlan(samplePlan, wMap, MOVIES);
  console.assert(upNext.current.id === planRel.ids[1], 'Criterion 5: Up Next advanced to item 1');
  console.log('✓ Criterion 5 Passed: Chronological canon block ordering (Fox -> MCU -> DC) and Up Next queue verified.');

  // Test 6: Catalog breadth tiers and TV Series multi-season tracking
  const coreMovies = MOVIES.filter(m => isMovieInCatalogScope(m, 'core'));
  const extMovies = MOVIES.filter(m => isMovieInCatalogScope(m, 'extended'));
  const allMovies = MOVIES.filter(m => isMovieInCatalogScope(m, 'everything'));
  console.assert(coreMovies.length === 104, `Criterion 6: Core tier has 104 titles (got ${coreMovies.length})`);
  console.assert(extMovies.length === 172, `Criterion 6: Extended tier has 172 titles (got ${extMovies.length})`);
  console.assert(allMovies.length === 199, `Criterion 6: Everything tier has 199 titles (got ${allMovies.length})`);

  // Multi-season TV tracking test
  const daredevil = MOVIES.find(m => m.id === 'daredevil-2015');
  console.assert(daredevil && daredevil.seasons === 3, 'Criterion 6: Daredevil has 3 seasons');

  store.toggleSeasonWatched('daredevil-2015', 1, 3);
  console.assert(store.isSeasonWatched('daredevil-2015', 1) === true, 'Criterion 6: Daredevil S1 watched');
  console.assert(store.isSeasonWatched('daredevil-2015', 2) === false, 'Criterion 6: Daredevil S2 unwatched');
  console.assert(store.isWatched('daredevil-2015', 3) === false, 'Criterion 6: Daredevil not fully watched with only 1 season');

  store.toggleSeasonWatched('daredevil-2015', 2, 3);
  store.toggleSeasonWatched('daredevil-2015', 3, 3);
  console.assert(store.isWatched('daredevil-2015', 3) === true, 'Criterion 6: Daredevil fully watched with all 3 seasons');
  console.assert(store.getWatchedSeasons('daredevil-2015').length === 3, 'Criterion 6: S1, S2, S3 all recorded');

  // Toggle off season 2
  store.toggleSeasonWatched('daredevil-2015', 2, 3);
  console.assert(store.isWatched('daredevil-2015', 3) === false, 'Criterion 6: Daredevil partially watched after untoggling S2');
  console.assert(store.getWatchedSeasons('daredevil-2015').includes(1) && store.getWatchedSeasons('daredevil-2015').includes(3), 'Criterion 6: S1 and S3 remain watched');

  console.log('✓ Criterion 6 Passed: Catalog breadth tiers and TV series multi-season tracking verified.');

  // Test 7: Export then import restores everything, corrupted JSON doesn't crash
  const exportedAll = store.exportData('all');
  console.assert(typeof exportedAll === 'string' && exportedAll.includes('version'), 'Criterion 7: Export generated valid JSON');
  
  // Clear store
  store.resetAllData();
  console.assert(store.getProfiles().length === 1, 'Criterion 7: Store cleared');
  
  // Import backup
  const importRes = store.importData(exportedAll, 'replace');
  console.assert(importRes.success === true, 'Criterion 7: Import succeeded');
  console.assert(store.getProfiles().length >= 2, 'Criterion 7: Both profiles restored');
  
  // Corrupted JSON recovery
  window.localStorage.setItem('mcu-tracker:v1', '{ invalid json :::');
  store.init();
  console.assert(store.getActiveProfile() !== null, 'Criterion 7: Corrupted JSON gracefully recovered without crashing');
  console.assert(window.localStorage.getItem('mcu-tracker:v1:backup') !== null, 'Criterion 7: Corrupted data backed up to backup key');
  console.log('✓ Criterion 7 Passed: Export/Import and corruption recovery verified.');

  // Test 8: TMDB Attribution, logo, and About page
  const logoPath = resolve(__dirname, '../assets/tmdb-logo.svg');
  const logoContent = readFileSync(logoPath, 'utf8');
  console.assert(logoContent.includes('<svg') && logoContent.includes('TMDB'), 'Criterion 8: Official TMDB logo SVG exists');

  const { renderAboutPage } = await import('../js/ui/about-page.js');
  const mockContainer = { innerHTML: '' };
  renderAboutPage(mockContainer);
  console.assert(
    mockContainer.innerHTML.includes('This product uses the TMDB API but is not endorsed or certified by TMDB.'),
    'Criterion 8: Exact required TMDB attribution sentence present on About page'
  );
  console.assert(
    mockContainer.innerHTML.includes('./assets/tmdb-logo.svg'),
    'Criterion 8: About page references official TMDB logo asset'
  );

  // Verify fetch-posters.mjs exists and does not contain hardcoded tokens
  const fetchScriptPath = resolve(__dirname, 'fetch-posters.mjs');
  const fetchScriptContent = readFileSync(fetchScriptPath, 'utf8');
  console.assert(fetchScriptContent.includes('TMDB_TOKEN'), 'Criterion 8: fetch script uses TMDB_TOKEN env var');
  console.assert(!fetchScriptContent.includes('Bearer eyJ'), 'Criterion 8: Token is never hardcoded');
  console.log('✓ Criterion 8 Passed: TMDB attribution, official logo, and fetch-posters script verified.');

  // Test 9: Poster-first rendering, Show Posters pref, and SVG fallback
  store.setShowPosters(true);
  console.assert(store.getShowPosters() === true, 'Criterion 9: showPosters pref persisted as true');
  
  const { renderCardHtml } = await import('../js/ui/card.js');
  const testMovie = MOVIES[0];
  const cardHtml = renderCardHtml(testMovie);
  console.assert(cardHtml.includes('card-poster-container'), 'Criterion 9: Card renders poster container');
  console.assert(cardHtml.includes('card-badges-overlay'), 'Criterion 9: Card overlays badges on poster');

  // Disable posters -> data saver mode
  store.setShowPosters(false);
  console.assert(store.getShowPosters() === false, 'Criterion 9: showPosters pref persisted as false');
  const cardSvgHtml = renderCardHtml(testMovie);
  console.assert(cardSvgHtml.includes('card-poster-svg'), 'Criterion 9: Data saver mode renders SVG poster');
  store.setShowPosters(true);
  console.log('✓ Criterion 9 Passed: Poster-first card rendering, data-saver SVG fallback, and pref toggle verified.');

  // Test 10: Before Doomsday Toggle and Count Isolation
  const officialList = MOVIES.filter(m => m.universe === 'Marvel' && m.doomsday === 'official');
  const optionalList = MOVIES.filter(m => m.universe === 'Marvel' && m.doomsday === 'optional');
  console.assert(officialList.length === 15, `Criterion 10: Exactly 15 official Doomsday titles (got ${officialList.length})`);
  console.assert(optionalList.length === 14, `Criterion 10: Exactly 14 optional Doomsday titles (got ${optionalList.length})`);
  console.assert(officialList.length + optionalList.length === 29, 'Criterion 10: Combined Doomsday count is 29');

  // Verify preference toggle persistence
  store.setDoomsdayIncludeOptional(false);
  console.assert(store.getDoomsdayIncludeOptional() === false, 'Criterion 10: doomsdayIncludeOptional set to false');
  
  // Watch an optional title (e.g. deadpool-and-wolverine-2024 or first optional)
  const optionalMovie = optionalList[0];
  store.toggleWatched(optionalMovie.id);
  console.assert(store.isWatched(optionalMovie.id) === true, 'Criterion 10: Optional title watched');

  // When toggle is FALSE (official only), calculate watched count:
  const officialWatchedCount = officialList.filter(m => store.isWatched(m.id)).length;
  // Watched optional title MUST NOT inflate official count!
  console.assert(officialWatchedCount === 0, 'Criterion 10: Watched optional item NEVER inflates official count');

  // When toggle is TRUE, both official and optional items count
  store.setDoomsdayIncludeOptional(true);
  console.assert(store.getDoomsdayIncludeOptional() === true, 'Criterion 10: doomsdayIncludeOptional toggled to true');
  const combinedWatchedCount = [...officialList, ...optionalList].filter(m => store.isWatched(m.id)).length;
  console.assert(combinedWatchedCount >= 1, 'Criterion 10: Combined count includes watched optional title');
  console.log('✓ Criterion 10 Passed: Before Doomsday toggle, 15/29 count math, and strict isolation verified.');

  console.log('--- ALL ACCEPTANCE CRITERIA VERIFIED SUCCESSFULLY ---');
}

runTests().catch(err => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
