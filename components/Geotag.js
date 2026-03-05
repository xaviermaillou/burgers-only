export function initGeotag({ element, threshold = 28, hiddenClass = 'geotag-hidden' }) {
  if (!element) {
    return {
      update: () => {},
      destroy: () => {}
    };
  }

  const update = () => {
    if (window.scrollY > threshold) {
      document.body.classList.add(hiddenClass);
    } else {
      document.body.classList.remove(hiddenClass);
    }
  };

  window.addEventListener('scroll', update, { passive: true });

  return {
    update,
    destroy() {
      window.removeEventListener('scroll', update);
    }
  };
}
