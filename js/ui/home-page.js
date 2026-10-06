/**
 * MCU & DC Tracker - Home Page Component (#/home)
 * Features:
 * 1. Hero with live countdown to Avengers: Doomsday (Dec 18, 2026) and SVG progress rings
 * 2. Slider A: "Before Doomsday" (official 15 in doomsdayOrder, optional picks toggle, no DC)
 * 3. Slider B: "Complete List" with comprehensive filters, search, sort, and grid/slider view toggle
 */

import { MOVIES } from '../data.js';
import { store } from '../store.js';
import { isMovieInCatalogScope } from '../plan.js';
import { renderCardHtml, attachCardListeners } from './card.js';
import { initSlider, renderSliderHtml } from './slider.js';
import { applyFilters, renderFiltersHtml, attachFilterListeners } from './filters.js';

// Target release date for Avengers: Doomsday: Dec 18, 2026
const DOOMSDAY_TARGET_DATE = new Date('2026-12-18T00:00:00Z');

// Module-level countdown interval ref
let countdownIntervalId = null;

/**
 * Format countdown remaining time
 */
function getCountdownParts() {
  const now = new Date();
  const diffMs = DOOMSDAY_TARGET_DATE.getTime() - now.getTime();

  if (diffMs <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true };
  }

  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

  return { days, hours, minutes, seconds, isPast: false };
}

/**
 * Render SVG circular progress ring
 */
function renderProgressRing({ size = 96, strokeWidth = 8, current, total, color = '#e23636', label = '' }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0;
  const offset = circumference - (pct / 100) * circumference;

  return `
    <div class="progress-ring-card">
      <div class="progress-ring-visual" style="width: ${size}px; height: ${size}px;">
        <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" class="progress-ring-svg">
          <circle
            class="progress-ring-bg"
            stroke="currentColor"
            stroke-width="${strokeWidth}"
            fill="transparent"
            r="${radius}"
            cx="${size / 2}"
            cy="${size / 2}"
          />
          <circle
            class="progress-ring-bar"
            stroke="${color}"
            stroke-width="${strokeWidth}"
            stroke-dasharray="${circumference}"
            stroke-dashoffset="${offset}"
            stroke-linecap="round"
            fill="transparent"
            r="${radius}"
            cx="${size / 2}"
            cy="${size / 2}"
          />
        </svg>
        <div class="progress-ring-content">
          <span class="progress-ring-pct">${pct}%</span>
          <span class="progress-ring-count">${current}/${total}</span>
        </div>
      </div>
      <div class="progress-ring-label">${label}</div>
    </div>
  `;
}

/**
 * Get items for Slider A (Before Doomsday)
 */
function getBeforeDoomsdayItems(includeOptional = false, sortOrder = 'doomsday') {
  // Official items: doomsday === "official", universe === "Marvel"
  const official = MOVIES
    .filter((m) => m.universe === 'Marvel' && m.doomsday === 'official');

  if (!includeOptional) {
    return official.sort((a, b) => (a.doomsdayOrder ?? 99) - (b.doomsdayOrder ?? 99));
  }

  // Optional items: doomsday === "optional", universe === "Marvel"
  const optional = MOVIES
    .filter((m) => m.universe === 'Marvel' && m.doomsday === 'optional');

  const combined = [...official, ...optional];

  if (sortOrder === 'chrono') {
    return combined.sort((a, b) => a.chronoOrder - b.chronoOrder);
  } else {
    return combined.sort((a, b) => a.releaseOrder - b.releaseOrder);
  }
}

/**
 * Render the entire Home page
 * @param {HTMLElement} container - Target main container
 */
