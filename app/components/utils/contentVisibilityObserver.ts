export const VISIBLE_STATE_CLASS = 'is-visible';

export const createObserver = (
  groupClass: string,
  root: HTMLElement | null = null,
  onVisibleChange?: (entry: IntersectionObserverEntry) => void,
) => {
  const observerCallback: IntersectionObserverCallback = (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add(VISIBLE_STATE_CLASS);
      } else {
        entry.target.classList.remove(VISIBLE_STATE_CLASS);
      }

      onVisibleChange?.(entry);
    });
  };

  const observer = new IntersectionObserver(observerCallback, {
    root,
    rootMargin: '200px 0px 200px 0px',
    threshold: 0,
  });

  if (groupClass) {
    const groups = document.querySelectorAll(`.${groupClass}`);

    groups.forEach((group) => {
      observer.observe(group);
    });
  }

  return observer;
};
