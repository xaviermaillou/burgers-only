export function initInfoArticleReader({ overlay, titleElement, bodyElement, closeButton }) {
  if (!overlay || !titleElement || !bodyElement) {
    return {
      open: () => {},
      close: () => {},
      isOpen: () => false,
      handleEscape: () => false,
      destroy: () => {}
    };
  }

  const isOpen = () => overlay.classList.contains('open');

  const open = (item) => {
    if (!item) {
      return;
    }

    titleElement.textContent = item.title || '';
    bodyElement.innerHTML = '';

    const paragraphs = Array.isArray(item.content) && item.content.length ? item.content : [item.summary || ''];
    paragraphs.forEach((paragraph) => {
      const p = document.createElement('p');
      p.textContent = paragraph;
      bodyElement.appendChild(p);
    });

    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.classList.add('info-open');
  };

  const close = () => {
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('info-open');
  };

  const onOverlayClick = (event) => {
    if (event.target === overlay) {
      close();
    }
  };

  const onCloseClick = () => close();

  overlay.addEventListener('click', onOverlayClick);
  if (closeButton) {
    closeButton.addEventListener('click', onCloseClick);
  }

  return {
    open,
    close,
    isOpen,
    handleEscape(event) {
      if (event.key === 'Escape' && isOpen()) {
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
