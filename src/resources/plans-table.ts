import { IPlan, IPlanCurrency, IProductCurrency } from '../interfaces';
import { ElementGenerator } from './element-generator';

export interface IEnvConfig {
  currency?: string;
  state: string;
  individualPlanOptions?: {
    [x: string]: {
      cta: {
        text: string;
        visibility?: string;
      };
    };
  };
  globalPlanOptions: {
    cta?: {
      text?: {
        [x: string]: string;
      };
      visibility?: string;
    };
  };
  stylingOptions?: {
    [x: string]: string;
  };
}

export interface IButtonTextDefaults {
  [x: string]:
    | {
        [x: string]: string;
      }
    | string;
}

export class PlansTableGenerator extends ElementGenerator {
  protected _envConfig?: IEnvConfig;

  constructor(envConfig?: IEnvConfig) {
    super();
    this._envConfig = envConfig;
  }

  _createFeatureIcon(classPrefix: string, feature: { value: string }) {
    return feature.value === 'false' ? '&#10007;' : '&#10004;';
  }
  _createFeatureLabel(classPrefix: string) {
    const featureLabelEl = this._createElementWithClass(
      'span',
      `${classPrefix}-feature-list-item-label`
    );
    return featureLabelEl;
  }

  _createFeatureValue(classPrefix: string) {
    const featureValueEl = this._createElementWithClass(
      'span',
      `${classPrefix}-feature-list-item-value`
    );
    return featureValueEl;
  }

  _createPlanHeading(classPrefix: string, plan: IPlan) {
    const planHeadingEl = this._createElementWithClass('h3', `${classPrefix}-plan-heading`);
    planHeadingEl.innerText = plan.displayName;
    return planHeadingEl;
  }

  _createPlan(classPrefix: string) {
    const planEl = this._createElementWithClass('div', `${classPrefix}-plan`);
    return planEl;
  }

  _createAvailablePlansTableIntervalToggle(classPrefix: string) {
    const plansIntervalToggleEl = this._createElementWithClass(
      'button',
      `${classPrefix}-plans-interval-toggle`
    );
    const plansIntervalToggleMonthLabel = this._createElementWithClass(
      'span',
      `${classPrefix}-plans-interval-toggle-label ${classPrefix}-plans-interval-toggle-label-month ${classPrefix}-plans-interval-toggle-active`
    );
    const plansIntervalToggleYearLabel = this._createElementWithClass(
      'span',
      `${classPrefix}-plans-interval-toggle-label ${classPrefix}-plans-interval-toggle-label-year`
    );
    plansIntervalToggleMonthLabel.innerText = 'Monthly Plans';
    plansIntervalToggleYearLabel.innerText = 'Yearly Plans';
    plansIntervalToggleEl.appendChild(plansIntervalToggleMonthLabel);
    plansIntervalToggleEl.appendChild(plansIntervalToggleYearLabel);

    return plansIntervalToggleEl;
  }

  _createPlanPrice(
    classPrefix: string,
    plan: IPlan,
    planEl: Element,
    defaultCurrency?: IPlanCurrency | IProductCurrency
  ) {
    const planPriceEl = this._createElementWithClass('div', `${classPrefix}-plan-price`);
    if (plan.pricingType === 'free') {
      planPriceEl.innerText = 'Free';
    } else {
      if (plan.currencies?.length) {
        const matchedCurrency = plan.currencies.find((c) => {
          if (this._envConfig?.currency) return c.currency.shortName === this._envConfig.currency;
          return c.currency.uuid === defaultCurrency?.currencyUuid;
        });
        if (this._envConfig?.currency && !matchedCurrency)
          throw Error('Salable pricing table - currency provided does not exist on product');
        if (matchedCurrency) {
          const price = (matchedCurrency.price / 100).toFixed(2);
          planPriceEl.innerText = `${matchedCurrency.currency.symbol}${
            price.toString().includes('.00') ? price.replace('.00', '') : price
          }`;
        }
        const planPriceIntervalEl = this._createElementWithClass(
          'span',
          `${classPrefix}-plan-price-interval`
        );
        planPriceIntervalEl.innerText = `per ${
          plan.licenseType !== 'metered' ? plan.interval : 'unit'
        }`;
        planPriceEl.appendChild(planPriceIntervalEl);
      }
    }
    if (plan.planType === 'Coming soon') {
      planPriceEl.innerText = 'Coming soon';
    }
    planEl.appendChild(planPriceEl);
  }

  _createPlansFeaturesList(classPrefix: string, plan: IPlan) {
    const planFeaturesEl = this._createElementWithClass('ul', `${classPrefix}-feature-list`);
    for (const feature of plan.features.filter((p) => p.feature.visibility === 'public')) {
      const featureEl = this._createElementWithClass('li', `${classPrefix}-feature-list-item`);
      const featureLabelEl = this._createFeatureLabel(classPrefix);
      featureLabelEl.innerText = feature.feature.displayName;
      featureEl.appendChild(featureLabelEl);
      const getValueText = (value: string): string => {
        switch (value.toString()) {
          case '-1':
            return 'Unlimited';
          case 'true':
            return this._createFeatureIcon(classPrefix, feature);
          case 'false':
            return this._createFeatureIcon(classPrefix, feature);
          default:
            return feature?.feature.valueType === 'enum' && feature.enumValue?.name
              ? feature.enumValue.name
              : value;
        }
      };
      const featureValueEl = this._createFeatureValue(classPrefix);
      featureValueEl.innerHTML = getValueText(feature.value);
      featureEl.appendChild(featureValueEl);
      planFeaturesEl.appendChild(featureEl);
    }
    return planFeaturesEl;
  }

  //   _queryParametersFactory(queryParams: object) {
  //     let paramsStr = '';

  //     const allowedQueryParams = [
  //       'customerCountry',
  //       'customerEmail',
  //       'customerPostcode',
  //       'member',
  //       'couponCode',
  //       'marketingConsent',
  //       'vatCity',
  //       'vatCompanyName',
  //       'vatCountry',
  //       'vatNumber',
  //       'vatPostcode',
  //       'vatState',
  //       'vatStreet',
  //     ];

  //     for (const key of Object.keys(queryParams)) {
  //       if (allowedQueryParams.includes(key)) {
  //         if (!queryParams[key]) break;
  //         switch (key) {
  //           case 'marketingConsent':
  //             paramsStr += `&${key}=${queryParams[key] ? '1' : '0'}`;
  //             break;
  //           default:
  //             paramsStr += `&${key}=${queryParams[key]}`;
  //             break;
  //         }
  //       }
  //     }

  //     return paramsStr;
  //   }
}
