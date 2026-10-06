/**
 * MCU & DC Tracker - My Progress Page (#/progress)
 * Features:
 * 1. Global & franchise stats (Totals, % complete, Marvel vs DC, Movies vs Series, Doomsday bar & days countdown)
 * 2. Section 1: "Watched" (newest first, editable date watched, undo action)
 * 3. Section 2: "Up Next" (highlighted target card from saved plan + 3 queue items, or prompt to create plan)
 * 4. Section 3: "Unwatched" (grouped by Universe -> Franchise, with filters and quick watch actions)
 */

import { MOVIES } from '../data.js';
import { store } from '../store.js';
import { getUpNextFromPlan, isMovieInCatalogScope } from '../plan.js';
import { renderCardHtml, attachCardListeners, escapeHtml, formatReleaseDisplay, generatePosterSvg } from './card.js';
import { applyFilters, renderFiltersHtml, attachFilterListeners } from './filters.js';

const DOOMSDAY_TARGET_DATE = new Date('2026-12-18T00:00:00Z');

/**
 * Render the entire My Progress page
 * @param {HTMLElement} container
 */
export function renderProgressPage(container) {
  const profile = store.getActiveProfile();
  const watchedMap = store.getWatchedMap();
  const plan = store.getPlan();
  const catalogScope = store.getCatalogScope();

  // 1. Calculate Statistics within active catalog breadth tier
  const moviesInScope = MOVIES.filter((m) => isMovieInCatalogScope(m, catalogScope));
  const totalCount = moviesInScope.length;
  const watchedInScope = moviesInScope.filter((m) => store.isWatched(m.id, m.seasons)).length;
  const overallPct = totalCount > 0 ? Math.round((watchedInScope / totalCount) * 100) : 0;

  const marvelList = moviesInScope.filter((m) => m.universe === 'Marvel');
  const marvelWatched = marvelList.filter((m) => store.isWatched(m.id, m.seasons)).length;
  const marvelPct = marvelList.length > 0 ? Math.round((marvelWatched / marvelList.length) * 100) : 0;

  const dcList = moviesInScope.filter((m) => m.universe === 'DC');
  const dcWatched = dcList.filter((m) => store.isWatched(m.id, m.seasons)).length;
  const dcPct = dcList.length > 0 ? Math.round((dcWatched / dcList.length) * 100) : 0;

  const moviesList = moviesInScope.filter((m) => m.type === 'Movie');
  const moviesWatched = moviesList.filter((m) => store.isWatched(m.id, m.seasons)).length;

  const seriesList = moviesInScope.filter((m) => m.type === 'TV Series');
  const seriesWatched = seriesList.filter((m) => store.isWatched(m.id, m.seasons)).length;

  const doomsdayIncludeOptional = store.getDoomsdayIncludeOptional();
  const doomsdayOfficial = MOVIES.filter((m) => m.universe === 'Marvel' && m.doomsday === 'official');
  const doomsdayOptional = MOVIES.filter((m) => m.universe === 'Marvel' && m.doomsday === 'optional');
  const doomsdayList = doomsdayIncludeOptional ? [...doomsdayOfficial, ...doomsdayOptional] : doomsdayOfficial;
  const doomsdayWatched = doomsdayList.filter((m) => store.isWatched(m.id, m.seasons)).length;
  const doomsdayLeft = Math.max(0, doomsdayList.length - doomsdayWatched);
  const doomsdayPct = Math.round((doomsdayWatched / doomsdayList.length) * 100);

  // Calculate days remaining to Doomsday
  const now = new Date();
  const msRemaining = DOOMSDAY_TARGET_DATE.getTime() - now.getTime();
  const daysRemaining = Math.max(0, Math.ceil(msRemaining / (1000 * 60 * 60 * 24)));

  // 2. Process Section: Watched
  // Get all watched movies and sort newest watched first
  const watchedMovies = [];
  for (const [id, info] of Object.entries(watchedMap)) {
    const movie = MOVIES.find((m) => m.id === id);
    if (movie) {
      watchedMovies.push({
        ...movie,
        watchedAt: info.watchedAt || new Date().toISOString()
      });
    }
  }

  watchedMovies.sort((a, b) => {
    const timeA = new Date(a.watchedAt).getTime() || 0;
    const timeB = new Date(b.watchedAt).getTime() || 0;
    return timeB - timeA;
  });

  // 3. Process Section: Up Next
  const upNextState = getUpNextFromPlan(plan, watchedMap, MOVIES);

  // 4. Process Section: Unwatched
  // Filter unwatched movies within current scope
  const unwatchedList = moviesInScope.filter((m) => !store.isWatched(m.id, m.seasons));
  const prefs = store.getPrefs();
  const unwatchedFiltered = applyFilters(unwatchedList, { ...prefs.filters, status: 'all', catalogScope });

  // Group unwatched by Universe then Franchise
  const groupedUnwatched = {
    Marvel: {},
    DC: {}
  };

  for (const movie of unwatchedFiltered) {
    const u = movie.universe;
    const f = movie.franchise;
    if (!groupedUnwatched[u]) groupedUnwatched[u] = {};
    if (!groupedUnwatched[u][f]) groupedUnwatched[u][f] = [];
    groupedUnwatched[u][f].push(movie);
  }

  const html = `
    <div class="page-progress">
      <!-- Page Header & Stats Bar -->
      <section class="progress-hero" aria-labelledby="progress-header-title">
        <div class="progress-hero-header">
          <div class="progress-hero-text">
            <span class="hero-badge">PERSONAL TRACKER</span>
            <h1 id="progress-header-title" class="page-title">My Progress (${escapeHtml(profile.name)})</h1>
            <p class="page-subtitle">Track your watched history, active queue, and backlog breakdown.</p>
          </div>

          <!-- Catalog Breadth Tier Switcher -->
          <div class="progress-tier-switcher" role="group" aria-label="Catalog Scope Switcher">
            <span class="control-label-mini">Catalog Scope:</span>
            <div class="breadth-toggle-buttons">
              <button
                type="button"
                class="btn-breadth-toggle ${catalogScope === 'core' ? 'is-active' : ''}"
                data-scope="core"
                aria-pressed="${catalogScope === 'core'}"
                title="Core essential universe titles (105 titles)"
              >
                Core
              </button>
              <button
                type="button"
                class="btn-breadth-toggle ${catalogScope === 'extended' ? 'is-active' : ''}"
                data-scope="extended"
                aria-pressed="${catalogScope === 'extended'}"
                title="Core + Extended sagas (168 titles)"
              >
                + Extended
              </button>
              <button
                type="button"
                class="btn-breadth-toggle ${catalogScope === 'everything' ? 'is-active' : ''}"
                data-scope="everything"
                aria-pressed="${catalogScope === 'everything'}"
                title="Everything including fringe shorts/animation (199 titles)"
              >
                Everything
              </button>
            </div>
          </div>
        </div>

        <!-- Comprehensive Stats Dashboard -->
        <div class="stats-dashboard" aria-label="Tracking statistics">
          <div class="stat-card stat-card-highlight">
            <span class="stat-label">Total in Scope (${catalogScope.toUpperCase()})</span>
            <div class="stat-main">
              <span class="stat-value">${watchedInScope}</span>
              <span class="stat-sub">/ ${totalCount} (${overallPct}%)</span>
            </div>
            <div class="stat-bar-track">
              <div class="stat-bar-fill stat-fill-gold" style="width: ${overallPct}%;"></div>
            </div>
          </div>

          <div class="stat-card">
            <span class="stat-label">Marvel Universe</span>
            <div class="stat-main">
              <span class="stat-value">${marvelWatched}</span>
              <span class="stat-sub">/ ${marvelList.length} (${marvelPct}%)</span>
            </div>
            <div class="stat-bar-track">
              <div class="stat-bar-fill stat-fill-marvel" style="width: ${marvelPct}%;"></div>
            </div>
          </div>

          <div class="stat-card">
            <span class="stat-label">DC Universe</span>
            <div class="stat-main">
              <span class="stat-value">${dcWatched}</span>
              <span class="stat-sub">/ ${dcList.length} (${dcPct}%)</span>
            </div>
            <div class="stat-bar-track">
              <div class="stat-bar-fill stat-fill-dc" style="width: ${dcPct}%;"></div>
            </div>
          </div>

          <div class="stat-card">
            <span class="stat-label">Format Split</span>
            <div class="stat-details-list">
              <div class="stat-detail-item">
                <span>Movies:</span>
                <strong>${moviesWatched} / ${moviesList.length}</strong>
              </div>
              <div class="stat-detail-item">
                <span>TV Series:</span>
                <strong>${seriesWatched} / ${seriesList.length}</strong>
              </div>
            </div>
          </div>
        </div>

        <!-- Before Doomsday Progress Bar & Countdown line -->
        <div class="doomsday-progress-banner">
          <div class="doomsday-banner-header">
            <div class="doomsday-banner-title">
              <span class="fire-icon">🔥</span>
              <strong>Before Doomsday (${doomsdayIncludeOptional ? 'Official + Optional Picks' : 'Official Watchlist'}):</strong>
              <span>${doomsdayWatched} / ${doomsdayList.length} watched (${doomsdayPct}%)</span>
            </div>
            <div class="segmented-control segmented-control-sm" role="group" aria-label="Before Doomsday Mode">
              <button
                type="button"
                class="segmented-btn ${!doomsdayIncludeOptional ? 'is-active' : ''}"
                id="progress-doomsday-official"
                aria-pressed="${!doomsdayIncludeOptional}"
              >
                Official (${doomsdayOfficial.length})
              </button>
              <button
                type="button"
                class="segmented-btn ${doomsdayIncludeOptional ? 'is-active' : ''}"
                id="progress-doomsday-optional"
                aria-pressed="${doomsdayIncludeOptional}"
              >
                + Optional (${doomsdayOfficial.length + doomsdayOptional.length})
              </button>
            </div>
            <div class="doomsday-banner-meta">
              <strong>${doomsdayLeft} titles left before Doomsday, ${daysRemaining} days remaining</strong>
            </div>
          </div>
          <div class="doomsday-bar-track">
            <div class="doomsday-bar-fill" style="width: ${doomsdayPct}%;"></div>
          </div>
        </div>
      </section>

      <!-- SECTION 2: UP NEXT (Target Priority) -->
      <section class="section-container section-up-next" aria-labelledby="section-up-next-title">
        <div class="section-header">
          <div class="section-title-wrap">
            <span class="section-kicker">ACTIVE QUEUE</span>
            <h2 id="section-up-next-title" class="section-title">Up Next Target</h2>
            <p class="section-desc">
              Your next destination driven by your custom Watch Plan.
            </p>
          </div>
          ${
            plan
              ? `<a href="#/plan" class="btn btn-secondary btn-sm">Edit Plan</a>`
              : ''
          }
        </div>

        <div class="up-next-content">
          ${renderUpNextContent(upNextState)}
        </div>
      </section>

      <!-- SECTION 1: WATCHED -->
      <section class="section-container section-watched" aria-labelledby="section-watched-title">
        <div class="section-header">
          <div class="section-title-wrap">
            <span class="section-kicker">HISTORY</span>
            <h2 id="section-watched-title" class="section-title">Watched (${watchedMovies.length})</h2>
            <p class="section-desc">
              Your watched timeline, ordered newest first. You can edit the date watched or undo at any time.
            </p>
          </div>
        </div>

        <div class="watched-list-container">
          ${renderWatchedList(watchedMovies)}
        </div>
      </section>

      <!-- SECTION 3: UNWATCHED -->
      <section class="section-container section-unwatched" aria-labelledby="section-unwatched-title">
        <div class="section-header">
          <div class="section-title-wrap">
            <span class="section-kicker">BACKLOG CATALOG</span>
            <h2 id="section-unwatched-title" class="section-title">Unwatched Backlog (${unwatchedList.length})</h2>
            <p class="section-desc">
              Remaining titles grouped by Universe and Franchise with quick-watch actions.
            </p>
          </div>
        </div>

        <!-- Filter chips for Unwatched list -->
        <div id="unwatched-filter-controls">
          ${renderFiltersHtml(prefs.filters, unwatchedList.length, unwatchedFiltered.length, { showViewToggle: false })}
        </div>

        <!-- Grouped Unwatched Content -->
        <div class="unwatched-groups-container">
          ${renderGroupedUnwatched(groupedUnwatched)}
        </div>
      </section>
    </div>
  `;

  container.innerHTML = html;

  // --- Attach Handlers ---

  // 1. Up next action buttons
  const upNextTargetBtn = container.querySelector('#btn-upnext-watch');
  if (upNextTargetBtn) {
    upNextTargetBtn.addEventListener('click', () => {
      const movieId = upNextTargetBtn.getAttribute('data-movie-id');
      if (movieId) {
        store.toggleWatched(movieId);
        renderProgressPage(container);
      }
    });
  }

  // Queue item quick watch buttons
  container.querySelectorAll('.btn-queue-watch').forEach((btn) => {
    btn.addEventListener('click', () => {
      const movieId = btn.getAttribute('data-movie-id');
      if (movieId) {
        store.toggleWatched(movieId);
        renderProgressPage(container);
      }
    });
  });

  // 2. Watched Section: Undo button & Edit date watched
  container.querySelectorAll('.btn-undo-watch').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const movieId = btn.getAttribute('data-movie-id');
      if (movieId) {
        store.toggleWatched(movieId);
        renderProgressPage(container);
      }
    });
  });

  // Edit date watched inline handler
  container.querySelectorAll('.watched-date-edit-trigger').forEach((btn) => {
    btn.addEventListener('click', () => {
      const parent = btn.closest('.watched-date-wrapper');
      if (!parent) return;
      const displaySpan = parent.querySelector('.watched-date-display');
      const inputEl = parent.querySelector('.watched-date-input');
      const saveBtn = parent.querySelector('.btn-save-date');

      if (displaySpan && inputEl) {
        displaySpan.hidden = true;
        btn.hidden = true;
        inputEl.hidden = false;
        if (saveBtn) saveBtn.hidden = false;
        inputEl.focus();
      }
    });
  });

  // Save date watched input handler
  container.querySelectorAll('.btn-save-date').forEach((saveBtn) => {
    saveBtn.addEventListener('click', () => {
      const parent = saveBtn.closest('.watched-date-wrapper');
      if (!parent) return;
      const movieId = parent.getAttribute('data-movie-id');
      const inputEl = parent.querySelector('.watched-date-input');
      if (movieId && inputEl && inputEl.value) {
        store.setWatchedDate(movieId, inputEl.value);
        renderProgressPage(container);
      }
    });
  });

  // 3. Attach card listeners for any standard card rendered in unwatched sections
  attachCardListeners(container, () => {
    renderProgressPage(container);
  });

  // 4. Attach filter listeners for unwatched backlog
  const filterControlsEl = container.querySelector('#unwatched-filter-controls');
  if (filterControlsEl) {
    attachFilterListeners(filterControlsEl, () => {
      renderProgressPage(container);
    });
  }

  // 5. Hero header breadth tier switcher buttons
  container.querySelectorAll('.progress-tier-switcher .btn-breadth-toggle').forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetScope = btn.getAttribute('data-scope');
      if (targetScope) {
        store.setCatalogScope(targetScope);
        renderProgressPage(container);
      }
    });
  });

  // 6. Doomsday banner segmented toggle
  const progOfficialBtn = container.querySelector('#progress-doomsday-official');
  if (progOfficialBtn) {
    progOfficialBtn.addEventListener('click', () => {
      store.setDoomsdayIncludeOptional(false);
      renderProgressPage(container);
    });
  }

  const progOptionalBtn = container.querySelector('#progress-doomsday-optional');
  if (progOptionalBtn) {
    progOptionalBtn.addEventListener('click', () => {
      store.setDoomsdayIncludeOptional(true);
      renderProgressPage(container);
    });
  }
}

