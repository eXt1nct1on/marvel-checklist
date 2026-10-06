/**
 * MCU & DC Tracker — Home Page (#/home)
 * Flat comic-editorial redesign.
 * All class names match css/style.css exactly.
 */

import { MOVIES } from '../data.js';
import { store } from '../store.js';
import { isMovieInCatalogScope } from '../plan.js';
import { POSTERS } from '../posters.js';
import { renderCardHtml, attachCardListeners, observeLazyPosters, escapeHtml } from './card.js';
import { initSlider } from './slider.js';
import { applyFilters, renderFiltersHtml, attachFilterListeners } from './filters.js';
import { fmtDuration, fmtApprox } from '../time.js';

const DOOMSDAY_DATE = new Date('2026-12-18T00:00:00Z');
let _cdInterval = null;

/* ─── Countdown ───────────────────────────────────── */
function getCountdownParts() {
  const diff = Math.max(0, DOOMSDAY_DATE.getTime() - Date.now());
  return {
    days:    Math.floor(diff / 86400000),
    hours:   Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
    isPast: diff <= 0
  };
}

export function updateHeroRight() {
  const container = document.getElementById('hero-right-container');
  if (!container) return;
  const cd = getCountdownParts();
  
  if (cd.isPast) {
    container.innerHTML = `<div class="cd-row-label">Doomsday is out</div>`;
    return;
  }

  // Row 1: Ticking countdown
  const row1 = `
    <div class="cd-row-wrap" aria-live="polite">
      <div class="cd-row-label">TIME UNTIL DOOMSDAY</div>
      <div class="hero-countdown" role="timer">
        <div class="cd-unit"><span id="cd-days" class="cd-num">${cd.days}</span><span class="cd-label">DAYS</span></div>
        <div class="cd-unit"><span id="cd-hours" class="cd-num">${String(cd.hours).padStart(2,'0')}</span><span class="cd-label">HRS</span></div>
        <div class="cd-unit"><span id="cd-minutes" class="cd-num">${String(cd.minutes).padStart(2,'0')}</span><span class="cd-label">MIN</span></div>
        <div class="cd-unit"><span id="cd-seconds" class="cd-num">${String(cd.seconds).padStart(2,'0')}</span><span class="cd-label">SEC</span></div>
      </div>
    </div>
  `;

  // Row 2: Watch time left
  const includeOptional = store.getDoomsdayIncludeOptional();
  const official = MOVIES.filter(m => m.universe === 'Marvel' && m.doomsday === 'official');
  const optional = MOVIES.filter(m => m.universe === 'Marvel' && m.doomsday === 'optional');
  const doomsdayList = includeOptional ? [...official, ...optional] : official;

  let totalLeft = 0;
  let missingDataCount = 0;
  let hasApprox = false;

  doomsdayList.forEach(m => {
    // Exclude unreleased titles from the main count
    if (m.upcoming) return;
    const isWatched = store.isWatched(m.id, m.seasons);
    if (!isWatched) {
      if (m.totalRuntimeMin) {
        totalLeft += m.totalRuntimeMin;
        if (m.runtimeApprox) hasApprox = true;
      } else {
        missingDataCount++;
      }
    }
  });

  const hoursLeft = Math.floor(totalLeft / 60);
  const minsLeft = totalLeft % 60;
  
  let prefix = '';
  if (hasApprox || missingDataCount > 0) prefix = '~';
  
  const tooltip = missingDataCount > 0 ? ` title="${missingDataCount} titles have no runtime data yet"` : '';

  const row2 = `
    <div class="cd-row-wrap" aria-live="polite" ${tooltip}>
      <div class="cd-row-label">WATCH TIME LEFT</div>
      <div class="hero-countdown watch-time-left">
        <div class="cd-unit"><span class="cd-num">${prefix}${hoursLeft}</span><span class="cd-label">HRS</span></div>
        <div class="cd-unit"><span class="cd-num">${String(minsLeft).padStart(2,'0')}</span><span class="cd-label">MIN</span></div>
      </div>
    </div>
  `;

  // Row 3: Pace
  const dailyWatchMin = store.getDailyWatchMin();
  const paceDays = Math.ceil(totalLeft / dailyWatchMin);
  const finishDate = new Date();
  finishDate.setDate(finishDate.getDate() + paceDays);
  
  const reqMin = Math.ceil(totalLeft / Math.max(1, cd.days));
  
  let paceMsg = '';
  if (totalLeft === 0) {
    paceMsg = 'All caught up.';
  } else if (finishDate <= DOOMSDAY_DATE) {
    const diffDays = Math.max(0, Math.floor((DOOMSDAY_DATE - finishDate) / 86400000));
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const formatted = `${months[finishDate.getMonth()]} ${finishDate.getDate()}`;
    paceMsg = `At ${dailyWatchMin} min/day you finish on ${formatted}, ${diffDays} days before Doomsday.`;
  } else {
    paceMsg = `You need at least ${reqMin} min/day to finish in time.`;
  }

  const row3 = `<div class="cd-pace-msg">${paceMsg}</div>`;

  container.innerHTML = row1 + row2 + row3;
}

