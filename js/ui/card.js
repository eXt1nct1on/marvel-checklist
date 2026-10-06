/**
 * MCU & DC Tracker - Card Component
 * Renders individual movie/series cards with SVG procedural posters,
 * accessible watch toggles, interactive notes, and status badges.
 */

import { store } from '../store.js';
import { MOVIES } from '../data.js';
import { POSTERS } from '../posters.js';
import { openMovieModal } from './modal.js';

// Session-level poster failure cache to avoid retry loops
const failedPosters = new Set();

// Format release date for user display
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

// Generate procedural SVG poster without external assets
export function generatePosterSvg(movie) {
  const { title, universe, franchise, type, release } = movie;

  // Extract year
  const yearMatch = release ? release.match(/\d{4}/) : null;
  const year = yearMatch ? yearMatch[0] : '';

  // Calculate clean monogram (up to 3 characters)
  const words = title
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .split(/\s+/)
    .filter(Boolean);
  let monogram = '';
  if (words.length === 1) {
    monogram = words[0].substring(0, 3).toUpperCase();
  } else if (words.length === 2) {
    monogram = (words[0][0] + words[1][0]).toUpperCase();
  } else {
    monogram = (words[0][0] + words[1][0] + words[2][0]).toUpperCase();
  }

  // Theme colors & emblems per franchise / canon
  let gradientId = `grad_${movie.id.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
  let gradStart = '#1e293b';
  let gradEnd = '#0f172a';
  let accentColor = '#94a3b8';
  let emblemType = 'marvel';

  const franchiseLower = (franchise || '').toLowerCase();
  const canonLower = (movie.canon || '').toLowerCase();

  if (universe === 'Marvel') {
    if (franchise === 'MCU') {
      gradStart = '#b91c1c';
      gradEnd = '#450a0a';
      accentColor = '#f59e0b';
      emblemType = 'mcu';
    } else if (franchiseLower.includes('x-men')) {
      gradStart = '#1e3a8a';
      gradEnd = '#0f172a';
      accentColor = '#38bdf8';
      emblemType = 'xmen';
    } else if (franchiseLower.includes('spider')) {
      gradStart = '#991b1b';
      gradEnd = '#1e1b4b';
      accentColor = '#f43f5e';
      emblemType = 'spiderman';
    } else if (franchiseLower.includes('defenders') || franchiseLower.includes('marvel television')) {
      gradStart = '#881337';
      gradEnd = '#0f172a';
      accentColor = '#fb7185';
      emblemType = 'defenders';
    } else if (franchiseLower.includes('fantastic four')) {
      gradStart = '#0369a1';
      gradEnd = '#082f49';
      accentColor = '#38bdf8';
      emblemType = 'f4';
    } else {
      // Classic / Blade / Ghost Rider
      gradStart = '#450a0a';
      gradEnd = '#09090b';
      accentColor = '#ef4444';
      emblemType = 'marvel';
    }
  } else {
    // DC
    if (franchiseLower.includes('batman') || franchiseLower.includes('dark knight')) {
      gradStart = '#18181b';
      gradEnd = '#09090b';
      accentColor = '#eab308';
      emblemType = 'batman';
    } else if (franchiseLower.includes('superman')) {
      gradStart = '#1d4ed8';
      gradEnd = '#7f1d1d';
      accentColor = '#fbbf24';
      emblemType = 'superman';
    } else if (franchiseLower.includes('arrowverse')) {
      gradStart = '#065f46';
      gradEnd = '#022c22';
      accentColor = '#34d399';
      emblemType = 'arrow';
    } else if (franchiseLower.includes('snyderverse')) {
      gradStart = '#1e293b';
      gradEnd = '#090d16';
      accentColor = '#60a5fa';
      emblemType = 'dceu';
    } else if (franchiseLower.includes('elseworlds')) {
      gradStart = '#27272a';
      gradEnd = '#09090b';
      accentColor = '#f43f5e';
      emblemType = 'elseworlds';
    } else {
      // DCU / Other DC
      gradStart = '#0369a1';
      gradEnd = '#082f49';
      accentColor = '#38bdf8';
      emblemType = 'dcu';
    }
  }

  // Decorative emblem SVG snippet
  let emblemSvg = '';
  if (emblemType === 'xmen') {
    emblemSvg = `
      <circle cx="100" cy="120" r="46" fill="none" stroke="${accentColor}" stroke-width="4" stroke-opacity="0.3"/>
      <line x1="72" y1="92" x2="128" y2="148" stroke="${accentColor}" stroke-width="7" stroke-linecap="round"/>
      <line x1="128" y1="92" x2="72" y2="148" stroke="${accentColor}" stroke-width="7" stroke-linecap="round"/>
    `;
  } else if (emblemType === 'mcu') {
    emblemSvg = `
      <polygon points="100,75 140,105 140,155 100,185 60,155 60,105" fill="none" stroke="${accentColor}" stroke-width="3" stroke-opacity="0.4"/>
      <circle cx="100" cy="130" r="28" fill="none" stroke="${accentColor}" stroke-width="2.5" stroke-opacity="0.6"/>
      <polygon points="100,112 105,125 118,125 107,133 111,146 100,138 89,146 93,133 82,125 95,125" fill="${accentColor}" fill-opacity="0.9"/>
    `;
  } else if (emblemType === 'spiderman') {
    emblemSvg = `
      <ellipse cx="100" cy="125" rx="14" ry="22" fill="${accentColor}" fill-opacity="0.8"/>
      <circle cx="100" cy="100" r="8" fill="${accentColor}" fill-opacity="0.8"/>
      <path d="M 86 112 Q 60 100 50 82 M 114 112 Q 140 100 150 82 M 86 122 Q 55 120 45 110 M 114 122 Q 145 120 155 110 M 86 132 Q 58 142 48 160 M 114 132 Q 142 142 152 160" stroke="${accentColor}" stroke-width="3.5" fill="none" stroke-linecap="round"/>
    `;
  } else if (emblemType === 'batman') {
    emblemSvg = `
      <ellipse cx="100" cy="125" rx="42" ry="24" fill="none" stroke="${accentColor}" stroke-width="3.5" stroke-opacity="0.5"/>
      <path d="M 68 125 Q 85 108 92 120 L 96 114 L 100 120 L 104 114 L 108 120 Q 115 108 132 125 Q 120 142 100 135 Q 80 142 68 125 Z" fill="${accentColor}" fill-opacity="0.85"/>
    `;
  } else if (emblemType === 'superman') {
    emblemSvg = `
      <polygon points="100,85 145,110 135,160 100,175 65,160 55,110" fill="none" stroke="${accentColor}" stroke-width="3.5" stroke-opacity="0.5"/>
      <text x="100" y="146" font-family="system-ui, sans-serif" font-weight="900" font-size="34" fill="${accentColor}" text-anchor="middle" font-style="italic">S</text>
    `;
  } else if (emblemType === 'f4') {
    emblemSvg = `
      <circle cx="100" cy="125" r="38" fill="none" stroke="${accentColor}" stroke-width="3.5" stroke-opacity="0.5"/>
      <text x="100" y="142" font-family="system-ui, sans-serif" font-weight="900" font-size="36" fill="${accentColor}" text-anchor="middle">4</text>
    `;
  } else if (emblemType === 'arrow') {
    emblemSvg = `
      <circle cx="100" cy="125" r="40" fill="none" stroke="${accentColor}" stroke-width="3" stroke-opacity="0.4"/>
      <line x1="100" y1="88" x2="100" y2="162" stroke="${accentColor}" stroke-width="4.5" stroke-linecap="round"/>
      <polyline points="85,108 100,88 115,108" fill="none" stroke="${accentColor}" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>
    `;
  } else {
    // DC Emblem / Default
    emblemSvg = `
      <polygon points="100,82 145,108 135,165 100,182 65,165 55,108" fill="none" stroke="${accentColor}" stroke-width="3.5" stroke-opacity="0.4"/>
      <text x="100" y="142" font-family="system-ui, sans-serif" font-weight="900" font-size="28" fill="${accentColor}" text-anchor="middle" letter-spacing="1">${universe === 'DC' ? 'DC' : 'MVL'}</text>
    `;
  }

  // Type badge overlay on poster
  let typeOverlay = '';
  if (type === 'TV Series') {
    const sLabel = movie.seasons ? (movie.seasons === 1 ? '1 SEASON' : `${movie.seasons} SEASONS`) : 'SERIES';
    typeOverlay = `
      <rect x="15" y="22" width="75" height="18" rx="4" fill="rgba(0,0,0,0.65)" stroke="${accentColor}" stroke-width="1.2"/>
      <text x="52.5" y="35" font-family="system-ui, sans-serif" font-size="9" font-weight="800" fill="#ffffff" text-anchor="middle">${sLabel}</text>
    `;
  } else if (type === 'Special') {
    typeOverlay = `
      <rect x="15" y="22" width="55" height="18" rx="4" fill="rgba(0,0,0,0.65)" stroke="#f59e0b" stroke-width="1.2"/>
      <text x="42.5" y="35" font-family="system-ui, sans-serif" font-size="9" font-weight="800" fill="#f59e0b" text-anchor="middle">SPECIAL</text>
    `;
  } else if (type === 'Short') {
    typeOverlay = `
      <rect x="15" y="22" width="48" height="18" rx="4" fill="rgba(0,0,0,0.65)" stroke="#a855f7" stroke-width="1.2"/>
      <text x="39" y="35" font-family="system-ui, sans-serif" font-size="9" font-weight="800" fill="#c084fc" text-anchor="middle">SHORT</text>
    `;
  }

  return `
    <svg class="card-poster-svg" viewBox="0 0 200 300" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Poster placeholder for ${escapeHtml(title)}">
      <defs>
        <linearGradient id="${gradientId}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${gradStart}"/>
          <stop offset="60%" stop-color="${gradEnd}"/>
          <stop offset="100%" stop-color="#020617"/>
        </linearGradient>
        <radialGradient id="glow_${gradientId}" cx="50%" cy="40%" r="55%">
          <stop offset="0%" stop-color="${accentColor}" stop-opacity="0.3"/>
          <stop offset="100%" stop-color="${accentColor}" stop-opacity="0"/>
        </radialGradient>
      </defs>

      <!-- Background -->
      <rect width="200" height="300" rx="10" fill="url(#${gradientId})"/>
      <circle cx="100" cy="120" r="85" fill="url(#glow_${gradientId})"/>

      <!-- Ambient grid lines -->
      <line x1="20" y1="60" x2="180" y2="60" stroke="#ffffff" stroke-opacity="0.08" stroke-dasharray="2,3"/>
      <line x1="20" y1="220" x2="180" y2="220" stroke="#ffffff" stroke-opacity="0.08" stroke-dasharray="2,3"/>

      <!-- Center emblem -->
      ${emblemSvg}

      <!-- Monogram -->
      <text x="100" y="215" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="20" fill="#f8fafc" text-anchor="middle" letter-spacing="3" opacity="0.95">${escapeHtml(monogram)}</text>

      <!-- Year Pill Badge -->
      <rect x="140" y="22" width="45" height="18" rx="4" fill="rgba(0,0,0,0.65)"/>
      <text x="162.5" y="35" font-family="system-ui, sans-serif" font-size="11" font-weight="700" fill="#e2e8f0" text-anchor="middle">${escapeHtml(year)}</text>

      <!-- Type badge overlay -->
      ${typeOverlay}

      <!-- Bottom cinematic bar -->
      <rect x="0" y="270" width="200" height="30" fill="rgba(0,0,0,0.7)"/>
      <text x="100" y="289" font-family="system-ui, sans-serif" font-size="10" font-weight="800" fill="${accentColor}" text-anchor="middle" letter-spacing="1.5">${escapeHtml(franchise.toUpperCase().split('(')[0].trim())}</text>
    </svg>
  `;
}

// Helper to escape HTML characters
export function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Render a complete movie card element or HTML string
 * @param {Object} movie - Movie object
 * @param {Object} options - Render options
 * @returns {string} HTML string
 */
export function renderCardHtml(movie, options = {}) {
  const isWatched = store.isWatched(movie.id, movie.seasons);
  const watchedSeasons = store.getWatchedSeasons(movie.id);
  const isPartiallyWatched = !isWatched && watchedSeasons.length > 0;
  const watchedInfo = store.getWatchedInfo(movie.id);
  const isUpcoming = Boolean(movie.upcoming);

  // Badge list (designed as overlay chips)
  const badges = [];

  // Universe Badge
  const universeClass = movie.universe === 'Marvel' ? 'badge-marvel' : 'badge-dc';
  badges.push(`<span class="badge ${universeClass}">${escapeHtml(movie.universe)}</span>`);

  // Franchise Badge
  badges.push(`<span class="badge badge-franchise">${escapeHtml(movie.franchise.split('(')[0].trim())}</span>`);

  // Platform Badge
  if (movie.platform) {
    badges.push(`<span class="badge badge-platform">${escapeHtml(movie.platform)}</span>`);
  }

  // Doomsday relevance
  if (movie.doomsday === 'official') {
    const orderLabel = movie.doomsdayOrder ? `#${movie.doomsdayOrder}` : '';
    badges.push(`<span class="badge badge-doomsday-official" title="Official Disney+ Watchlist">Doomsday ${orderLabel}</span>`);
  } else if (movie.doomsday === 'optional') {
    badges.push(`<span class="badge badge-doomsday-optional" title="Recommended optional watch">Doomsday Pick</span>`);
  }

  // Type & Season Badges
  if (movie.type === 'TV Series') {
    const seasonsCount = movie.seasons || 1;
    badges.push(`<span class="badge badge-series">${seasonsCount} ${seasonsCount === 1 ? 'Season' : 'Seasons'}</span>`);
    if (isPartiallyWatched) {
      badges.push(`<span class="badge badge-partial" title="${watchedSeasons.length} of ${seasonsCount} seasons watched">${watchedSeasons.length}/${seasonsCount} S</span>`);
    }
  } else if (movie.type === 'Special') {
    badges.push(`<span class="badge badge-special">Special</span>`);
  } else if (movie.type === 'Short') {
    badges.push(`<span class="badge badge-short">Short</span>`);
  }

  // Upcoming badge
  if (isUpcoming) {
    badges.push(`<span class="badge badge-upcoming">Upcoming</span>`);
  }

  // Watched date display
  let watchedDateHtml = '';
  if (isWatched && watchedInfo && watchedInfo.watchedAt) {
    const dateObj = new Date(watchedInfo.watchedAt);
    const dateStr = !isNaN(dateObj.getTime())
      ? dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
      : 'Watched';
    watchedDateHtml = `<span class="watched-timestamp" title="Date Watched: ${dateStr}">Watched: ${dateStr}</span>`;
  }

  // Multi-season interactive checkboxes
  let seasonCheckboxesHtml = '';
  if (movie.type === 'TV Series' && movie.seasons && movie.seasons > 1 && !isUpcoming) {
    seasonCheckboxesHtml = `
      <div class="card-seasons-block">
        <div class="card-seasons-header">
          <span class="card-seasons-title">Seasons (${watchedSeasons.length}/${movie.seasons}):</span>
        </div>
        <div class="card-seasons-grid" role="group" aria-label="Seasons for ${escapeHtml(movie.title)}">
          ${Array.from({ length: movie.seasons }, (_, i) => i + 1).map((s) => {
            const isSeasonDone = watchedSeasons.includes(s);
            return `
              <button
                type="button"
                class="btn-season-toggle ${isSeasonDone ? 'is-season-watched' : ''}"
                data-movie-id="${escapeHtml(movie.id)}"
                data-season="${s}"
                data-total-seasons="${movie.seasons}"
                role="checkbox"
                aria-checked="${isSeasonDone}"
                aria-label="Season ${s} of ${escapeHtml(movie.title)}"
                title="Toggle Season ${s}"
              >
                S${s}
              </button>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  // Bottom action: Upcoming vs Checkbox
  let actionHtml = '';
  if (isUpcoming) {
    const formattedRelease = formatReleaseDisplay(movie.release);
    actionHtml = `
      <div class="card-action card-action-upcoming">
        <span class="coming-soon-label" aria-label="Not released yet. Coming ${escapeHtml(formattedRelease)}">
          <svg class="icon" viewBox="0 0 20 20" fill="currentColor" width="14" height="14" aria-hidden="true">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"/>
          </svg>
          Coming ${escapeHtml(formattedRelease)}
        </span>
      </div>
    `;
  } else {
    const btnLabel = isWatched
      ? 'Watched'
      : isPartiallyWatched
      ? `${watchedSeasons.length}/${movie.seasons} Watched`
      : 'Mark Watched';

    actionHtml = `
      <div class="card-action">
        <button
          type="button"
          class="btn-watch-toggle ${isWatched ? 'is-watched' : ''} ${isPartiallyWatched ? 'is-partially-watched' : ''}"
          data-movie-id="${escapeHtml(movie.id)}"
          data-total-seasons="${movie.seasons || ''}"
          role="checkbox"
          aria-checked="${isWatched}"
          aria-label="${isWatched ? 'Mark ' + escapeHtml(movie.title) + ' as unwatched' : 'Mark ' + escapeHtml(movie.title) + ' as watched'}"
        >
          <span class="checkbox-indicator" aria-hidden="true">
            <svg class="check-icon" viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
            </svg>
          </span>
          <span class="watch-btn-text">${btnLabel}</span>
        </button>
      </div>
    `;
  }

  // Doomsday reason callout
  let doomsdayReasonHtml = '';
  if (movie.doomsday === 'optional' && movie.doomsdayReason) {
    doomsdayReasonHtml = `
      <div class="card-doomsday-reason" title="${escapeHtml(movie.doomsdayReason)}">
        <span class="reason-icon">💡</span>
        <span class="reason-text"><strong>Doomsday Link:</strong> ${escapeHtml(movie.doomsdayReason)}</span>
      </div>
    `;
  }

  // Notes expander / info
  const hasNotes = Boolean(movie.notes && movie.notes.trim());
  const notesHtml = hasNotes
    ? `
      <div class="card-notes-wrapper">
        <button
          type="button"
          class="btn-notes-toggle"
          data-notes-target="notes-${escapeHtml(movie.id)}"
          aria-expanded="false"
          aria-controls="notes-${escapeHtml(movie.id)}"
          aria-label="Toggle notes for ${escapeHtml(movie.title)}"
          title="Curator notes"
        >
          <svg class="icon-info" viewBox="0 0 20 20" fill="currentColor" width="14" height="14" aria-hidden="true">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
          </svg>
          <span>Notes</span>
        </button>
        <div id="notes-${escapeHtml(movie.id)}" class="card-notes-content" hidden>
          <p>${escapeHtml(movie.notes)}</p>
        </div>
      </div>
    `
    : '';

  // Runtime info
  const runtimeDisplay = movie.runtimeMin ? `${movie.runtimeMin}m` : null;

  // Poster rendering (poster-first)
  const showPosters = store.getShowPosters();
  const posterEntry = showPosters ? POSTERS[movie.id] : null;
  const hasValidPoster = Boolean(posterEntry && posterEntry.posterPath && !failedPosters.has(movie.id));

  let posterMarkup = '';
  if (hasValidPoster) {
    const posterPath = posterEntry.posterPath;
    posterMarkup = `
      <div class="card-poster-wrap poster-shimmer">
        <img
          src="https://image.tmdb.org/t/p/w342${posterPath}"
          srcset="https://image.tmdb.org/t/p/w185${posterPath} 185w, https://image.tmdb.org/t/p/w342${posterPath} 342w, https://image.tmdb.org/t/p/w500${posterPath} 500w"
          sizes="(max-width: 480px) 185px, (max-width: 1024px) 342px, 500px"
          alt="Poster for ${escapeHtml(movie.title)}"
          class="card-poster-img"
          width="342"
          height="513"
          loading="lazy"
          decoding="async"
          referrerpolicy="no-referrer"
          data-movie-id="${escapeHtml(movie.id)}"
        />
      </div>
    `;
  } else {
    posterMarkup = `
      <div class="card-poster-wrap card-poster-svg-wrap">
        ${generatePosterSvg(movie)}
      </div>
    `;
  }

  return `
    <article
      class="movie-card ${isWatched ? 'is-watched' : ''} ${isPartiallyWatched ? 'is-partially-watched' : ''} ${isUpcoming ? 'is-upcoming' : ''} ${movie.doomsday === 'optional' ? 'is-doomsday-optional' : ''}"
      data-id="${escapeHtml(movie.id)}"
      data-universe="${escapeHtml(movie.universe)}"
      data-franchise="${escapeHtml(movie.franchise)}"
      data-canon="${escapeHtml(movie.canon || '')}"
      data-type="${escapeHtml(movie.type)}"
      data-tier="${escapeHtml(movie.tier || 'core')}"
      data-platform="${escapeHtml(movie.platform || '')}"
      data-doomsday="${escapeHtml(movie.doomsday)}"
      tabindex="0"
      role="button"
      aria-label="${escapeHtml(movie.title)}. Click to view details."
    >
      <div class="card-poster-container">
        ${posterMarkup}

        <div class="card-badges-overlay" aria-label="Tags">
          ${badges.join('')}
        </div>

        ${
          isWatched
            ? `
          <div class="card-watched-overlay" aria-label="Watched">
            <svg class="watched-check-icon" viewBox="0 0 20 20" fill="currentColor" width="22" height="22" aria-hidden="true">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
            </svg>
          </div>
        `
            : ''
        }
      </div>

      <div class="card-content">
        <h3 class="card-title" title="${escapeHtml(movie.title)}">${escapeHtml(movie.title)}</h3>

        <div class="card-meta">
          <span class="meta-release">${escapeHtml(formatReleaseDisplay(movie.release))}</span>
          <span class="meta-separator">•</span>
          <span class="meta-era">${escapeHtml(movie.era || 'Feature')}</span>
          ${runtimeDisplay ? `<span class="meta-separator">•</span><span class="meta-runtime">${escapeHtml(runtimeDisplay)}</span>` : ''}
        </div>

        ${watchedDateHtml}
        ${doomsdayReasonHtml}
        ${seasonCheckboxesHtml}
        ${notesHtml}
        ${actionHtml}
      </div>
    </article>
  `;
}

