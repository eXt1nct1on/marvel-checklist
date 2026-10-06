/**
 * MCU & DC Tracker - Slider / Carousel Component
 * Flat editorial rail redesign.
 */

export function initSlider(wrapper, options = {}) {
  if (!wrapper) return null;

  const track = wrapper.querySelector('.rail-container');
  const prevBtn = wrapper.querySelector('.slider-nav-prev');
  const nextBtn = wrapper.querySelector('.slider-nav-next');

  if (!track) return null;

  function updateNavButtons() {
    if (!prevBtn || !nextBtn) return;
    const maxScroll = track.scrollWidth - track.clientWidth;
    const current = track.scrollLeft;
    prevBtn.disabled = current <= 4;
    nextBtn.disabled = current >= maxScroll - 4;
  }

  function scrollStep(direction) {
    const stepSize = Math.max(260, track.clientWidth * 0.75);
    track.scrollBy({ left: direction * stepSize, behavior: 'smooth' });
  }

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

  track.addEventListener('wheel', (e) => {
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      const maxScroll = track.scrollWidth - track.clientWidth;
      if (maxScroll > 10) {
        const canScrollLeft = track.scrollLeft > 0 && e.deltaY < 0;
        const canScrollRight = track.scrollLeft < maxScroll && e.deltaY > 0;
        if (canScrollLeft || canScrollRight) {
          e.preventDefault();
          track.scrollBy({ left: e.deltaY * 1.2, behavior: 'auto' });
          updateNavButtons();
        }
      }
    }
  }, { passive: false });

  track.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      scrollStep(-1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      scrollStep(1);
    }
  });

  let scrollTimeout;
  track.addEventListener('scroll', () => {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(updateNavButtons, 60);
  }, { passive: true });

  updateNavButtons();
  window.addEventListener('resize', updateNavButtons, { passive: true });

  return { updateNavButtons, scrollStep, scrollToStart: () => track.scrollTo({ left: 0, behavior: 'smooth' }) };
}

export function renderSliderHtml({ id, label, cardsHtml, isGrid = false }) {
  if (isGrid) {
    return \`
      <div id="\${id}-wrapper" role="region" aria-label="\${label}">
        <div class="grid-container" id="\${id}-track" tabindex="0" role="group">
          \${cardsHtml.replace(/class="movie-card"/g, 'class="movie-card grid-item"')}
        </div>
      </div>
    \`;
  }

  return \`
    <div id="\${id}-wrapper" role="region" aria-label="\${label}" style="position: relative;">
      <div style="display:flex; justify-content: flex-end; gap: 8px; margin-bottom: 8px;">
        <button type="button" class="btn btn-sm slider-nav-prev" aria-label="Previous items" title="Scroll Left">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="16" height="16"><polyline points="15 18 9 12 15 6"></polyline></svg>
        </button>
        <button type="button" class="btn btn-sm slider-nav-next" aria-label="Next items" title="Scroll Right">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="16" height="16"><polyline points="9 18 15 12 9 6"></polyline></svg>
        </button>
      </div>
      <div class="rail-container" id="\${id}-track" tabindex="0" role="group" aria-label="\${label} list">
        <!-- Wrap cards in rail-item -->
        \${cardsHtml.replace(/<article/g, '<div class="rail-item"><article').replace(/<\\/article>/g, '</article></div>')}
      </div>
    </div>
  \`;
}
