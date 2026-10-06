/**
 * MCU & DC Tracker - Home Page Component (#/home)
 * Flat, comic-book editorial redesign.
 */

import { MOVIES } from '../data.js';
import { store } from '../store.js';
import { isMovieInCatalogScope } from '../plan.js';
import { renderCardHtml, attachCardListeners, observeLazyPosters } from './card.js';
import { initSlider, renderSliderHtml } from './slider.js';
import { applyFilters, renderFiltersHtml, attachFilterListeners } from './filters.js';

const DOOMSDAY_TARGET_DATE = new Date('2026-12-18T00:00:00Z');
let countdownIntervalId = null;

function getCountdownParts() {
  const now = new Date();
  const diffMs = DOOMSDAY_TARGET_DATE.getTime() - now.getTime();

  if (diffMs <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true };

  return {
    days: Math.floor(diffMs / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((diffMs % (1000 * 60)) / 1000),
    isPast: false
  };
}

function renderProgressStrip(label, current, total, colorVar) {
  const pct = total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0;
  return \`
    <div class="progress-strip-item">
      <div class="progress-strip-header">
        <span class="progress-strip-label">\${label}</span>
        <span class="progress-strip-count">\${current} / \${total}</span>
      </div>
      <div class="progress-strip-track">
        <div class="progress-strip-fill" style="width: \${pct}%; background-color: var(\${colorVar});"></div>
      </div>
    </div>
  \`;
}

function getBeforeDoomsdayItems(includeOptional = false, sortOrder = 'doomsday') {
  const official = MOVIES.filter((m) => m.universe === 'Marvel' && m.doomsday === 'official');
  if (!includeOptional) {
    return official.sort((a, b) => (a.doomsdayOrder ?? 99) - (b.doomsdayOrder ?? 99));
  }
  const optional = MOVIES.filter((m) => m.universe === 'Marvel' && m.doomsday === 'optional');
  const combined = [...official, ...optional];
  if (sortOrder === 'chrono') return combined.sort((a, b) => a.chronoOrder - b.chronoOrder);
  return combined.sort((a, b) => a.releaseOrder - b.releaseOrder);
}

// Subscribe to store updates for targeted DOM changes
store.subscribe((action) => {
  if (action === 'watched_toggle') {
    updateProgressCounts();
  }
});

function updateProgressCounts() {
  const includeOptional = store.getDoomsdayIncludeOptional();
  const catalogScope = store.getCatalogScope();
  const moviesInScope = MOVIES.filter((m) => isMovieInCatalogScope(m, catalogScope));

  const officialList = MOVIES.filter((m) => m.universe === 'Marvel' && m.doomsday === 'official');
  const optionalList = MOVIES.filter((m) => m.universe === 'Marvel' && m.doomsday === 'optional');

  const doomsdayWatchedCount = includeOptional
    ? [...officialList, ...optionalList].filter((m) => store.isWatched(m.id, m.seasons)).length
    : officialList.filter((m) => store.isWatched(m.id, m.seasons)).length;
  const doomsdayTotalCount = includeOptional ? officialList.length + optionalList.length : officialList.length;

  const marvelList = moviesInScope.filter((m) => m.universe === 'Marvel');
  const marvelWatchedCount = marvelList.filter((m) => store.isWatched(m.id, m.seasons)).length;

  const dcList = moviesInScope.filter((m) => m.universe === 'DC');
  const dcWatchedCount = dcList.filter((m) => store.isWatched(m.id, m.seasons)).length;

  // Targeted update of the progress strip items if they exist
  const strip = document.querySelector('.hero-progress-strip');
  if (strip) {
    const labelA = includeOptional ? 'Before Doomsday (+Optional)' : 'Before Doomsday (Official)';
    strip.innerHTML = \`
      \${renderProgressStrip(labelA, doomsdayWatchedCount, doomsdayTotalCount, '--gold')}
      \${renderProgressStrip(\`Marvel (\${catalogScope.toUpperCase()})\`, marvelWatchedCount, marvelList.length, '--red')}
      \${renderProgressStrip(\`DC (\${catalogScope.toUpperCase()})\`, dcWatchedCount, dcList.length, '--dc-blue')}
    \`;
  }
}

export function renderHomePage(container) {
  if (countdownIntervalId) {
    clearInterval(countdownIntervalId);
    countdownIntervalId = null;
  }

  const prefs = store.getPrefs();
  const includeOptional = store.getDoomsdayIncludeOptional();
  const sliderASort = prefs.sliderASort || 'doomsday';
  const catalogScope = store.getCatalogScope();
  const moviesInScope = MOVIES.filter((m) => isMovieInCatalogScope(m, catalogScope));

  const cd = getCountdownParts();

  const sliderAItems = getBeforeDoomsdayItems(includeOptional, sliderASort);
  // High priority for the first few posters in slider A
  const sliderACardsHtml = sliderAItems.map((m, i) => renderCardHtml(m, { priority: i < 5 })).join('');

  const filteredBItems = applyFilters(MOVIES, prefs.filters);
  const sliderBCardsHtml = filteredBItems.map((m) => renderCardHtml(m, { priority: false })).join('');
  const isGridView = prefs.filters?.view === 'grid';

  const html = \`
    <div class="page-home">
      <!-- Compact Hero -->
      <section class="home-hero">
        <div class="hero-red-band">
          DESTINATION: 2026
        </div>
        <div class="hero-content">
          <h1 class="hero-title">AVENGERS: DOOMSDAY</h1>
          <div class="hero-countdown">
            <div class="cd-box"><span id="cd-days" class="cd-num">\${cd.days}</span><span class="cd-label">DAYS</span></div>
            <div class="cd-box"><span id="cd-hours" class="cd-num">\${String(cd.hours).padStart(2, '0')}</span><span class="cd-label">HRS</span></div>
            <div class="cd-box"><span id="cd-minutes" class="cd-num">\${String(cd.minutes).padStart(2, '0')}</span><span class="cd-label">MIN</span></div>
            <div class="cd-box"><span id="cd-seconds" class="cd-num">\${String(cd.seconds).padStart(2, '0')}</span><span class="cd-label">SEC</span></div>
          </div>
        </div>
        
        <!-- Progress Strip (replaces rings) -->
        <div class="hero-progress-strip">
          <!-- Will be populated by updateProgressCounts() -->
        </div>
      </section>

      <!-- Up Next Row (mock logic for now, using the first unwatched Doomsday item) -->
      <section class="section-container up-next-rail">
        <div class="section-header">
          <h2 class="section-title">UP NEXT</h2>
        </div>
        <div id="up-next-container" class="rail-container">
          <!-- To be implemented in a complete Up Next logic flow -->
          <p class="rail-placeholder">Continue your journey...</p>
        </div>
      </section>

      <!-- Slider A: Before Doomsday -->
      <section class="section-container section-doomsday">
        <div class="section-header">
          <h2 class="section-title">BEFORE DOOMSDAY</h2>
          <div class="section-actions doomsday-actions-bar">
            \${includeOptional ? \`
              <select id="select-slider-a-sort" class="form-select form-select-sm">
                <option value="release" \${sliderASort !== 'chrono' ? 'selected' : ''}>Release Order</option>
                <option value="chrono" \${sliderASort === 'chrono' ? 'selected' : ''}>Chronological</option>
              </select>
            \` : ''}
            <div class="segmented-control">
              <button type="button" class="segmented-btn \${!includeOptional ? 'is-active' : ''}" id="btn-doomsday-official">Official (15)</button>
              <button type="button" class="segmented-btn \${includeOptional ? 'is-active' : ''}" id="btn-doomsday-optional">+ Optional</button>
            </div>
          </div>
        </div>
        <div id="slider-a-container">
          \${renderSliderHtml({ id: 'slider-a', cardsHtml: sliderACardsHtml, isGrid: false })}
        </div>
      </section>

      <!-- Slider B: Complete List -->
      <section class="section-container section-complete">
        <div class="section-header">
          <h2 class="section-title">COMPLETE CATALOG</h2>
        </div>
        <div id="home-filter-controls" class="filter-sticky-bar">
          \${renderFiltersHtml(prefs.filters, moviesInScope.length, filteredBItems.length, { showViewToggle: true })}
        </div>
        <div id="slider-b-container">
          \${filteredBItems.length > 0
            ? renderSliderHtml({ id: 'slider-b', cardsHtml: sliderBCardsHtml, isGrid: isGridView })
            : \`<div class="empty-state">No titles match your filter criteria.<br><button id="btn-empty-reset-filters" class="btn btn-primary">Reset Filters</button></div>\`
          }
        </div>
      </section>
    </div>
  \`;

  container.innerHTML = html;
  
  // Populate initial progress
  updateProgressCounts();

  // Attach Intersection Observer for lazy loading posters
  observeLazyPosters(container);

  // Countdown timer
  countdownIntervalId = setInterval(() => {
    const cdParts = getCountdownParts();
    const daysEl = container.querySelector('#cd-days');
    const hoursEl = container.querySelector('#cd-hours');
    const minsEl = container.querySelector('#cd-minutes');
    const secsEl = container.querySelector('#cd-seconds');
    if (daysEl) daysEl.textContent = String(cdParts.days);
    if (hoursEl) hoursEl.textContent = String(cdParts.hours).padStart(2, '0');
    if (minsEl) minsEl.textContent = String(cdParts.minutes).padStart(2, '0');
    if (secsEl) secsEl.textContent = String(cdParts.seconds).padStart(2, '0');
  }, 1000);

  // Initialize Sliders
  const sliderAWrapper = container.querySelector('#slider-a-wrapper');
  if (sliderAWrapper) initSlider(sliderAWrapper);
  
  const sliderBWrapper = container.querySelector('#slider-b-wrapper');
  if (sliderBWrapper && !isGridView) initSlider(sliderBWrapper);

  // Attach UI listeners
  attachCardListeners(container);

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

  const sortSelectA = container.querySelector('#select-slider-a-sort');
  if (sortSelectA) {
    sortSelectA.addEventListener('change', (e) => {
      store.updatePrefs({ sliderASort: e.target.value });
      renderHomePage(container);
    });
  }

  const filterControlsEl = container.querySelector('#home-filter-controls');
  if (filterControlsEl) {
    attachFilterListeners(filterControlsEl, () => renderHomePage(container));
  }

  const emptyResetBtn = container.querySelector('#btn-empty-reset-filters');
  if (emptyResetBtn) {
    emptyResetBtn.addEventListener('click', () => {
      store.updatePrefs({
        filters: { universe: 'all', type: 'all', franchises: [], status: 'all', search: '', sort: 'release', view: 'slider' }
      });
      renderHomePage(container);
    });
  }
}

export function destroyHomePage() {
  if (countdownIntervalId) {
    clearInterval(countdownIntervalId);
    countdownIntervalId = null;
  }
}
