/**
 * MCU & DC Tracker - App Bootstrap & Hash Router
 */

import { store } from './store.js';
import { renderHeader } from './ui/header.js';
import { renderHomePage } from './ui/home-page.js';
import { renderProgressPage } from './ui/progress-page.js';
import { renderPlanPage } from './ui/plan-page.js';
import { renderProfilesPage } from './ui/profiles-page.js';
import { renderAboutPage } from './ui/about-page.js';

const ROUTES = {
  '#/home': { title: 'Home - Multiverse Checklist', render: renderHomePage },
  '#/progress': { title: 'My Progress - Multiverse Checklist', render: renderProgressPage },
  '#/plan': { title: 'Watch Plan - Multiverse Checklist', render: renderPlanPage },
  '#/profiles': { title: 'Profiles & Settings - Multiverse Checklist', render: renderProfilesPage },
  '#/about': { title: 'About & TMDB Attribution - Multiverse Checklist', render: renderAboutPage }
};

let currentRouteKey = null;
const routeContainers = {};

export function getRouteContainer(hash) {
  return routeContainers[hash];
}

function handleRoute() {
  let hash = window.location.hash || '#/home';
  if (hash === '#/' || hash === '' || hash === '#') {
    hash = '#/home';
  }

  if (!ROUTES[hash]) {
    window.location.hash = '#/home';
    return;
  }

  currentRouteKey = hash;
  const route = ROUTES[hash];
  document.title = route.title;

  const headerEl = document.getElementById('app-header-container');
  if (headerEl) {
    renderHeader(headerEl, hash);
  }

  const mainEl = document.getElementById('app-main');
  if (!mainEl) return;

  // Hide initial loading state
  const loading = mainEl.querySelector('.initial-loading-state');
  if (loading) loading.hidden = true;

  // Hide all routes
  Object.values(routeContainers).forEach(el => {
    el.hidden = true;
  });

  // Build if not exists
  if (!routeContainers[hash]) {
    const wrapper = document.createElement('div');
    wrapper.id = 'route-container-' + hash.replace('#/', '');
    wrapper.className = 'route-container';
    mainEl.appendChild(wrapper);
    route.render(wrapper);
    routeContainers[hash] = wrapper;
  }

  // Show
  routeContainers[hash].hidden = false;
  
  // On hash change, we don't force scroll top to preserve state, unless it's a new load
}

function checkFirstVisit() {
  const FIRST_VISIT_KEY = 'mcu-tracker:visited';
  try {
    const visited = window.localStorage?.getItem(FIRST_VISIT_KEY);
    if (!visited) {
      window.localStorage?.setItem(FIRST_VISIT_KEY, 'true');
      const activeProfile = store.getActiveProfile();
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
              // Rerender all routes to reflect name change
              Object.values(routeContainers).forEach(el => el.remove());
              for (const k in routeContainers) delete routeContainers[k];
              handleRoute();
            }
            welcomeBanner.hidden = true;
          });
        }
        if (closeBtn) closeBtn.addEventListener('click', () => welcomeBanner.hidden = true);
      }
    }
  } catch (e) {}
}

export function initApp() {
  window.addEventListener('hashchange', handleRoute);

  window.addEventListener('app:rerender', () => {
    // Re-render current route
    if (currentRouteKey && routeContainers[currentRouteKey]) {
      routeContainers[currentRouteKey].innerHTML = '';
      ROUTES[currentRouteKey].render(routeContainers[currentRouteKey]);
    }
  });

  store.subscribe((action) => {
    if (action === 'storage_sync' || action === 'profile_switch' || action === 'data_reset' || action === 'data_import' || action === 'prefs_changed') {
      // Complete nuke
      Object.values(routeContainers).forEach(el => el.remove());
      for (const k in routeContainers) delete routeContainers[k];
      handleRoute();
    }
  });

  handleRoute();
  checkFirstVisit();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
