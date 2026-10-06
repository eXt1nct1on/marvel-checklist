/**
 * MCU & DC Tracker - Filters Component
 * Supports multi-criteria filtering (Catalog Breadth, Universe, Type, Canon, Platform,
 * Collection, Franchise multi-select, Status, Search) and sorting, with per-profile persistence.
 */

import { MOVIES } from '../data.js';
import { store } from '../store.js';
import { sortReleaseOrder, sortChronologicalOrder, isMovieInCatalogScope } from '../plan.js';
import { escapeHtml } from './card.js';

export const FRANCHISES = [
  'MCU',
  'Fox X-Men (non-MCU)',
  'DCEU (Snyderverse era)',
  'DCU (Chapter One)',
  'Elseworlds',
  'Defenders Saga',
  'Spider-Man (Raimi)',
  'The Amazing Spider-Man',
  'Spider-Verse',
  "Sony's Spider-Man Universe",
  'Batman (Burton/Schumacher)',
  'The Dark Knight Trilogy',
  'Superman (Reeve)',
  'Arrowverse',
  'Marvel Television',
  'Fantastic Four (Fox)'
];

export const CANONS = [
  'MCU canon',
  'Non-MCU Marvel',
  'DCU',
  'DCEU',
  'Elseworlds',
  'Legacy DC',
  'Arrowverse'
];

export const PLATFORMS = [
  'Theaters',
  'Disney+',
  'Netflix',
  'Max',
  'Prime Video',
  'Fox',
  'CW',
  'Other'
];

export const TYPES = [
  { id: 'Movie', label: 'Movies' },
  { id: 'TV Series', label: 'Series' },
  { id: 'Special', label: 'Specials' },
  { id: 'Short', label: 'Shorts' }
];

/**
 * Extract unique sorted collections from movies catalog
 */
export function getUniqueCollections(movies = MOVIES) {
  const set = new Set();
  for (const m of movies) {
    if (m.collection) set.add(m.collection);
  }
  return Array.from(set).sort();
}

/**
 * Filter and sort a list of movie objects based on filter criteria
 * @param {Array} movies
 * @param {Object} filterCriteria
 * @returns {Array}
 */
export function applyFilters(movies, filterCriteria = {}) {
  const {
    universe = 'all',
    type = 'all',
    canon = 'all',
    platform = 'all',
    collection = 'all',
    franchises = [],
    status = 'all',
    search = '',
    sort = 'release',
    catalogScope = null
  } = filterCriteria;

  // Catalog breadth tier from criteria or active profile store
  const activeCatalogScope = catalogScope || store.getCatalogScope() || 'core';
  const searchNormalized = (search || '').trim().toLowerCase();

  const filtered = movies.filter((movie) => {
    // 0. Catalog breadth tier (core / extended / everything)
    if (!isMovieInCatalogScope(movie, activeCatalogScope)) {
      return false;
    }

    // 1. Universe
    if (universe !== 'all' && movie.universe !== universe) {
      return false;
    }

    // 2. Type (Movie, TV Series, Special, Short)
    if (type !== 'all' && movie.type !== type) {
      return false;
    }

    // 3. Canon
    if (canon !== 'all' && movie.canon !== canon) {
      return false;
    }

    // 4. Platform
    if (platform !== 'all' && movie.platform !== platform) {
      return false;
    }

    // 5. Collection
    if (collection !== 'all' && movie.collection !== collection) {
      return false;
    }

    // 6. Franchise (multi-select: if any selected, movie must match one)
    if (Array.isArray(franchises) && franchises.length > 0) {
      if (!franchises.includes(movie.franchise)) {
        return false;
      }
    }

    // 7. Status (unwatched / watched)
    if (status !== 'all') {
      const isWatched = store.isWatched(movie.id, movie.seasons);
      if (status === 'watched' && !isWatched) return false;
      if (status === 'unwatched' && isWatched) return false;
    }

    // 8. Search across title, era, notes, and collection
    if (searchNormalized) {
      const matchTitle = movie.title.toLowerCase().includes(searchNormalized);
      const matchEra = (movie.era || '').toLowerCase().includes(searchNormalized);
      const matchNotes = (movie.notes || '').toLowerCase().includes(searchNormalized);
      const matchCollection = (movie.collection || '').toLowerCase().includes(searchNormalized);
      if (!matchTitle && !matchEra && !matchNotes && !matchCollection) {
        return false;
      }
    }

    return true;
  });

  // Sort
  if (sort === 'chrono') {
    return sortChronologicalOrder(filtered);
  } else {
    return sortReleaseOrder(filtered, 'everything');
  }
}

