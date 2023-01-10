import { PricingTable } from "@/packages";

declare global {
  interface Window {
    PricingTable: typeof PricingTable;
  }
}

export {};
