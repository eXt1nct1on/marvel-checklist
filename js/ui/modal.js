/**
 * Multiverse Tracker - Movie Detail Modal
 * Flat, comic-book editorial redesign.
 */

import { store } from '../store.js';
import { POSTERS } from '../posters.js';
import { escapeHtml, formatReleaseDisplay, announceLiveMessage } from './card.js';
import { fmtDuration, fmtApprox } from '../time.js';

let activeModalEl = null;
let lastFocusedEl = null;

export function openMovieModal(movie, onStateChange = null) {
  closeMovieModal();

  lastFocusedEl = document.activeElement;

  const showPosters = store.getShowPosters();
  const posterEntry = showPosters ? POSTERS[movie.id] : null;
  const isWatched = store.isWatched(movie.id, movie.seasons);
  const watchedSeasons = store.getWatchedSeasons(movie.id);
  const isUpcoming = Boolean(movie.upcoming);
  const formattedRelease = formatReleaseDisplay(movie.release);
  const plan = store.getPlan();
  const isMarvel = movie.universe === 'Marvel';

  const badges = [];
  badges.push(`<span class="badge ${isMarvel ? 'badge-marvel' : 'badge-dc'}">${escapeHtml(movie.universe)}</span>`);
  badges.push(`<span class="badge badge-franchise">${escapeHtml(movie.franchise.split('(')[0].trim())}</span>`);
  
  if (movie.doomsday === 'official') {
    badges.push(`<span class="badge badge-official">Official #${movie.doomsdayOrder || ''}</span>`);
  } else if (movie.doomsday === 'optional') {
    badges.push(`<span class="badge badge-optional">Optional Pick</span>`);
  }

  let posterHtml = '';
  if (posterEntry && posterEntry.posterPath) {
    posterHtml = `
      <div class="modal-poster-col">
        <img
          src="https://image.tmdb.org/t/p/w500${posterEntry.posterPath}"
          alt="Poster for ${escapeHtml(movie.title)}"
          class="modal-poster"
          loading="eager"
          decoding="async"
          referrerpolicy="no-referrer"
        />
      </div>
    `;
  } else {
    const monogram = movie.title.split(' ').map(w => w[0]).join('').substring(0, 3).toUpperCase();
    const bg = isMarvel ? '--red' : '--dc-blue';
    posterHtml = `
      <div class="modal-poster-col">
        <div class="modal-poster-placeholder" style="background-color:var(${bg})">
          ${escapeHtml(monogram)}
        </div>
      </div>
    `;
  }

  let doomsdayCalloutHtml = '';
  if (movie.doomsday === 'official') {
    doomsdayCalloutHtml = `
      <div class="modal-callout callout-official">
        <strong>BEFORE DOOMSDAY: OFFICIAL #${movie.doomsdayOrder || ''}</strong>
        <p>Curated by Disney+ & Marvel Studios as an essential chapter.</p>
      </div>
    `;
  } else if (movie.doomsday === 'optional' && movie.doomsdayReason) {
    doomsdayCalloutHtml = `
      <div class="modal-callout callout-optional">
        <strong>DOOMSDAY CONNECTION</strong>
        <p>${escapeHtml(movie.doomsdayReason)}</p>
      </div>
    `;
  }

  const totalMin = movie.totalRuntimeMin || movie.runtimeMin || null;
  const runtimeDisplay = fmtApprox(fmtDuration(totalMin), movie.runtimeApprox);
  const epsStr = movie.episodes ? `${movie.episodes} eps &middot; ` : '';
  const runtimeStr = ` &middot; ${epsStr}${runtimeDisplay}`;

  let seasonsGridHtml = '';
  if (movie.type === 'TV Series' && movie.seasons && movie.seasons > 1 && !isUpcoming) {
    seasonsGridHtml = `
      <div class="modal-seasons-block">
        <span class="modal-section-label">Mark Watched by Season:</span>
        <div class="modal-seasons-grid" role="group" aria-label="Seasons">
          ${Array.from({ length: movie.seasons }, (_, i) => i + 1).map((s) => {
            const isDone = watchedSeasons.includes(s);
            const sData = movie.seasonsData?.find(sd => sd.n === s);
            const sText = sData && sData.totalMin ? fmtDuration(sData.totalMin) : 'TBA';
            return `
              <button
                type="button"
                class="btn btn-sm btn-season-toggle ${isDone ? 'btn-primary' : ''}"
                data-movie-id="${escapeHtml(movie.id)}"
                data-season="${s}"
                data-total-seasons="${movie.seasons}"
                role="checkbox"
                aria-checked="${isDone}"
              >
                S${s} &middot; ${sText} ${isDone ? '✓' : ''}
              </button>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  const modalHtml = `
    <div class="modal-backdrop" id="movie-detail-modal-backdrop" role="presentation">
      <div class="modal-dialog" role="dialog" aria-modal="true" aria-labelledby="modal-movie-title" tabindex="-1">
        <button type="button" class="btn-close" id="modal-close-btn" aria-label="Close dialog">×</button>
        ${posterHtml}
        <div class="modal-content">
          <div class="card-badges" style="margin-bottom: 16px;">${badges.join('')}</div>
          <h2 id="modal-movie-title" class="display-font" style="font-size: 40px; margin-bottom: 8px;">${escapeHtml(movie.title)}</h2>
          <div style="font-size: 14px; color: var(--muted); margin-bottom: 24px; text-transform: uppercase; font-weight: bold; letter-spacing: 0.05em;">
            ${escapeHtml(formattedRelease)} • ${escapeHtml(movie.era || 'Feature')} ${movie.platform ? `• ${escapeHtml(movie.platform)}` : ''}${runtimeStr}
          </div>

          ${doomsdayCalloutHtml}

          ${movie.notes ? `
            <div style="margin-bottom: 24px;">
              <strong style="text-transform: uppercase; font-size: 14px;">Notes</strong>
              <p>${escapeHtml(movie.notes)}</p>
            </div>
          ` : ''}

          ${seasonsGridHtml}

          <div style="margin-top: auto; display: flex; gap: 16px;">
            ${isUpcoming
              ? `<div class="btn" style="pointer-events: none; opacity: 0.5;">Coming ${escapeHtml(formattedRelease)}</div>`
              : `<button type="button" class="btn btn-primary" id="modal-btn-watch" data-movie-id="${escapeHtml(movie.id)}" data-total-seasons="${movie.seasons || ''}">
                  ${isWatched ? 'Watched ✓' : 'Mark as Watched'}
                </button>`
            }
          </div>
        </div>
      </div>
    </div>
  `;

  const wrapper = document.createElement('div');
  wrapper.id = 'movie-detail-modal-root';
  wrapper.innerHTML = modalHtml;
  document.body.appendChild(wrapper);
  activeModalEl = wrapper;
  document.body.style.overflow = 'hidden';

  const dialogEl = wrapper.querySelector('.modal-dialog');
  dialogEl.focus();

  wrapper.querySelector('#modal-close-btn')?.addEventListener('click', closeMovieModal);
  wrapper.querySelector('#movie-detail-modal-backdrop')?.addEventListener('click', (e) => {
    if (e.target.id === 'movie-detail-modal-backdrop') closeMovieModal();
  });

  const watchBtn = wrapper.querySelector('#modal-btn-watch');
  if (watchBtn) {
    watchBtn.addEventListener('click', () => {
      const tot = parseInt(watchBtn.getAttribute('data-total-seasons'), 10) || null;
      const isNowWatched = store.toggleWatched(movie.id, null, tot);
      if (typeof onStateChange === 'function') onStateChange(movie.id, isNowWatched);
      openMovieModal(movie, onStateChange);
    });
  }

  wrapper.querySelectorAll('.btn-season-toggle').forEach((btn) => {
    btn.addEventListener('click', () => {
      const sNum = parseInt(btn.getAttribute('data-season'), 10);
      const tot = parseInt(btn.getAttribute('data-total-seasons'), 10) || null;
      const isFullyWatched = store.toggleSeasonWatched(movie.id, sNum, tot);
      if (typeof onStateChange === 'function') onStateChange(movie.id, isFullyWatched);
      openMovieModal(movie, onStateChange);
    });
  });

  const onKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      closeMovieModal();
      return;
    }
  };
  document.addEventListener('keydown', onKeyDown);
  wrapper._cleanupKeydown = () => document.removeEventListener('keydown', onKeyDown);
}

export function closeMovieModal() {
  if (activeModalEl) {
    if (typeof activeModalEl._cleanupKeydown === 'function') activeModalEl._cleanupKeydown();
    activeModalEl.remove();
    activeModalEl = null;
    document.body.style.overflow = '';
    if (lastFocusedEl && typeof lastFocusedEl.focus === 'function') lastFocusedEl.focus();
  }
}
