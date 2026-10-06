/**
 * MCU & DC Tracker - My Progress Page (#/progress)
 * Flat, comic-book editorial redesign.
 */

import { MOVIES } from '../data.js';
import { store } from '../store.js';
import { getUpNextFromPlan, isMovieInCatalogScope } from '../plan.js';
import { renderCardHtml, attachCardListeners, observeLazyPosters, escapeHtml, formatReleaseDisplay } from './card.js';
import { applyFilters, renderFiltersHtml, attachFilterListeners } from './filters.js';

const DOOMSDAY_TARGET_DATE = new Date('2026-12-18T00:00:00Z');

export function renderProgressPage(container) {
  const profile = store.getActiveProfile();
  const watchedMap = store.getWatchedMap();
  const plan = store.getPlan();
  const catalogScope = store.getCatalogScope();

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

  const doomsdayIncludeOptional = store.getDoomsdayIncludeOptional();
  const doomsdayOfficial = MOVIES.filter((m) => m.universe === 'Marvel' && m.doomsday === 'official');
  const doomsdayOptional = MOVIES.filter((m) => m.universe === 'Marvel' && m.doomsday === 'optional');
  const doomsdayList = doomsdayIncludeOptional ? [...doomsdayOfficial, ...doomsdayOptional] : doomsdayOfficial;
  const doomsdayWatched = doomsdayList.filter((m) => store.isWatched(m.id, m.seasons)).length;
  const doomsdayLeft = Math.max(0, doomsdayList.length - doomsdayWatched);
  const doomsdayPct = Math.round((doomsdayWatched / doomsdayList.length) * 100);

  const msRemaining = DOOMSDAY_TARGET_DATE.getTime() - new Date().getTime();
  const daysRemaining = Math.max(0, Math.ceil(msRemaining / (1000 * 60 * 60 * 24)));

  const watchedMovies = [];
  for (const [id, info] of Object.entries(watchedMap)) {
    const movie = MOVIES.find((m) => m.id === id);
    if (movie) watchedMovies.push({ ...movie, watchedAt: info.watchedAt || new Date().toISOString() });
  }
  watchedMovies.sort((a, b) => new Date(b.watchedAt).getTime() - new Date(a.watchedAt).getTime());

  const upNextState = getUpNextFromPlan(plan, watchedMap, MOVIES);

  const unwatchedList = moviesInScope.filter((m) => !store.isWatched(m.id, m.seasons));
  const prefs = store.getPrefs();
  const unwatchedFiltered = applyFilters(unwatchedList, { ...prefs.filters, status: 'all', catalogScope });

  const groupedUnwatched = { Marvel: {}, DC: {} };
  for (const movie of unwatchedFiltered) {
    const u = movie.universe;
    const f = movie.franchise;
    if (!groupedUnwatched[u]) groupedUnwatched[u] = {};
    if (!groupedUnwatched[u][f]) groupedUnwatched[u][f] = [];
    groupedUnwatched[u][f].push(movie);
  }

  const html = `
    <div class="page-progress">
      <section class="section-container" style="border-top: 4px solid var(--text); padding-top: 16px;">
        <h1 class="display-font" style="font-size: 48px; margin-bottom: 24px;">PROGRESS: ${escapeHtml(profile.name)}</h1>
        
        <div style="display: flex; gap: 8px; margin-bottom: 24px;">
          <span style="font-weight: bold; align-self: center;">CATALOG:</span>
          <button class="btn btn-sm ${catalogScope === 'core' ? 'btn-primary' : ''}" data-scope="core">Core</button>
          <button class="btn btn-sm ${catalogScope === 'extended' ? 'btn-primary' : ''}" data-scope="extended">+ Extended</button>
          <button class="btn btn-sm ${catalogScope === 'everything' ? 'btn-primary' : ''}" data-scope="everything">Everything</button>
        </div>

        <div class="progress-strip">
          <div class="progress-item">
            <div class="progress-item-header">
              <span class="progress-item-title">Total</span>
              <span class="progress-item-val">${watchedInScope}<span class="progress-item-pct"> / ${totalCount}</span></span>
            </div>
            <div class="progress-bar-wrap"><div class="progress-bar-fill fill-text" style="width:${overallPct}%"></div></div>
          </div>
          <div class="progress-item">
            <div class="progress-item-header">
              <span class="progress-item-title">Marvel</span>
              <span class="progress-item-val">${marvelWatched}<span class="progress-item-pct"> / ${marvelList.length}</span></span>
            </div>
            <div class="progress-bar-wrap"><div class="progress-bar-fill" style="width:${marvelPct}%"></div></div>
          </div>
          <div class="progress-item">
            <div class="progress-item-header">
              <span class="progress-item-title">DC</span>
              <span class="progress-item-val">${dcWatched}<span class="progress-item-pct"> / ${dcList.length}</span></span>
            </div>
            <div class="progress-bar-wrap"><div class="progress-bar-fill fill-dc" style="width:${dcPct}%"></div></div>
          </div>
        </div>

        <div style="border: 2px solid var(--border); padding: 16px; margin-bottom: 32px; background: var(--surface)">
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <strong>BEFORE DOOMSDAY: ${doomsdayLeft} LEFT (${daysRemaining} DAYS)</strong>
            <div style="display:flex; gap:8px;">
              <button class="btn btn-sm ${!doomsdayIncludeOptional ? 'btn-primary' : ''}" id="progress-doomsday-official">Official</button>
              <button class="btn btn-sm ${doomsdayIncludeOptional ? 'btn-primary' : ''}" id="progress-doomsday-optional">+ Optional</button>
            </div>
          </div>
          <div class="progress-bar-wrap"><div class="progress-bar-fill fill-gold" style="width: ${doomsdayPct}%"></div></div>
        </div>
      </section>

      <section class="section-container">
        <div class="section-hd">
          <div class="section-hd-left">
            <h2 class="section-title">ACTIVE QUEUE</h2>
          </div>
        </div>
        ${renderUpNextContent(upNextState)}
      </section>

      <section class="section-container">
        <div class="section-hd">
          <div class="section-hd-left">
            <h2 class="section-title">WATCHED HISTORY (${watchedMovies.length})</h2>
          </div>
        </div>
        ${renderWatchedList(watchedMovies)}
      </section>

      <section class="section-container">
        <div class="section-hd">
          <div class="section-hd-left">
            <h2 class="section-title">UNWATCHED BACKLOG (${unwatchedList.length})</h2>
          </div>
        </div>
        <div id="unwatched-filter-controls" style="margin-bottom: 24px;">
          ${renderFiltersHtml(prefs.filters, unwatchedList.length, unwatchedFiltered.length, { showViewToggle: false })}
        </div>
        ${renderGroupedUnwatched(groupedUnwatched)}
      </section>
    </div>
  `;

  container.innerHTML = html;

  observeLazyPosters(container);
  attachCardListeners(container);

  container.querySelectorAll('button[data-scope]').forEach((btn) => {
    btn.addEventListener('click', () => {
      store.setCatalogScope(btn.getAttribute('data-scope'));
      renderProgressPage(container);
    });
  });

  const progOfficialBtn = container.querySelector('#progress-doomsday-official');
  if (progOfficialBtn) progOfficialBtn.addEventListener('click', () => { store.setDoomsdayIncludeOptional(false); renderProgressPage(container); });

  const progOptionalBtn = container.querySelector('#progress-doomsday-optional');
  if (progOptionalBtn) progOptionalBtn.addEventListener('click', () => { store.setDoomsdayIncludeOptional(true); renderProgressPage(container); });

  container.querySelectorAll('.btn-queue-watch').forEach((btn) => {
    btn.addEventListener('click', () => {
      store.toggleWatched(btn.getAttribute('data-movie-id'));
      renderProgressPage(container);
    });
  });

  container.querySelectorAll('.btn-undo-watch').forEach((btn) => {
    btn.addEventListener('click', () => {
      store.toggleWatched(btn.getAttribute('data-movie-id'));
      renderProgressPage(container);
    });
  });

  const filterControlsEl = container.querySelector('#unwatched-filter-controls');
  if (filterControlsEl) {
    attachFilterListeners(filterControlsEl, () => renderProgressPage(container));
  }
}

