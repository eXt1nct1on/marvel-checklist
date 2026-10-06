/**
 * MCU & DC Tracker - Card Component
 * Flat, comic-book editorial redesign.
 * Targeted updates via store.subscribe.
 */

import { store } from '../store.js';
import { MOVIES } from '../data.js';
import { POSTERS } from '../posters.js';
import { openMovieModal } from './modal.js';

const failedPosters = new Set();
let observer = null;

export function formatReleaseDisplay(release) {
  if (!release) return 'TBA';
  if (/^\d{4}$/.test(release)) return release;
  if (/^\d{4}-\d{2}$/.test(release)) {
    const [y, m] = release.split('-');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[parseInt(m, 10) - 1]} ${y}`;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(release)) {
    const [y, m, d] = release.split('-');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[parseInt(m, 10) - 1]} ${parseInt(d, 10)}, ${y}`;
  }
  return release;
}

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

export function renderCardHtml(movie, options = {}) {
  const isWatched = store.isWatched(movie.id, movie.seasons);
  const watchedSeasons = store.getWatchedSeasons(movie.id);
  const isPartiallyWatched = !isWatched && watchedSeasons.length > 0;
  const isUpcoming = Boolean(movie.upcoming);

  // Determine priority for posters
  const isPriority = options.priority === true;
  const loadingAttr = isPriority ? 'eager' : 'lazy';
  const fetchPriorityAttr = isPriority ? 'fetchpriority="high"' : '';

  const badges = [];
  const isMarvel = movie.universe === 'Marvel';
  badges.push(`<span class="badge ${isMarvel ? 'badge-marvel' : 'badge-dc'}">${escapeHtml(movie.universe)}</span>`);
  
  if (movie.type === 'TV Series') {
    badges.push(`<span class="badge badge-tv"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><rect x="2" y="7" width="20" height="15" rx="2" ry="2"></rect><polyline points="17 2 12 7 7 2"></polyline></svg> ${movie.seasons || 1} Seasons</span>`);
  } else if (movie.type === 'Special' || movie.type === 'Short') {
    badges.push(`<span class="badge">${escapeHtml(movie.type)}</span>`);
  } else {
    badges.push(`<span class="badge badge-movie"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect><line x1="7" y1="2" x2="7" y2="22"></line><line x1="17" y1="2" x2="17" y2="22"></line><line x1="2" y1="12" x2="22" y2="12"></line><line x1="2" y1="7" x2="7" y2="7"></line><line x1="2" y1="17" x2="7" y2="17"></line><line x1="17" y1="17" x2="22" y2="17"></line><line x1="17" y1="7" x2="22" y2="7"></line></svg> Movie</span>`);
  }

  if (isUpcoming) badges.push(`<span class="badge badge-upcoming">Upcoming</span>`);
  if (movie.doomsday === 'optional') badges.push(`<span class="badge badge-optional">Optional</span>`);

  const showPosters = store.getShowPosters();
  const posterEntry = showPosters ? POSTERS[movie.id] : null;
  const hasValidPoster = Boolean(posterEntry && posterEntry.posterPath && !failedPosters.has(movie.id));

  let posterMarkup = '';
  if (hasValidPoster) {
    const posterPath = posterEntry.posterPath;
    posterMarkup = `
      <img
        data-src="https://image.tmdb.org/t/p/w342${posterPath}"
        data-srcset="https://image.tmdb.org/t/p/w185${posterPath} 185w, https://image.tmdb.org/t/p/w342${posterPath} 342w, https://image.tmdb.org/t/p/w500${posterPath} 500w"
        sizes="(max-width: 480px) 185px, (max-width: 1024px) 342px, 500px"
        alt="Poster for ${escapeHtml(movie.title)}"
        class="card-poster lazy-poster"
        loading="${loadingAttr}"
        ${fetchPriorityAttr}
        decoding="async"
        referrerpolicy="no-referrer"
        data-movie-id="${escapeHtml(movie.id)}"
        width="342"
        height="513"
      />
    `;
  } else {
    // Flat background placeholder
    const monogram = movie.title.split(' ').map(w => w[0]).join('').substring(0, 3).toUpperCase();
    posterMarkup = `
      <div class="card-poster-placeholder" style="background-color: var(${isMarvel ? '--red' : '--dc-blue'});">
        <span class="placeholder-text">${escapeHtml(monogram)}</span>
      </div>
    `;
  }

  const btnLabel = isWatched ? 'Watched' : isPartiallyWatched ? `${watchedSeasons.length}/${movie.seasons} Watched` : 'Mark Watched';

  return `
    <article 
      class="movie-card ${isWatched ? 'is-watched' : ''} ${isMarvel ? 'card-marvel' : 'card-dc'}" 
      data-id="${escapeHtml(movie.id)}"
      id="card-${escapeHtml(movie.id)}"
      tabindex="0"
    >
      <div class="card-stripe"></div>
      <div class="card-poster-wrapper">
        ${posterMarkup}
        <div class="card-badges">${badges.join('')}</div>
      </div>
      <div class="card-content">
        <h3 class="card-title">${escapeHtml(movie.title)}</h3>
        <p class="card-meta">${escapeHtml(formatReleaseDisplay(movie.release))}</p>
        
        <button
          type="button"
          class="btn-watch-toggle"
          data-movie-id="${escapeHtml(movie.id)}"
          data-total-seasons="${movie.seasons || ''}"
          role="checkbox"
          aria-checked="${isWatched}"
        >
          <span class="watch-checkbox"></span>
          <span class="watch-label" data-unwatched-label="Mark Watched" data-watched-label="Watched">${btnLabel}</span>
        </button>
      </div>
    </article>
  `;
}

