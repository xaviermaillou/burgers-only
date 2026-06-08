let stylesheetPromise = null;

function loadStylesheet() {
  if (stylesheetPromise) {
    return stylesheetPromise;
  }

  stylesheetPromise = new Promise((resolve, reject) => {
    const existingLink = document.querySelector('link[data-nav-top-styles]');
    if (existingLink) {
      resolve();
      return;
    }

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = new URL('../nav-top.css', import.meta.url).href;
    link.dataset.navTopStyles = '';
    link.addEventListener('load', resolve, { once: true });
    link.addEventListener('error', reject, { once: true });
    document.head.appendChild(link);
  });

  return stylesheetPromise;
}

export async function initTopNavigation({
  bottomNav,
  topbar,
  geotagElement,
  onLayoutChange
}) {
  if (!bottomNav) {
    return;
  }

  await loadStylesheet();
  document.body.classList.add('nav-top', 'nav-top-initializing');

  const updateLayout = () => {
    const topbarBottom = topbar?.getBoundingClientRect()?.bottom || 0;
    const navHeight = bottomNav.getBoundingClientRect().height || 0;
    const geotagHeight = geotagElement?.getBoundingClientRect()?.height || 0;
    const navTopOffset = Math.max(0, Math.ceil(topbarBottom + 8));

    document.documentElement.style.setProperty(
      '--nav-top-padding',
      `${navTopOffset}px`
    );
    document.documentElement.style.setProperty(
      '--nav-top-offset',
      `${navTopOffset}px`
    );
    document.documentElement.style.setProperty(
      '--nav-height',
      `${Math.max(0, Math.ceil(navHeight))}px`
    );
    document.documentElement.style.setProperty(
      '--geotag-height',
      `${Math.max(0, Math.ceil(geotagHeight))}px`
    );

    if (typeof onLayoutChange === 'function') {
      onLayoutChange();
    }
  };

  window.addEventListener('resize', updateLayout);
  if ('ResizeObserver' in window) {
    const resizeObserver = new ResizeObserver(updateLayout);
    [bottomNav, topbar, geotagElement].forEach((element) => {
      if (element) {
        resizeObserver.observe(element);
      }
    });
  }

  window.requestAnimationFrame(() => {
    updateLayout();
    window.requestAnimationFrame(() => {
      document.body.classList.remove('nav-top-initializing');
    });
  });
}
