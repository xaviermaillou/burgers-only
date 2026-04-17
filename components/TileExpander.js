export function initTileExpander({ overlay, expander, closeButton, inset = 12, onClose = null }) {
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
  let cleanupRunId = 0;

  const readExpandedList = (tileElement) => {
    try {
      const parsed = JSON.parse(tileElement.dataset.expandedList || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

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

  const waitOverlayFadeOut = (callback) => {
    let done = false;

    const finalize = () => {
      if (done) {
        return;
      }

      done = true;
      overlay.removeEventListener('transitionend', onEnd);
      callback();
    };

    const onEnd = (event) => {
      if (event.target !== overlay || event.propertyName !== 'opacity') {
        return;
      }

      finalize();
    };

    overlay.addEventListener('transitionend', onEnd);
    window.setTimeout(finalize, 280);
  };

  const open = (tileElement) => {
    if (!tileElement || isAnimating || document.body.classList.contains('menu-open')) {
      return;
    }

    cleanupRunId += 1;
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
    const titleText = tileElement.querySelector('.tile-title')?.textContent || '';
    const expandedList = readExpandedList(tileElement);
    const content = document.createElement('div');
    content.className = 'tile-expander-content';
    const imageUrl = tileElement.dataset.image || '';
    const maskUrl = tileElement.dataset.maskUrl || '';

    if (imageUrl) {
      const baseImage = document.createElement('img');
      baseImage.src = imageUrl;
      baseImage.alt = '';
      baseImage.className = 'tile-expander-image-base';

      content.appendChild(baseImage);

      if (maskUrl) {
        content.style.setProperty('--tile-mask-url', `url("${maskUrl}")`);

        const maskedImage = document.createElement('img');
        maskedImage.src = imageUrl;
        maskedImage.alt = '';
        maskedImage.className = 'tile-expander-image-mask';
        content.appendChild(maskedImage);
      }

      const veilLayer = document.createElement('div');
      veilLayer.className = 'tile-expander-veil';
      content.appendChild(veilLayer);
    }

    const top = document.createElement('div');
    top.className = 'tile-expander-top';

    const bottom = document.createElement('div');
    bottom.className = 'tile-expander-bottom';

    if (tileElement.dataset.expandedBody) {
      const body = document.createElement('p');
      body.className = 'tile-expanded-body';
      body.textContent = tileElement.dataset.expandedBody;
      top.appendChild(body);
    }

    if (expandedList.length) {
      const list = document.createElement('ul');
      list.className = 'tile-expanded-list';

      expandedList.forEach((item) => {
        const listItem = document.createElement('li');
        listItem.textContent = item;
        list.appendChild(listItem);
      });

      top.appendChild(list);
    }

    if (titleText) {
      const title = document.createElement('p');
      title.className = 'tile-title';
      title.textContent = titleText;
      bottom.appendChild(title);
    }

    content.appendChild(top);
    content.appendChild(bottom);
    expander.replaceChildren(content);
    expander.style.transition = 'none';
    setFrame(fromRect);
    expander.getBoundingClientRect();
    expander.style.transition = '';

    overlay.classList.add('open');
    if (imageUrl) {
      overlay.classList.add('has-image-open');
    }
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

    const currentCleanupRunId = ++cleanupRunId;
    isAnimating = true;
    const toRect = activeTileElement.getBoundingClientRect();

    expander.classList.add('is-collapsing');
    overlay.classList.remove('expanded');
    setFrame(toRect);

    waitAnimationEnd(() => {
      expander.classList.remove('is-collapsing');
      overlay.classList.remove('open');
      overlay.classList.remove('has-image-open');
      overlay.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('tile-open');
      activeTileElement = null;
      isAnimating = false;
      if (typeof onClose === 'function') {
        onClose();
      }
      waitOverlayFadeOut(() => {
        if (currentCleanupRunId !== cleanupRunId || overlay.classList.contains('open')) {
          return;
        }

        expander.innerHTML = '';
      });
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
    getActiveRouteId: () => activeTileElement?.dataset?.routeId || null,
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
