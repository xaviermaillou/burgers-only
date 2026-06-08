export function initOptionsMenu({ menuElement, toggleButton, onOpen }) {
  if (!menuElement || !toggleButton) {
    return {
      handleEscape: () => false
    };
  }

  const isOpen = () => menuElement.classList.contains('open');

  const open = () => {
    menuElement.classList.add('open');
    menuElement.setAttribute('aria-hidden', 'false');
    toggleButton.setAttribute('aria-expanded', 'true');
    document.body.classList.add('menu-open');

    if (typeof onOpen === 'function') {
      onOpen();
    }
  };

  const close = () => {
    menuElement.classList.remove('open');
    menuElement.setAttribute('aria-hidden', 'true');
    toggleButton.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('menu-open');
  };

  const toggle = () => {
    if (isOpen()) {
      close();
    } else {
      open();
    }
  };

  const onBackdropClick = (event) => {
    if (event.target === menuElement) {
      close();
    }
  };

  toggleButton.addEventListener('click', toggle);
  menuElement.addEventListener('click', onBackdropClick);

  return {
    handleEscape(event) {
      if (event.key === 'Escape' && isOpen()) {
        close();
        return true;
      }
      return false;
    }
  };
}
