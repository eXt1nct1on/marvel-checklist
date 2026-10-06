/**
 * MCU & DC Tracker — Card Component
 * All class names match css/style.css exactly.
 * Square by default; poster shape via .card-shape-poster on the card.
 * Targeted DOM updates via store.subscribe (no full re-render on toggle).
 */

import { store } from '../store.js';
import { MOVIES } from '../data.js';
import { POSTERS } from '../posters.js';
import { openMovieModal } from './modal.js';
import { fmtDuration, fmtApprox } from '../time.js';

const failedPosters = new Set();
let _observer = null;

/* ─── Helpers ─────────────────────────────────────── */
export function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function announceLiveMessage(message) {
  let el = document.getElementById('a11y-live-region');
  if (!el) {
    el = document.createElement('div');
    el.id = 'a11y-live-region';
    el.setAttribute('aria-live', 'polite');
    el.className = 'sr-only';
    document.body.appendChild(el);
  }
  el.textContent = message;
}

export function formatReleaseDisplay(release) {
  if (!release) return 'TBA';
  if (/^\d{4}$/.test(release)) return release;
  if (/^\d{4}-\d{2}$/.test(release)) {
    const [y, m] = release.split('-');
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return `${months[parseInt(m,10)-1]} ${y}`;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(release)) {
    const [y, m, d] = release.split('-');
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return `${months[parseInt(m,10)-1]} ${parseInt(d,10)}, ${y}`;
  }
  return release;
}

/* ─── Card HTML ───────────────────────────────────── */
export function renderCardHtml(movie, options = {}) {
  const isWatched  = store.isWatched(movie.id, movie.seasons);
  const watchedSeasons = store.getWatchedSeasons(movie.id);
  const isPartial  = !isWatched && watchedSeasons.length > 0;
  const isMarvel   = movie.universe === 'Marvel';
  const isUpcoming = Boolean(movie.upcoming);
  const isOptional = movie.doomsday === 'optional';

  // Card shape preference
  const cardShape = store.getPrefs().cardShape || 'square';
  const shapeClass = cardShape === 'poster' ? 'card-shape-poster' : '';

  // Priority
  const isPriority = options.priority === true;
  const loading = isPriority ? 'eager' : 'lazy';
  const fetchpriority = isPriority ? 'fetchpriority="high"' : '';

  // Poster
  const showPosters = store.getShowPosters();
  const posterEntry = showPosters ? POSTERS[movie.id] : null;
  const hasPoster   = Boolean(posterEntry?.posterPath && !failedPosters.has(movie.id));

  let mediaHtml = '';
  if (hasPoster) {
    const p = posterEntry.posterPath;
    mediaHtml = `
      <img
        class="card-poster lazy-poster"
        data-src="https://image.tmdb.org/t/p/w342${p}"
        data-srcset="https://image.tmdb.org/t/p/w185${p} 185w, https://image.tmdb.org/t/p/w342${p} 342w, https://image.tmdb.org/t/p/w500${p} 500w"
        sizes="(max-width:480px) 185px,(max-width:1024px) 342px,500px"
        alt="Poster for ${escapeHtml(movie.title)}"
        loading="${loading}" ${fetchpriority}
        decoding="async"
        referrerpolicy="no-referrer"
        data-movie-id="${escapeHtml(movie.id)}"
        width="342" height="513"
      />
    `;
  } else {
    const mono = movie.title.split(' ').map(w => w[0]).join('').substring(0,3).toUpperCase();
    const bg   = isMarvel ? '--red' : '--dc-blue';
    mediaHtml = `
      <div class="card-poster-placeholder" style="background-color:var(${bg})">
        ${escapeHtml(mono)}
      </div>
    `;
  }

  // Badges — max 2, priority: Optional > Series > Upcoming > Universe
  const badges = [];
  if (isOptional)              badges.push(`<span class="badge badge-optional">OPT</span>`);
  if (movie.type==='TV Series') badges.push(`<span class="badge badge-tv">SERIES</span>`);
  if (isUpcoming && badges.length < 2) badges.push(`<span class="badge badge-upcoming">SOON</span>`);
  if (badges.length < 2)       badges.push(`<span class="badge ${isMarvel ? 'badge-marvel':'badge-dc'}">${escapeHtml(movie.universe)}</span>`);
  const badgesHtml = badges.slice(0,2).join('');

  const year = movie.release ? movie.release.substring(0,4) : 'TBA';
  const typeLabel = movie.type === 'TV Series' ? 'Series' : 'Movie';
  const btnLabel = isWatched ? 'WATCHED' : isPartial ? `${watchedSeasons.length}/${movie.seasons} WATCHED` : 'MARK WATCHED';

  let runtimeLabel = 'TBA';
  if (movie.totalRuntimeMin) {
    runtimeLabel = fmtApprox(fmtDuration(movie.totalRuntimeMin), movie.runtimeApprox);
    if (movie.type === 'TV Series' && movie.episodes) {
      runtimeLabel = `${movie.episodes} eps · ` + runtimeLabel;
    }
  }
  // We use aria-label to spell out the abbreviation later or keep it simple.
  const runtimeHtml = `<div class="card-runtime-badge" aria-label="Runtime: ${escapeHtml(runtimeLabel)}">${escapeHtml(runtimeLabel)}</div>`;

  return `
    <article
      class="movie-card ${shapeClass} ${isWatched ? 'is-watched' : ''} ${isMarvel ? 'card-marvel' : 'card-dc'} ${isOptional ? 'is-optional' : ''}"
      data-id="${escapeHtml(movie.id)}"
      id="card-${escapeHtml(movie.id)}"
      tabindex="0"
    >
      <div class="card-stripe"></div>
      <div class="card-poster-wrapper">
        ${mediaHtml}
        ${runtimeHtml}
        <div class="card-badges">${badgesHtml}</div>
      </div>
      <div class="card-content">
        <h3 class="card-title">${escapeHtml(movie.title)}</h3>
        <p class="card-meta">${year} · ${typeLabel}</p>
      </div>
      <button
        type="button"
        class="btn-watch-toggle"
        data-movie-id="${escapeHtml(movie.id)}"
        data-total-seasons="${movie.seasons || ''}"
        role="checkbox"
        aria-checked="${isWatched}"
        aria-label="${isWatched ? 'Unmark' : 'Mark'} ${escapeHtml(movie.title)} as watched"
        ${movie.upcoming ? 'disabled style="opacity: 0.5; cursor: not-allowed; pointer-events: none;"' : ''}
      >
        <span class="watch-checkbox"></span>
        <span class="watch-label">${movie.upcoming ? 'UPCOMING' : btnLabel}</span>
      </button>
    </article>
  `;
}

