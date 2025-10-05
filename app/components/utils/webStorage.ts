const EXPIRE_SUFFIX = '__EXPIRES__';

// date in ms
const isValid = (date: string) => parseInt(date, 10) > new Date().getTime();

// store is window.sessionStorage or localStorage
export function getState(key: string, store: Storage = window.sessionStorage) {
  const state = store.getItem(key);
  const expireDate = store.getItem(`${key}${EXPIRE_SUFFIX}`);

  if (state && (!expireDate || (expireDate && isValid(expireDate)))) {
    return JSON.parse(state);
  }

  return null;
}

interface State {
  [key: string]: any;
}

// expire in ms
export function setState(
  key: string,
  state: State,
  store: Storage = window.sessionStorage,
  expire?: number,
) {
  store.setItem(key, JSON.stringify(state));

  if (expire) {
    store.setItem(
      `${key}${EXPIRE_SUFFIX}`,
      (new Date().getTime() + expire).toString(),
    );
  }
}

export function removeState(
  key: string,
  store: Storage = window.sessionStorage,
) {
  store.removeItem(key);
  store.removeItem(`${key}${EXPIRE_SUFFIX}`);
}
