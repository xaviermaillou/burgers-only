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
  let stackingTimer = null;

  const readArrayData = (tileElement, key) => {
    try {
      const parsed = JSON.parse(tileElement.dataset[key] || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const uppercaseFirst = (value) => {
    const text = String(value || '');
    return text ? `${text.charAt(0).toLocaleUpperCase()}${text.slice(1)}` : '';
  };

  const bindBannerFade = (scrollElement, contentElement) => {
    const update = () => {
      const bannerProgress = Math.min(1, scrollElement.scrollTop / 35);
      const titleProgress = Math.min(1, scrollElement.scrollTop / 140);
      contentElement.style.setProperty('--tile-banner-opacity', String(1 - bannerProgress));
      contentElement.style.setProperty('--tile-title-opacity', String(1 - titleProgress));
    };

    scrollElement.addEventListener('scroll', update, { passive: true });
    update();
  };

  const setFrame = (rect) => {
    expander.style.top = `${rect.top}px`;
    expander.style.left = `${rect.left}px`;
    expander.style.width = `${rect.width}px`;
    expander.style.height = typeof rect.height === 'string'
      ? rect.height
      : `${rect.height}px`;
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
    window.clearTimeout(stackingTimer);
    overlay.classList.remove('behind-nav');

    const fromRect = tileElement.getBoundingClientRect();
    document.body.classList.add('tile-open');
    document.documentElement.getBoundingClientRect();

    const viewportWidth = document.documentElement.clientWidth;
    const toRect = {
      top: inset,
      left: inset,
      width: Math.max(0, viewportWidth - inset * 2 - 3),
      height: `calc(100dvh - ${inset * 2}px)`
    };

    expander.className = `${tileElement.className} tile-expander`;
    const titleText = tileElement.querySelector('.tile-title')?.textContent || '';
    const expandedList = readArrayData(tileElement, 'expandedList');
    const expandedSteps = readArrayData(tileElement, 'expandedSteps');
    const content = document.createElement('div');
    content.className = 'tile-expander-content';
    const imageUrl = tileElement.dataset.image || '';
    const maskUrl = tileElement.dataset.maskUrl || '';

    if (imageUrl) {
      const media = document.createElement('div');
      media.className = 'tile-expander-media';
      if (maskUrl) {
        content.style.setProperty('--tile-mask-url', `url("${maskUrl}")`);
      }

      const image = document.createElement('img');
      image.src = imageUrl;
      if (tileElement.dataset.imageSrcset) {
        image.srcset = tileElement.dataset.imageSrcset;
        image.sizes = `calc(100vw - ${inset * 2}px)`;
      }
      image.alt = '';
      image.className = 'tile-expander-image';
      media.appendChild(image);

      const veilLayer = document.createElement('div');
      veilLayer.className = 'tile-expander-veil';
      media.appendChild(veilLayer);
      content.appendChild(media);
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
      const ingredientsTitle = document.createElement('h2');
      ingredientsTitle.className = 'tile-expanded-heading';
      ingredientsTitle.textContent = 'Ingrédients';
      top.appendChild(ingredientsTitle);

      const list = document.createElement('ul');
      list.className = 'tile-expanded-list tile-expanded-ingredients';

      expandedList.forEach((item) => {
        const listItem = document.createElement('li');
        listItem.textContent = uppercaseFirst(item);
        list.appendChild(listItem);
      });

      top.appendChild(list);
    }

    if (expandedSteps.length) {
      const stepsTitle = document.createElement('h2');
      stepsTitle.className = 'tile-expanded-heading';
      stepsTitle.textContent = 'Étapes';
      top.appendChild(stepsTitle);

      const steps = document.createElement('ol');
      steps.className = 'tile-expanded-list tile-expanded-steps';

      expandedSteps.forEach((item) => {
        const step = document.createElement('li');
        step.textContent = item;
        steps.appendChild(step);
      });

      top.appendChild(steps);
    }

    if (titleText) {
      const title = document.createElement('h1');
      title.className = 'tile-title';
      title.textContent = titleText;
      bottom.appendChild(title);
    }

    content.appendChild(top);
    content.appendChild(bottom);
    expander.replaceChildren(content);
    if (imageUrl) {
      bindBannerFade(top, content);
    }
    expander.style.transition = 'none';
    setFrame(fromRect);
    expander.getBoundingClientRect();
    expander.style.transition = '';

    overlay.classList.add('open');
    if (imageUrl) {
      overlay.classList.add('has-image-open');
    }
    overlay.setAttribute('aria-hidden', 'false');

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
    stackingTimer = window.setTimeout(() => {
      overlay.classList.add('behind-nav');
    }, 180);

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
        overlay.classList.remove('behind-nav');
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
      window.clearTimeout(stackingTimer);
      overlay.removeEventListener('click', onOverlayClick);
      if (closeButton) {
        closeButton.removeEventListener('click', onCloseClick);
      }
    }
  };
}