/**
 * Render Up Next section content
 */
function renderUpNextContent(upNextState) {
  if (!upNextState.hasPlan) {
    return `
      <div class="up-next-empty-plan">
        <div class="empty-icon-box">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="40" height="40" aria-hidden="true">
            <path d="M9 18l6-6-6-6"></path>
          </svg>
        </div>
        <div class="empty-text-wrap">
          <h3 class="empty-title">No Active Watch Plan</h3>
          <p class="empty-desc">
            Create a watch plan (Release or Chronological order) to automatically set your Up Next target and queue!
          </p>
        </div>
        <a href="#/plan" class="btn btn-primary">Create a Watch Plan</a>
      </div>
    `;
  }

  if (upNextState.isPlanComplete) {
    return `
      <div class="up-next-completed-banner">
        <div class="complete-icon">🎉</div>
        <div class="complete-text">
          <h3 class="complete-title">Watch Plan Completed!</h3>
          <p class="complete-desc">You have successfully watched all titles in your active watch plan. Outstanding work!</p>
        </div>
        <a href="#/plan" class="btn btn-secondary">Create a New Plan</a>
      </div>
    `;
  }

  const current = upNextState.current;
  const queue = upNextState.queue;

  const formattedRelease = formatReleaseDisplay(current.release);
  const isUpcoming = Boolean(current.upcoming);

  return `
    <div class="up-next-layout">
      <!-- Target Hero Card -->
      <div class="up-next-target-card">
        <div class="target-card-poster">
          ${generatePosterSvg(current)}
        </div>
        <div class="target-card-details">
          <div class="target-badges">
            <span class="badge ${current.universe === 'Marvel' ? 'badge-marvel' : 'badge-dc'}">${escapeHtml(current.universe)}</span>
            <span class="badge badge-franchise">${escapeHtml(current.franchise.split('(')[0].trim())}</span>
            <span class="badge badge-target-pulse">🎯 Up Next Target</span>
          </div>

          <h3 class="target-title">${escapeHtml(current.title)}</h3>

          <div class="target-meta">
            <span>${escapeHtml(formattedRelease)}</span>
            <span>•</span>
            <span>${escapeHtml(current.era || 'Feature')}</span>
            <span>•</span>
            <span>${escapeHtml(current.type)}</span>
          </div>

          ${
            current.notes
              ? `<div class="target-notes"><p><strong>Curator Note:</strong> ${escapeHtml(current.notes)}</p></div>`
              : ''
          }

          <div class="target-actions">
            ${
              isUpcoming
                ? `<span class="coming-soon-label">Coming ${escapeHtml(formattedRelease)}</span>`
                : `
                  <button
                    type="button"
                    class="btn btn-primary btn-lg"
                    id="btn-upnext-watch"
                    data-movie-id="${escapeHtml(current.id)}"
                  >
                    <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18" aria-hidden="true">
                      <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                    </svg>
                    Mark as Watched
                  </button>
                `
            }
          </div>
        </div>
      </div>

      <!-- Queue: Next 3 titles in plan -->
      <div class="up-next-queue-box">
        <h4 class="queue-header-title">Coming Up in Queue (${queue.length})</h4>
        ${
          queue.length > 0
            ? `
            <div class="queue-items-list">
              ${queue.map((m, idx) => `
                <div class="queue-item">
                  <div class="queue-item-index">${idx + 1}</div>
                  <div class="queue-item-info">
                    <span class="queue-item-title">${escapeHtml(m.title)}</span>
                    <span class="queue-item-meta">${escapeHtml(formatReleaseDisplay(m.release))} • ${escapeHtml(m.franchise.split('(')[0].trim())}</span>
                  </div>
                  <div class="queue-item-action">
                    ${
                      m.upcoming
                        ? `<span class="badge badge-upcoming">Upcoming</span>`
                        : `
                          <button
                            type="button"
                            class="btn btn-secondary btn-sm btn-queue-watch"
                            data-movie-id="${escapeHtml(m.id)}"
                            title="Mark watched"
                          >
                            Mark Watched
                          </button>
                        `
                    }
                  </div>
                </div>
              `).join('')}
            </div>
          `
            : `<p class="queue-empty-text">This is the final title remaining in your watch plan!</p>`
        }
      </div>
    </div>
  `;
}

