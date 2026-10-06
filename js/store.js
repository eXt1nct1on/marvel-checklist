/**
 * MCU & DC Tracker - Store Module
 * Handles per-user browser persistence, multi-profile management,
 * JSON export/import, cross-tab sync, and corruption recovery.
 */

const STORAGE_KEY = 'mcu-tracker:v1';
const BACKUP_KEY = 'mcu-tracker:v1:backup';
const CURRENT_VERSION = 2;
export const DATA_VERSION = 2;

/**
 * Creates default user preferences
 */
function createDefaultPrefs() {
  return {
    theme: 'dark',
    showPosters: true,
    catalogScope: 'core', // 'core' | 'extended' | 'everything'
    doomsdayIncludeOptional: false,
    includeOptionalInSliderA: false,
    dailyWatchMin: 60,
    filters: {
      universe: 'all', // 'all' | 'Marvel' | 'DC'
      type: 'all', // 'all' | 'Movie' | 'TV Series' | 'Special' | 'Short'
      canon: 'all', // 'all' | 'MCU canon' | 'Non-MCU Marvel' | ...
      platform: 'all', // 'all' | 'Theaters' | 'Disney+' | 'Netflix' | 'Max' | ...
      collection: 'all', // 'all' | collection string
      franchises: [], // array of franchise strings
      status: 'all', // 'all' | 'watched' | 'unwatched'
      search: '',
      sort: 'release', // 'release' | 'chrono' | 'shortest' | 'longest'
      runtime: 'all', // 'all' | 'under-2h' | '2h-to-3h' | 'over-3h' | 'series'
      view: 'slider' // 'slider' | 'grid'
    }
  };
}

/**
 * Creates a brand new profile
 * @param {string} id
 * @param {string} name
 */
function createProfileObject(id, name = 'Me') {
  return {
    id,
    name: name.trim() || 'Me',
    createdAt: new Date().toISOString(),
    watched: {}, // { [movieId]: { watchedAt: ISOString } }
    plan: null, // { order, scope, skipWatched, generatedAt, ids }
    prefs: createDefaultPrefs()
  };
}

/**
 * Creates initial store structure
 */
function createInitialStore(defaultProfileName = 'Me') {
  const defaultId = 'profile_default';
  return {
    version: CURRENT_VERSION,
    activeProfileId: defaultId,
    profiles: {
      [defaultId]: createProfileObject(defaultId, defaultProfileName)
    }
  };
}

class Store {
  constructor() {
    this.state = null;
    this.isStorageAvailable = true;
    this.hasStorageWarning = false;
    this.listeners = new Set();
    this.init();
    this.setupCrossTabSync();
  }

