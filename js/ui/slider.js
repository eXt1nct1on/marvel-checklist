/**
 * MCU & DC Tracker — Slider init helper
 * The rail HTML is now emitted by home-page.js directly; this file only exports
 * the initSlider convenience function and the legacy renderSliderHtml for
 * pages that still use it (progress, etc.).
 */

/**
 * Attach scroll nav to a .card-rail container.
 * @param {HTMLElement} wrapper — element containing .card-rail
 */
export function initSlider(wrapper) {
  if (!wrapper) return null;
  const track = wrapper.querySelector('.card-rail');
  const prev  = wrapper.querySelector('.slider-nav-prev');
  const next  = wrapper.querySelector('.slider-nav-next');
  if (!track) return null;

  function updateNav() {
    if (!prev || !next) return;
    const max = track.scrollWidth - track.clientWidth;
    prev.disabled = track.scrollLeft <= 2;
    next.disabled = track.scrollLeft >= max - 2;
  }

  if (prev) prev.addEventListener('click', () => track.scrollBy({ left: -track.clientWidth * 0.8, behavior: 'auto' }));
  if (next) next.addEventListener('click', () => track.scrollBy({ left:  track.clientWidth * 0.8, behavior: 'auto' }));
  track.addEventListener('scroll', updateNav, { passive: true });
  window.addEventListener('resize', updateNav, { passive: true });
  updateNav();

  return { updateNav, scrollToStart: () => track.scrollTo({ left: 0, behavior: 'smooth' }) };
}

/**
 * Render a complete slider section HTML (used by pages that build their own HTML).
 * Each card is wrapped in a .card-rail-item for flex sizing.
 */
export function renderSliderHtml({ id, label = '', cardsHtml = '', isGrid = false }) {
  if (isGrid) {
    return `
      <div id="${id}-wrapper" role="region" aria-label="${label}">
        <div class="card-grid" id="${id}-track" tabindex="0" role="group">
          ${cardsHtml}
        </div>
      </div>
    `;
  }

  // Wrap each <article> card in a .card-rail-item
  const wrapped = cardsHtml.replace(/<article/g, '<div class="card-rail-item"><article').replace(/<\/article>/g, '</article></div>');

  return `
    <div id="${id}-wrapper" role="region" aria-label="${label}" style="position:relative;">
      <div class="card-rail" id="${id}-track" tabindex="0" role="group" aria-label="${label} list">
        ${wrapped}
      </div>
    </div>
  `;
}
