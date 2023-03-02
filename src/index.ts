import {BaseResource} from './base';
import {SalablePricingTable} from './pricing-table';

export class Salable extends BaseResource {
  public PricingTable = new SalablePricingTable(this._apiKey);
}

window.Salable = Salable;
