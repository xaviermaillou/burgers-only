export function initTileExpander({ overlay, expander, closeButton, inset = 12 }) {
  if (!overlay || !expander) {
    return {
      open: () => {},
      close: () => {},
      isOpen: () => false,
      handleEscape: () => false,
      destroy: () => {}
    };
  }

  let activeTileElement = null;
  let isAnimating = false;

  const setFrame = (rect) => {
    expander.style.top = `${rect.top}px`;
    expander.style.left = `${rect.left}px`;
    expander.style.width = `${rect.width}px`;
    expander.style.height = `${rect.height}px`;
  };

  const waitAnimationEnd = (callback) => {
    let done = false;

    const finalize = () => {
      if (done) {
        return;
      }

      done = true;
      expander.removeEventListener('transitionend', onEnd);
      callback();
    };

    const onEnd = (event) => {
      if (event.target !== expander || event.propertyName !== 'height') {
        return;
      }

      finalize();
    };

    expander.addEventListener('transitionend', onEnd);
    window.setTimeout(finalize, 420);
  };

  const open = (tileElement) => {
    if (!tileElement || isAnimating || document.body.classList.contains('menu-open')) {
      return;
    }

    isAnimating = true;
    activeTileElement = tileElement;

    const fromRect = tileElement.getBoundingClientRect();
    const toRect = {
      top: inset,
      left: inset,
      width: Math.max(0, window.innerWidth - inset * 2),
      height: Math.max(0, window.innerHeight - inset * 2)
    };

    expander.className = `${tileElement.className} tile-expander`;
    expander.innerHTML = tileElement.innerHTML;
    expander.style.transition = 'none';
    setFrame(fromRect);
    expander.getBoundingClientRect();
    expander.style.transition = '';

    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.classList.add('tile-open');

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        overlay.classList.add('expanded');
        setFrame(toRect);
        waitAnimationEnd(() => {
          isAnimating = false;
        });
      });
    });
  };

  const close = () => {
    if (!activeTileElement || isAnimating) {
      return;
    }

    isAnimating = true;
    const toRect = activeTileElement.getBoundingClientRect();

    overlay.classList.remove('expanded');
    setFrame(toRect);

    waitAnimationEnd(() => {
      overlay.classList.remove('open');
      overlay.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('tile-open');
      expander.innerHTML = '';
      activeTileElement = null;
      isAnimating = false;
    });
  };

  const onOverlayClick = (event) => {
    if (event.target === overlay) {
      close();
    }
  };

  overlay.addEventListener('click', onOverlayClick);

  const onCloseClick = () => close();
  if (closeButton) {
    closeButton.addEventListener('click', onCloseClick);
  }

  return {
    open,
    close,
    isOpen: () => overlay.classList.contains('open'),
    handleEscape(event) {
      if (event.key === 'Escape' && overlay.classList.contains('open')) {
        close();
        return true;
      }
      return false;
    },
    destroy() {
      overlay.removeEventListener('click', onOverlayClick);
      if (closeButton) {
        closeButton.removeEventListener('click', onCloseClick);
      }
    }
  };
}
