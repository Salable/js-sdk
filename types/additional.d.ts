import {Salable} from '../src';

declare global {
  interface Window {
    Salable: typeof Salable;
  }
}

export {};
