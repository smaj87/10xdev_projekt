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
}

export {};
