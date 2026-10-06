/**
 * MCU & DC Tracker - Watch Plan Page (#/plan)
 * Flat, comic-book editorial redesign.
 */

import { MOVIES } from '../data.js';
import { store } from '../store.js';
import { generateWatchPlan, isMovieInCatalogScope, SCOPES, ORDERS } from '../plan.js';
import { escapeHtml, formatReleaseDisplay, announceLiveMessage } from './card.js';

let planGeneratorState = {
  order: ORDERS.RELEASE,
  scope: SCOPES.DOOMSDAY_OFFICIAL,
  skipWatched: true
};

export function renderPlanPage(container) {
  const profile = store.getActiveProfile();
  const savedPlan = store.getPlan();
  const watchedMap = store.getWatchedMap();
  const catalogScope = store.getCatalogScope();

  if (savedPlan && planGeneratorState._synced !== profile.id) {
    planGeneratorState.order = savedPlan.order || ORDERS.RELEASE;
    planGeneratorState.scope = savedPlan.scope || SCOPES.DOOMSDAY_OFFICIAL;
    planGeneratorState.skipWatched = savedPlan.skipWatched !== false;
    planGeneratorState._synced = profile.id;
  } else if (!savedPlan && planGeneratorState._synced !== profile.id) {
    planGeneratorState.scope = store.getDoomsdayIncludeOptional() ? SCOPES.DOOMSDAY_OPTIONAL : SCOPES.DOOMSDAY_OFFICIAL;
    planGeneratorState._synced = profile.id;
  }

  const officialCount = MOVIES.filter((m) => m.universe === 'Marvel' && m.doomsday === 'official').length;
  const optionalCount = MOVIES.filter((m) => m.universe === 'Marvel' && (m.doomsday === 'official' || m.doomsday === 'optional')).length;
  const marvelCount = MOVIES.filter((m) => isMovieInCatalogScope(m, catalogScope) && m.universe === 'Marvel').length;
  const dcCount = MOVIES.filter((m) => isMovieInCatalogScope(m, catalogScope) && m.universe === 'DC').length;
  const everythingCount = MOVIES.filter((m) => isMovieInCatalogScope(m, catalogScope)).length;

  const planResult = generateWatchPlan({
    order: planGeneratorState.order,
    scope: planGeneratorState.scope,
    skipWatched: planGeneratorState.skipWatched,
    watchedMap,
    catalogScope
  });

  const prefs = store.getPrefs();
  const dailyWatchMin = prefs.dailyWatchMin || 60;

  let totalLeftMin = 0;
  for (const m of planResult.items) {
    if (m.upcoming) continue;
    if (store.isWatched(m.id, m.seasons)) continue;
    if (m.seasons && watchedMap[m.id]?.seasons && m.seasonsData) {
      for (const s of m.seasonsData) {
        if (!watchedMap[m.id].seasons.includes(s.n) && s.totalMin) totalLeftMin += s.totalMin;
      }
    } else {
      totalLeftMin += m.totalRuntimeMin || m.runtimeMin || 0;
    }
  }
  const finishDays = Math.ceil(totalLeftMin / dailyWatchMin) || 0;
  const finishDate = new Date();
  finishDate.setDate(finishDate.getDate() + finishDays);
  const summaryStr = `${planResult.remainingCount} titles &middot; ${fmtDuration(totalLeftMin)} &middot; finish by ${finishDate.toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'})} at ${dailyWatchMin} min/day`;

  const isCurrentPlanSaved = savedPlan && savedPlan.order === planGeneratorState.order && savedPlan.scope === planGeneratorState.scope && Boolean(savedPlan.skipWatched) === Boolean(planGeneratorState.skipWatched);

  const html = `
    <div class="page-plan" style="max-width: 1000px; margin: 0 auto; padding-top: 16px; border-top: 4px solid var(--text);">
      <h1 class="display-font" style="font-size: 48px; margin-bottom: 24px;">WATCH PLAN BUILDER</h1>
      
      ${savedPlan 
        ? `<div style="background: var(--text); color: var(--bg); padding: 12px 16px; font-weight: bold; margin-bottom: 32px; display:inline-block;">ACTIVE PLAN: ${formatScopeName(savedPlan.scope).toUpperCase()} (${savedPlan.order.toUpperCase()})</div>`
        : `<div style="margin-bottom: 32px; padding: 12px; border: 2px dashed var(--border);">No active plan saved yet.</div>`
      }

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px; margin-bottom: 40px; padding: 24px; border: 2px solid var(--border); background: var(--surface);">
        <div>
          <strong style="display:block; margin-bottom: 8px;">1. CATALOG SCOPE</strong>
          <div style="display:flex; gap:8px;">
            <button class="btn btn-sm btn-breadth-toggle ${catalogScope === 'core' ? 'btn-primary' : ''}" data-scope="core">Core</button>
            <button class="btn btn-sm btn-breadth-toggle ${catalogScope === 'extended' ? 'btn-primary' : ''}" data-scope="extended">+ Extended</button>
            <button class="btn btn-sm btn-breadth-toggle ${catalogScope === 'everything' ? 'btn-primary' : ''}" data-scope="everything">Everything</button>
          </div>
        </div>
        
        <div>
          <strong style="display:block; margin-bottom: 8px;">2. ORDER</strong>
          <div style="display:flex; gap:8px;">
            <label><input type="radio" name="plan-order" value="${ORDERS.RELEASE}" ${planGeneratorState.order === ORDERS.RELEASE ? 'checked' : ''}> Release</label>
            <label><input type="radio" name="plan-order" value="${ORDERS.CHRONOLOGICAL}" ${planGeneratorState.order === ORDERS.CHRONOLOGICAL ? 'checked' : ''}> Chronological</label>
          </div>
        </div>

        <div>
          <strong style="display:block; margin-bottom: 8px;">3. TIMELINE SCOPE</strong>
          <select id="plan-scope-select" style="width: 100%; padding: 8px; border: 2px solid var(--border); background: var(--surface); color: var(--text); font-family: inherit;">
            <option value="${SCOPES.DOOMSDAY_OFFICIAL}" ${planGeneratorState.scope === SCOPES.DOOMSDAY_OFFICIAL ? 'selected' : ''}>Before Doomsday (Official) - ${officialCount}</option>
            <option value="${SCOPES.DOOMSDAY_OPTIONAL}" ${planGeneratorState.scope === SCOPES.DOOMSDAY_OPTIONAL ? 'selected' : ''}>Before Doomsday + Optional - ${optionalCount}</option>
            <option value="${SCOPES.ALL_MARVEL}" ${planGeneratorState.scope === SCOPES.ALL_MARVEL ? 'selected' : ''}>All Marvel - ${marvelCount}</option>
            <option value="${SCOPES.ALL_DC}" ${planGeneratorState.scope === SCOPES.ALL_DC ? 'selected' : ''}>All DC - ${dcCount}</option>
            <option value="${SCOPES.EVERYTHING}" ${planGeneratorState.scope === SCOPES.EVERYTHING ? 'selected' : ''}>Everything - ${everythingCount}</option>
          </select>
        </div>

        <div>
          <strong style="display:block; margin-bottom: 8px;">4. FILTER</strong>
          <label><input type="checkbox" id="toggle-skip-watched" ${planGeneratorState.skipWatched ? 'checked' : ''}> Skip watched titles</label>
        </div>
      </div>

      <div style="display: flex; gap: 16px; margin-bottom: 40px;">
        <button type="button" class="btn ${isCurrentPlanSaved ? '' : 'btn-primary'} btn-lg" id="btn-save-plan">${isCurrentPlanSaved ? 'Plan Saved ✓' : 'Save as My Plan'}</button>
        ${savedPlan ? `<button type="button" class="btn btn-secondary btn-lg" id="btn-reset-plan">Reset Plan</button>` : ''}
      </div>

      <div style="display: flex; justify-content: space-between; align-items: baseline; border-bottom: 4px solid var(--border); margin-bottom: 16px;">
        <h2 class="display-font" style="font-size: 32px; margin: 0;">LIVE PREVIEW</h2>
        <span style="font-weight: bold;">${summaryStr}</span>
      </div>
      ${renderPlanItemsList(planResult.items, watchedMap, dailyWatchMin)}
    </div>
  `;

  container.innerHTML = html;

  container.querySelectorAll('input[name="plan-order"]').forEach((radio) => {
    radio.addEventListener('change', (e) => {
      planGeneratorState.order = e.target.value;
      renderPlanPage(container);
    });
  });

  const scopeSelect = container.querySelector('#plan-scope-select');
  if (scopeSelect) {
    scopeSelect.addEventListener('change', (e) => {
      planGeneratorState.scope = e.target.value;
      renderPlanPage(container);
    });
  }

  const skipWatchedToggle = container.querySelector('#toggle-skip-watched');
  if (skipWatchedToggle) {
    skipWatchedToggle.addEventListener('change', (e) => {
      planGeneratorState.skipWatched = e.target.checked;
      renderPlanPage(container);
    });
  }

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

  container.querySelectorAll('.btn-breadth-toggle').forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetScope = btn.getAttribute('data-scope');
      if (targetScope) {
        store.setCatalogScope(targetScope);
        renderPlanPage(container);
      }
    });
  });

  container.querySelectorAll('.btn-plan-row-toggle').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const movieId = btn.getAttribute('data-movie-id');
      const totalSeasons = parseInt(btn.getAttribute('data-total-seasons'), 10) || null;
      if (movieId) {
        store.toggleWatched(movieId, null, totalSeasons);
        renderPlanPage(container);
      }
    });
  });
}

