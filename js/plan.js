/**
 * MCU & DC Tracker - Watch Plan Logic
 * Generates custom watch orders (Release order vs Chronological order)
 * across various scopes (Doomsday official, Doomsday+optional, All Marvel, All DC, Everything).
 */

import { MOVIES } from './data.js';

// Scope definitions
export const SCOPES = {
  DOOMSDAY_OFFICIAL: 'doomsday-official',
  DOOMSDAY_OPTIONAL: 'doomsday-plus-optional',
  ALL_MARVEL: 'all-marvel',
  ALL_DC: 'all-dc',
  EVERYTHING: 'everything'
};

export const ORDERS = {
  RELEASE: 'release',
  CHRONOLOGICAL: 'chronological'
};

/**
 * Check if a title matches the selected catalog breadth tier
 * @param {Object} movie
 * @param {string} catalogScope - 'core' | 'extended' | 'everything'
 * @returns {boolean}
 */
export function isMovieInCatalogScope(movie, catalogScope = 'core') {
  if (!catalogScope || catalogScope === 'everything') return true;
  if (catalogScope === 'extended') {
    return movie.tier === 'core' || movie.tier === 'extended';
  }
  return movie.tier === 'core';
}

/**
 * Filter movies by requested scope and optional catalog breadth tier
 * @param {string} scope
 * @param {Array} movies
 * @param {string|null} catalogScope
 * @returns {Array}
 */
export function filterMoviesByScope(scope, movies = MOVIES, catalogScope = null) {
  let list = movies;
  if (catalogScope) {
    list = list.filter((m) => isMovieInCatalogScope(m, catalogScope));
  }

  switch (scope) {
    case SCOPES.DOOMSDAY_OFFICIAL:
      return list.filter((m) => m.universe === 'Marvel' && m.doomsday === 'official');
    case SCOPES.DOOMSDAY_OPTIONAL:
      return list.filter(
        (m) => m.universe === 'Marvel' && (m.doomsday === 'official' || m.doomsday === 'optional')
      );
    case SCOPES.ALL_MARVEL:
      return list.filter((m) => m.universe === 'Marvel');
    case SCOPES.ALL_DC:
      return list.filter((m) => m.universe === 'DC');
    case SCOPES.EVERYTHING:
    default:
      return [...list];
  }
}

/**
 * Comparator for Release Order
 * For scope "doomsday-official", follows doomsdayOrder (Disney+ list 1..15).
 * For all other scopes, follows releaseOrder (then title).
 */
export function sortReleaseOrder(items, scope) {
  const list = [...items];
  if (scope === SCOPES.DOOMSDAY_OFFICIAL) {
    return list.sort((a, b) => {
      const orderA = a.doomsdayOrder ?? 9999;
      const orderB = b.doomsdayOrder ?? 9999;
      return orderA - orderB;
    });
  }

  return list.sort((a, b) => {
    if (a.releaseOrder !== b.releaseOrder) {
      return a.releaseOrder - b.releaseOrder;
    }
    return a.title.localeCompare(b.title);
  });
}

/**
 * Comparator for Chronological Order
 * Canonical block order:
 * 1. Fox X-Men block (sorted by Fox chronoOrder: in-universe order)
 * 2. MCU canon block (sorted by MCU chronoOrder: official Disney+ timeline)
 * 3. Other Marvel block (Non-MCU Marvel, Sony, legacy Marvel)
 * 4. DCEU block (DCEU canon)
 * 5. DCU block (DCU Chapter One)
 * 6. Elseworlds block
 * 7. Legacy DC block (Reeve Superman, Burton/Nolan Batman, etc.)
 * 8. Arrowverse block
 */