/**
 * Attach interactive event listeners to card elements within a container
 * @param {HTMLElement} container
 * @param {Function} onWatchedChange
 */
export function attachCardListeners(container, onWatchedChange = null) {
  if (!container) return;

  // 1. Poster image load and error handling (capturing phase)
  if (!container._posterHandlersAttached) {
    container.addEventListener(
      'error',
      (e) => {
        if (e.target && e.target.classList && e.target.classList.contains('card-poster-img')) {
          const movieId = e.target.getAttribute('data-movie-id');
          if (movieId) {
            failedPosters.add(movieId);
            const wrap = e.target.closest('.card-poster-wrap');
            const movie = MOVIES.find((m) => m.id === movieId);
            if (wrap && movie) {
              wrap.classList.remove('poster-shimmer');
              wrap.classList.add('card-poster-svg-wrap');
              wrap.innerHTML = generatePosterSvg(movie);
            }
          }
        }
      },
      true
    );

    container.addEventListener(
      'load',
      (e) => {
        if (e.target && e.target.classList && e.target.classList.contains('card-poster-img')) {
          const wrap = e.target.closest('.card-poster-wrap');
          if (wrap) {
            wrap.classList.remove('poster-shimmer');
          }
        }
      },
      true
    );

    container._posterHandlersAttached = true;
  }

  // 2. Click events (delegated)
  container.addEventListener('click', (e) => {
    // A. Season Checkbox Toggle
    const seasonBtn = e.target.closest('.btn-season-toggle');
    if (seasonBtn) {
      e.preventDefault();
      e.stopPropagation();
      const movieId = seasonBtn.getAttribute('data-movie-id');
      const seasonNum = parseInt(seasonBtn.getAttribute('data-season'), 10);
      const totalSeasons = parseInt(seasonBtn.getAttribute('data-total-seasons'), 10) || null;

      if (movieId && seasonNum) {
        const isFullyWatched = store.toggleSeasonWatched(movieId, seasonNum, totalSeasons);
        const card = seasonBtn.closest('.movie-card');
        const title = card ? card.querySelector('.card-title')?.textContent : movieId;
        const isSeasonNowDone = store.isSeasonWatched(movieId, seasonNum);
        announceLiveMessage(`Season ${seasonNum} of "${title}" marked as ${isSeasonNowDone ? 'watched' : 'unwatched'}`);

        if (typeof onWatchedChange === 'function') {
          onWatchedChange(movieId, isFullyWatched);
        }
      }
      return;
    }

    // B. Main Watch Toggle Button
    const watchBtn = e.target.closest('.btn-watch-toggle');
    if (watchBtn) {
      e.preventDefault();
      e.stopPropagation();
      const movieId = watchBtn.getAttribute('data-movie-id');
      const totalSeasons = parseInt(watchBtn.getAttribute('data-total-seasons'), 10) || null;

      if (movieId) {
        const isNowWatched = store.toggleWatched(movieId, null, totalSeasons);
        const card = watchBtn.closest('.movie-card');
        const title = card ? card.querySelector('.card-title')?.textContent : movieId;
        announceLiveMessage(`Marked "${title}" as ${isNowWatched ? 'watched' : 'unwatched'}`);

        if (typeof onWatchedChange === 'function') {
          onWatchedChange(movieId, isNowWatched);
        }
      }
      return;
    }

    // C. Notes expander toggle
    const notesBtn = e.target.closest('.btn-notes-toggle');
    if (notesBtn) {
      e.preventDefault();
      e.stopPropagation();
      const targetId = notesBtn.getAttribute('data-notes-target');
      const targetEl = document.getElementById(targetId);
      if (targetEl) {
        const isExpanded = notesBtn.getAttribute('aria-expanded') === 'true';
        notesBtn.setAttribute('aria-expanded', String(!isExpanded));
        targetEl.hidden = isExpanded;
        targetEl.classList.toggle('is-open', !isExpanded);
      }
      return;
    }

    // D. Card Click -> Open Detail Modal
    const card = e.target.closest('.movie-card');
    if (card) {
      const movieId = card.getAttribute('data-id');
      if (movieId) {
        const movie = MOVIES.find((m) => m.id === movieId);
        if (movie) {
          openMovieModal(movie, onWatchedChange);
        }
      }
    }
  });

  // 3. Keyboard accessibility for watch toggle on space/enter, or card click to open modal
  container.addEventListener('keydown', (e) => {
    if (e.key === ' ' || e.key === 'Enter') {
      const activeEl = document.activeElement;
      if (!activeEl) return;

      if (activeEl.classList.contains('btn-watch-toggle') || activeEl.classList.contains('btn-season-toggle')) {
        e.preventDefault();
        activeEl.click();
      } else if (activeEl.classList.contains('movie-card')) {
        e.preventDefault();
        const movieId = activeEl.getAttribute('data-id');
        const movie = MOVIES.find((m) => m.id === movieId);
        if (movie) {
          openMovieModal(movie, onWatchedChange);
        }
      }
    }
  });
}

/**
 * Accessible live announcement utility
 * @param {string} message
 */
export function announceLiveMessage(message) {
  let announcer = document.getElementById('aria-live-announcer');
  if (!announcer) {
    announcer = document.createElement('div');
    announcer.id = 'aria-live-announcer';
    announcer.className = 'sr-only';
    announcer.setAttribute('aria-live', 'polite');
    announcer.setAttribute('aria-atomic', 'true');
    document.body.appendChild(announcer);
  }
  announcer.textContent = message;
}
