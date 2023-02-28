import { SalablePricingTable } from './pricing-table/src';

class Config {
  protected _apiKey;

  constructor(config: { apiKey: string }) {
    this._apiKey = config.apiKey;
  }

  get apiKey() {
    return this._apiKey;
  }
}

export class Salable {
  protected config;

  constructor(config: { apiKey: string }) {
    this.config = new Config(config);
  }

  init() {
    const requiredFields: { [k: string]: { [k: string]: string } } = {
      apiKey: {
        value: this.config.apiKey,
      },
    };

    Object.keys(requiredFields).forEach((key) => {
      const field = requiredFields[key];

      if (!field.value) throw Error(`Salable - Missing Property: ${key}`);
    });
  }

  public PricingTale = new SalablePricingTable();
}

window.Salable = Salable;