function formatScopeName(scope) {
  switch (scope) {
    case SCOPES.DOOMSDAY_OFFICIAL: return 'Before Doomsday (Official)';
    case SCOPES.DOOMSDAY_OPTIONAL: return 'Before Doomsday + Optional';
    case SCOPES.ALL_MARVEL: return 'All Marvel';
    case SCOPES.ALL_DC: return 'All DC';
    case SCOPES.EVERYTHING: return 'Everything';
    default: return scope;
  }
}

function renderPlanItemsList(items, watchedMap, dailyWatchMin) {
  if (items.length === 0) return '<p>No remaining titles in this plan sequence.</p>';

  let cumulativeMin = 0;

  return `
    <div style="display:flex; flex-direction:column; gap:8px;">
      ${items.map((movie, index) => {
        const isWatched = store.isWatched(movie.id, movie.seasons);
        let runtime = 0;

        if (!movie.upcoming && !isWatched) {
           if (movie.seasons && watchedMap[movie.id]?.seasons && movie.seasonsData) {
             for (const s of movie.seasonsData) {
               if (!watchedMap[movie.id].seasons.includes(s.n) && s.totalMin) runtime += s.totalMin;
             }
           } else {
             runtime = movie.totalRuntimeMin || movie.runtimeMin || 0;
           }
        }
        cumulativeMin += runtime;
        
        let dayStr = "";
        if (runtime > 0 && dailyWatchMin > 0) {
           const dayN = Math.ceil(cumulativeMin / dailyWatchMin);
           dayStr = ` • Day ${dayN}`;
        }
        
        const runtimeText = runtime > 0 ? fmtDuration(runtime) : 'TBA';

        return `
          <div style="display:flex; align-items:center; gap:16px; padding:12px; border:2px solid var(--border); background:var(--surface);">
            <div style="font-family:'Bebas Neue', sans-serif; font-size:24px; min-width:32px;">${index + 1}</div>
            <div style="flex-grow:1;">
              <strong style="display:block; font-size:18px;">${escapeHtml(movie.title)}</strong>
              <div style="font-size:12px; color:var(--muted); text-transform:uppercase;">
                ${escapeHtml(movie.universe)} • ${escapeHtml(movie.franchise.split('(')[0].trim())} • ${escapeHtml(formatReleaseDisplay(movie.release))} • ${runtimeText}${dayStr}
              </div>
            </div>
            <div>
              ${!movie.upcoming ? `<button class="btn btn-sm btn-plan-row-toggle ${isWatched ? '' : 'btn-primary'}" data-movie-id="${escapeHtml(movie.id)}">${isWatched ? 'Watched ✓' : 'Mark Watched'}</button>` : '<span class="badge">Upcoming</span>'}
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}
