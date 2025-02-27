declare global {
  interface Global extends NodeJS.Global {
    [key: string]: any;
  }

  var global: Global;
}

export {};