/* ─── Progress strip item ─────────────────────────── */
function renderProgressItem(label, watched, total, fillClass) {
  const pct = total > 0 ? Math.min(100, Math.round((watched / total) * 100)) : 0;
  return `
    <div class="progress-item">
      <div class="progress-item-header">
        <span class="progress-item-title">${label}</span>
        <span class="progress-item-val">${watched}<span class="progress-item-pct"> / ${total}</span></span>
      </div>
      <div class="progress-bar-wrap">
        <div class="progress-bar-fill ${fillClass}" style="width:${pct}%"></div>
      </div>
    </div>
  `;
}

/* ─── Before Doomsday items ──────────────────────── */
function getDoomsdayItems(includeOptional) {
  const official = MOVIES.filter(m => m.universe === 'Marvel' && m.doomsday === 'official');
  if (!includeOptional) return official.sort((a, b) => (a.doomsdayOrder ?? 99) - (b.doomsdayOrder ?? 99));
  const optional = MOVIES.filter(m => m.universe === 'Marvel' && m.doomsday === 'optional');
  return [...official, ...optional].sort((a, b) => (a.releaseOrder ?? 0) - (b.releaseOrder ?? 0));
}

/* ─── Up Next panel ──────────────────────────────── */
function renderUpNextPanel(plan) {
  if (!plan || !plan.ids || plan.ids.length === 0) {
    return `
      <div class="up-next-panel">
        <div class="up-next-empty">
          <p style="color:var(--muted);font-size:14px;">No watch plan yet — build one to see what's up next.</p>
          <a href="#/plan" class="btn btn-primary btn-sm">CREATE A WATCH PLAN</a>
        </div>
      </div>
    `;
  }

  // Find first unwatched item in plan
  const nextId = plan.ids.find(id => {
    const m = MOVIES.find(x => x.id === id);
    return m && !store.isWatched(id, m.seasons);
  });
  if (!nextId) {
    return `
      <div class="up-next-panel">
        <div class="up-next-empty">
          <p style="color:var(--muted);font-size:14px;">Plan complete! All titles watched.</p>
          <a href="#/plan" class="btn btn-sm">MANAGE PLAN</a>
        </div>
      </div>
    `;
  }

  const movie = MOVIES.find(m => m.id === nextId);
  if (!movie) return '';

  const posterEntry = POSTERS[movie.id];
  const posterHtml = posterEntry?.posterPath
    ? `<img class="up-next-thumb" src="https://image.tmdb.org/t/p/w185${posterEntry.posterPath}"
          alt="Poster for ${escapeHtml(movie.title)}" loading="lazy" decoding="async"
          referrerpolicy="no-referrer" width="96" height="96" />`
    : `<div class="up-next-thumb" style="background:var(${movie.universe === 'Marvel' ? '--red' : '--dc-blue'});display:flex;align-items:center;justify-content:center;font-family:'Bebas Neue',sans-serif;font-size:18px;color:#fff;">${escapeHtml(movie.title.substring(0,3).toUpperCase())}</div>`;

  return `
    <div class="up-next-panel">
      ${posterHtml}
      <div class="up-next-info">
        <p class="up-next-title">${escapeHtml(movie.title)}</p>
        <p class="up-next-meta">${escapeHtml(movie.franchise || '')} · ${escapeHtml(movie.release || 'TBA')}</p>
      </div>
      <div class="up-next-actions">
        <button type="button" class="btn btn-primary btn-sm" data-upnext-watch="${escapeHtml(movie.id)}" data-total-seasons="${movie.seasons || ''}">
          MARK AS WATCHED
        </button>
        <button type="button" class="btn btn-sm" data-upnext-open="${escapeHtml(movie.id)}">OPEN</button>
      </div>
    </div>
  `;
}