/**
 * Render HTML for filter controls
 * @param {Object} currentFilters
 * @param {number} totalCount
 * @param {number} matchCount
 * @param {Object} options
 * @returns {string} HTML string
 */
export function renderFiltersHtml(currentFilters = {}, totalCount = 0, matchCount = 0, options = {}) {
  const {
    universe = 'all',
    type = 'all',
    canon = 'all',
    platform = 'all',
    collection = 'all',
    franchises = [],
    status = 'all',
    search = '',
    sort = 'release',
    view = 'slider'
  } = currentFilters;

  const showViewToggle = options.showViewToggle !== false;
  const activeCatalogScope = store.getCatalogScope();
  const collectionsList = getUniqueCollections(MOVIES);

  return `
    <div class="filter-panel" role="search" aria-label="Filter and Sort Titles">
      <!-- Breadth Selector & Search Row -->
      <div class="filter-row filter-row-primary">
        <!-- Catalog Breadth Segmented Control -->
        <div class="breadth-control-group" role="group" aria-label="Catalog Breadth Tier">
          <span class="control-label-mini">Catalog:</span>
          <div class="breadth-toggle-buttons">
            <button
              type="button"
              class="btn-breadth-toggle ${activeCatalogScope === 'core' ? 'is-active' : ''}"
              data-scope="core"
              aria-pressed="${activeCatalogScope === 'core'}"
              title="Core essential universe titles (105 titles)"
            >
              Core
            </button>
            <button
              type="button"
              class="btn-breadth-toggle ${activeCatalogScope === 'extended' ? 'is-active' : ''}"
              data-scope="extended"
              aria-pressed="${activeCatalogScope === 'extended'}"
              title="Core + Extended sagas (Defenders, Sony Spider-Man, classics - 168 titles)"
            >
              + Extended
            </button>
            <button
              type="button"
              class="btn-breadth-toggle ${activeCatalogScope === 'everything' ? 'is-active' : ''}"
              data-scope="everything"
              aria-pressed="${activeCatalogScope === 'everything'}"
              title="Everything including specials, shorts, animated, Arrowverse (199 titles)"
            >
              Everything
            </button>
          </div>
        </div>

        <!-- Search Input -->
        <div class="filter-search-box">
          <svg class="search-icon" viewBox="0 0 20 20" fill="currentColor" width="16" height="16" aria-hidden="true">
            <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd"/>
          </svg>
          <input
            type="search"
            class="filter-search-input"
            id="filter-search-input"
            placeholder="Search title, character, or era..."
            value="${escapeHtml(search)}"
            aria-label="Search titles"
          />
          ${
            search
              ? `<button type="button" class="btn-clear-search" id="btn-clear-search" aria-label="Clear search">×</button>`
              : ''
          }
        </div>

        <!-- Sort Select -->
        <div class="filter-sort-group">
          <label for="filter-sort-select" class="filter-sort-label">Sort:</label>
          <select id="filter-sort-select" class="filter-select" aria-label="Sort Order">
            <option value="release" ${sort === 'release' ? 'selected' : ''}>Release Order</option>
            <option value="chrono" ${sort === 'chrono' ? 'selected' : ''}>Chronological Order</option>
          </select>
        </div>

        ${
          showViewToggle
            ? `
          <div class="filter-view-toggle" role="group" aria-label="Display View">
            <button
              type="button"
              class="btn-view-toggle ${view === 'slider' ? 'is-active' : ''}"
              data-view="slider"
              aria-pressed="${view === 'slider'}"
              title="Carousel Slider View"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16" aria-hidden="true">
                <rect x="2" y="5" width="20" height="14" rx="2"></rect>
                <line x1="2" y1="10" x2="22" y2="10"></line>
              </svg>
              <span>Slider</span>
            </button>
            <button
              type="button"
              class="btn-view-toggle ${view === 'grid' ? 'is-active' : ''}"
              data-view="grid"
              aria-pressed="${view === 'grid'}"
              title="Responsive Grid View"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16" aria-hidden="true">
                <rect x="3" y="3" width="7" height="7"></rect>
                <rect x="14" y="3" width="7" height="7"></rect>
                <rect x="14" y="14" width="7" height="7"></rect>
                <rect x="3" y="14" width="7" height="7"></rect>
              </svg>
              <span>Grid</span>
            </button>
          </div>
        `
            : ''
        }
      </div>

      <!-- Filter Chips Row: Universe, Type, Status -->
      <div class="filter-row filter-row-chips">
        <!-- Universe -->
        <div class="chip-group" role="group" aria-label="Filter by Universe">
          <span class="chip-group-label">Universe:</span>
          <button type="button" class="filter-chip ${universe === 'all' ? 'is-active' : ''}" data-filter-type="universe" data-filter-val="all">All</button>
          <button type="button" class="filter-chip chip-marvel ${universe === 'Marvel' ? 'is-active' : ''}" data-filter-type="universe" data-filter-val="Marvel">Marvel</button>
          <button type="button" class="filter-chip chip-dc ${universe === 'DC' ? 'is-active' : ''}" data-filter-type="universe" data-filter-val="DC">DC</button>
        </div>

        <!-- Type -->
        <div class="chip-group" role="group" aria-label="Filter by Type">
          <span class="chip-group-label">Type:</span>
          <button type="button" class="filter-chip ${type === 'all' ? 'is-active' : ''}" data-filter-type="type" data-filter-val="all">All</button>
          ${TYPES.map((t) => `
            <button
              type="button"
              class="filter-chip ${type === t.id ? 'is-active' : ''}"
              data-filter-type="type"
              data-filter-val="${escapeHtml(t.id)}"
            >
              ${escapeHtml(t.label)}
            </button>
          `).join('')}
        </div>

        <!-- Status -->
        <div class="chip-group" role="group" aria-label="Filter by Watch Status">
          <span class="chip-group-label">Status:</span>
          <button type="button" class="filter-chip ${status === 'all' ? 'is-active' : ''}" data-filter-type="status" data-filter-val="all">All</button>
          <button type="button" class="filter-chip ${status === 'unwatched' ? 'is-active' : ''}" data-filter-type="status" data-filter-val="unwatched">Unwatched</button>
          <button type="button" class="filter-chip ${status === 'watched' ? 'is-active' : ''}" data-filter-type="status" data-filter-val="watched">Watched</button>
        </div>
      </div>

      <!-- Advanced Selects Row: Canon, Platform, Collection -->
      <div class="filter-row filter-row-selects">
        <!-- Canon Select -->
        <div class="filter-select-field">
          <label for="filter-canon-select" class="select-label">Canon:</label>
          <select id="filter-canon-select" class="filter-select" aria-label="Filter by Canon">
            <option value="all" ${canon === 'all' ? 'selected' : ''}>All Canons</option>
            ${CANONS.map((c) => `<option value="${escapeHtml(c)}" ${canon === c ? 'selected' : ''}>${escapeHtml(c)}</option>`).join('')}
          </select>
        </div>

        <!-- Platform Select -->
        <div class="filter-select-field">
          <label for="filter-platform-select" class="select-label">Platform:</label>
          <select id="filter-platform-select" class="filter-select" aria-label="Filter by Platform">
            <option value="all" ${platform === 'all' ? 'selected' : ''}>All Platforms</option>
            ${PLATFORMS.map((p) => `<option value="${escapeHtml(p)}" ${platform === p ? 'selected' : ''}>${escapeHtml(p)}</option>`).join('')}
          </select>
        </div>

        <!-- Collection Select -->
        <div class="filter-select-field">
          <label for="filter-collection-select" class="select-label">Collection:</label>
          <select id="filter-collection-select" class="filter-select" aria-label="Filter by Collection">
            <option value="all" ${collection === 'all' ? 'selected' : ''}>All Collections</option>
            ${collectionsList.map((col) => `<option value="${escapeHtml(col)}" ${collection === col ? 'selected' : ''}>${escapeHtml(col)}</option>`).join('')}
          </select>
        </div>
      </div>

      <!-- Franchise Multi-select Chips Row -->
      <div class="filter-row filter-row-franchises">
        <div class="chip-group chip-group-wrap" role="group" aria-label="Filter by Franchise">
          <span class="chip-group-label">Franchises:</span>
          ${FRANCHISES.map((fr) => {
            const isSelected = franchises.includes(fr);
            const shortName = fr.split('(')[0].trim();
            return `
              <button
                type="button"
                class="filter-chip chip-franchise ${isSelected ? 'is-active' : ''}"
                data-filter-type="franchise-toggle"
                data-filter-val="${escapeHtml(fr)}"
                aria-pressed="${isSelected}"
              >
                ${escapeHtml(shortName)}
              </button>
            `;
          }).join('')}
        </div>
      </div>

      <!-- Results Summary Bar -->
      <div class="filter-summary-bar">
        <div class="filter-count" aria-live="polite">
          Showing <strong>${matchCount}</strong> of <strong>${totalCount}</strong> titles
          ${activeCatalogScope !== 'everything' ? `<span class="scope-indicator-tag">(${activeCatalogScope.toUpperCase()} TIER)</span>` : ''}
        </div>
        <button type="button" class="btn-reset-filters" id="btn-reset-filters" title="Reset all filters">
          Reset Filters
        </button>
      </div>
    </div>
  `;
}

