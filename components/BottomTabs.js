export function initBottomTabs({ bottomNav, bottomNavTrack, items, onSelect }) {
  const tabs = Array.isArray(items) ? items : [];

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

    bottomNav.scrollTo({
      left: target,
      behavior: 'smooth'
    });
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
      listeners.forEach(({ item, handler }) => item.removeEventListener('click', handler));
    }
  };
}
