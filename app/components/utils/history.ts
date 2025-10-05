import { createBrowserHistory } from 'history';

import { useEffect, useRef, useState } from 'components/utils/react';

let urlList: string[] = [];

const history = createBrowserHistory();

history.listen(({ action, location }) => {
  if (action === 'PUSH') {
    // save max 4 urls to array
    urlList = [...urlList, location.pathname].slice(-4);
  } else if (action === 'POP') {
    urlList = urlList.slice(0, -1);
  }

  // return 3 previous History urls
  history.previousUrls = urlList.slice(0, -1);
});

history.previousUrls = [];

export const usePathname = () => {
  const [pathname, setPathname] = useState(window.location.pathname);
  const listenRed = useRef<() => void | undefined>();

  if (!listenRed.current) {
    listenRed.current = history.listen(({ location }) => {
      setPathname(location.pathname);
    });
  }

  useEffect(
    () => () => {
      listenRed.current?.();
    },
    [],
  );

  return pathname;
};

export default history;