/**
 * Attach listeners to filter container and trigger onFilterChange callback
 * @param {HTMLElement} container
 * @param {Function} onFilterChange
 */
export function attachFilterListeners(container, onFilterChange) {
  if (!container) return;

  const prefs = store.getPrefs();
  let currentFilters = { ...prefs.filters };

  function triggerUpdate() {
    store.updatePrefs({ filters: { ...currentFilters } });
    if (typeof onFilterChange === 'function') {
      onFilterChange(currentFilters);
    }
  }

  // 1. Catalog Breadth Toggle Buttons
  container.querySelectorAll('.btn-breadth-toggle').forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetScope = btn.getAttribute('data-scope');
      if (targetScope) {
        store.setCatalogScope(targetScope);
        triggerUpdate();
      }
    });
  });

  // 2. Search input (debounced)
  const searchInput = container.querySelector('#filter-search-input');
  if (searchInput) {
    let debounceTimer;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        currentFilters.search = e.target.value;
        triggerUpdate();
      }, 200);
    });
  }

  // Clear search button
  const clearSearchBtn = container.querySelector('#btn-clear-search');
  if (clearSearchBtn) {
    clearSearchBtn.addEventListener('click', () => {
      currentFilters.search = '';
      if (searchInput) searchInput.value = '';
      triggerUpdate();
    });
  }

  // 3. Sort select
  const sortSelect = container.querySelector('#filter-sort-select');
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      currentFilters.sort = e.target.value;
      triggerUpdate();
    });
  }

  // 4. Canon select
  const canonSelect = container.querySelector('#filter-canon-select');
  if (canonSelect) {
    canonSelect.addEventListener('change', (e) => {
      currentFilters.canon = e.target.value;
      triggerUpdate();
    });
  }

  // 5. Platform select
  const platformSelect = container.querySelector('#filter-platform-select');
  if (platformSelect) {
    platformSelect.addEventListener('change', (e) => {
      currentFilters.platform = e.target.value;
      triggerUpdate();
    });
  }

  // 6. Collection select
  const collectionSelect = container.querySelector('#filter-collection-select');
  if (collectionSelect) {
    collectionSelect.addEventListener('change', (e) => {
      currentFilters.collection = e.target.value;
      triggerUpdate();
    });
  }

  // 7. View toggle
  container.querySelectorAll('.btn-view-toggle').forEach((btn) => {
    btn.addEventListener('click', () => {
      const viewMode = btn.getAttribute('data-view');
      currentFilters.view = viewMode;
      triggerUpdate();
    });
  });

  // 8. Chip clicks (Universe, Type, Status, Franchise)
  container.addEventListener('click', (e) => {
    const chip = e.target.closest('.filter-chip');
    if (!chip) return;

    const filterType = chip.getAttribute('data-filter-type');
    const filterVal = chip.getAttribute('data-filter-val');

    if (filterType === 'universe') {
      currentFilters.universe = filterVal;
      triggerUpdate();
    } else if (filterType === 'type') {
      currentFilters.type = filterVal;
      triggerUpdate();
    } else if (filterType === 'status') {
      currentFilters.status = filterVal;
      triggerUpdate();
    } else if (filterType === 'franchise-toggle') {
      const frList = Array.isArray(currentFilters.franchises) ? [...currentFilters.franchises] : [];
      const idx = frList.indexOf(filterVal);
      if (idx !== -1) {
        frList.splice(idx, 1);
      } else {
        frList.push(filterVal);
      }
      currentFilters.franchises = frList;
      triggerUpdate();
    }
  });

  // 9. Reset filters
  const resetBtn = container.querySelector('#btn-reset-filters');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      currentFilters = {
        universe: 'all',
        type: 'all',
        canon: 'all',
        platform: 'all',
        collection: 'all',
        franchises: [],
        status: 'all',
        search: '',
        sort: 'release',
        view: currentFilters.view || 'slider'
      };
      triggerUpdate();
    });
  }
}
