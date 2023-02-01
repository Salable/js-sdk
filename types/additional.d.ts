import { SalablePricingTable } from "@/packages";

declare global {
  interface Window {
    SalablePricingTable: typeof SalablePricingTable;
  }
}

export {};
