/**
 * MCU & DC Tracker - Watch Plan Page (#/plan)
 * Features:
 * 1. Order selection (Release Order vs Chronological Order)
 * 2. Scope selection (Doomsday official, Doomsday+optional, All Marvel, All DC, Everything)
 * 3. "Skip titles I've already watched" checkbox
 * 4. Live interactive preview list (numbered, checkable in place)
 * 5. DC chronology approximation note
 * 6. "Save as my plan" and "Reset plan" buttons
 */

import { MOVIES } from '../data.js';
import { store } from '../store.js';
import { generateWatchPlan, isMovieInCatalogScope, SCOPES, ORDERS } from '../plan.js';
import { escapeHtml, formatReleaseDisplay, announceLiveMessage } from './card.js';

// Local UI state for plan generator before saving
let planGeneratorState = {
  order: ORDERS.RELEASE,
  scope: SCOPES.DOOMSDAY_OFFICIAL,
  skipWatched: true
};

/**
 * Render the Watch Plan page
 * @param {HTMLElement} container
 */
export function renderPlanPage(container) {
  const profile = store.getActiveProfile();
  const savedPlan = store.getPlan();
  const watchedMap = store.getWatchedMap();
  const catalogScope = store.getCatalogScope();

  // If active profile already has a saved plan and local state hasn't been modified yet
  if (savedPlan && planGeneratorState._synced !== profile.id) {
    planGeneratorState.order = savedPlan.order || ORDERS.RELEASE;
    planGeneratorState.scope = savedPlan.scope || SCOPES.DOOMSDAY_OFFICIAL;
    planGeneratorState.skipWatched = savedPlan.skipWatched !== false;
    planGeneratorState._synced = profile.id;
  } else if (!savedPlan && planGeneratorState._synced !== profile.id) {
    planGeneratorState.scope = store.getDoomsdayIncludeOptional()
      ? SCOPES.DOOMSDAY_OPTIONAL
      : SCOPES.DOOMSDAY_OFFICIAL;
    planGeneratorState._synced = profile.id;
  }

  // Calculate dynamic scope counts based on active catalog scope
  const officialCount = MOVIES.filter((m) => m.universe === 'Marvel' && m.doomsday === 'official').length;
  const optionalCount = MOVIES.filter((m) => m.universe === 'Marvel' && (m.doomsday === 'official' || m.doomsday === 'optional')).length;
  const marvelCount = MOVIES.filter((m) => isMovieInCatalogScope(m, catalogScope) && m.universe === 'Marvel').length;
  const dcCount = MOVIES.filter((m) => isMovieInCatalogScope(m, catalogScope) && m.universe === 'DC').length;
  const everythingCount = MOVIES.filter((m) => isMovieInCatalogScope(m, catalogScope)).length;

  // Generate live preview based on current state and catalog tier
  const planResult = generateWatchPlan({
    order: planGeneratorState.order,
    scope: planGeneratorState.scope,
    skipWatched: planGeneratorState.skipWatched,
    watchedMap,
    catalogScope
  });

  const isCurrentPlanSaved =
    savedPlan &&
    savedPlan.order === planGeneratorState.order &&
    savedPlan.scope === planGeneratorState.scope &&
    Boolean(savedPlan.skipWatched) === Boolean(planGeneratorState.skipWatched);

  const html = `
    <div class="page-plan">
      <!-- Plan Header -->
      <section class="plan-header" aria-labelledby="plan-header-title">
        <div class="plan-header-content">
          <span class="hero-badge">CURATED ROADMAPS</span>
          <h1 id="plan-header-title" class="page-title">Watch Plan Builder</h1>
          <p class="page-subtitle">
            Craft a personalized watch sequence tailored for your timeline. Your saved plan directly guides the "Up Next" tracker.
          </p>
        </div>

        ${
          savedPlan
            ? `
            <div class="active-plan-badge-card">
              <div class="active-badge-indicator">
                <span class="pulse-dot"></span>
                <strong>Active Saved Plan</strong>
              </div>
              <p class="active-badge-details">
                ${formatScopeName(savedPlan.scope)} • ${savedPlan.order === 'chronological' ? 'Chronological' : 'Release'} Order
              </p>
            </div>
          `
            : `
            <div class="no-plan-notice">
              <span>No plan saved yet for <strong>${escapeHtml(profile.name)}</strong>. Configure and click "Save as my plan" below.</span>
            </div>
          `
        }
      </section>

      <!-- Plan Configuration Controls -->
      <section class="plan-controls-card" aria-label="Watch Plan Options">
        <div class="plan-control-grid">
          <!-- 1. Catalog Scope Tier -->
          <div class="plan-control-group">
            <label class="control-group-title">1. Catalog Breadth Tier:</label>
            <div class="breadth-toggle-buttons" role="group" aria-label="Catalog Scope">
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
                title="Everything (199 titles)"
              >
                Everything
              </button>
            </div>
            <span class="control-help-text">
              Filters which titles are eligible for your plan sequence (${catalogScope.toUpperCase()} tier active).
            </span>
          </div>

          <!-- 2. Ordering Strategy -->
          <div class="plan-control-group">
            <label class="control-group-title">2. Watch Order:</label>
            <div class="radio-pill-group" role="radiogroup" aria-label="Watch Order">
              <label class="radio-pill ${planGeneratorState.order === ORDERS.RELEASE ? 'is-selected' : ''}">
                <input
                  type="radio"
                  name="plan-order"
                  value="${ORDERS.RELEASE}"
                  ${planGeneratorState.order === ORDERS.RELEASE ? 'checked' : ''}
                />
                <span class="radio-pill-text">Release Order</span>
              </label>

              <label class="radio-pill ${planGeneratorState.order === ORDERS.CHRONOLOGICAL ? 'is-selected' : ''}">
                <input
                  type="radio"
                  name="plan-order"
                  value="${ORDERS.CHRONOLOGICAL}"
                  ${planGeneratorState.order === ORDERS.CHRONOLOGICAL ? 'checked' : ''}
                />
                <span class="radio-pill-text">Chronological Order</span>
              </label>
            </div>
            <span class="control-help-text">
              ${
                planGeneratorState.order === ORDERS.CHRONOLOGICAL
                  ? 'Follows in-universe narrative timeline (Fox X-Men era first, then official MCU story arc, then other Marvel and DC canons).'
                  : 'Follows official theatrical/broadcast release sequence (or Disney+ priority order).'
              }
            </span>
          </div>

          <!-- 3. Scope Selection -->
          <div class="plan-control-group">
            <label class="control-group-title" for="plan-scope-select">3. Timeline Scope:</label>
            <select id="plan-scope-select" class="plan-scope-select" aria-label="Select Timeline Scope">
              <option value="${SCOPES.DOOMSDAY_OFFICIAL}" ${planGeneratorState.scope === SCOPES.DOOMSDAY_OFFICIAL ? 'selected' : ''}>
                Before Doomsday (Official Disney+ List - ${officialCount} titles)
              </option>
              <option value="${SCOPES.DOOMSDAY_OPTIONAL}" ${planGeneratorState.scope === SCOPES.DOOMSDAY_OPTIONAL ? 'selected' : ''}>
                Before Doomsday + Optional Picks (${optionalCount} titles)
              </option>
              <option value="${SCOPES.ALL_MARVEL}" ${planGeneratorState.scope === SCOPES.ALL_MARVEL ? 'selected' : ''}>
                All Marvel in Scope (${marvelCount} titles)
              </option>
              <option value="${SCOPES.ALL_DC}" ${planGeneratorState.scope === SCOPES.ALL_DC ? 'selected' : ''}>
                All DC in Scope (${dcCount} titles)
              </option>
              <option value="${SCOPES.EVERYTHING}" ${planGeneratorState.scope === SCOPES.EVERYTHING ? 'selected' : ''}>
                Everything in Scope (${everythingCount} titles)
              </option>
            </select>
          </div>

          <!-- 4. Skip Watched Toggle -->
          <div class="plan-control-group">
            <label class="control-group-title">4. Watched Filter:</label>
            <label class="toggle-control" for="toggle-skip-watched">
              <input
                type="checkbox"
                id="toggle-skip-watched"
                class="toggle-checkbox"
                ${planGeneratorState.skipWatched ? 'checked' : ''}
              />
              <span class="toggle-slider"></span>
              <span class="toggle-label">Skip titles I've already watched</span>
            </label>
            <span class="control-help-text">
              Hide completed titles from the active list. Uncheck to view the entire master sequence.
            </span>
          </div>
        </div>

        <!-- DC Chronology Note if applicable -->
        ${
          planResult.hasDcChronologyNote
            ? `
            <div class="dc-chronology-note" role="note">
              <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16" aria-hidden="true">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
              </svg>
              <span>Note: Chronology approximated by release order for DC titles.</span>
            </div>
          `
            : ''
        }

        <!-- Primary Plan Actions -->
        <div class="plan-actions-bar">
          <button
            type="button"
            class="btn btn-primary btn-lg"
            id="btn-save-plan"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18" aria-hidden="true">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
            </svg>
            ${isCurrentPlanSaved ? 'Plan Saved ✓' : 'Save as My Plan'}
          </button>

          ${
            savedPlan
              ? `
              <button
                type="button"
                class="btn btn-secondary btn-lg"
                id="btn-reset-plan"
                title="Clear current saved plan"
              >
                Reset Plan
              </button>
            `
              : ''
          }
        </div>
      </section>

      <!-- Live Preview Section -->
      <section class="section-container plan-preview-section" aria-labelledby="preview-section-title">
        <div class="section-header">
          <div class="section-title-wrap">
            <span class="section-kicker">LIVE PREVIEW</span>
            <h2 id="preview-section-title" class="section-title">
              Plan Sequence (${planResult.remainingCount} remaining of ${planResult.totalCount})
            </h2>
            <p class="section-desc">
              Rows are interactive. Check off any title in place to instantly update your progress and queue!
            </p>
          </div>
        </div>

        <div class="plan-table-container">
          ${renderPlanItemsList(planResult.items, watchedMap)}
        </div>
      </section>
    </div>
  `;

  container.innerHTML = html;

  // --- Attach Handlers ---

  // 1. Order radio change
  container.querySelectorAll('input[name="plan-order"]').forEach((radio) => {
    radio.addEventListener('change', (e) => {
      planGeneratorState.order = e.target.value;
      renderPlanPage(container);
    });
  });

  // 2. Scope select change
  const scopeSelect = container.querySelector('#plan-scope-select');
  if (scopeSelect) {
    scopeSelect.addEventListener('change', (e) => {
      planGeneratorState.scope = e.target.value;
      renderPlanPage(container);
    });
  }

  // 3. Skip watched toggle
  const skipWatchedToggle = container.querySelector('#toggle-skip-watched');
  if (skipWatchedToggle) {
    skipWatchedToggle.addEventListener('change', (e) => {
      planGeneratorState.skipWatched = e.target.checked;
      renderPlanPage(container);
    });
  }

  // 4. Save Plan Button
  const savePlanBtn = container.querySelector('#btn-save-plan');
  if (savePlanBtn) {
    savePlanBtn.addEventListener('click', () => {
      store.setPlan({
        order: planGeneratorState.order,
        scope: planGeneratorState.scope,
        skipWatched: planGeneratorState.skipWatched,
        ids: planResult.ids
      });
      announceLiveMessage('Saved watch plan successfully!');
      renderPlanPage(container);
    });
  }

  // 5. Reset Plan Button
  const resetPlanBtn = container.querySelector('#btn-reset-plan');
  if (resetPlanBtn) {
    resetPlanBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to reset your saved watch plan?')) {
        store.clearPlan();
        announceLiveMessage('Watch plan cleared.');
        renderPlanPage(container);
      }
    });
  }

  // 6. Breadth Tier Switcher in Plan Controls
  container.querySelectorAll('.plan-controls-card .btn-breadth-toggle').forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetScope = btn.getAttribute('data-scope');
      if (targetScope) {
        store.setCatalogScope(targetScope);
        renderPlanPage(container);
      }
    });
  });

  // 7. In-place checking of preview rows
  container.querySelectorAll('.btn-plan-row-toggle').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const movieId = btn.getAttribute('data-movie-id');
      const totalSeasons = parseInt(btn.getAttribute('data-total-seasons'), 10) || null;
      if (movieId) {
        const isWatched = store.toggleWatched(movieId, null, totalSeasons);
        const row = btn.closest('.plan-row');
        const title = row ? row.querySelector('.plan-row-title')?.textContent : movieId;
        announceLiveMessage(`Marked "${title}" as ${isWatched ? 'watched' : 'unwatched'}`);
        renderPlanPage(container);
      }
    });
  });
}