export function renderHomePage(container) {
  // Clear any existing countdown
  if (countdownIntervalId) {
    clearInterval(countdownIntervalId);
    countdownIntervalId = null;
  }

  const prefs = store.getPrefs();
  const includeOptional = store.getDoomsdayIncludeOptional();
  const sliderASort = prefs.sliderASort || 'doomsday';
  const catalogScope = store.getCatalogScope();
  const moviesInScope = MOVIES.filter((m) => isMovieInCatalogScope(m, catalogScope));

  // Calculate statistics within active catalog scope
  const officialList = MOVIES.filter((m) => m.universe === 'Marvel' && m.doomsday === 'official');
  const optionalList = MOVIES.filter((m) => m.universe === 'Marvel' && m.doomsday === 'optional');

  // Strict Doomsday counts:
  // When includeOptional is false: ONLY official items are counted (15 max).
  // Watched optional items NEVER inflate the official count.
  const doomsdayWatchedCount = includeOptional
    ? [...officialList, ...optionalList].filter((m) => store.isWatched(m.id, m.seasons)).length
    : officialList.filter((m) => store.isWatched(m.id, m.seasons)).length;
  const doomsdayTotalCount = includeOptional ? officialList.length + optionalList.length : officialList.length;

  const marvelList = moviesInScope.filter((m) => m.universe === 'Marvel');
  const marvelWatchedCount = marvelList.filter((m) => store.isWatched(m.id, m.seasons)).length;

  const dcList = moviesInScope.filter((m) => m.universe === 'DC');
  const dcWatchedCount = dcList.filter((m) => store.isWatched(m.id, m.seasons)).length;

  const countdown = getCountdownParts();

  // Slider A items
  const sliderAItems = getBeforeDoomsdayItems(includeOptional, sliderASort);
  const sliderACardsHtml = sliderAItems.map((m) => renderCardHtml(m)).join('');

  // Slider B items (Complete list with filters)
  const filteredBItems = applyFilters(MOVIES, prefs.filters);
  const sliderBCardsHtml = filteredBItems.map((m) => renderCardHtml(m)).join('');
  const isGridView = prefs.filters?.view === 'grid';

  const html = `
    <div class="page-home">
      <!-- Hero Section -->
      <section class="home-hero" aria-labelledby="hero-title">
        <div class="hero-container">
          <div class="hero-header">
            <span class="hero-badge">DESTINATION: 2026</span>
            <h1 id="hero-title" class="hero-title">Avengers: Doomsday</h1>
            <p class="hero-subtitle">
              Robert Downey Jr. returns as Victor Von Doom. Are you caught up with the essential multiverse timeline?
            </p>
          </div>

          <!-- Live Countdown -->
          <div class="hero-countdown-block" role="timer" aria-label="Countdown to Avengers Doomsday">
            <div class="countdown-unit">
              <span class="countdown-val" id="cd-days">${countdown.days}</span>
              <span class="countdown-label">Days</span>
            </div>
            <span class="countdown-sep" aria-hidden="true">:</span>
            <div class="countdown-unit">
              <span class="countdown-val" id="cd-hours">${String(countdown.hours).padStart(2, '0')}</span>
              <span class="countdown-label">Hours</span>
            </div>
            <span class="countdown-sep" aria-hidden="true">:</span>
            <div class="countdown-unit">
              <span class="countdown-val" id="cd-minutes">${String(countdown.minutes).padStart(2, '0')}</span>
              <span class="countdown-label">Mins</span>
            </div>
            <span class="countdown-sep" aria-hidden="true">:</span>
            <div class="countdown-unit">
              <span class="countdown-val" id="cd-seconds">${String(countdown.seconds).padStart(2, '0')}</span>
              <span class="countdown-label">Secs</span>
            </div>
          </div>

          <!-- Overall Progress Rings -->
          <div class="hero-progress-section" aria-label="Your Universe Progress">
            ${renderProgressRing({
              size: 104,
              strokeWidth: 9,
              current: doomsdayWatchedCount,
              total: doomsdayTotalCount,
              color: '#f59e0b',
              label: includeOptional ? 'Before Doomsday (+Optional)' : 'Before Doomsday (Official)'
            })}
            ${renderProgressRing({
              size: 104,
              strokeWidth: 9,
              current: marvelWatchedCount,
              total: marvelList.length,
              color: '#e23636',
              label: `Marvel (${catalogScope.toUpperCase()})`
            })}
            ${renderProgressRing({
              size: 104,
              strokeWidth: 9,
              current: dcWatchedCount,
              total: dcList.length,
              color: '#0476f2',
              label: `DC (${catalogScope.toUpperCase()})`
            })}
          </div>
        </div>
      </section>

      <!-- Section: Slider A (Before Doomsday) -->
      <section class="section-container section-doomsday" aria-labelledby="section-doomsday-title">
        <div class="section-header">
          <div class="section-title-wrap">
            <span class="section-kicker">ESSENTIAL TIMELINE</span>
            <h2 id="section-doomsday-title" class="section-title">Before Doomsday Checklist</h2>
            <p class="section-desc">
              ${
                includeOptional
                  ? `Expanded Doomsday preparation (${doomsdayTotalCount} titles: ${officialList.length} official + ${optionalList.length} optional multiverse/character links).`
                  : `The official Disney+ priority watchlist (${officialList.length} titles: 14 films + Loki S1-2) leading directly into Avengers: Doomsday.`
              }
            </p>
          </div>

          <div class="section-actions doomsday-actions-bar">
            ${
              includeOptional
                ? `
              <div class="slider-a-sort-group">
                <label for="select-slider-a-sort" class="sort-select-label">Sort:</label>
                <select id="select-slider-a-sort" class="form-select form-select-sm" aria-label="Sort Before Doomsday titles">
                  <option value="release" ${sliderASort !== 'chrono' ? 'selected' : ''}>Release Date</option>
                  <option value="chrono" ${sliderASort === 'chrono' ? 'selected' : ''}>Chronological</option>
                </select>
              </div>
            `
                : ''
            }

            <div class="segmented-control" role="group" aria-label="Before Doomsday Mode">
              <button
                type="button"
                class="segmented-btn ${!includeOptional ? 'is-active' : ''}"
                id="btn-doomsday-official"
                aria-pressed="${!includeOptional}"
              >
                Official only (${officialList.length})
              </button>
              <button
                type="button"
                class="segmented-btn ${includeOptional ? 'is-active' : ''}"
                id="btn-doomsday-optional"
                aria-pressed="${includeOptional}"
              >
                + Optional picks (${officialList.length + optionalList.length})
              </button>
            </div>
          </div>
        </div>

        <div id="slider-a-container">
          ${renderSliderHtml({
            id: 'slider-a',
            label: 'Before Doomsday Watchlist',
            cardsHtml: sliderACardsHtml,
            isGrid: false
          })}
        </div>
      </section>

      <!-- Section: Slider B (Complete List) -->
      <section class="section-container section-complete" aria-labelledby="section-complete-title">
        <div class="section-header">
          <div class="section-title-wrap">
            <span class="section-kicker">THE MULTIVERSE VAULT</span>
            <h2 id="section-complete-title" class="section-title">Complete Catalog</h2>
            <p class="section-desc">
              Every Marvel & DC title across MCU, Fox X-Men, DCEU, DCU, Elseworlds, and Legacy sagas. Filter by universe, canon, platform, or franchise.
            </p>
          </div>
        </div>

        <!-- Filter Controls -->
        <div id="home-filter-controls">
          ${renderFiltersHtml(prefs.filters, moviesInScope.length, filteredBItems.length, { showViewToggle: true })}
        </div>

        <!-- Slider B Content Container -->
        <div id="slider-b-container">
          ${
            filteredBItems.length > 0
              ? renderSliderHtml({
                  id: 'slider-b',
                  label: 'Complete Titles Catalog',
                  cardsHtml: sliderBCardsHtml,
                  isGrid: isGridView
                })
              : `<div class="empty-state">
                  <p class="empty-state-title">No titles match your filter criteria.</p>
                  <p class="empty-state-text">Try resetting filters or adjusting your search term.</p>
                  <button type="button" class="btn btn-secondary" id="btn-empty-reset-filters">Reset Filters</button>
                 </div>`
          }
        </div>
      </section>
    </div>
  `;

  container.innerHTML = html;

  // --- Attach Handlers & Interactive Subsystems ---

  // 1. Live Countdown Interval
  countdownIntervalId = setInterval(() => {
    const cd = getCountdownParts();
    const daysEl = container.querySelector('#cd-days');
    const hoursEl = container.querySelector('#cd-hours');
    const minsEl = container.querySelector('#cd-minutes');
    const secsEl = container.querySelector('#cd-seconds');

    if (daysEl) daysEl.textContent = String(cd.days);
    if (hoursEl) hoursEl.textContent = String(cd.hours).padStart(2, '0');
    if (minsEl) minsEl.textContent = String(cd.minutes).padStart(2, '0');
    if (secsEl) secsEl.textContent = String(cd.seconds).padStart(2, '0');
  }, 1000);

  // 2. Initialize Slider A
  const sliderAWrapper = container.querySelector('#slider-a-wrapper');
  if (sliderAWrapper) {
    initSlider(sliderAWrapper);
  }

  // 3. Initialize Slider B
  const sliderBWrapper = container.querySelector('#slider-b-wrapper');
  if (sliderBWrapper && !isGridView) {
    initSlider(sliderBWrapper);
  }

  // 4. Attach Card Listeners (both sliders)
  attachCardListeners(container, () => {
    // Re-render home page to update rings, card states and counts
    renderHomePage(container);
  });

  // 5. Before Doomsday segmented mode toggle
  const btnOfficial = container.querySelector('#btn-doomsday-official');
  if (btnOfficial) {
    btnOfficial.addEventListener('click', () => {
      store.setDoomsdayIncludeOptional(false);
      renderHomePage(container);
    });
  }

  const btnOptional = container.querySelector('#btn-doomsday-optional');
  if (btnOptional) {
    btnOptional.addEventListener('click', () => {
      store.setDoomsdayIncludeOptional(true);
      renderHomePage(container);
    });
  }

  // 5b. Slider A Sort Selector
  const sortSelectA = container.querySelector('#select-slider-a-sort');
  if (sortSelectA) {
    sortSelectA.addEventListener('change', (e) => {
      store.updatePrefs({ sliderASort: e.target.value });
      renderHomePage(container);
    });
  }

  // 6. Attach Filter Listeners for Slider B
  const filterControlsEl = container.querySelector('#home-filter-controls');
  if (filterControlsEl) {
    attachFilterListeners(filterControlsEl, () => {
      // Re-render home page with updated filters
      renderHomePage(container);
    });
  }

  // 7. Reset filters button in empty state
  const emptyResetBtn = container.querySelector('#btn-empty-reset-filters');
  if (emptyResetBtn) {
    emptyResetBtn.addEventListener('click', () => {
      store.updatePrefs({
        filters: {
          universe: 'all',
          type: 'all',
          franchises: [],
          status: 'all',
          search: '',
          sort: 'release',
          view: 'slider'
        }
      });
      renderHomePage(container);
    });
  }
}

/**
 * Cleanup timers on route transition
 */
export function destroyHomePage() {
  if (countdownIntervalId) {
    clearInterval(countdownIntervalId);
    countdownIntervalId = null;
  }
}
