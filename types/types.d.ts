declare global {
  interface Window {
    __REDUX_DEVTOOLS_EXTENSION_COMPOSE__: any;
    version: string;
    browserInfo: {
      name: string;
      ver: string;
      os: string;
      osVer: string;
    };
  }

  interface ReadonlyArray<T> {
    includes<U>(x: U & (T & U extends never ? never : unknown)): boolean;
  }
  interface Array<T> {
    includes<U>(x: U & (T & U extends never ? never : unknown)): boolean;
  }
}

export {};
