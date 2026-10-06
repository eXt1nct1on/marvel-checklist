import { BG_CONFIG } from './bg-config.js';
import { store } from './store.js';

let player = null;
let apiLoaded = false;
let ytIframeScriptAdded = false;

function shouldLoadVideo() {
  // Respect reduced motion
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
  
  // Respect data constraints
  if (navigator.connection) {
    if (navigator.connection.saveData) return false;
    if (['slow-2g', '2g', '3g'].includes(navigator.connection.effectiveType)) return false;
  }
  
  // Mobile size (using arbitrary breakpoint 720px based on prompt)
  if (window.innerWidth < 720) return false;
  
  // User prefs
  const profile = store.getActiveProfile();
  
  // Default logic matching the request (ON for desktop, OFF for mobile)
  // Our desktop check is above (innerWidth < 720 returns false early)
  // But wait, the user's prefs should override. If it's explicitly OFF, don't load.
  if (profile.prefs.bgVideo === false) {
    return false;
  }
  
  return true;
}

export function initBgVideoFacade() {
  const layer = document.getElementById('bg-video-layer');
  if (!layer) return;

  // 4. Poster first (facade): set immediately
  layer.style.backgroundImage = `url(https://i.ytimg.com/vi/${BG_CONFIG.VIDEO_ID}/maxresdefault.jpg)`;
  
  // fallback image on error
  const img = new Image();
  img.src = `https://i.ytimg.com/vi/${BG_CONFIG.VIDEO_ID}/maxresdefault.jpg`;
  img.onerror = () => {
    layer.style.backgroundImage = `url(https://i.ytimg.com/vi/${BG_CONFIG.VIDEO_ID}/hqdefault.jpg)`;
  };

  updateVideoLayerOpacity();

  if (!shouldLoadVideo()) {
    return;
  }

  // Load after window load + requestIdleCallback (2s timeout)
  if (document.readyState === 'complete') {
    scheduleVideoLoad();
  } else {
    window.addEventListener('load', scheduleVideoLoad, { once: true });
  }
}

function scheduleVideoLoad() {
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => loadYouTubeAPI(), { timeout: 2000 });
  } else {
    setTimeout(() => loadYouTubeAPI(), 2000);
  }
}

function loadYouTubeAPI() {
  if (ytIframeScriptAdded) return;
  ytIframeScriptAdded = true;
  
  const tag = document.createElement('script');
  tag.src = "https://www.youtube.com/iframe_api";
  const firstScriptTag = document.getElementsByTagName('script')[0];
  firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
}

// YouTube API callback
window.onYouTubeIframeAPIReady = function() {
  apiLoaded = true;
  if (!shouldLoadVideo()) return; // Re-check in case it changed
  
  const layer = document.getElementById('bg-video-layer');
  const iframeContainer = document.createElement('div');
  iframeContainer.id = 'bg-video-iframe';
  layer.appendChild(iframeContainer);
  
  const params = {
    autoplay: 1,
    mute: 1,
    controls: 0,
    disablekb: 1,
    fs: 0,
    rel: 0,
    iv_load_policy: 3,
    playsinline: 1,
    modestbranding: 1,
    origin: location.origin,
    enablejsapi: 1
  };
  
  if (BG_CONFIG.START !== null) params.start = BG_CONFIG.START;
  if (BG_CONFIG.END !== null) params.end = BG_CONFIG.END;
  
  let playerStartedPlay = false;
  let errorFired = false;
  
  // 8 second timeout to reach PLAYING
  const timeoutId = setTimeout(() => {
    if (!playerStartedPlay && !errorFired) {
      console.info("YouTube player failed to start playing within 8 seconds. Falling back to poster.");
      removeIframe();
    }
  }, 8000);

  player = new YT.Player('bg-video-iframe', {
    host: 'https://www.youtube-nocookie.com',
    videoId: BG_CONFIG.VIDEO_ID,
    playerVars: params,
    events: {
      'onReady': onPlayerReady,
      'onStateChange': onPlayerStateChange,
      'onError': (e) => {
        errorFired = true;
        console.info(`YouTube player error: ${e.data}. Falling back to poster.`);
        removeIframe();
      }
    }
  });

  function onPlayerReady(event) {
    event.target.mute();
    event.target.playVideo();
  }

  function onPlayerStateChange(event) {
    if (event.data === YT.PlayerState.PLAYING) {
      if (!playerStartedPlay) {
        playerStartedPlay = true;
        clearTimeout(timeoutId);
        const iframe = player.getIframe();
        iframe.tabIndex = -1; // ensure tabindex is -1
        iframe.title = `YouTube video player`; 
        iframe.classList.add('playing');
      }
    }
    
    if (event.data === YT.PlayerState.ENDED) {
      if (BG_CONFIG.START !== null) {
        player.seekTo(BG_CONFIG.START);
      } else {
        player.seekTo(0);
      }
      player.playVideo();
    }
  }
}

function removeIframe() {
  if (player) {
    try {
      player.destroy();
    } catch(e){}
    player = null;
  }
  const iframe = document.querySelector('#bg-video-layer iframe');
  if (iframe) iframe.remove();
}

function updateVideoLayerOpacity() {
  const layer = document.getElementById('bg-video-layer');
  if (!layer) return;
  
  const profile = store.getActiveProfile();
  const theme = document.documentElement.getAttribute('data-theme') || 'dark';
  
  let opacity = 0.20; // dark default
  if (theme === 'light') opacity = 0.10;
  
  if (profile.prefs.bgVideoOpacity !== undefined) {
    opacity = profile.prefs.bgVideoOpacity;
  }
  
  document.documentElement.style.setProperty('--bg-video-opacity', opacity);
}

// Pause/Resume on visibility change
document.addEventListener('visibilitychange', () => {
  if (!player || !player.getPlayerState) return;
  if (document.visibilityState === 'hidden') {
    try { player.pauseVideo(); } catch (e) {}
  } else {
    try { player.playVideo(); } catch (e) {}
  }
});

// Expose settings updates
export function updateBgVideoSettings() {
  updateVideoLayerOpacity();
  
  const layer = document.getElementById('bg-video-layer');
  if (!layer) return;
  
  const shouldBePlaying = shouldLoadVideo();
  
  if (shouldBePlaying && !player && apiLoaded) {
    // we need to create it since user just turned it on
    // The easiest is just calling the ready callback if api is loaded
    if (window.onYouTubeIframeAPIReady) window.onYouTubeIframeAPIReady();
  } else if (!shouldBePlaying && player) {
    removeIframe();
  } else if (shouldBePlaying && !apiLoaded && !ytIframeScriptAdded) {
    // API not even loaded yet
    scheduleVideoLoad();
  }
}
