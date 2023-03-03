import {Salable} from '.';

declare global {
  interface Window {
    Salable: typeof Salable;
  }
}

export {};
