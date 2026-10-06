/**
 * MCU & DC Tracker - Slider / Carousel Component
 * Provides smooth CSS scroll-snap, prev/next navigation buttons,
 * mouse drag, touch swipe, keyboard arrows, and mouse-wheel horizontal scrolling.
 */

/**
 * Initialize a slider component on a wrapper element
 * @param {HTMLElement} wrapper - Container element with .slider-wrapper
 * @param {Object} options
 */
export function initSlider(wrapper, options = {}) {
  if (!wrapper) return null;

  const track = wrapper.querySelector('.slider-track');
  const prevBtn = wrapper.querySelector('.slider-nav-prev');
  const nextBtn = wrapper.querySelector('.slider-nav-next');

  if (!track) return null;

  let isDown = false;
  let startX = 0;
  let scrollLeft = 0;
  let hasDragged = false;

  // Update button disabled state
  function updateNavButtons() {
    if (!prevBtn || !nextBtn) return;
    const maxScroll = track.scrollWidth - track.clientWidth;
    const current = track.scrollLeft;

    prevBtn.disabled = current <= 4;
    nextBtn.disabled = current >= maxScroll - 4;
  }

  // Scroll by step (e.g. 80% of visible width)
  function scrollStep(direction) {
    const stepSize = Math.max(260, track.clientWidth * 0.75);
    track.scrollBy({
      left: direction * stepSize,
      behavior: 'smooth'
    });
  }

  // Click listeners for buttons
  if (prevBtn) {
    prevBtn.addEventListener('click', (e) => {
      e.preventDefault();
      scrollStep(-1);
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', (e) => {
      e.preventDefault();
      scrollStep(1);
    });
  }

  // Mouse drag implementation
  track.addEventListener('mousedown', (e) => {
    // Ignore interactive element clicks
    if (e.target.closest('button, a, input, select, textarea')) return;

    isDown = true;
    hasDragged = false;
    track.classList.add('is-dragging');
    startX = e.pageX - track.offsetLeft;
    scrollLeft = track.scrollLeft;
  });

  window.addEventListener('mouseup', () => {
    if (!isDown) return;
    isDown = false;
    track.classList.remove('is-dragging');
    setTimeout(() => {
      hasDragged = false;
    }, 50);
  });

  track.addEventListener('mousemove', (e) => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - track.offsetLeft;
    const walk = (x - startX) * 1.5; // Drag speed multiplier
    if (Math.abs(walk) > 6) {
      hasDragged = true;
    }
    track.scrollLeft = scrollLeft - walk;
    updateNavButtons();
  });

  // Prevent click triggering if dragged
  track.addEventListener(
    'click',
    (e) => {
      if (hasDragged) {
        e.preventDefault();
        e.stopPropagation();
      }
    },
    true
  );

  // Mouse wheel horizontal translation
  track.addEventListener(
    'wheel',
    (e) => {
      // If primarily vertical scroll and horizontal overflow exists
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        const maxScroll = track.scrollWidth - track.clientWidth;
        if (maxScroll > 10) {
          // If not at extremes, prevent default and scroll horizontally
          const canScrollLeft = track.scrollLeft > 0 && e.deltaY < 0;
          const canScrollRight = track.scrollLeft < maxScroll && e.deltaY > 0;
          if (canScrollLeft || canScrollRight) {
            e.preventDefault();
            track.scrollBy({
              left: e.deltaY * 1.2,
              behavior: 'auto'
            });
            updateNavButtons();
          }
        }
      }
    },
    { passive: false }
  );

  // Keyboard navigation
  track.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      scrollStep(-1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      scrollStep(1);
    }
  });

  // Scroll listener for buttons
  let scrollTimeout;
  track.addEventListener(
    'scroll',
    () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(updateNavButtons, 60);
    },
    { passive: true }
  );

  // Initial check
  updateNavButtons();
  window.addEventListener('resize', updateNavButtons, { passive: true });

  return {
    updateNavButtons,
    scrollStep,
    scrollToStart: () => track.scrollTo({ left: 0, behavior: 'smooth' })
  };
}

/**
 * Render template for a slider section
 * @param {Object} options
 * @param {string} options.id - Unique ID
 * @param {string} options.label - Accessible label
 * @param {string} options.cardsHtml - Pre-rendered cards HTML
 * @returns {string} HTML string
 */
export function renderSliderHtml({ id, label, cardsHtml, isGrid = false }) {
  return `
    <div class="slider-wrapper ${isGrid ? 'view-mode-grid' : 'view-mode-slider'}" id="${id}-wrapper" role="region" aria-label="${label}">
      <div class="slider-controls">
        <button
          type="button"
          class="slider-nav-btn slider-nav-prev"
          aria-label="Previous items in ${label}"
          title="Scroll Left"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="18" height="18" aria-hidden="true">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>
        <button
          type="button"
          class="slider-nav-btn slider-nav-next"
          aria-label="Next items in ${label}"
          title="Scroll Right"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="18" height="18" aria-hidden="true">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>
      </div>

      <div
        class="slider-track"
        id="${id}-track"
        tabindex="0"
        role="group"
        aria-label="${label} list"
      >
        ${cardsHtml}
      </div>
    </div>
  `;
}
