export function initBurgerIcon(button) {
  if (!button) {
    return {
      onToggle: () => () => {},
      setExpanded: () => {},
      destroy: () => {}
    };
  }

  const listeners = new Set();
  const onClick = () => {
    listeners.forEach((listener) => listener());
  };

  button.addEventListener('click', onClick);

  return {
    onToggle(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    setExpanded(isExpanded) {
      button.setAttribute('aria-expanded', String(isExpanded));
    },
    destroy() {
      button.removeEventListener('click', onClick);
      listeners.clear();
    }
  };
}
