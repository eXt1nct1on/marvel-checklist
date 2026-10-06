/**
 * MCU & DC Tracker - App Bootstrap & Hash Router
 * Handles hash-based routing (#/home, #/progress, #/plan, #/profiles),
 * layout rendering, active link states, and route lifecycle.
 */

import { store } from './store.js';
import { renderHeader } from './ui/header.js';
import { renderHomePage, destroyHomePage } from './ui/home-page.js';
import { renderProgressPage } from './ui/progress-page.js';
import { renderPlanPage } from './ui/plan-page.js';
import { renderProfilesPage } from './ui/profiles-page.js';
import { renderAboutPage } from './ui/about-page.js';

// Route registry
const ROUTES = {
  '#/home': {
    title: 'Home - Multiverse Checklist',
    render: renderHomePage,
    destroy: destroyHomePage
  },
  '#/progress': {
    title: 'My Progress - Multiverse Checklist',
    render: renderProgressPage
  },
  '#/plan': {
    title: 'Watch Plan - Multiverse Checklist',
    render: renderPlanPage
  },
  '#/profiles': {
    title: 'Profiles & Settings - Multiverse Checklist',
    render: renderProfilesPage
  },
  '#/about': {
    title: 'About & TMDB Attribution - Multiverse Checklist',
    render: renderAboutPage
  }
};

let currentRouteKey = null;

/**
 * Handle client-side hash routing
 */
function handleRoute() {
  let hash = window.location.hash || '#/home';
  if (hash === '#/' || hash === '' || hash === '#') {
    hash = '#/home';
  }

  // Normalize unknown hashes to #/home
  if (!ROUTES[hash]) {
    window.location.hash = '#/home';
    return;
  }

  // Cleanup prior route
  if (currentRouteKey && ROUTES[currentRouteKey]?.destroy) {
    try {
      ROUTES[currentRouteKey].destroy();
    } catch (e) {
      console.warn('Error during route teardown:', e);
    }
  }

  currentRouteKey = hash;
  const route = ROUTES[hash];

  // Update browser document title
  document.title = route.title;

  // Render Header
  const headerEl = document.getElementById('app-header-container');
  if (headerEl) {
    renderHeader(headerEl, hash);
  }

  // Render Main Content
  const mainEl = document.getElementById('app-main');
  if (mainEl) {
    mainEl.innerHTML = '';
    route.render(mainEl);

    // Scroll to top of page on route transition
    window.scrollTo({ top: 0, behavior: 'instant' });

    // Accessible focus management
    mainEl.focus();
  }
}

/**
 * First visit check & modal
 */
function checkFirstVisit() {
  const FIRST_VISIT_KEY = 'mcu-tracker:visited';
  try {
    const visited = window.localStorage?.getItem(FIRST_VISIT_KEY);
    if (!visited) {
      window.localStorage?.setItem(FIRST_VISIT_KEY, 'true');
      const activeProfile = store.getActiveProfile();
      // If default profile name is "Me", show a friendly non-blocking welcome banner
      const welcomeBanner = document.getElementById('welcome-banner');
      if (welcomeBanner) {
        welcomeBanner.hidden = false;
        const nameInput = welcomeBanner.querySelector('#welcome-name-input');
        const saveBtn = welcomeBanner.querySelector('#welcome-name-save');
        const closeBtn = welcomeBanner.querySelector('#welcome-close-btn');

        if (saveBtn && nameInput) {
          saveBtn.addEventListener('click', () => {
            const val = nameInput.value.trim();
            if (val) {
              store.renameProfile(activeProfile.id, val);
              handleRoute();
            }
            welcomeBanner.hidden = true;
          });
        }

        if (closeBtn) {
          closeBtn.addEventListener('click', () => {
            welcomeBanner.hidden = true;
          });
        }
      }
    }
  } catch (e) {
    // Ignore private mode errors
  }
}

/**
 * Bootstrap Application
 */
export function initApp() {
  // Listen for hash changes
  window.addEventListener('hashchange', handleRoute);

  // Custom re-render event
  window.addEventListener('app:rerender', () => {
    handleRoute();
  });

  // Cross-tab store synchronization
  store.subscribe((action) => {
    if (action === 'storage_sync' || action === 'profile_switch' || action === 'data_reset' || action === 'data_import') {
      handleRoute();
    }
  });

  // Initial Route Render
  handleRoute();

  // First Visit Welcome Dialog
  checkFirstVisit();
}

// Auto-boot on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