/* ─── Intersection Observer for lazy posters ─────── */
function initObserver() {
  if (_observer) return;
  _observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const img = entry.target;
      if (img.dataset.src) {
        img.src = img.dataset.src;
        if (img.dataset.srcset) img.srcset = img.dataset.srcset;
        img.removeAttribute('data-src');
        img.removeAttribute('data-srcset');
      }
      obs.unobserve(img);
    });
  }, { rootMargin: '600px 0px' });
}

export function observeLazyPosters(container) {
  initObserver();
  container.querySelectorAll('.lazy-poster[data-src]').forEach(img => _observer.observe(img));
}

/* ─── Card interaction listeners ─────────────────── */
export function attachCardListeners(container) {
  if (!container) return;

  // Poster error fallback (delegated, once per container)
  if (!container._posterErrAttached) {
    container.addEventListener('error', e => {
      const img = e.target;
      if (!img.classList?.contains('card-poster')) return;
      const movieId = img.getAttribute('data-movie-id');
      if (!movieId) return;
      failedPosters.add(movieId);
      const card = img.closest('.movie-card');
      const wrap = img.closest('.card-poster-wrapper');
      if (!wrap || !card) return;
      const isMarvel = card.classList.contains('card-marvel');
      const mono = (card.querySelector('.card-title')?.textContent || '').split(' ').map(w=>w[0]).join('').substring(0,3).toUpperCase();
      const bg   = isMarvel ? '--red' : '--dc-blue';
      const badgesEl = wrap.querySelector('.card-badges');
      wrap.innerHTML = `
        <div class="card-poster-placeholder" style="background-color:var(${bg})">${escapeHtml(mono)}</div>
        ${badgesEl ? badgesEl.outerHTML : ''}
      `;
    }, true);
    container._posterErrAttached = true;
  }

  // Click: watch toggle vs card open (delegated)
  if (!container._clickAttached) {
    container.addEventListener('click', e => {
      // Watch toggle
      const watchBtn = e.target.closest('.btn-watch-toggle');
      if (watchBtn) {
        e.preventDefault();
        e.stopPropagation();
        const movieId = watchBtn.getAttribute('data-movie-id');
        const seasons = parseInt(watchBtn.getAttribute('data-total-seasons'), 10) || null;
        if (movieId) store.toggleWatched(movieId, null, seasons);
        return;
      }
      // Open modal (click on media or title, NOT footer)
      const card = e.target.closest('.movie-card');
      if (card && !e.target.closest('.btn-watch-toggle')) {
        const movieId = card.getAttribute('data-id');
        if (movieId) {
          const movie = MOVIES.find(m => m.id === movieId);
          if (movie) openMovieModal(movie, null);
        }
      }
    });
    container._clickAttached = true;
  }
}

/* ─── Targeted DOM updates on watched state change ── */
store.subscribe(() => {
  document.querySelectorAll('.movie-card').forEach(card => {
    const id = card.getAttribute('data-id');
    const movie = MOVIES.find(m => m.id === id);
    if (!movie) return;

    const isWatched = store.isWatched(id, movie.seasons);
    const watchedSeasons = store.getWatchedSeasons(id);
    const isPartial = !isWatched && watchedSeasons.length > 0;

    card.classList.toggle('is-watched', isWatched);

    const btn = card.querySelector('.btn-watch-toggle');
    if (btn) {
      btn.setAttribute('aria-checked', String(isWatched));
      const labelEl = btn.querySelector('.watch-label');
      if (labelEl) {
        labelEl.textContent = isWatched
          ? 'WATCHED'
          : isPartial
            ? `${watchedSeasons.length}/${movie.seasons} WATCHED`
            : 'MARK WATCHED';
      }
    }
  });
});