export function sortChronologicalOrder(items) {
  const list = [...items];

  // Helper to determine canon chronological block priority
  function getBlockRank(item) {
    if (item.universe === 'Marvel') {
      if (item.franchise === 'Fox X-Men (non-MCU)') return 1;
      if (item.canon === 'MCU canon') return 2;
      return 3; // Other Marvel
    }
    // DC Canon Blocks
    if (item.canon === 'DCEU') return 4;
    if (item.canon === 'DCU') return 5;
    if (item.canon === 'Elseworlds') return 6;
    if (item.canon === 'Legacy DC') return 7;
    if (item.canon === 'Arrowverse') return 8;
    return 9;
  }

  return list.sort((a, b) => {
    const rankA = getBlockRank(a);
    const rankB = getBlockRank(b);

    if (rankA !== rankB) {
      return rankA - rankB;
    }

    // Within same canon block: sort by chronoOrder, fallback to releaseOrder
    const chronoA = a.chronoOrder ?? 9999;
    const chronoB = b.chronoOrder ?? 9999;
    if (chronoA !== chronoB) {
      return chronoA - chronoB;
    }

    const relA = a.releaseOrder ?? 9999;
    const relB = b.releaseOrder ?? 9999;
    if (relA !== relB) {
      return relA - relB;
    }

    return a.title.localeCompare(b.title);
  });
}

/**
 * Generate a complete watch plan
 * @param {Object} params
 * @param {"release"|"chronological"} params.order
 * @param {string} params.scope
 * @param {boolean} params.skipWatched
 * @param {Object} params.watchedMap
 * @param {string|null} params.catalogScope
 * @returns {Object} { items, allItems, ids, hasDcChronologyNote, totalCount, remainingCount }
 */
export function generateWatchPlan({
  order = ORDERS.RELEASE,
  scope = SCOPES.DOOMSDAY_OFFICIAL,
  skipWatched = true,
  watchedMap = {},
  catalogScope = null
} = {}) {
  // Step 1: Filter by scope and catalog breadth tier
  const filtered = filterMoviesByScope(scope, MOVIES, catalogScope);

  // Step 2: Sort
  let sorted;
  if (order === ORDERS.CHRONOLOGICAL) {
    sorted = sortChronologicalOrder(filtered);
  } else {
    sorted = sortReleaseOrder(filtered, scope);
  }

  // Check if DC titles are included and mode is chronological
  const hasDcChronologyNote =
    order === ORDERS.CHRONOLOGICAL && (scope === SCOPES.ALL_DC || scope === SCOPES.EVERYTHING || filtered.some((m) => m.universe === 'DC'));

  // Step 3: Handle skip watched
  const allItems = [...sorted];
  const items = skipWatched ? sorted.filter((item) => !watchedMap[item.id]) : sorted;

  return {
    order,
    scope,
    catalogScope,
    skipWatched,
    allItems, // full sequence before skip
    items, // active remaining sequence
    ids: allItems.map((item) => item.id),
    hasDcChronologyNote,
    totalCount: allItems.length,
    remainingCount: items.length
  };
}

/**
 * Determine the "Up Next" target item and queue based on active plan and watched map
 * @param {Object|null} plan - Saved plan object from profile
 * @param {Object} watchedMap - Map of watched movies
 * @param {Array} movies - Movie database
 * @returns {Object} { current: Movie|null, queue: Movie[], isPlanComplete: boolean, hasPlan: boolean }
 */
export function getUpNextFromPlan(plan, watchedMap = {}, movies = MOVIES) {
  if (!plan || !Array.isArray(plan.ids) || plan.ids.length === 0) {
    return {
      current: null,
      queue: [],
      isPlanComplete: false,
      hasPlan: false
    };
  }

  const movieMap = new Map(movies.map((m) => [m.id, m]));
  const unwatchedPlanItems = [];

  for (const id of plan.ids) {
    if (!watchedMap[id]) {
      const movie = movieMap.get(id);
      if (movie) {
        unwatchedPlanItems.push(movie);
      }
    }
  }

  if (unwatchedPlanItems.length === 0) {
    return {
      current: null,
      queue: [],
      isPlanComplete: true,
      hasPlan: true
    };
  }

  return {
    current: unwatchedPlanItems[0],
    queue: unwatchedPlanItems.slice(1, 4),
    isPlanComplete: false,
    hasPlan: true
  };
}