  /**
   * Safe access to localStorage
   */
  getStorage() {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage;
    }
    return null;
  }

  /**
   * Initialize state from localStorage with corruption recovery
   */
  init() {
    let raw = null;
    const storage = this.getStorage();
    if (!storage) {
      this.isStorageAvailable = false;
      this.hasStorageWarning = true;
      this.state = createInitialStore('Me');
      return;
    }

    try {
      // Test localStorage availability
      const testKey = '__storage_test__';
      storage.setItem(testKey, testKey);
      storage.removeItem(testKey);
      raw = storage.getItem(STORAGE_KEY);
      this.isStorageAvailable = true;
    } catch (err) {
      console.warn('localStorage is unavailable (e.g. private mode or cookies disabled). Falling back to in-memory storage.', err);
      this.isStorageAvailable = false;
      this.hasStorageWarning = true;
      this.state = createInitialStore('Me');
      return;
    }

    if (!raw) {
      // First visit: initialize default profile
      this.state = createInitialStore('Me');
      this.persist();
      return;
    }

    try {
      const parsed = JSON.parse(raw);
      this.state = this.migrateAndValidate(parsed);
      this.persist();
    } catch (err) {
      console.error('Corrupted JSON detected in localStorage! Creating backup and starting clean.', err);
      try {
        storage.setItem(BACKUP_KEY, raw);
      } catch (backupErr) {
        console.error('Failed to save corrupted backup:', backupErr);
      }
      this.state = createInitialStore('Me');
      this.persist();
    }
  }

  /**
   * Migrate and validate schema
   */
  migrateAndValidate(data) {
    if (!data || typeof data !== 'object') {
      throw new Error('Data root is not an object');
    }

    // Version migration hook
    let migrated = this.migrate(data);

    if (!migrated.profiles || typeof migrated.profiles !== 'object') {
      migrated.profiles = {};
    }

    const profileKeys = Object.keys(migrated.profiles);
    if (profileKeys.length === 0) {
      const defaultId = 'profile_default';
      migrated.profiles[defaultId] = createProfileObject(defaultId, 'Me');
      migrated.activeProfileId = defaultId;
    }

    if (!migrated.activeProfileId || !migrated.profiles[migrated.activeProfileId]) {
      migrated.activeProfileId = profileKeys[0] || 'profile_default';
    }

    // Ensure all profiles have proper subfields
    const defaultPrefs = createDefaultPrefs();
    for (const [id, prof] of Object.entries(migrated.profiles)) {
      if (!prof.watched || typeof prof.watched !== 'object') prof.watched = {};
      if (!prof.prefs || typeof prof.prefs !== 'object') prof.prefs = createDefaultPrefs();
      if (!prof.prefs.catalogScope) prof.prefs.catalogScope = defaultPrefs.catalogScope;
      if (prof.prefs.showPosters === undefined) prof.prefs.showPosters = true;
      if (prof.prefs.doomsdayIncludeOptional === undefined) {
        prof.prefs.doomsdayIncludeOptional = prof.prefs.includeOptionalInSliderA ?? false;
      }
      if (!prof.prefs.filters || typeof prof.prefs.filters !== 'object') {
        prof.prefs.filters = { ...defaultPrefs.filters };
      } else {
        prof.prefs.filters = {
          ...defaultPrefs.filters,
          ...prof.prefs.filters
        };
      }
      if (!prof.id) prof.id = id;
      if (!prof.name) prof.name = 'Profile';
    }

    return migrated;
  }

  /**
   * Schema migration handler
   */
  migrate(data) {
    const version = data.version || 1;
    if (version < CURRENT_VERSION) {
      // Future version migrations can be chained here
      data.version = CURRENT_VERSION;
    }
    return data;
  }

  /**
   * Synchronously persist state to localStorage
   */
  persist() {
    if (!this.isStorageAvailable) {
      return;
    }
    const storage = this.getStorage();
    if (!storage) return;

    try {
      const serialized = JSON.stringify(this.state);
      storage.setItem(STORAGE_KEY, serialized);
    } catch (err) {
      console.error('Failed to save to localStorage:', err);
      this.isStorageAvailable = false;
      this.hasStorageWarning = true;
    }
  }

  /**
   * Listen for changes from other tabs
   */
  setupCrossTabSync() {
    if (typeof window === 'undefined' || typeof window.addEventListener !== 'function') {
      return;
    }
    window.addEventListener('storage', (event) => {
      if (event.key === STORAGE_KEY && event.newValue) {
        try {
          const parsed = JSON.parse(event.newValue);
          this.state = this.migrateAndValidate(parsed);
          this.notify('storage_sync');
        } catch (err) {
          console.warn('Received invalid data from storage event:', err);
        }
      }
    });
  }

  /**
   * Subscribe to state change notifications
   */
  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Notify all subscribers
   */
  notify(action, payload = null) {
    for (const listener of this.listeners) {
      try {
        listener(action, payload, this.state);
      } catch (err) {
        console.error('Error in store subscriber:', err);
      }
    }
  }

  // --- Profile Management ---

  getActiveProfileId() {
    return this.state.activeProfileId;
  }

  getActiveProfile() {
    return this.state.profiles[this.state.activeProfileId] || Object.values(this.state.profiles)[0];
  }

  getProfiles() {
    return Object.values(this.state.profiles);
  }

  setActiveProfile(id) {
    if (this.state.profiles[id]) {
      this.state.activeProfileId = id;
      this.persist();
      this.notify('profile_switch', { id });
      return true;
    }
    return false;
  }

  createProfile(name) {
    const cleanName = (name || '').trim() || `Profile ${Object.keys(this.state.profiles).length + 1}`;
    const id = `profile_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newProfile = createProfileObject(id, cleanName);
    this.state.profiles[id] = newProfile;
    this.state.activeProfileId = id;
    this.persist();
    this.notify('profile_create', { profile: newProfile });
    return newProfile;
  }

  renameProfile(id, newName) {
    const cleanName = (newName || '').trim();
    if (!cleanName || !this.state.profiles[id]) return false;
    this.state.profiles[id].name = cleanName;
    this.persist();
    this.notify('profile_rename', { id, name: cleanName });
    return true;
  }

  deleteProfile(id) {
    const keys = Object.keys(this.state.profiles);
    if (keys.length <= 1) {
      throw new Error('Cannot delete the last remaining profile.');
    }
    if (!this.state.profiles[id]) return false;

    delete this.state.profiles[id];

    // If deleted profile was active, switch to first remaining profile
    if (this.state.activeProfileId === id) {
      this.state.activeProfileId = Object.keys(this.state.profiles)[0];
    }

    this.persist();
    this.notify('profile_delete', { id });
    return true;
  }

  // --- Watched Checklist Management ---

  getCatalogScope() {
    const profile = this.getActiveProfile();
    return (profile && profile.prefs && profile.prefs.catalogScope) || 'core';
  }

  setCatalogScope(scope) {
    this.updatePrefs({ catalogScope: scope });
    this.notify('catalog_scope_change', { scope });
  }

  getShowPosters() {
    const profile = this.getActiveProfile();
    return (profile && profile.prefs && profile.prefs.showPosters !== undefined) ? Boolean(profile.prefs.showPosters) : true;
  }

  setShowPosters(val) {
    const boolVal = Boolean(val);
    this.updatePrefs({ showPosters: boolVal });
    this.notify('show_posters_toggle', { showPosters: boolVal });
  }

  getDoomsdayIncludeOptional() {
    const profile = this.getActiveProfile();
    return Boolean(profile && profile.prefs && (profile.prefs.doomsdayIncludeOptional ?? profile.prefs.includeOptionalInSliderA));
  }

  setDoomsdayIncludeOptional(val) {
    const boolVal = Boolean(val);
    this.updatePrefs({ doomsdayIncludeOptional: boolVal, includeOptionalInSliderA: boolVal });
    this.notify('doomsday_toggle', { doomsdayIncludeOptional: boolVal });
  }

  getDailyWatchMin() {
    const profile = this.getActiveProfile();
    return (profile && profile.prefs && profile.prefs.dailyWatchMin) || 60;
  }

  setDailyWatchMin(val) {
    let min = parseInt(val, 10);
    if (isNaN(min) || min < 15) min = 15;
    if (min > 600) min = 600;
    this.updatePrefs({ dailyWatchMin: min });
    this.notify('daily_watch_min_changed', { dailyWatchMin: min });
  }

  isWatched(movieId, totalSeasons = null) {
    const profile = this.getActiveProfile();
    const entry = profile && profile.watched && profile.watched[movieId];
    if (!entry) return false;
    if (totalSeasons && totalSeasons > 1 && Array.isArray(entry.seasons)) {
      return entry.seasons.length >= totalSeasons;
    }
    return true;
  }

  getWatchedInfo(movieId) {
    const profile = this.getActiveProfile();
    return (profile && profile.watched && profile.watched[movieId]) || null;
  }

  getWatchedSeasons(movieId) {
    const profile = this.getActiveProfile();
    const entry = profile && profile.watched && profile.watched[movieId];
    return (entry && Array.isArray(entry.seasons)) ? entry.seasons : [];
  }

  isSeasonWatched(movieId, seasonNum) {
    return this.getWatchedSeasons(movieId).includes(seasonNum);
  }

  toggleSeasonWatched(movieId, seasonNum, totalSeasons = null) {
    const profile = this.getActiveProfile();
    if (!profile) return false;

    if (!profile.watched[movieId]) {
      profile.watched[movieId] = {
        watchedAt: new Date().toISOString(),
        seasons: [seasonNum]
      };
    } else {
      const current = new Set(profile.watched[movieId].seasons || []);
      if (current.has(seasonNum)) {
        current.delete(seasonNum);
      } else {
        current.add(seasonNum);
      }
      const updatedList = Array.from(current).sort((a, b) => a - b);
      if (updatedList.length === 0) {
        delete profile.watched[movieId];
      } else {
        profile.watched[movieId].seasons = updatedList;
      }
    }

    const isFullyWatched = this.isWatched(movieId, totalSeasons);
    this.persist();
    this.notify('watched_toggle', {
      movieId,
      watched: isFullyWatched,
      profileId: profile.id
    });
    return isFullyWatched;
  }

  getWatchedMap() {
    const profile = this.getActiveProfile();
    return (profile && profile.watched) || {};
  }

  getWatchedCount() {
    const profile = this.getActiveProfile();
    return Object.keys((profile && profile.watched) || {}).length;
  }

  toggleWatched(movieId, customDate = null, totalSeasons = null) {
    const profile = this.getActiveProfile();
    if (!profile) return false;

    const isCurrentlyWatched = this.isWatched(movieId, totalSeasons);
    if (isCurrentlyWatched) {
      delete profile.watched[movieId];
    } else {
      const newEntry = {
        watchedAt: customDate || new Date().toISOString()
      };
      if (totalSeasons && totalSeasons > 1) {
        newEntry.seasons = Array.from({ length: totalSeasons }, (_, i) => i + 1);
      }
      profile.watched[movieId] = newEntry;
    }

    this.persist();
    this.notify('watched_toggle', {
      movieId,
      watched: !isCurrentlyWatched,
      profileId: profile.id
    });
    return !isCurrentlyWatched;
  }

  setWatchedDate(movieId, dateInput) {
    const profile = this.getActiveProfile();
    if (!profile || !profile.watched[movieId]) return false;

    let isoDate;
    if (dateInput instanceof Date) {
      isoDate = dateInput.toISOString();
    } else if (typeof dateInput === 'string') {
      const parsed = new Date(dateInput);
      isoDate = isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
    } else {
      isoDate = new Date().toISOString();
    }

    profile.watched[movieId].watchedAt = isoDate;
    this.persist();
    this.notify('watched_date_update', { movieId, watchedAt: isoDate });
    return true;
  }

  // --- Watch Plan Management ---

  getPlan() {
    const profile = this.getActiveProfile();
    return (profile && profile.plan) || null;
  }

  setPlan(planObj) {
    const profile = this.getActiveProfile();
    if (!profile) return false;

    profile.plan = {
      order: planObj.order,
      scope: planObj.scope,
      skipWatched: Boolean(planObj.skipWatched),
      generatedAt: new Date().toISOString(),
      ids: Array.isArray(planObj.ids) ? [...planObj.ids] : []
    };

    this.persist();
    this.notify('plan_update', { plan: profile.plan });
    return true;
  }

  clearPlan() {
    const profile = this.getActiveProfile();
    if (!profile) return false;

    profile.plan = null;
    this.persist();
    this.notify('plan_clear', { profileId: profile.id });
    return true;
  }

  // --- Preferences & UI State ---

  getPrefs() {
    const profile = this.getActiveProfile();
    return (profile && profile.prefs) || createDefaultPrefs();
  }

  updatePrefs(partialPrefs) {
    const profile = this.getActiveProfile();
    if (!profile) return;

    profile.prefs = {
      ...profile.prefs,
      ...partialPrefs
    };

    if (partialPrefs.filters) {
      profile.prefs.filters = {
        ...profile.prefs.filters,
        ...partialPrefs.filters
      };
    }

    this.persist();
    this.notify('prefs_update', { prefs: profile.prefs });
  }

  // --- Import / Export / Reset ---

  exportData(scope = 'all') {
    if (scope === 'active') {
      const active = this.getActiveProfile();
      return JSON.stringify(
        {
          exportType: 'single_profile',
          exportedAt: new Date().toISOString(),
          version: CURRENT_VERSION,
          profile: active
        },
        null,
        2
      );
    }

    return JSON.stringify(
      {
        exportType: 'full_backup',
        exportedAt: new Date().toISOString(),
        ...this.state
      },
      null,
      2
    );
  }

  importData(jsonString, mode = 'merge') {
    let data;
    try {
      data = JSON.parse(jsonString);
    } catch (e) {
      throw new Error('Invalid JSON format. Please select a valid backup file.');
    }

    if (!data || typeof data !== 'object') {
      throw new Error('Invalid data structure.');
    }

    // Case 1: Single Profile Import
    if (data.exportType === 'single_profile' && data.profile) {
      const prof = data.profile;
      if (!prof.name) prof.name = 'Imported Profile';
      const newId = `imported_${Date.now()}`;
      prof.id = newId;
      if (!prof.watched) prof.watched = {};
      if (!prof.prefs) prof.prefs = createDefaultPrefs();

      this.state.profiles[newId] = prof;
      this.state.activeProfileId = newId;
      this.persist();
      this.notify('data_import', { mode: 'single_profile' });
      return { success: true, count: 1 };
    }

    // Case 2: Full Backup Import
    if (data.profiles && typeof data.profiles === 'object') {
      if (mode === 'replace') {
        this.state = this.migrateAndValidate(data);
      } else {
        // Merge profiles
        for (const [id, prof] of Object.entries(data.profiles)) {
          const targetId = this.state.profiles[id] ? `import_${id}_${Date.now()}` : id;
          this.state.profiles[targetId] = {
            ...prof,
            id: targetId,
            name: this.state.profiles[id] ? `${prof.name} (Imported)` : prof.name,
            watched: { ...(prof.watched || {}) },
            prefs: { ...(prof.prefs || createDefaultPrefs()) }
          };
        }
      }
      this.persist();
      this.notify('data_import', { mode });
      return { success: true, count: Object.keys(data.profiles).length };
    }

    throw new Error('Unrecognized backup format. Please ensure this is an MCU Tracker export file.');
  }

  resetAllData() {
    this.state = createInitialStore('Me');
    this.persist();
    this.notify('data_reset');
    return true;
  }
}

// Global store singleton
export const store = new Store();
export default store;
