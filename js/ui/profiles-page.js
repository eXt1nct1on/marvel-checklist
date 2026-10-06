/**
 * MCU & DC Tracker - Profiles Page (#/profiles)
 * Flat, comic-book editorial redesign.
 */

import { store } from '../store.js';
import { escapeHtml, announceLiveMessage } from './card.js';

export function renderProfilesPage(container) {
  const profiles = store.getProfiles();
  const activeProfile = store.getActiveProfile();
  const activeProfileId = store.getActiveProfileId();

  const html = `
    <div class="page-profiles" style="max-width: 1000px; margin: 0 auto; padding-top: 16px; border-top: 4px solid var(--text);">
      <h1 class="display-font" style="font-size: 48px; margin-bottom: 24px;">PROFILES & DATA</h1>
      
      <div style="display:flex; align-items:center; gap: 16px; padding: 16px; border: 2px solid var(--border); background: var(--surface); margin-bottom: 40px;">
        <div style="width: 48px; height: 48px; border: 2px solid var(--border); display: flex; align-items:center; justify-content:center; font-family: 'Bebas Neue', sans-serif; font-size: 24px; background: var(--red); color: var(--on-red);">
          ${escapeHtml(activeProfile.name.charAt(0).toUpperCase())}
        </div>
        <div>
          <strong style="display:block; font-size: 14px; letter-spacing:0.05em; color:var(--muted);">ACTIVE PROFILE</strong>
          <h2 class="display-font" style="font-size: 32px; margin:0;">${escapeHtml(activeProfile.name)}</h2>
        </div>
      </div>

      <section class="section-container" style="margin-bottom: 40px;">
        <h2 class="section-title">ALL PROFILES</h2>
        <div class="grid-container">
          ${profiles.map(p => {
            const isActive = p.id === activeProfileId;
            const watchedCount = Object.keys(p.watched || {}).length;
            return `
              <div style="border: 2px solid ${isActive ? 'var(--red)' : 'var(--border)'}; background: var(--surface); padding: 16px; display:flex; flex-direction:column; gap:16px;">
                <div>
                  <h3 class="display-font" style="font-size: 24px; margin:0;">${escapeHtml(p.name)}</h3>
                  <span style="font-size:12px; color:var(--muted);">${watchedCount} titles watched</span>
                </div>
                <div style="display:flex; gap:8px;">
                  ${isActive ? '<button class="btn btn-sm" disabled style="opacity:0.5; cursor:not-allowed;">Active</button>' : `<button class="btn btn-sm btn-primary btn-switch-profile" data-profile-id="${escapeHtml(p.id)}">Switch</button>`}
                  <button class="btn btn-sm btn-rename-profile" data-profile-id="${escapeHtml(p.id)}" data-profile-name="${escapeHtml(p.name)}">Rename</button>
                  ${profiles.length > 1 ? `<button class="btn btn-sm btn-delete-profile" style="color:var(--red-text);" data-profile-id="${escapeHtml(p.id)}" data-profile-name="${escapeHtml(p.name)}">Delete</button>` : ''}
                </div>
              </div>
            `;
          }).join('')}
          <div style="border: 2px dashed var(--border); padding: 16px; display:flex; flex-direction:column; justify-content:center; gap: 8px;">
            <strong style="font-size: 14px;">+ NEW PROFILE</strong>
            <form id="form-create-profile" style="display:flex; gap:8px;">
              <input type="text" id="input-new-profile-name" style="flex:1; padding:4px 8px; border:2px solid var(--border); background:var(--bg); color:var(--text);" placeholder="Name" required maxlength="32">
              <button type="submit" class="btn btn-sm btn-primary">Add</button>
            </form>
          </div>
        </div>
      </section>

      <section class="section-container" style="margin-bottom: 40px;">
        <h2 class="section-title">PREFERENCES</h2>
        <div style="display:flex; flex-direction:column; gap:16px;">
          <div style="display:flex; align-items:center; justify-content:space-between; border:2px solid var(--border); padding:16px; background:var(--surface);">
            <div>
              <strong style="display:block;">Movie & Series Posters</strong>
              <span style="font-size:12px; color:var(--muted);">Disable to use data-saver placeholder mode</span>
            </div>
            <label><input type="checkbox" id="toggle-show-posters" ${store.getShowPosters() ? 'checked' : ''}> Show</label>
          </div>
          <div style="display:flex; align-items:center; justify-content:space-between; border:2px solid var(--border); padding:16px; background:var(--surface);">
            <div>
              <strong style="display:block;">Doomsday Optional Picks</strong>
              <span style="font-size:12px; color:var(--muted);">Include 14 optional titles with official 15</span>
            </div>
            <label><input type="checkbox" id="toggle-doomsday-optional-pref" ${store.getDoomsdayIncludeOptional() ? 'checked' : ''}> Include</label>
          </div>
          
          <div style="border:2px solid var(--border); padding:16px; background:var(--surface);">
            <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom: 16px;">
              <div>
                <strong style="display:block;">Background Video</strong>
                <span style="font-size:12px; color:var(--muted);">Looping YouTube embed</span>
              </div>
              <label><input type="checkbox" id="toggle-bg-video" ${(activeProfile.prefs.bgVideo !== false && (activeProfile.prefs.bgVideo === true || window.innerWidth >= 720)) ? 'checked' : ''}> Enable</label>
            </div>
            <div>
              <div style="display:flex; justify-content:space-between; margin-bottom: 4px;">
                <label for="range-bg-video-opacity" style="font-size: 14px; font-weight: bold;">Video Opacity</label>
                <span id="label-bg-video-opacity" style="font-size: 14px;">${activeProfile.prefs.bgVideoOpacity !== undefined ? activeProfile.prefs.bgVideoOpacity : (document.documentElement.getAttribute('data-theme') === 'light' ? 0.30 : 0.20)}</span>
              </div>
              <input type="range" id="range-bg-video-opacity" min="0.05" max="0.40" step="0.05" value="${activeProfile.prefs.bgVideoOpacity !== undefined ? activeProfile.prefs.bgVideoOpacity : (document.documentElement.getAttribute('data-theme') === 'light' ? 0.30 : 0.20)}" style="width: 100%;">
            </div>
          </div>
        </div>
      </section>

      <section class="section-container" style="margin-bottom: 40px;">
        <h2 class="section-title">DATA MANAGEMENT</h2>
        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap:16px;">
          <div style="border:2px solid var(--border); padding:16px; background:var(--surface);">
            <strong style="display:block; margin-bottom:16px;">EXPORT</strong>
            <div style="display:flex; flex-direction:column; gap:8px;">
              <button type="button" class="btn btn-sm btn-primary" id="btn-export-active">Export "${escapeHtml(activeProfile.name)}"</button>
              <button type="button" class="btn btn-sm" id="btn-export-all">Export All Profiles</button>
            </div>
          </div>
          <div style="border:2px solid var(--border); padding:16px; background:var(--surface);">
            <strong style="display:block; margin-bottom:16px;">IMPORT</strong>
            <div style="margin-bottom:16px; font-size:14px;">
              <label style="display:block;"><input type="radio" name="import-mode" value="merge" checked> Merge</label>
              <label style="display:block;"><input type="radio" name="import-mode" value="replace"> Replace All Data</label>
            </div>
            <div style="display:flex; flex-direction:column; gap:8px;">
              <input type="file" id="input-import-file" accept=".json" style="display:none;">
              <button type="button" class="btn btn-sm" id="btn-trigger-file">Choose File...</button>
              <span id="selected-file-name" style="font-size:12px; color:var(--muted);">No file selected</span>
              <button type="button" class="btn btn-sm btn-primary" id="btn-run-import" disabled>Import Data</button>
            </div>
          </div>
        </div>
      </section>

      <section class="section-container" style="margin-top: 48px; border-top: 4px solid var(--border); padding-top: 24px;">
        <strong style="display:block; color:var(--red-text); margin-bottom:16px;">DANGER ZONE</strong>
        <button type="button" class="btn" style="border-color:var(--red-text); color:var(--red-text);" id="btn-danger-reset">Factory Reset All Data</button>
      </section>
    </div>
  `;

  container.innerHTML = html;

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

  container.querySelectorAll('.btn-switch-profile').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-profile-id');
      if (id) {
        store.setActiveProfile(id);
        announceLiveMessage(`Switched to profile "${store.getActiveProfile().name}"`);
        renderProfilesPage(container);
      }
    });
  });

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

  container.querySelectorAll('.btn-delete-profile').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-profile-id');
      const name = btn.getAttribute('data-profile-name');
      if (confirm(`Delete profile "${name}"? Cannot be undone.`)) {
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
      announceLiveMessage(`Optional picks ${e.target.checked ? 'included' : 'excluded'}`);
      renderProfilesPage(container);
    });
  }

  const bgVideoToggle = container.querySelector('#toggle-bg-video');
  if (bgVideoToggle) {
    bgVideoToggle.addEventListener('change', (e) => {
      store.updatePrefs({ bgVideo: e.target.checked });
      announceLiveMessage(`Background video ${e.target.checked ? 'enabled' : 'disabled'}`);
      // Re-render handled by store subscribe -> prefs_changed in app.js if we wanted,
      // but re-rendering just this page is fine:
      renderProfilesPage(container);
    });
  }

  const bgVideoOpacityRange = container.querySelector('#range-bg-video-opacity');
  const bgVideoOpacityLabel = container.querySelector('#label-bg-video-opacity');
  if (bgVideoOpacityRange) {
    bgVideoOpacityRange.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      if (bgVideoOpacityLabel) bgVideoOpacityLabel.textContent = val.toFixed(2);
      store.updatePrefs({ bgVideoOpacity: val });
    });
  }

  const exportActiveBtn = container.querySelector('#btn-export-active');
  if (exportActiveBtn) {
    exportActiveBtn.addEventListener('click', () => {
      const json = store.exportData('active');
      downloadJsonFile(json, `mcu-tracker-${slugify(activeProfile.name)}-${getTodayDateString()}.json`);
    });
  }

  const exportAllBtn = container.querySelector('#btn-export-all');
  if (exportAllBtn) {
    exportAllBtn.addEventListener('click', () => {
      const json = store.exportData('all');
      downloadJsonFile(json, `mcu-tracker-full-backup-${getTodayDateString()}.json`);
    });
  }

  const fileInput = container.querySelector('#input-import-file');
  const triggerFileBtn = container.querySelector('#btn-trigger-file');
  const fileNameDisplay = container.querySelector('#selected-file-name');
  const runImportBtn = container.querySelector('#btn-run-import');
  let fileContent = null;

  if (triggerFileBtn && fileInput) triggerFileBtn.addEventListener('click', () => fileInput.click());

  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (file) {
        fileNameDisplay.textContent = file.name;
        const reader = new FileReader();
        reader.onload = (event) => { fileContent = event.target.result; runImportBtn.disabled = false; };
        reader.onerror = () => { alert('Failed to read file.'); runImportBtn.disabled = true; };
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
        alert(`Imported ${res.count} profile(s)!`);
        renderProfilesPage(container);
      } catch (err) {
        alert(`Import Error: ${err.message}`);
      }
    });
  }

  const dangerResetBtn = container.querySelector('#btn-danger-reset');
  if (dangerResetBtn) {
    dangerResetBtn.addEventListener('click', () => {
      if (confirm('WARNING: Erase all data?')) {
        if (prompt('Type "RESET" to confirm:') === 'RESET') {
          store.resetAllData();
          alert('Data reset.');
          renderProfilesPage(container);
        }
      }
    });
  }
}

function downloadJsonFile(content, fileName) {
  const blob = new Blob([content], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = fileName;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function slugify(text) { return (text || 'user').toLowerCase().replace(/[^a-z0-9]+/g, '-'); }
function getTodayDateString() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
}
