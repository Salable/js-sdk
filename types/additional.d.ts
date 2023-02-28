import { Salable } from "@/packages";

declare global {
  interface Window {
    Salable: typeof Salable;
  }
}

export {};
