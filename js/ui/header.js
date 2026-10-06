/**
 * MCU & DC Tracker - Header Component
 * Contains Logo, Navigation, Active Profile, Theme Toggle.
 * Includes Mobile Bottom Navigation for smaller screens.
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
    { hash: '#/home', label: 'Home', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>' },
    { hash: '#/progress', label: 'Progress', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>' },
    { hash: '#/plan', label: 'Plan', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>' },
    { hash: '#/profiles', label: 'Profiles', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>' },
    { hash: '#/about', label: 'About', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>' }
  ];

  const html = \`
    \${!store.isStorageAvailable || store.hasStorageWarning ? \`
      <div style="background:var(--red); color:var(--on-red); padding: 8px; text-align: center; font-weight:bold; font-size:14px;">
        Progress can't be saved in this browser mode. Operating in temporary memory.
      </div>
    \` : ''}

    <header class="app-header">
      <a href="#/home" class="header-brand">
        MULTIVERSE TRACKER
      </a>

      <nav class="header-nav">
        \${navLinks.map((link) => {
          const isActive = currentRoute === link.hash || (link.hash === '#/home' && currentRoute === '#/');
          return \`<a href="\${link.hash}" class="\${isActive ? 'is-active' : ''}">\${escapeHtml(link.label)}</a>\`;
        }).join('')}
      </nav>

      <div class="header-controls">
        <select id="profile-select" class="btn btn-sm" style="appearance: none; padding-right: 24px; cursor: pointer;" aria-label="Switch Profile">
          \${profiles.map(p => \`
            <option value="\${escapeHtml(p.id)}" \${p.id === activeProfile.id ? 'selected' : ''}>
              \${escapeHtml(p.name)}
            </option>
          \`).join('')}
        </select>
        
        <button type="button" class="btn btn-sm" id="btn-theme-toggle" aria-label="Toggle Theme">
          \${isDark 
            ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>'
            : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>'
          }
        </button>
      </div>
    </header>

    <!-- Mobile Bottom Navigation -->
    <nav class="mobile-nav">
      \${navLinks.map((link) => {
        const isActive = currentRoute === link.hash || (link.hash === '#/home' && currentRoute === '#/');
        return \`
          <a href="\${link.hash}" class="\${isActive ? 'is-active' : ''}" aria-label="\${escapeHtml(link.label)}">
            \${link.icon}
            <span>\${escapeHtml(link.label)}</span>
          </a>
        \`;
      }).join('')}
    </nav>
  \`;

  headerEl.innerHTML = html;

  const profileSelect = headerEl.querySelector('#profile-select');
  if (profileSelect) {
    profileSelect.addEventListener('change', (e) => {
      const id = e.target.value;
      if (id) {
        store.setActiveProfile(id);
        announceLiveMessage(\`Switched active profile to \${store.getActiveProfile().name}\`);
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
      announceLiveMessage(\`Switched to \${newTheme} theme\`);
      renderHeader(headerEl, currentRoute);
    });
  }
}