/* ─── Card rail HTML ─────────────────────────────── */
function renderRailHtml({ id, items, isGrid = false, priorityCount = 0 }) {
  const cardsHtml = items.map((m, i) => {
    const cardHtml = renderCardHtml(m, { priority: i < priorityCount });
    return isGrid
      ? cardHtml
      : `<div class="card-rail-item">${cardHtml}</div>`;
  }).join('');

  if (isGrid) {
    return `<div class="card-grid" id="${id}-track" role="group" aria-label="Titles">${cardsHtml}</div>`;
  }

  return `
    <div id="${id}-wrapper" style="position:relative;">
      <div class="card-rail" id="${id}-track" tabindex="0" role="group">
        ${cardsHtml}
      </div>
    </div>
  `;
}

/* ─── Progress strip update (targeted, no re-render) ─ */
function updateProgressStrip() {
  const includeOptional = store.getDoomsdayIncludeOptional();
  const catalogScope = store.getCatalogScope();
  const moviesInScope = MOVIES.filter(m => isMovieInCatalogScope(m, catalogScope));

  const official = MOVIES.filter(m => m.universe === 'Marvel' && m.doomsday === 'official');
  const optional = MOVIES.filter(m => m.universe === 'Marvel' && m.doomsday === 'optional');
  const doomsdayList = includeOptional ? [...official, ...optional] : official;
  const doomsdayWatched = doomsdayList.filter(m => store.isWatched(m.id, m.seasons)).length;

  const marvelList = moviesInScope.filter(m => m.universe === 'Marvel');
  const marvelWatched = marvelList.filter(m => store.isWatched(m.id, m.seasons)).length;

  const dcList = moviesInScope.filter(m => m.universe === 'DC');
  const dcWatched = dcList.filter(m => store.isWatched(m.id, m.seasons)).length;

  let totalMin = 0;
  let watchedMin = 0;
  let missingCount = 0;
  doomsdayList.forEach(m => {
    if (m.upcoming) return;
    if (m.totalRuntimeMin) {
      totalMin += m.totalRuntimeMin;
      if (store.isWatched(m.id, m.seasons)) watchedMin += m.totalRuntimeMin;
    } else {
      missingCount++;
    }
  });
  const leftMin = Math.max(0, totalMin - watchedMin);
  
  const descEl = document.querySelector('#hd-doomsday + .section-desc');
  if (descEl) {
    let t = `Total ${fmtDuration(totalMin)} &middot; Watched ${fmtDuration(watchedMin)} &middot; Left ${fmtDuration(leftMin)}`;
    if (missingCount > 0) t += ` <span title="${missingCount} titles missing runtime data">(~approx)</span>`;
    descEl.innerHTML = t;
  }

  const strip = document.getElementById('home-progress-strip');
  if (!strip) return;

  const doomsdayLabel = includeOptional ? 'DOOMSDAY (+OPT)' : 'DOOMSDAY';
  strip.innerHTML =
    renderProgressItem(doomsdayLabel, doomsdayWatched, doomsdayList.length, 'fill-gold') +
    renderProgressItem(`MARVEL · ${catalogScope.toUpperCase()}`, marvelWatched, marvelList.length, '') +
    renderProgressItem(`DC · ${catalogScope.toUpperCase()}`, dcWatched, dcList.length, 'fill-dc');
}

