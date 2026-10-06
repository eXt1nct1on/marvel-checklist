/**
 * Multiverse Tracker - Movie Detail Modal
 * Features:
 * - High-res poster display (TMDB w500 or SVG fallback)
 * - Complete metadata, curator notes, and Doomsday preparation rationale
 * - Interactive Watch & per-season checkboxes
 * - "Add to Watch Plan / Set as Up Next" dynamic action
 * - Accessible: focus trap, Esc to close, backdrop click, aria-modal
 */

import { store } from '../store.js';
import { POSTERS } from '../posters.js';
import { escapeHtml, formatReleaseDisplay, generatePosterSvg, announceLiveMessage } from './card.js';

let activeModalEl = null;
let lastFocusedEl = null;

/**
 * Open detail modal for a movie
 * @param {Object} movie - Catalog movie object
 * @param {Function} onStateChange - Callback when watch status changes
 */
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

  // Badges
  const badges = [];
  badges.push(`<span class="badge ${movie.universe === 'Marvel' ? 'badge-marvel' : 'badge-dc'}">${escapeHtml(movie.universe)}</span>`);
  badges.push(`<span class="badge badge-franchise">${escapeHtml(movie.franchise.split('(')[0].trim())}</span>`);
  if (movie.canon) badges.push(`<span class="badge badge-canon">${escapeHtml(movie.canon)}</span>`);
  if (movie.platform) badges.push(`<span class="badge badge-platform">${escapeHtml(movie.platform)}</span>`);
  if (movie.type === 'TV Series') {
    const sCount = movie.seasons || 1;
    badges.push(`<span class="badge badge-series">${sCount} ${sCount === 1 ? 'Season' : 'Seasons'}</span>`);
  } else if (movie.type === 'Special') {
    badges.push(`<span class="badge badge-special">Special</span>`);
  } else if (movie.type === 'Short') {
    badges.push(`<span class="badge badge-short">Short</span>`);
  }
  if (movie.doomsday === 'official') {
    badges.push(`<span class="badge badge-doomsday-official">Official #${movie.doomsdayOrder || ''}</span>`);
  } else if (movie.doomsday === 'optional') {
    badges.push(`<span class="badge badge-doomsday-optional">Optional Pick</span>`);
  }
  if (isUpcoming) badges.push(`<span class="badge badge-upcoming">Upcoming</span>`);

  // Poster Image or SVG
  let posterHtml = '';
  if (posterEntry && posterEntry.posterPath) {
    posterHtml = `
      <div class="modal-poster-wrap">
        <img
          src="https://image.tmdb.org/t/p/w500${posterEntry.posterPath}"
          alt="Poster for ${escapeHtml(movie.title)}"
          class="modal-poster-img"
          loading="eager"
          decoding="async"
          referrerpolicy="no-referrer"
        />
      </div>
    `;
  } else {
    posterHtml = `
      <div class="modal-poster-wrap modal-poster-svg-wrap">
        ${generatePosterSvg(movie)}
      </div>
    `;
  }

  // Doomsday Callout
  let doomsdayCalloutHtml = '';
  if (movie.doomsday === 'official') {
    doomsdayCalloutHtml = `
      <div class="modal-doomsday-callout is-official" role="note">
        <span class="callout-icon">🔥</span>
        <div>
          <strong>Official Before Doomsday Priority #${movie.doomsdayOrder || ''}</strong>
          <p>Curated by Disney+ & Marvel Studios as an essential chapter in the Multiverse Saga directly leading into Avengers: Doomsday.</p>
        </div>
      </div>
    `;
  } else if (movie.doomsday === 'optional' && movie.doomsdayReason) {
    doomsdayCalloutHtml = `
      <div class="modal-doomsday-callout is-optional" role="note">
        <span class="callout-icon">💡</span>
        <div>
          <strong>Doomsday Preparation Connection</strong>
          <p>${escapeHtml(movie.doomsdayReason)}</p>
        </div>
      </div>
    `;
  }

  // TV Series Seasons Grid
  let seasonsGridHtml = '';
  if (movie.type === 'TV Series' && movie.seasons && movie.seasons > 1 && !isUpcoming) {
    seasonsGridHtml = `
      <div class="modal-seasons-block">
        <span class="modal-section-label">Mark Watched by Season:</span>
        <div class="modal-seasons-grid" role="group" aria-label="Seasons">
          ${Array.from({ length: movie.seasons }, (_, i) => i + 1).map((s) => {
            const isDone = watchedSeasons.includes(s);
            return `
              <button
                type="button"
                class="btn-season-toggle modal-season-btn ${isDone ? 'is-season-watched' : ''}"
                data-movie-id="${escapeHtml(movie.id)}"
                data-season="${s}"
                data-total-seasons="${movie.seasons}"
                role="checkbox"
                aria-checked="${isDone}"
              >
                Season ${s} ${isDone ? '✓' : ''}
              </button>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  // Plan Actions
  let planActionHtml = '';
  if (plan && Array.isArray(plan.ids)) {
    const inPlan = plan.ids.includes(movie.id);
    if (inPlan) {
      const isAlreadyWatched = store.isWatched(movie.id, movie.seasons);
      planActionHtml = `
        <div class="modal-plan-status">
          <span class="plan-status-badge">✓ In Active Watch Plan</span>
          ${
            !isAlreadyWatched && !isUpcoming
              ? `
              <button type="button" class="btn btn-secondary btn-sm" id="modal-btn-set-upnext" data-id="${escapeHtml(movie.id)}">
                🎯 Set as Up Next Target
              </button>
            `
              : ''
          }
        </div>
      `;
    } else {
      planActionHtml = `
        <div class="modal-plan-status">
          <button type="button" class="btn btn-secondary btn-sm" id="modal-btn-add-plan" data-id="${escapeHtml(movie.id)}">
            + Add to Active Watch Plan
          </button>
        </div>
      `;
    }
  } else {
    planActionHtml = `
      <div class="modal-plan-status">
        <a href="#/plan" class="btn btn-secondary btn-sm" id="modal-btn-create-plan">
          Create a Watch Plan
        </a>
      </div>
    `;
  }

  const modalHtml = `
    <div class="modal-backdrop" id="movie-detail-modal-backdrop" role="presentation">
      <div
        class="modal-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-movie-title"
        tabindex="-1"
      >
        <button type="button" class="btn-modal-close" id="modal-close-btn" aria-label="Close dialog">×</button>

        <div class="modal-grid">
          ${posterHtml}

          <div class="modal-content-pane">
            <div class="modal-badges">${badges.join('')}</div>
            <h2 id="modal-movie-title" class="modal-title">${escapeHtml(movie.title)}</h2>

            <div class="modal-meta-row">
              <span class="modal-meta-item"><strong>Release:</strong> ${escapeHtml(formattedRelease)}</span>
              <span class="modal-meta-sep">•</span>
              <span class="modal-meta-item"><strong>Era:</strong> ${escapeHtml(movie.era || 'Feature')}</span>
              ${movie.runtimeMin ? `<span class="modal-meta-sep">•</span><span class="modal-meta-item"><strong>Runtime:</strong> ${movie.runtimeMin}m</span>` : ''}
              ${movie.platform ? `<span class="modal-meta-sep">•</span><span class="modal-meta-item"><strong>Platform:</strong> ${escapeHtml(movie.platform)}</span>` : ''}
            </div>

            ${doomsdayCalloutHtml}

            ${
              movie.notes
                ? `
              <div class="modal-notes-section">
                <span class="modal-section-label">Curator Notes:</span>
                <p class="modal-notes-text">${escapeHtml(movie.notes)}</p>
              </div>
            `
                : ''
            }

            ${seasonsGridHtml}

            <!-- Primary Actions -->
            <div class="modal-actions-bar">
              ${
                isUpcoming
                  ? `<span class="coming-soon-label">Coming ${escapeHtml(formattedRelease)}</span>`
                  : `
                  <button
                    type="button"
                    class="btn ${isWatched ? 'btn-success' : 'btn-primary'} btn-lg"
                    id="modal-btn-watch"
                    data-movie-id="${escapeHtml(movie.id)}"
                    data-total-seasons="${movie.seasons || ''}"
                  >
                    ${isWatched ? 'Watched ✓' : 'Mark as Watched'}
                  </button>
                `
              }
              ${planActionHtml}
            </div>
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

  // Prevent background scrolling
  document.body.classList.add('modal-open');

  // Focus trap elements
  const dialogEl = wrapper.querySelector('.modal-dialog');
  dialogEl.focus();

  // Attach event handlers
  const closeBtn = wrapper.querySelector('#modal-close-btn');
  closeBtn?.addEventListener('click', closeMovieModal);

  const backdrop = wrapper.querySelector('#movie-detail-modal-backdrop');
  backdrop?.addEventListener('click', (e) => {
    if (e.target === backdrop) {
      closeMovieModal();
    }
  });

  // Watch toggle
  const watchBtn = wrapper.querySelector('#modal-btn-watch');
  if (watchBtn) {
    watchBtn.addEventListener('click', () => {
      const tot = parseInt(watchBtn.getAttribute('data-total-seasons'), 10) || null;
      const isNowWatched = store.toggleWatched(movie.id, null, tot);
      announceLiveMessage(`Marked "${movie.title}" as ${isNowWatched ? 'watched' : 'unwatched'}`);
      if (typeof onStateChange === 'function') onStateChange(movie.id, isNowWatched);
      // Re-render modal to show updated state
      openMovieModal(movie, onStateChange);
    });
  }

  // Season toggle inside modal
  wrapper.querySelectorAll('.modal-season-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const sNum = parseInt(btn.getAttribute('data-season'), 10);
      const tot = parseInt(btn.getAttribute('data-total-seasons'), 10) || null;
      const isFullyWatched = store.toggleSeasonWatched(movie.id, sNum, tot);
      const sDone = store.isSeasonWatched(movie.id, sNum);
      announceLiveMessage(`Season ${sNum} of "${movie.title}" marked as ${sDone ? 'watched' : 'unwatched'}`);
      if (typeof onStateChange === 'function') onStateChange(movie.id, isFullyWatched);
      openMovieModal(movie, onStateChange);
    });
  });

  // Set as Up Next in Plan
  const setUpNextBtn = wrapper.querySelector('#modal-btn-set-upnext');
  if (setUpNextBtn) {
    setUpNextBtn.addEventListener('click', () => {
      const currentPlan = store.getPlan();
      if (currentPlan && Array.isArray(currentPlan.ids)) {
        // Move this movie ID to front of plan
        const newIds = [movie.id, ...currentPlan.ids.filter((x) => x !== movie.id)];
        store.setPlan({ ...currentPlan, ids: newIds });
        announceLiveMessage(`Set "${movie.title}" as Up Next target.`);
        openMovieModal(movie, onStateChange);
      }
    });
  }

  // Add to Watch Plan
  const addPlanBtn = wrapper.querySelector('#modal-btn-add-plan');
  if (addPlanBtn) {
    addPlanBtn.addEventListener('click', () => {
      const currentPlan = store.getPlan();
      if (currentPlan && Array.isArray(currentPlan.ids)) {
        if (!currentPlan.ids.includes(movie.id)) {
          const newIds = [...currentPlan.ids, movie.id];
          store.setPlan({ ...currentPlan, ids: newIds });
          announceLiveMessage(`Added "${movie.title}" to active watch plan.`);
          openMovieModal(movie, onStateChange);
        }
      }
    });
  }

  // Close create plan link
  const createPlanBtn = wrapper.querySelector('#modal-btn-create-plan');
  if (createPlanBtn) {
    createPlanBtn.addEventListener('click', () => {
      closeMovieModal();
    });
  }

  // Global Keydown Handler for Modal (Esc + Focus Trap)
  const onKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      closeMovieModal();
      return;
    }

    if (e.key === 'Tab') {
      const focusableEls = dialogEl.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      if (focusableEls.length === 0) return;

      const firstEl = focusableEls[0];
      const lastEl = focusableEls[focusableEls.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === firstEl || document.activeElement === dialogEl) {
          e.preventDefault();
          lastEl.focus();
        }
      } else {
        if (document.activeElement === lastEl) {
          e.preventDefault();
          firstEl.focus();
        }
      }
    }
  };

  document.addEventListener('keydown', onKeyDown);
  wrapper._cleanupKeydown = () => document.removeEventListener('keydown', onKeyDown);
}

/**
 * Close any active movie detail modal
 */
export function closeMovieModal() {
  if (activeModalEl) {
    if (typeof activeModalEl._cleanupKeydown === 'function') {
      activeModalEl._cleanupKeydown();
    }
    activeModalEl.remove();
    activeModalEl = null;
    document.body.classList.remove('modal-open');
    if (lastFocusedEl && typeof lastFocusedEl.focus === 'function') {
      lastFocusedEl.focus();
    }
  }
}

