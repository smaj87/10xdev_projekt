const isBehaviorSupport = 'scrollBehavior' in document.documentElement.style;

export const scrollPage = (
  top = 0,
  behavior: 'instant' | 'auto' | 'smooth' = 'instant',
) => {
  if (isBehaviorSupport) {
    window.scrollTo({
      top,
      left: 0,
      behavior,
    });
  } else {
    window.scrollTo(0, top);
  }
};

export const scrollIntoView = (el: HTMLElement | null) => {
  if (el?.scrollIntoView) {
    el.scrollIntoView(
      isBehaviorSupport
        ? {
            block: 'start',
            inline: 'nearest',
            behavior: 'smooth',
          }
        : true,
    );
  }
};