/* ─── Subscribe for targeted updates ─────────────── */
store.subscribe((action) => {
  if (action === 'watched_toggle' || action === 'doomsday_toggle' || action === 'daily_watch_min_changed') {
    updateProgressStrip();
    updateHeroRight();
  }
});

/* ─── Main render ────────────────────────────────── */
export function renderHomePage(container) {
  if (_cdInterval) { clearInterval(_cdInterval); _cdInterval = null; }

  const prefs = store.getPrefs();
  const includeOptional = store.getDoomsdayIncludeOptional();
  const catalogScope = store.getCatalogScope();
  const moviesInScope = MOVIES.filter(m => isMovieInCatalogScope(m, catalogScope));
  const plan = store.getPlan();

  const cd = getCountdownParts();

  const sliderAItems = getDoomsdayItems(includeOptional);
  const sliderAHtml = renderRailHtml({ id: 'slider-a', items: sliderAItems, priorityCount: 8 });

  const DOOMSDAY_TARGET_DATE = new Date('2026-12-18T00:00:00Z');
  const upcomingRailItems = MOVIES.filter(m => m.upcoming && new Date(m.release) < DOOMSDAY_TARGET_DATE && isMovieInCatalogScope(m, catalogScope))
                                  .sort((a, b) => new Date(a.release) - new Date(b.release));
  const upcomingRailHtml = upcomingRailItems.length > 0 
    ? renderRailHtml({ id: 'slider-upcoming', items: upcomingRailItems, priorityCount: 4 })
    : `<div class="empty-state" style="padding: 24px; text-align: center; border: 2px dashed var(--border); color: var(--muted);">No upcoming titles before Doomsday.</div>`;

  const filteredItems = applyFilters(MOVIES, prefs.filters);
  const isGrid = prefs.filters?.view === 'grid';
  const sliderBHtml = filteredItems.length > 0
    ? renderRailHtml({ id: 'slider-b', items: filteredItems, isGrid, priorityCount: 0 })
    : `<div class="empty-state">No titles match your filters. <button class="btn btn-sm" id="btn-empty-reset">Reset Filters</button></div>`;

  const officialCount = MOVIES.filter(m => m.universe === 'Marvel' && m.doomsday === 'official').length;
  const optionalCount = MOVIES.filter(m => m.universe === 'Marvel' && m.doomsday === 'optional').length;

  container.innerHTML = `
    <div class="page-home">

      <!-- ── HERO BAND (full-bleed) ── -->
      <div class="hero-band">
        <div class="hero-band-inner">
          <div class="hero-left">
            <span class="hero-kicker">AVENGERS: DOOMSDAY · DEC 18, 2026</span>
            <h1 class="hero-title">AVENGERS:<br>DOOMSDAY</h1>
            <p class="hero-subtitle">Track every title before the final battle.</p>
          </div>
          <div class="hero-right" id="hero-right-container">
            <!-- populated by updateHeroRight() -->
          </div>
        </div>
      </div>

      <!-- ── PROGRESS STRIP ── -->
      <div class="progress-strip" id="home-progress-strip">
        <!-- populated by updateProgressStrip() -->
      </div>

      <!-- ── UP NEXT ── -->
      <section class="home-section" aria-labelledby="hd-upnext">
        <div class="section-hd">
          <div class="section-hd-left">
            <h2 class="section-title" id="hd-upnext">UP NEXT</h2>
          </div>
        </div>
        <div id="up-next-container">
          ${renderUpNextPanel(plan)}
        </div>
      </section>

      <!-- ── BEFORE DOOMSDAY ── -->
      <section class="home-section" aria-labelledby="hd-doomsday">
        <div class="section-hd">
          <div class="section-hd-left">
            <h2 class="section-title" id="hd-doomsday">BEFORE DOOMSDAY</h2>
            <p class="section-desc">${sliderAItems.length} titles to watch before Dec 18</p>
          </div>
          <div class="section-hd-right doomsday-actions-bar">
            <div class="segmented-control">
              <button type="button" class="segmented-btn ${!includeOptional ? 'is-active' : ''}" id="btn-doomsday-official">
                OFFICIAL (${officialCount})
              </button>
              <button type="button" class="segmented-btn ${includeOptional ? 'is-active' : ''}" id="btn-doomsday-optional">
                + OPTIONAL (${optionalCount})
              </button>
            </div>
            <button type="button" class="slider-nav-prev" id="slider-a-prev" aria-label="Previous">&#8592;</button>
            <button type="button" class="slider-nav-next" id="slider-a-next" aria-label="Next">&#8594;</button>
          </div>
        </div>
        <div id="slider-a-container">
          ${sliderAHtml}
        </div>
      </section>

      <!-- ── UPCOMING ── -->
      <section class="home-section" aria-labelledby="hd-upcoming">
        <div class="section-hd">
          <div class="section-hd-left">
            <h2 class="section-title" id="hd-upcoming">COMING BEFORE DOOMSDAY</h2>
            <p class="section-desc">${upcomingRailItems.length} titles left to release</p>
          </div>
          <div class="section-hd-right">
            <button type="button" class="slider-nav-prev" id="slider-upcoming-prev" aria-label="Previous">&#8592;</button>
            <button type="button" class="slider-nav-next" id="slider-upcoming-next" aria-label="Next">&#8594;</button>
          </div>
        </div>
        <div id="slider-upcoming-container">
          ${upcomingRailHtml}
        </div>
      </section>

      <!-- ── COMPLETE CATALOG ── -->
      <section class="home-section" aria-labelledby="hd-catalog">
        <div class="section-hd">
          <div class="section-hd-left">
            <h2 class="section-title" id="hd-catalog">COMPLETE CATALOG</h2>
            <p class="section-desc">Showing ${filteredItems.length} of ${moviesInScope.length} titles</p>
          </div>
          <div class="section-hd-right">
            <button type="button" class="slider-nav-prev" id="slider-b-prev" aria-label="Previous">&#8592;</button>
            <button type="button" class="slider-nav-next" id="slider-b-next" aria-label="Next">&#8594;</button>
          </div>
        </div>
        <div id="home-filter-controls" class="filter-sticky-bar">
          ${renderFiltersHtml(prefs.filters, moviesInScope.length, filteredItems.length, { showViewToggle: true })}
        </div>
        <div id="slider-b-container">
          ${sliderBHtml}
        </div>
      </section>

    </div>
  `;

  /* ── Populate progress ── */
  updateProgressStrip();

  /* ── Lazy posters ── */
  observeLazyPosters(container);

  /* ── Card listeners ── */
  attachCardListeners(container);

  /* ── Countdown ticker ── */
  _cdInterval = setInterval(() => {
    const p = getCountdownParts();
    const dEl = container.querySelector('#cd-days');
    const hEl = container.querySelector('#cd-hours');
    const mEl = container.querySelector('#cd-minutes');
    const sEl = container.querySelector('#cd-seconds');
    if (dEl) dEl.textContent = p.days;
    if (hEl) hEl.textContent = String(p.hours).padStart(2,'0');
    if (mEl) mEl.textContent = String(p.minutes).padStart(2,'0');
    if (sEl) sEl.textContent = String(p.seconds).padStart(2,'0');
  }, 1000);

  /* ── Slider A ── */
  const wrapperA = container.querySelector('#slider-a-wrapper');
  const trackA   = container.querySelector('#slider-a-track');
  const prevA    = container.querySelector('#slider-a-prev');
  const nextA    = container.querySelector('#slider-a-next');
  if (trackA && prevA && nextA) {
    function updateANav() {
      const max = trackA.scrollWidth - trackA.clientWidth;
      prevA.disabled = trackA.scrollLeft <= 2;
      nextA.disabled = trackA.scrollLeft >= max - 2;
    }
    prevA.addEventListener('click', () => { trackA.scrollBy({ left: -trackA.clientWidth * 0.8, behavior: 'auto' }); });
    nextA.addEventListener('click', () => { trackA.scrollBy({ left:  trackA.clientWidth * 0.8, behavior: 'auto' }); });
    trackA.addEventListener('scroll', updateANav, { passive: true });
    updateANav();
  }

  /* ── Slider Upcoming ── */
  const trackUpcoming = container.querySelector('#slider-upcoming-track');
  const prevUpcoming  = container.querySelector('#slider-upcoming-prev');
  const nextUpcoming  = container.querySelector('#slider-upcoming-next');
  if (trackUpcoming && prevUpcoming && nextUpcoming) {
    function updateUpcomingNav() {
      const max = trackUpcoming.scrollWidth - trackUpcoming.clientWidth;
      prevUpcoming.disabled = trackUpcoming.scrollLeft <= 2;
      nextUpcoming.disabled = trackUpcoming.scrollLeft >= max - 2;
    }
    prevUpcoming.addEventListener('click', () => { trackUpcoming.scrollBy({ left: -trackUpcoming.clientWidth * 0.8, behavior: 'auto' }); });
    nextUpcoming.addEventListener('click', () => { trackUpcoming.scrollBy({ left:  trackUpcoming.clientWidth * 0.8, behavior: 'auto' }); });
    trackUpcoming.addEventListener('scroll', updateUpcomingNav, { passive: true });
    // wait a tick for layout
    setTimeout(updateUpcomingNav, 50);
  }

  /* ── Slider B ── */
  const trackB = container.querySelector('#slider-b-track');
  const prevB  = container.querySelector('#slider-b-prev');
  const nextB  = container.querySelector('#slider-b-next');
  if (trackB && prevB && nextB) {
    function updateBNav() {
      const max = trackB.scrollWidth - trackB.clientWidth;
      prevB.disabled = trackB.scrollLeft <= 2;
      nextB.disabled = trackB.scrollLeft >= max - 2;
    }
    prevB.addEventListener('click', () => { trackB.scrollBy({ left: -trackB.clientWidth * 0.8, behavior: 'auto' }); });
    nextB.addEventListener('click', () => { trackB.scrollBy({ left:  trackB.clientWidth * 0.8, behavior: 'auto' }); });
    trackB.addEventListener('scroll', updateBNav, { passive: true });
    updateBNav();
  }

  /* ── Doomsday toggle ── */
  const btnOfficial = container.querySelector('#btn-doomsday-official');
  if (btnOfficial) btnOfficial.addEventListener('click', () => {
    store.setDoomsdayIncludeOptional(false);
    renderHomePage(container);
  });
  const btnOptional = container.querySelector('#btn-doomsday-optional');
  if (btnOptional) btnOptional.addEventListener('click', () => {
    store.setDoomsdayIncludeOptional(true);
    renderHomePage(container);
  });

  /* ── Up Next actions ── */
  container.querySelectorAll('[data-upnext-watch]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.upnextWatch;
      const seasons = parseInt(btn.dataset.totalSeasons, 10) || null;
      store.toggleWatched(id, null, seasons);
      // Re-render just the up-next container
      const upNextEl = container.querySelector('#up-next-container');
      if (upNextEl) upNextEl.innerHTML = renderUpNextPanel(store.getPlan());
    });
  });
  container.querySelectorAll('[data-upnext-open]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.upnextOpen;
      const movie = MOVIES.find(m => m.id === id);
      if (movie) {
        import('./modal.js').then(({ openMovieModal }) => openMovieModal(movie, null));
      }
    });
  });

  /* ── Filters ── */
  const filterEl = container.querySelector('#home-filter-controls');
  if (filterEl) {
    attachFilterListeners(filterEl, () => renderHomePage(container));
  }

  const emptyReset = container.querySelector('#btn-empty-reset');
  if (emptyReset) {
    emptyReset.addEventListener('click', () => {
      store.updatePrefs({ filters: { universe:'all', type:'all', franchises:[], status:'all', search:'', sort:'release', runtime: 'all', view:'slider' } });
      renderHomePage(container);
    });
  }

  updateProgressStrip();
  updateHeroRight();
}

export function destroyHomePage() {
  if (_cdInterval) { clearInterval(_cdInterval); _cdInterval = null; }
}
