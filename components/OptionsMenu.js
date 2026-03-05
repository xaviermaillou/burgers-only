export function initOptionsMenu({ menuElement, burgerIcon }) {
  if (!menuElement || !burgerIcon) {
    return {
      open: () => {},
      close: () => {},
      toggle: () => {},
      isOpen: () => false,
      handleEscape: () => false,
      destroy: () => {}
    };
  }

  const isOpen = () => menuElement.classList.contains('open');

  const open = () => {
    menuElement.classList.add('open');
    menuElement.setAttribute('aria-hidden', 'false');
    burgerIcon.setExpanded(true);
    document.body.classList.add('menu-open');
  };

  const close = () => {
    menuElement.classList.remove('open');
    menuElement.setAttribute('aria-hidden', 'true');
    burgerIcon.setExpanded(false);
    document.body.classList.remove('menu-open');
  };

  const toggle = () => {
    if (isOpen()) {
      close();
    } else {
      open();
    }
  };

  const offToggle = burgerIcon.onToggle(toggle);
  const onBackdropClick = (event) => {
    if (event.target === menuElement) {
      close();
    }
  };

  menuElement.addEventListener('click', onBackdropClick);

  return {
    open,
    close,
    toggle,
    isOpen,
    handleEscape(event) {
      if (event.key === 'Escape' && isOpen()) {
        close();
        return true;
      }
      return false;
    },
    destroy() {
      offToggle();
      menuElement.removeEventListener('click', onBackdropClick);
    }
  };
}