function initIntersectionObserver() {
  if (observer) return;
  observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        if (img.dataset.src) {
          img.src = img.dataset.src;
          if (img.dataset.srcset) img.srcset = img.dataset.srcset;
          img.removeAttribute('data-src');
          img.removeAttribute('data-srcset');
        }
        obs.unobserve(img);
      }
    });
  }, { rootMargin: '600px 0px' });
}

export function observeLazyPosters(container) {
  initIntersectionObserver();
  const lazyImages = container.querySelectorAll('.lazy-poster[data-src]');
  lazyImages.forEach(img => observer.observe(img));
}

export function attachCardListeners(container) {
  if (!container) return;

  if (!container._posterHandlersAttached) {
    container.addEventListener('error', (e) => {
      if (e.target && e.target.classList && e.target.classList.contains('card-poster')) {
        const movieId = e.target.getAttribute('data-movie-id');
        if (movieId) {
          failedPosters.add(movieId);
          const wrapper = e.target.closest('.card-poster-wrapper');
          if (wrapper) {
            const isMarvel = wrapper.closest('.movie-card').classList.contains('card-marvel');
            const title = wrapper.closest('.movie-card').querySelector('.card-title').textContent;
            const monogram = title.split(' ').map(w => w[0]).join('').substring(0, 3).toUpperCase();
            wrapper.innerHTML = `
              <div class="card-poster-placeholder" style="background-color: var(${isMarvel ? '--red' : '--dc-blue'});">
                <span class="placeholder-text">${escapeHtml(monogram)}</span>
              </div>
              ${wrapper.querySelector('.card-badges').outerHTML}
            `;
          }
        }
      }
    }, true);
    container._posterHandlersAttached = true;
  }

  container.addEventListener('click', (e) => {
    const watchBtn = e.target.closest('.btn-watch-toggle');
    if (watchBtn) {
      e.preventDefault();
      e.stopPropagation();
      const movieId = watchBtn.getAttribute('data-movie-id');
      const totalSeasons = parseInt(watchBtn.getAttribute('data-total-seasons'), 10) || null;
      if (movieId) {
        store.toggleWatched(movieId, null, totalSeasons);
      }
      return;
    }

    const card = e.target.closest('.movie-card');
    if (card) {
      const movieId = card.getAttribute('data-id');
      if (movieId) {
        const movie = MOVIES.find((m) => m.id === movieId);
        if (movie) openMovieModal(movie, null);
      }
    }
  });
}

// Targeted DOM Updates
store.subscribe(() => {
  // Update all rendered cards
  const cards = document.querySelectorAll('.movie-card');
  cards.forEach(card => {
    const id = card.getAttribute('data-id');
    const movie = MOVIES.find(m => m.id === id);
    if (!movie) return;

    const isWatched = store.isWatched(id, movie.seasons);
    const watchedSeasons = store.getWatchedSeasons(id);
    const isPartiallyWatched = !isWatched && watchedSeasons.length > 0;

    if (isWatched) {
      card.classList.add('is-watched');
    } else {
      card.classList.remove('is-watched');
    }
    
    const btn = card.querySelector('.btn-watch-toggle');
    if (btn) {
      btn.setAttribute('aria-checked', isWatched);
      const labelEl = btn.querySelector('.watch-label');
      if (labelEl) {
        labelEl.textContent = isWatched ? 'Watched' : isPartiallyWatched ? `${watchedSeasons.length}/${movie.seasons} Watched` : 'Mark Watched';
      }
    }
  });
});
