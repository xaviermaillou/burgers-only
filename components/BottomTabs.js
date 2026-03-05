export function initBottomTabs({ bottomNav, bottomNavTrack, items, onSelect }) {
  const tabs = Array.isArray(items) ? items : [];
  let rafId = null;

  const easeOutCubic = (t) => 1 - (1 - t) ** 3;

  const animateScrollLeft = (to) => {
    if (!bottomNav) {
      return;
    }

    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }

    const from = bottomNav.scrollLeft;
    const delta = to - from;
    if (Math.abs(delta) < 1) {
      bottomNav.scrollLeft = to;
      return;
    }

    const duration = 280;
    const start = performance.now();

    const step = (now) => {
      const elapsed = now - start;
      const progress = Math.min(1, elapsed / duration);
      const eased = easeOutCubic(progress);
      bottomNav.scrollLeft = from + delta * eased;

      if (progress < 1) {
        rafId = requestAnimationFrame(step);
      } else {
        rafId = null;
      }
    };

    rafId = requestAnimationFrame(step);
  };

  const updateScrollPosition = (activeIndex) => {
    if (!bottomNav || !tabs.length) {
      return;
    }

    const trackWidth = bottomNavTrack ? bottomNavTrack.scrollWidth : 0;
    const maxScroll = trackWidth - bottomNav.clientWidth;
    const safeMax = Math.max(0, maxScroll);
    const denominator = Math.max(1, tabs.length - 1);
    const ratio = Math.max(0, Math.min(1, activeIndex / denominator));
    const target = safeMax * ratio;

    animateScrollLeft(target);
  };

  const setActive = (viewId) => {
    let activeIndex = 0;

    tabs.forEach((item, index) => {
      const isActive = item.dataset.viewTarget === viewId;
      item.classList.toggle('active', isActive);

      if (isActive) {
        activeIndex = index;
        item.setAttribute('aria-current', 'page');
      } else {
        item.removeAttribute('aria-current');
      }
    });

    updateScrollPosition(activeIndex);
  };

  const listeners = tabs.map((item) => {
    const handler = () => {
      if (typeof onSelect === 'function') {
        onSelect(item.dataset.viewTarget);
      }
    };

    item.addEventListener('click', handler);
    return { item, handler };
  });

  return {
    setActive,
    destroy() {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      listeners.forEach(({ item, handler }) => item.removeEventListener('click', handler));
    }
  };
}
