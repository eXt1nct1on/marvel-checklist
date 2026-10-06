/**
 * MCU & DC Tracker — Header Component
 * Renders .app-header (inner aligner) + .mobile-nav inside the .app-header-wrap container.
 */

import { store } from '../store.js';
import { escapeHtml, announceLiveMessage } from './card.js';

export function renderHeader(headerEl, currentRoute = '#/home') {
  const activeProfile = store.getActiveProfile();
  const profiles = store.getProfiles();
  const prefs = store.getPrefs();
  const isDark = prefs.theme !== 'light';

  document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');

  const navLinks = [
    { hash: '#/home',     label: 'Home' },
    { hash: '#/progress', label: 'Progress' },
    { hash: '#/plan',     label: 'Plan' },
    { hash: '#/profiles', label: 'Profiles' },
    { hash: '#/about',    label: 'About' },
  ];

  const html = `
    ${!store.isStorageAvailable || store.hasStorageWarning ? `
      <div style="background:var(--red);color:var(--on-red);padding:6px 16px;text-align:center;font-weight:bold;font-size:13px;">
        Progress can't be saved in this browser mode.
      </div>
    ` : ''}

    <header class="app-header">
      <a href="#/home" class="header-brand">MULTIVERSE TRACKER</a>

      <nav class="header-nav" aria-label="Main navigation">
        ${navLinks.map(link => {
          const isActive = currentRoute === link.hash || (link.hash === '#/home' && currentRoute === '#/');
          return `<a href="${link.hash}" class="${isActive ? 'is-active' : ''}">${escapeHtml(link.label)}</a>`;
        }).join('')}
      </nav>

      <div class="header-controls">
        <select id="profile-select" class="btn btn-sm" style="appearance:none;cursor:pointer;" aria-label="Switch Profile">
          ${profiles.map(p => `
            <option value="${escapeHtml(p.id)}" ${p.id === activeProfile.id ? 'selected' : ''}>
              ${escapeHtml(p.name)}
            </option>
          `).join('')}
        </select>

        <button type="button" class="btn btn-sm" id="btn-theme-toggle" aria-label="${isDark ? 'Switch to light theme' : 'Switch to dark theme'}">
          ${isDark
            ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16" aria-hidden="true"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`
            : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`
          }
        </button>
      </div>
    </header>

    <!-- Mobile Bottom Nav -->
    <nav class="mobile-nav" aria-label="Mobile navigation">
      ${navLinks.map(link => {
        const isActive = currentRoute === link.hash || (link.hash === '#/home' && currentRoute === '#/');
        return `<a href="${link.hash}" class="${isActive ? 'is-active' : ''}" aria-label="${escapeHtml(link.label)}">${escapeHtml(link.label)}</a>`;
      }).join('')}
    </nav>
  `;

  headerEl.innerHTML = html;

  const profileSelect = headerEl.querySelector('#profile-select');
  if (profileSelect) {
    profileSelect.addEventListener('change', (e) => {
      const id = e.target.value;
      if (id) {
        store.setActiveProfile(id);
        announceLiveMessage(`Switched to profile: ${store.getActiveProfile().name}`);
        window.dispatchEvent(new CustomEvent('app:rerender'));
      }
    });
  }

  const themeBtn = headerEl.querySelector('#btn-theme-toggle');
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', newTheme);
      store.updatePrefs({ theme: newTheme });
      announceLiveMessage(`Switched to ${newTheme} theme`);
      renderHeader(headerEl, currentRoute);
    });
  }
}
