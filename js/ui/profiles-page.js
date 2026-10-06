/**
 * MCU & DC Tracker - Profiles Page (#/profiles)
 * Features:
 * 1. Profile Switcher, Creator, Renamer, and Deleter (with confirmations)
 * 2. Complete data isolation between profiles
 * 3. JSON Export (active profile or full backup)
 * 4. JSON Import (merge or replace modes, schema validation, friendly error handling)
 * 5. Factory reset with double confirmation
 * 6. Browser-only storage persistence note
 */

import { store } from '../store.js';
import { escapeHtml, announceLiveMessage } from './card.js';

/**
 * Render Profiles page
 * @param {HTMLElement} container
 */
export function renderProfilesPage(container) {
  const profiles = store.getProfiles();
  const activeProfile = store.getActiveProfile();
  const activeProfileId = store.getActiveProfileId();

  const html = `
    <div class="page-profiles">
      <!-- Profiles Header -->
      <section class="profiles-header" aria-labelledby="profiles-header-title">
        <div class="profiles-header-content">
          <span class="hero-badge">MULTI-USER SYSTEM</span>
          <h1 id="profiles-header-title" class="page-title">Profiles & Data Management</h1>
          <p class="page-subtitle">
            Manage separate checklists for family or friends, export backups, and synchronize across devices.
          </p>
        </div>
      </section>

      <!-- Active Profile Card -->
      <section class="section-container active-profile-spotlight" aria-labelledby="active-prof-title">
        <div class="spotlight-card">
          <div class="spotlight-avatar">
            <span class="avatar-letter">${escapeHtml(activeProfile.name.charAt(0).toUpperCase())}</span>
          </div>
          <div class="spotlight-info">
            <span class="spotlight-tag">CURRENT ACTIVE PROFILE</span>
            <h2 id="active-prof-title" class="spotlight-name">${escapeHtml(activeProfile.name)}</h2>
            <div class="spotlight-meta">
              <span>Watched: <strong>${Object.keys(activeProfile.watched || {}).length}</strong> titles</span>
              <span>•</span>
              <span>
                Plan: <strong>${activeProfile.plan ? activeProfile.plan.scope + ' (' + activeProfile.plan.order + ')' : 'None active'}</strong>
              </span>
              <span>•</span>
              <span>Created: ${new Date(activeProfile.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Profiles List & Creation Grid -->
      <section class="section-container" aria-labelledby="manage-profiles-title">
        <div class="section-header">
          <div class="section-title-wrap">
            <h2 id="manage-profiles-title" class="section-title">All Profiles (${profiles.length})</h2>
            <p class="section-desc">Each profile maintains a distinct checklist, watch plan, and view preferences.</p>
          </div>
        </div>

        <div class="profiles-grid">
          ${profiles.map((p) => {
            const isActive = p.id === activeProfileId;
            const watchedCount = Object.keys(p.watched || {}).length;

            return `
              <div class="profile-card ${isActive ? 'is-active-profile' : ''}" data-profile-id="${escapeHtml(p.id)}">
                <div class="profile-card-header">
                  <div class="profile-card-avatar">${escapeHtml(p.name.charAt(0).toUpperCase())}</div>
                  <div class="profile-card-title-wrap">
                    <h3 class="profile-card-name">${escapeHtml(p.name)}</h3>
                    <span class="profile-card-subtitle">${watchedCount} titles watched</span>
                  </div>
                  ${isActive ? `<span class="badge badge-active-profile">Active</span>` : ''}
                </div>

                <div class="profile-card-actions">
                  ${
                    !isActive
                      ? `
                      <button
                        type="button"
                        class="btn btn-primary btn-sm btn-switch-profile"
                        data-profile-id="${escapeHtml(p.id)}"
                      >
                        Switch Profile
                      </button>
                    `
                      : `
                      <button type="button" class="btn btn-secondary btn-sm" disabled>
                        Active Now
                      </button>
                    `
                  }

                  <button
                    type="button"
                    class="btn btn-secondary btn-sm btn-rename-profile"
                    data-profile-id="${escapeHtml(p.id)}"
                    data-profile-name="${escapeHtml(p.name)}"
                    title="Rename this profile"
                  >
                    Rename
                  </button>

                  ${
                    profiles.length > 1
                      ? `
                      <button
                        type="button"
                        class="btn btn-danger-outline btn-sm btn-delete-profile"
                        data-profile-id="${escapeHtml(p.id)}"
                        data-profile-name="${escapeHtml(p.name)}"
                        title="Delete this profile"
                      >
                        Delete
                      </button>
                    `
                      : ''
                  }
                </div>
              </div>
            `;
          }).join('')}

          <!-- Create New Profile Card -->
          <div class="profile-create-card">
            <h3 class="create-card-title">+ New Profile</h3>
            <p class="create-card-desc">Add another checklist tracker for a friend or alternate watch order.</p>
            <form id="form-create-profile" class="create-profile-form">
              <input
                type="text"
                id="input-new-profile-name"
                class="form-input"
                placeholder="Profile Name (e.g., Alex, Family)"
                maxlength="32"
                required
              />
              <button type="submit" class="btn btn-primary btn-sm">
                Create Profile
              </button>
            </form>
          </div>
        </div>
      </section>

      <!-- Profile Preferences Section -->
      <section class="section-container profile-prefs-section" aria-labelledby="profile-prefs-title">
        <div class="section-header">
          <div class="section-title-wrap">
            <span class="section-kicker">CUSTOMIZATION</span>
            <h2 id="profile-prefs-title" class="section-title">Display & Experience Preferences</h2>
            <p class="section-desc">Customize how posters, tiers, and preparation lists are displayed for <strong>${escapeHtml(activeProfile.name)}</strong>.</p>
          </div>
        </div>

        <div class="prefs-card-grid">
          <!-- Poster Display Toggle -->
          <div class="pref-card">
            <div class="pref-card-content">
              <div class="pref-icon">🖼️</div>
              <div class="pref-info">
                <h3 class="pref-title">Movie & Series Posters</h3>
                <p class="pref-desc">
                  Load official high-resolution posters from TMDB. Disable to enable data-saver mode with generated SVG cards.
                </p>
              </div>
            </div>
            <label class="toggle-control" for="toggle-show-posters">
              <input
                type="checkbox"
                id="toggle-show-posters"
                class="toggle-checkbox"
                ${store.getShowPosters() ? 'checked' : ''}
              />
              <span class="toggle-slider"></span>
              <span class="toggle-label">${store.getShowPosters() ? 'Posters Enabled' : 'Data Saver (SVG Only)'}</span>
            </label>
          </div>

          <!-- Doomsday Optional Picks Preference -->
          <div class="pref-card">
            <div class="pref-card-content">
              <div class="pref-icon">🔥</div>
              <div class="pref-info">
                <h3 class="pref-title">Before Doomsday Optional Picks</h3>
                <p class="pref-desc">
                  Include 14 recommended multiverse background titles alongside the 15 official chapters in Doomsday tracking.
                </p>
              </div>
            </div>
            <label class="toggle-control" for="toggle-doomsday-optional-pref">
              <input
                type="checkbox"
                id="toggle-doomsday-optional-pref"
                class="toggle-checkbox"
                ${store.getDoomsdayIncludeOptional() ? 'checked' : ''}
              />
              <span class="toggle-slider"></span>
              <span class="toggle-label">${store.getDoomsdayIncludeOptional() ? '+ Optional (29 titles)' : 'Official only (15 titles)'}</span>
            </label>
          </div>
        </div>
      </section>

      <!-- Backup & Restore (Export / Import) -->
      <section class="section-container" aria-labelledby="data-transfer-title">
        <div class="section-header">
          <div class="section-title-wrap">
            <span class="section-kicker">PORTABILITY</span>
            <h2 id="data-transfer-title" class="section-title">Backup, Export & Import</h2>
            <p class="section-desc">Move your checklist across browsers, phones, and computers using portable JSON files.</p>
          </div>
        </div>

        <div class="data-transfer-grid">
          <!-- Export Block -->
          <div class="data-card export-card">
            <div class="data-card-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="28" height="28" aria-hidden="true">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
            </div>
            <h3 class="data-card-title">Export Progress</h3>
            <p class="data-card-desc">
              Download your saved progress as a JSON file to keep a permanent backup or transfer to another device.
            </p>
            <div class="data-card-buttons">
              <button type="button" class="btn btn-primary" id="btn-export-active">
                Export "${escapeHtml(activeProfile.name)}" Only
              </button>
              <button type="button" class="btn btn-secondary" id="btn-export-all">
                Export All Profiles & Settings
              </button>
            </div>
          </div>

          <!-- Import Block -->
          <div class="data-card import-card">
            <div class="data-card-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="28" height="28" aria-hidden="true">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"></path>
                <polyline points="17 8 12 3 7 8"></polyline>
                <line x1="12" y1="3" x2="12" y2="15"></line>
              </svg>
            </div>
            <h3 class="data-card-title">Import Progress</h3>
            <p class="data-card-desc">
              Load an existing JSON backup file into this browser.
            </p>
            <div class="import-mode-options">
              <label class="radio-label">
                <input type="radio" name="import-mode" value="merge" checked />
                <span>Merge with existing profiles</span>
              </label>
              <label class="radio-label">
                <input type="radio" name="import-mode" value="replace" />
                <span>Replace all data</span>
              </label>
            </div>
            <div class="file-input-wrapper">
              <input type="file" id="input-import-file" accept=".json,application/json" class="file-input" />
              <button type="button" class="btn btn-secondary" id="btn-trigger-file">
                Choose Backup File (.json)
              </button>
              <span id="selected-file-name" class="selected-file-name">No file selected</span>
            </div>
            <button type="button" class="btn btn-primary" id="btn-run-import" disabled>
              Import Data
            </button>
          </div>
        </div>
      </section>

      <!-- Danger Zone: Factory Reset -->
      <section class="section-container danger-zone-container" aria-labelledby="danger-zone-title">
        <div class="danger-zone-card">
          <div class="danger-zone-info">
            <h3 id="danger-zone-title" class="danger-zone-title">Danger Zone: Reset All Data</h3>
            <p class="danger-zone-desc">
              This will permanently delete all profiles, checklists, watch plans, and custom settings from this browser. This cannot be undone.
            </p>
          </div>
          <button type="button" class="btn btn-danger" id="btn-danger-reset">
            Reset All My Data
          </button>
        </div>
      </section>

      <!-- Storage Note Footer -->
      <footer class="profiles-footer-note" role="note">
        <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18" aria-hidden="true">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
        </svg>
        <p>
          <strong>Notice:</strong> Your data lives in this browser only. Use <strong>Export</strong> to back it up or move it to another device.
        </p>
      </footer>
    </div>
  `;

  container.innerHTML = html;

  // --- Attach Event Listeners ---

  // 1. Create Profile Form
  const createForm = container.querySelector('#form-create-profile');
  if (createForm) {
    createForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = container.querySelector('#input-new-profile-name');
      if (input && input.value.trim()) {
        const newProf = store.createProfile(input.value.trim());
        announceLiveMessage(`Created profile "${newProf.name}"`);
        renderProfilesPage(container);
      }
    });
  }

  // 2. Switch Profile Buttons
  container.querySelectorAll('.btn-switch-profile').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-profile-id');
      if (id) {
        store.setActiveProfile(id);
        const name = store.getActiveProfile().name;
        announceLiveMessage(`Switched to profile "${name}"`);
        renderProfilesPage(container);
      }
    });
  });

  // 3. Rename Profile Buttons
  container.querySelectorAll('.btn-rename-profile').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-profile-id');
      const currentName = btn.getAttribute('data-profile-name') || '';
      const newName = prompt(`Enter new name for "${currentName}":`, currentName);
      if (newName && newName.trim() && newName.trim() !== currentName) {
        store.renameProfile(id, newName.trim());
        announceLiveMessage(`Renamed profile to "${newName.trim()}"`);
        renderProfilesPage(container);
      }
    });
  });

  // 4. Delete Profile Buttons
  container.querySelectorAll('.btn-delete-profile').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-profile-id');
      const name = btn.getAttribute('data-profile-name');
      if (confirm(`Are you sure you want to delete profile "${name}"? This action cannot be undone.`)) {
        try {
          store.deleteProfile(id);
          announceLiveMessage(`Deleted profile "${name}"`);
          renderProfilesPage(container);
        } catch (err) {
          alert(err.message);
        }
      }
    });
  });

  // 4b. Profile Preferences Toggles
  const posterToggle = container.querySelector('#toggle-show-posters');
  if (posterToggle) {
    posterToggle.addEventListener('change', (e) => {
      store.setShowPosters(e.target.checked);
      announceLiveMessage(`Posters ${e.target.checked ? 'enabled' : 'disabled (Data Saver active)'}`);
      renderProfilesPage(container);
    });
  }

  const doomsdayPrefToggle = container.querySelector('#toggle-doomsday-optional-pref');
  if (doomsdayPrefToggle) {
    doomsdayPrefToggle.addEventListener('change', (e) => {
      store.setDoomsdayIncludeOptional(e.target.checked);
      announceLiveMessage(`Before Doomsday optional picks ${e.target.checked ? 'included' : 'excluded'}`);
      renderProfilesPage(container);
    });
  }

  // 5. Export Active Profile
  const exportActiveBtn = container.querySelector('#btn-export-active');
  if (exportActiveBtn) {
    exportActiveBtn.addEventListener('click', () => {
      const json = store.exportData('active');
      downloadJsonFile(json, `mcu-tracker-${slugify(activeProfile.name)}-${getTodayDateString()}.json`);
      announceLiveMessage('Exported profile backup file.');
    });
  }

  // Export All Profiles
  const exportAllBtn = container.querySelector('#btn-export-all');
  if (exportAllBtn) {
    exportAllBtn.addEventListener('click', () => {
      const json = store.exportData('all');
      downloadJsonFile(json, `mcu-tracker-full-backup-${getTodayDateString()}.json`);
      announceLiveMessage('Exported complete backup file.');
    });
  }

  // 6. Import File Handler
  const fileInput = container.querySelector('#input-import-file');
  const triggerFileBtn = container.querySelector('#btn-trigger-file');
  const fileNameDisplay = container.querySelector('#selected-file-name');
  const runImportBtn = container.querySelector('#btn-run-import');

  let fileContent = null;

  if (triggerFileBtn && fileInput) {
    triggerFileBtn.addEventListener('click', () => {
      fileInput.click();
    });
  }

  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (file) {
        fileNameDisplay.textContent = file.name;
        const reader = new FileReader();
        reader.onload = (event) => {
          fileContent = event.target.result;
          runImportBtn.disabled = false;
        };
        reader.onerror = () => {
          alert('Failed to read file.');
          runImportBtn.disabled = true;
        };
        reader.readAsText(file);
      } else {
        fileNameDisplay.textContent = 'No file selected';
        runImportBtn.disabled = true;
      }
    });
  }

  if (runImportBtn) {
    runImportBtn.addEventListener('click', () => {
      if (!fileContent) return;
      const mode = container.querySelector('input[name="import-mode"]:checked')?.value || 'merge';

      try {
        const res = store.importData(fileContent, mode);
        alert(`Successfully imported ${res.count} profile(s)!`);
        announceLiveMessage('Data imported successfully.');
        renderProfilesPage(container);
      } catch (err) {
        alert(`Import Error: ${err.message}`);
      }
    });
  }

  // 7. Danger Zone Reset Handler (Double confirmation)
  const dangerResetBtn = container.querySelector('#btn-danger-reset');
  if (dangerResetBtn) {
    dangerResetBtn.addEventListener('click', () => {
      const firstConfirm = confirm('WARNING: Are you sure you want to reset ALL data? This will erase all profiles and checklist progress.');
      if (firstConfirm) {
        const doubleConfirm = prompt('FINAL CONFIRMATION: Type "RESET" in all caps below to delete all data and start fresh:');
        if (doubleConfirm === 'RESET') {
          store.resetAllData();
          alert('All tracker data has been reset to defaults.');
          announceLiveMessage('Tracker data reset.');
          renderProfilesPage(container);
        } else {
          alert('Reset canceled. Input did not match "RESET".');
        }
      }
    });
  }
}

/**
 * Trigger browser file download
 */
function downloadJsonFile(content, fileName) {
  const blob = new Blob([content], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function slugify(text) {
  return (text || 'user').toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

function getTodayDateString() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