function renderUpNextContent(upNextState) {
  if (!upNextState.hasPlan) return '<a href="#/plan" class="btn btn-primary">Create a Watch Plan to populate this queue</a>';
  if (upNextState.isPlanComplete) return '<p>Plan Complete!</p><a href="#/plan" class="btn btn-secondary">Create a New Plan</a>';
  
  const current = upNextState.current;
  const queue = upNextState.queue;

  return `
    <div style="display: grid; grid-template-columns: 1fr; gap: 24px;">
      <div>
        <h3 style="font-family: 'Bebas Neue', sans-serif; font-size: 24px; margin-bottom: 16px;">🎯 TARGET</h3>
        <div style="max-width: 200px;">
          ${renderCardHtml(current)}
        </div>
      </div>
      <div>
        <h3 style="font-family: 'Bebas Neue', sans-serif; font-size: 24px; margin-bottom: 16px;">ON DECK</h3>
        <div style="display:flex; flex-direction: column; gap: 8px;">
          ${queue.map(m => `
            <div style="border: 2px solid var(--border); padding: 12px; display: flex; justify-content: space-between; align-items: center; background: var(--surface);">
              <div><strong>${escapeHtml(m.title)}</strong> <span style="font-size: 12px; color: var(--muted); margin-left: 8px;">${escapeHtml(formatReleaseDisplay(m.release))}</span></div>
              ${!m.upcoming ? `<button class="btn btn-sm btn-queue-watch" data-movie-id="${escapeHtml(m.id)}">Watch</button>` : '<span class="badge">Upcoming</span>'}
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

function renderWatchedList(watchedMovies) {
  if (watchedMovies.length === 0) return '<p>No watched titles yet.</p>';
  return `
    <div class="grid-container">
      ${watchedMovies.map(m => `
        <div style="border: 2px solid var(--border); background: var(--surface); display: flex; flex-direction: column;">
          <div style="padding: 12px; border-bottom: 2px solid var(--border);">
            <strong style="display:block; font-size: 14px; margin-bottom:4px;">${escapeHtml(m.title)}</strong>
            <span style="font-size:12px; color:var(--muted)">${escapeHtml(new Date(m.watchedAt).toLocaleDateString())}</span>
          </div>
          <button class="btn btn-sm btn-undo-watch" style="border: none; border-radius: 0; width: 100%;" data-movie-id="${escapeHtml(m.id)}">Undo</button>
        </div>
      `).join('')}
    </div>
  `;
}

function renderGroupedUnwatched(groupedUnwatched) {
  const universes = Object.keys(groupedUnwatched);
  let html = '';
  universes.forEach(universe => {
    const franchises = groupedUnwatched[universe];
    const franchiseKeys = Object.keys(franchises);
    if (franchiseKeys.length === 0) return;
    
    html += `<div style="margin-bottom: 40px;"><h3 class="display-font" style="font-size: 32px; border-bottom: 4px solid var(--border); margin-bottom: 16px;">${universe}</h3>`;
    
    franchiseKeys.forEach(franchise => {
      const movies = franchises[franchise];
      if (movies.length === 0) return;
      html += `
        <h4 style="margin: 24px 0 16px; font-weight: bold; text-transform: uppercase;">${escapeHtml(franchise)}</h4>
        <div class="grid-container">
          ${movies.map(m => renderCardHtml(m)).join('')}
        </div>
      `;
    });
    html += `</div>`;
  });

  return html || '<p>No unwatched titles match filters.</p>';
}
