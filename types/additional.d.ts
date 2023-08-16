import { SalableCheckout, SalablePricingTable } from '@/packages';

declare global {
  interface Window {
    SalablePricingTable: typeof SalablePricingTable;
    SalableCheckout: typeof SalableCheckout;
  }
}

export {};
