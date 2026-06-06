export function initBottomTabs({ bottomNav, bottomNavTrack, items, onSelect }) {
  const tabs = Array.isArray(items) ? items : [];
  let scrollAnimationFrame = null;

  const animateScroll = (target) => {
    window.cancelAnimationFrame(scrollAnimationFrame);

    const start = bottomNav.scrollLeft;
    const distance = target - start;
    const startedAt = performance.now();

    if (Math.abs(distance) < 1) {
      bottomNav.scrollLeft = target;
      return;
    }

    const update = (now) => {
      const progress = Math.min(1, (now - startedAt) / 400);
      const eased = progress < 0.5
        ? 4 * progress ** 3
        : 1 - (-2 * progress + 2) ** 3 / 2;
      bottomNav.scrollLeft = progress < 1 ? start + distance * eased : target;

      if (progress < 1) {
        scrollAnimationFrame = window.requestAnimationFrame(update);
      } else {
        scrollAnimationFrame = null;
      }
    };

    scrollAnimationFrame = window.requestAnimationFrame(update);
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

    animateScroll(target);
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
    const handler = (event) => {
      event.preventDefault();
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
      window.cancelAnimationFrame(scrollAnimationFrame);
      listeners.forEach(({ item, handler }) => item.removeEventListener('click', handler));
    }
  };
}