/**
 * Format scope identifier into human-readable label
 */
function formatScopeName(scope) {
  switch (scope) {
    case SCOPES.DOOMSDAY_OFFICIAL:
      return 'Before Doomsday (Official)';
    case SCOPES.DOOMSDAY_OPTIONAL:
      return 'Before Doomsday + Optional';
    case SCOPES.ALL_MARVEL:
      return 'All Marvel';
    case SCOPES.ALL_DC:
      return 'All DC';
    case SCOPES.EVERYTHING:
      return 'Everything';
    default:
      return scope;
  }
}

/**
 * Render preview table/list of plan rows
 */
function renderPlanItemsList(items, watchedMap) {
  if (items.length === 0) {
    return `
      <div class="empty-state">
        <p class="empty-state-title">No remaining titles in this plan sequence</p>
        <p class="empty-state-text">All titles in this scope have already been watched! Uncheck "Skip titles I've already watched" to view the full order.</p>
      </div>
    `;
  }

  return `
    <div class="plan-list" role="list">
      ${items.map((movie, index) => {
        const isWatched = store.isWatched(movie.id, movie.seasons);
        const isUpcoming = Boolean(movie.upcoming);
        const formattedRelease = formatReleaseDisplay(movie.release);

        return `
          <div
            class="plan-row ${isWatched ? 'is-watched' : ''} ${isUpcoming ? 'is-upcoming' : ''}"
            data-id="${escapeHtml(movie.id)}"
            role="listitem"
          >
            <div class="plan-row-number">${index + 1}</div>

            <div class="plan-row-main">
              <div class="plan-row-title-bar">
                <span class="plan-row-title">${escapeHtml(movie.title)}</span>
                <span class="badge ${movie.universe === 'Marvel' ? 'badge-marvel' : 'badge-dc'}">${escapeHtml(movie.universe)}</span>
                <span class="badge badge-franchise">${escapeHtml(movie.franchise.split('(')[0].trim())}</span>
                ${
                  movie.platform
                    ? `<span class="badge badge-platform">${escapeHtml(movie.platform)}</span>`
                    : ''
                }
                ${
                  movie.doomsday === 'official'
                    ? `<span class="badge badge-doomsday-official">Official #${movie.doomsdayOrder || ''}</span>`
                    : ''
                }
                ${
                  movie.doomsday === 'optional'
                    ? `<span class="badge badge-doomsday-optional" title="${escapeHtml(movie.doomsdayReason || '')}">Optional</span>`
                    : ''
                }
              </div>

              <div class="plan-row-meta">
                <span>${escapeHtml(formattedRelease)}</span>
                <span>•</span>
                <span>${escapeHtml(movie.era || 'Feature')}</span>
                <span>•</span>
                <span>${escapeHtml(movie.type === 'TV Series' && movie.seasons ? `${movie.seasons} Seasons` : movie.type)}</span>
                ${
                  movie.runtimeMin
                    ? `<span>•</span><span>${movie.runtimeMin}m</span>`
                    : ''
                }
                ${
                  movie.doomsday === 'optional' && movie.doomsdayReason
                    ? `<span class="plan-row-doomsday-reason" title="Reason before Doomsday">💡 ${escapeHtml(movie.doomsdayReason)}</span>`
                    : ''
                }
                ${
                  movie.notes
                    ? `<span class="plan-row-note-text" title="${escapeHtml(movie.notes)}">• ${escapeHtml(movie.notes)}</span>`
                    : ''
                }
              </div>
            </div>

            <div class="plan-row-action">
              ${
                isUpcoming
                  ? `<span class="coming-soon-label">Coming ${escapeHtml(formattedRelease)}</span>`
                  : `
                    <button
                      type="button"
                      class="btn-plan-row-toggle ${isWatched ? 'is-watched' : ''}"
                      data-movie-id="${escapeHtml(movie.id)}"
                      data-total-seasons="${movie.seasons || ''}"
                      role="checkbox"
                      aria-checked="${isWatched}"
                      aria-label="Mark ${escapeHtml(movie.title)} as ${isWatched ? 'unwatched' : 'watched'}"
                    >
                      <span class="checkbox-indicator" aria-hidden="true">
                        <svg class="check-icon" viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
                          <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                        </svg>
                      </span>
                      <span>${isWatched ? 'Watched' : 'Mark Watched'}</span>
                    </button>
                  `
              }
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}
