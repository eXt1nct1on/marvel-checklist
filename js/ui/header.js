/**
 * MCU & DC Tracker - Header Component
 * Contains Logo, Navigation, Active Profile Dropdown Switcher,
 * Dark/Light Theme Toggle, and Storage Warning Banner.
 */

import { store } from '../store.js';
import { escapeHtml, announceLiveMessage } from './card.js';

/**
 * Initialize and render the global header
 * @param {HTMLElement} headerEl
 * @param {string} currentRoute - e.g. '#/home'
 */
export function renderHeader(headerEl, currentRoute = '#/home') {
  const activeProfile = store.getActiveProfile();
  const profiles = store.getProfiles();
  const prefs = store.getPrefs();
  const isDark = prefs.theme !== 'light';

  // Apply theme to document element
  document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');

  const navLinks = [
    { hash: '#/home', label: 'Home' },
    { hash: '#/progress', label: 'My Progress' },
    { hash: '#/plan', label: 'Watch Plan' },
    { hash: '#/profiles', label: 'Profiles' },
    { hash: '#/about', label: 'About' }
  ];

  const html = `
    <!-- Storage Warning Banner if private mode / storage unavailable -->
    ${
      !store.isStorageAvailable || store.hasStorageWarning
        ? `
        <div class="storage-warning-banner" role="alert">
          <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16" aria-hidden="true">
            <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
          </svg>
          <span>Progress can't be saved in this browser mode. Checklist is operating in temporary memory.</span>
        </div>
      `
        : ''
    }

    <header class="app-header">
      <div class="header-inner">
        <!-- Logo & Brand -->
        <a href="#/home" class="brand-logo" aria-label="MCU & DC Checklist Home">
          <div class="brand-emblem" aria-hidden="true">
            <span class="emblem-m">M</span>
            <span class="emblem-divider">/</span>
            <span class="emblem-dc">DC</span>
          </div>
          <div class="brand-text">
            <span class="brand-title">MULTIVERSE TRACKER</span>
            <span class="brand-subtitle">Marvel & DC Complete Checklist</span>
          </div>
        </a>

        <!-- Main Navigation Links -->
        <nav class="header-nav" aria-label="Main Navigation">
          <ul class="nav-list">
            ${navLinks.map((link) => {
              const isActive = currentRoute === link.hash || (link.hash === '#/home' && currentRoute === '#/');
              return `
                <li class="nav-item">
                  <a
                    href="${link.hash}"
                    class="nav-link ${isActive ? 'is-active' : ''}"
                    ${isActive ? 'aria-current="page"' : ''}
                  >
                    ${escapeHtml(link.label)}
                  </a>
                </li>
              `;
            }).join('')}
          </ul>
        </nav>

        <!-- Right Tools: Profile Switcher & Theme Toggle -->
        <div class="header-tools">
          <!-- Profile Dropdown -->
          <div class="profile-dropdown-wrapper">
            <button
              type="button"
              class="btn-profile-dropdown"
              id="btn-profile-toggle"
              aria-haspopup="true"
              aria-expanded="false"
              title="Active Profile: ${escapeHtml(activeProfile.name)}"
            >
              <span class="header-avatar" aria-hidden="true">
                ${escapeHtml(activeProfile.name.charAt(0).toUpperCase())}
              </span>
              <span class="header-profile-name">${escapeHtml(activeProfile.name)}</span>
              <svg class="dropdown-chevron" viewBox="0 0 20 20" fill="currentColor" width="14" height="14" aria-hidden="true">
                <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"/>
              </svg>
            </button>

            <!-- Dropdown Menu -->
            <div class="profile-menu" id="profile-dropdown-menu" hidden role="menu" aria-label="Profile Selection">
              <div class="profile-menu-header">
                <span>Switch Profile</span>
              </div>
              <ul class="profile-menu-list">
                ${profiles.map((p) => {
                  const isCurrent = p.id === activeProfile.id;
                  return `
                    <li role="none">
                      <button
                        type="button"
                        class="profile-menu-item ${isCurrent ? 'is-active' : ''}"
                        role="menuitem"
                        data-profile-id="${escapeHtml(p.id)}"
                      >
                        <span class="menu-avatar">${escapeHtml(p.name.charAt(0).toUpperCase())}</span>
                        <span class="menu-profile-name">${escapeHtml(p.name)}</span>
                        ${isCurrent ? `<span class="menu-check">✓</span>` : ''}
                      </button>
                    </li>
                  `;
                }).join('')}
              </ul>
              <div class="profile-menu-footer">
                <a href="#/profiles" class="menu-manage-link" role="menuitem">
                  Manage Profiles & Backups →
                </a>
              </div>
            </div>
          </div>

          <!-- Dark / Light Theme Toggle -->
          <button
            type="button"
            class="btn-theme-toggle"
            id="btn-theme-toggle"
            aria-label="${isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}"
            title="${isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}"
          >
            ${
              isDark
                ? `
                <!-- Sun Icon for Light Mode -->
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18" aria-hidden="true">
                  <circle cx="12" cy="12" r="5"></circle>
                  <line x1="12" y1="1" x2="12" y2="3"></line>
                  <line x1="12" y1="21" x2="12" y2="23"></line>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                  <line x1="1" y1="12" x2="3" y2="12"></line>
                  <line x1="21" y1="12" x2="23" y2="12"></line>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                </svg>
              `
                : `
                <!-- Moon Icon for Dark Mode -->
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18" aria-hidden="true">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                </svg>
              `
            }
          </button>
        </div>
      </div>
    </header>
  `;

  headerEl.innerHTML = html;

  // --- Attach Header Handlers ---

  // 1. Profile Dropdown Toggle
  const toggleBtn = headerEl.querySelector('#btn-profile-toggle');
  const menuEl = headerEl.querySelector('#profile-dropdown-menu');

  if (toggleBtn && menuEl) {
    toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isExpanded = toggleBtn.getAttribute('aria-expanded') === 'true';
      toggleBtn.setAttribute('aria-expanded', String(!isExpanded));
      menuEl.hidden = isExpanded;
    });

    // Close when clicking outside
    document.addEventListener('click', (e) => {
      if (!headerEl.contains(e.target)) {
        toggleBtn.setAttribute('aria-expanded', 'false');
        menuEl.hidden = true;
      }
    });

    // Switch profile item click
    menuEl.querySelectorAll('.profile-menu-item').forEach((item) => {
      item.addEventListener('click', () => {
        const id = item.getAttribute('data-profile-id');
        if (id) {
          store.setActiveProfile(id);
          toggleBtn.setAttribute('aria-expanded', 'false');
          menuEl.hidden = true;
          announceLiveMessage(`Switched active profile to ${store.getActiveProfile().name}`);
          // Trigger route re-render
          window.dispatchEvent(new CustomEvent('app:rerender'));
        }
      });
    });
  }

  // 2. Theme Toggle Button
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