/**
 * Render Watched section table/grid
 */
function renderWatchedList(watchedMovies) {
  if (watchedMovies.length === 0) {
    return `
      <div class="empty-state">
        <p class="empty-state-title">No watched titles yet</p>
        <p class="empty-state-text">Check off titles as you watch them on the Home page or Follow your Watch Plan!</p>
        <a href="#/home" class="btn btn-primary">Browse Titles</a>
      </div>
    `;
  }

  return `
    <div class="watched-grid">
      ${watchedMovies.map((m) => {
        const dateObj = new Date(m.watchedAt);
        const formattedDate = !isNaN(dateObj.getTime())
          ? dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
          : 'Watched';
        const isoDateForInput = !isNaN(dateObj.getTime())
          ? dateObj.toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0];

        return `
          <div class="watched-card" data-id="${escapeHtml(m.id)}">
            <div class="watched-card-main">
              <div class="watched-card-header">
                <span class="badge ${m.universe === 'Marvel' ? 'badge-marvel' : 'badge-dc'}">${escapeHtml(m.universe)}</span>
                <span class="badge badge-franchise">${escapeHtml(m.franchise.split('(')[0].trim())}</span>
              </div>
              <h4 class="watched-title">${escapeHtml(m.title)}</h4>
              <div class="watched-meta">${escapeHtml(formatReleaseDisplay(m.release))} • ${escapeHtml(m.era || 'Feature')}</div>

              <!-- Editable Date Display -->
              <div class="watched-date-wrapper" data-movie-id="${escapeHtml(m.id)}">
                <span class="watched-date-display" title="Date Watched">Watched: <strong>${escapeHtml(formattedDate)}</strong></span>
                <button type="button" class="btn-icon watched-date-edit-trigger" aria-label="Edit watched date for ${escapeHtml(m.title)}" title="Edit date">
                  <svg viewBox="0 0 20 20" fill="currentColor" width="13" height="13" aria-hidden="true">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
                  </svg>
                </button>
                <input type="date" class="watched-date-input" value="${isoDateForInput}" hidden aria-label="Select date watched" />
                <button type="button" class="btn btn-secondary btn-sm btn-save-date" hidden>Save</button>
              </div>
            </div>

            <div class="watched-card-actions">
              <button
                type="button"
                class="btn btn-undo-watch"
                data-movie-id="${escapeHtml(m.id)}"
                aria-label="Undo watched status for ${escapeHtml(m.title)}"
              >
                <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14" aria-hidden="true">
                  <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd"/>
                </svg>
                <span>Undo</span>
              </button>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

/**
 * Render Unwatched grouped by Universe then Franchise
 */
function renderGroupedUnwatched(groupedUnwatched) {
  const universes = Object.keys(groupedUnwatched);
  let hasAny = false;

  const universeBlocks = universes.map((universe) => {
    const franchises = groupedUnwatched[universe];
    const franchiseKeys = Object.keys(franchises);
    if (franchiseKeys.length === 0) return '';

    const franchiseSections = franchiseKeys.map((franchise) => {
      const movies = franchises[franchise];
      if (!movies || movies.length === 0) return '';
      hasAny = true;

      return `
        <div class="franchise-group-block">
          <div class="franchise-group-header">
            <h4 class="franchise-group-title">${escapeHtml(franchise)}</h4>
            <span class="franchise-group-count">${movies.length} unwatched</span>
          </div>
          <div class="cards-grid">
            ${movies.map((m) => renderCardHtml(m)).join('')}
          </div>
        </div>
      `;
    }).join('');

    if (!franchiseSections.trim()) return '';

    return `
      <div class="universe-group-block universe-${universe.toLowerCase()}">
        <div class="universe-group-header">
          <h3 class="universe-group-title">${escapeHtml(universe)} Universe</h3>
        </div>
        <div class="universe-group-content">
          ${franchiseSections}
        </div>
      </div>
    `;
  }).join('');

  if (!hasAny) {
    return `
      <div class="empty-state">
        <p class="empty-state-title">No unwatched titles found</p>
        <p class="empty-state-text">You have watched all titles matching your current filter criteria!</p>
      </div>
    `;
  }

  return universeBlocks;
}
