import {IPlan, IProduct, IProductCurrency, ISubscription} from '../interfaces';
import {MissingPropertyError} from '../utils/errors';
import {IBaseResource, SalableBase} from './base';
import {ChangePlan} from './change-plan';
import {IButtonTextDefaults, IEnvConfig, PlansTableGenerator} from './plans-table';

export type IMountPlanCallbackProp = (
  success?: {
    message: string;
  },
  error?: {
    message: string;
  }
) => void;

export interface IAvailablePlans extends IBaseResource {
  granteeID: string;
  memberID: string;
  productID: string;
  subscriptionID: string;
  config?: IEnvConfig;
}

interface ICreatePlansPerInterval {
  interval: string;
  plans: IPlan[];
  availablePlansTableContainerEl: Element;
  classPrefix: string;
  envConfig?: IEnvConfig;
  plansContainerEl: Element;
  defaultCurrency?: IProductCurrency;
  subscriptionData: ISubscription;
  currentPlanIndex: number;
  callback: IMountPlanCallbackProp;
}

interface ICreatePlanCTA {
  classPrefix: string;
  envConfig?: IEnvConfig;
  plan: IPlan;
  planIndex: number;
  buttonTextDefaults: IButtonTextDefaults;
  availablePlansTableContainerEl: Element;
  subscriptionData: ISubscription;
  currentPlanIndex: number;
  plans: IPlan[];
  callback: IMountPlanCallbackProp;
}

interface IPlanCTA {
  subscriptionPlanID: string;
  planID: string;
  planIndex: number;
  currentPlanIndex: number;
}

export class SalableAvailablePlans extends SalableBase {
  protected _granteeID: string;
  protected _memberID: string;
  protected _productID: string;
  protected _subscriptionID: string;
  protected _element: Element | null;
  protected _plansTableGenerator: PlansTableGenerator;
  protected _envConfig?: IEnvConfig;

  constructor(params: IAvailablePlans) {
    super(params.apiKey, params.options);
    this._granteeID = params.granteeID;
    this._memberID = params.memberID;
    this._productID = params.productID;
    this._subscriptionID = params.subscriptionID;
    this._element = null;
    this._envConfig = params.config;
    this._plansTableGenerator = new PlansTableGenerator();
  }

  mount(element: Element, callback: IMountPlanCallbackProp) {
    void (async () => {
      if (!element) MissingPropertyError('element');

      const classPrefix = 'salable';
      const availablePlansTable = element;
      const bodyMovinScript = document.createElement('script');
      bodyMovinScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/bodymovin/5.7.7/lottie.min.js';
      bodyMovinScript.integrity =
        'sha512-HDCfX3BneBQMfloBfluMQe6yio+OfXnbKAbI0SnfcZ4YfZL670nc52Aue1bBhgXa+QdWsBdhMVR2hYROljf+Fg==';
      bodyMovinScript.crossOrigin = 'anonymous';
      bodyMovinScript.defer = true;
      bodyMovinScript.id = 'SalableLottieCdn';
      document.body.appendChild(bodyMovinScript);

      this._plansTableGenerator._createCssStyleSheetLink(`${this._cdnDomain}/latest/css/main.css`, 'SalableCssMain');
      this._plansTableGenerator._createCssStyleSheetLink(
        `${this._cdnDomain}/latest/css/themes/${this._options?.theme ?? 'light'}.css`,
        `SalableCss${
          this._options?.theme ? this._options?.theme[0].toUpperCase() + this._options.theme.substr(1) : 'Light'
        }`
      );

      const availablePlansTableContainerEl = this._plansTableGenerator._createElementWithClass(
        'div',
        `${classPrefix}-pricing-table-container`
      );
      availablePlansTable.appendChild(availablePlansTableContainerEl);

      availablePlansTableContainerEl.setAttribute('data-interval', 'month');

      if (this._envConfig?.globalPlanOptions?.cta?.visibility === 'hidden')
        availablePlansTableContainerEl.classList.add('salable-global-cta-hidden');
      if (this._envConfig?.state)
        availablePlansTableContainerEl.classList.add(`salable-pricing-table-state-${this._envConfig.state}`);

      const loadingEl = this._plansTableGenerator._createElementWithClass('div', `${classPrefix}-loading`);
      availablePlansTableContainerEl.appendChild(loadingEl);

      bodyMovinScript.addEventListener('load', () => {
        this._plansTableGenerator._createInlineScript(
          this._plansTableGenerator._createLottieAnimation(
            `document.getElementsByClassName('salable-loading')[0]`,
            `${this._cdnDomain}/latest/lottie/dots-left-${this._options?.theme === 'dark' ? 'white' : 'blue'}.json`
          ),
          availablePlansTableContainerEl,
          'SalableLottiePricingTableLoadingAnimation'
        );
      });
      const [productResult, subscriptionResult] = await Promise.allSettled<[Promise<IProduct>, Promise<ISubscription>]>(
        [
          this._request(
            encodeURI(
              `/products/${this._productID}?expand=[plans, currencies.currency, organisationPaymentIntegration, plans.currencies.currency, plans.features.feature, plans.features.enumValue]`
            )
          ),
          this._request(`/subscriptions/${this._subscriptionID}`),
        ]
      );

      const handleError = (err: string) => {
        throw new Error(`SalableJS - ${err}`);
      };

      if (productResult.status === 'rejected') {
        const error = productResult.reason as string;
        handleError(error);
        return;
      }

      // process subscription
      if (subscriptionResult.status === 'rejected') {
        const error = subscriptionResult.reason as string;
        handleError(error);
        return;
      }

      const productData = productResult.value;
      const subscriptionData = subscriptionResult.value;
      const defaultCurrency = productData?.currencies?.find((c) => c.defaultCurrency);

      const plans = productData.plans
        .filter((p) => p.active && p.planType !== 'bespoke' && p.status === 'ACTIVE')
        .sort((a, b) => {
          if (a.pricingType === 'free' && a.planType !== 'Coming soon') return -1;
          if (a.planType === 'Coming soon') return 1;
          const priceA = a.currencies.find((c) => c.currencyUuid === defaultCurrency?.currencyUuid)?.price || 0;
          const priceB = b.currencies.find((c) => c.currencyUuid === defaultCurrency?.currencyUuid)?.price || 0;
          return priceA - priceB;
        });

      const currentPlanIndex = plans.findIndex((plan) => plan.uuid === subscriptionData?.planUuid) ?? -1;

      if (plans.filter((p) => p.interval === 'month').length) {
        this._createPlansPerInterval({
          interval: 'month',
          plans: plans.filter((p) => p.interval === 'month' || (p.pricingType === 'free' && p.planType === 'Standard')),
          availablePlansTableContainerEl,
          classPrefix,
          envConfig: this._envConfig,
          plansContainerEl: this._plansTableGenerator._createElementWithClass(
            'div',
            `${classPrefix}-plans-container ${classPrefix}-plans-container-month`
          ),
          defaultCurrency,
          subscriptionData,
          currentPlanIndex,
          callback,
        });
      }

      if (plans.filter((p) => p.interval === 'year' && p.pricingType === 'paid').length) {
        this._createPlansPerInterval({
          interval: 'year',
          plans: plans.filter((p) => p.interval === 'year' || (p.pricingType === 'free' && p.planType === 'Standard')),
          availablePlansTableContainerEl,
          classPrefix,
          envConfig: this._envConfig,
          plansContainerEl: this._plansTableGenerator._createElementWithClass(
            'div',
            `${classPrefix}-plans-container ${classPrefix}-plans-container-year`
          ),
          defaultCurrency,
          subscriptionData,
          currentPlanIndex,
          callback,
        });
      }

      if (
        plans.filter((p) => p.interval === 'year' && p.pricingType === 'paid').length &&
        plans.filter((p) => p.interval === 'month').length
      ) {
        const monthlyEl = document.querySelector(`.${classPrefix}-plans-container-month`) as HTMLElement;
        const yearEl = document.querySelector(`.${classPrefix}-plans-container-year`) as HTMLElement;
        const plansIntervalToggleEl = this._plansTableGenerator._createAvailablePlansTableIntervalToggle(classPrefix);

        (document.querySelectorAll(`.${classPrefix}-plans-container`)[0] as HTMLElement).parentNode?.insertBefore(
          plansIntervalToggleEl,
          document.querySelectorAll(`.${classPrefix}-plans-container`)[0]
        );

        yearEl.style.display = 'none';
        plansIntervalToggleEl.addEventListener('click', () => {
          if (yearEl.style.display === 'none') {
            availablePlansTableContainerEl.setAttribute('data-interval', 'year');
            monthlyEl.style.display = 'none';
            yearEl.style.display = 'flex';
            document
              .querySelector(`.${classPrefix}-plans-interval-toggle-label-year`)
              ?.classList.add(`${classPrefix}-plans-interval-toggle-active`);
            document
              .querySelector(`.${classPrefix}-plans-interval-toggle-label-month`)
              ?.classList.remove(`${classPrefix}-plans-interval-toggle-active`);
          } else {
            availablePlansTableContainerEl.setAttribute('data-interval', 'month');
            monthlyEl.style.display = 'flex';
            yearEl.style.display = 'none';
            document
              .querySelector(`.${classPrefix}-plans-interval-toggle-label-year`)
              ?.classList.remove(`${classPrefix}-plans-interval-toggle-active`);
            document
              .querySelector(`.${classPrefix}-plans-interval-toggle-label-month`)
              ?.classList.add(`${classPrefix}-plans-interval-toggle-active`);
          }
        });
      }

      loadingEl.style.display = 'none';

      if (this._envConfig?.stylingOptions && Object.keys(this._envConfig?.stylingOptions).length) {
        const stylingOptionsKeyValues = Object.entries(this._envConfig.stylingOptions);
        const root = document.querySelector(':root') as HTMLElement;

        if (stylingOptionsKeyValues) {
          for (const option of stylingOptionsKeyValues) {
            root.style.setProperty(`--${option[0].split('_').join('-')}`, option[1]);
          }
        }
      }
    })();
  }

  _createPlanCta({
    classPrefix,
    plan,
    planIndex,
    availablePlansTableContainerEl,
    subscriptionData,
    currentPlanIndex,
    plans,
    callback,
  }: ICreatePlanCTA) {
    const planCtaEl = this._plansTableGenerator._createElementWithClass(
      'button',
      `${classPrefix}-plan-button${plan.planType === 'Coming soon' ? ' salable-plan-button-coming-soon' : ''}`
    );
    const planCtaText = ({subscriptionPlanID, planID, planIndex, currentPlanIndex}: IPlanCTA): string => {
      if (subscriptionPlanID === planID) {
        return 'Current Plan';
      }
      if (planIndex > currentPlanIndex) {
        return 'Upgrade';
      }
      return 'Downgrade';
    };

    const planCtaElText = planCtaText({
      subscriptionPlanID: subscriptionData.planUuid,
      currentPlanIndex,
      planIndex,
      planID: plan.uuid,
    });

    const planCtaElId = `button-${planIndex}-cta`;
    const planCtaElInnerSpan = this._plansTableGenerator._createElementWithClass('span', 'salable-plan-button-span');
    planCtaEl.appendChild(planCtaElInnerSpan);
    planCtaEl.classList.add('salable-plan-button-free');
    planCtaEl.id = planCtaElId;

    if (subscriptionData?.planUuid === plan.uuid) {
      planCtaEl.setAttribute('disabled', 'true');
      planCtaEl.classList.add('salable-disabled');
      planCtaEl.classList.add('salable-plan-button-disabled');
    }
    planCtaElInnerSpan.innerText = planCtaElText;

    planCtaEl.id = planCtaElId;

    // Execute function to upgrade or downgrade user's plan
    planCtaEl.addEventListener('click', (event) => {
      event.preventDefault();

      void (async () => {
        // Get Salable Plan buttons from DOM and disable them
        const planCTAs = Array.from(document.querySelectorAll('.salable-plan-button'));
        let buttonIndex = 0;
        for (const cta of planCTAs) {
          if (buttonIndex !== planIndex) {
            cta.classList.add('salable-plan-button-disabled');
          }
          cta.classList.add('salable-disabled');
          cta.setAttribute('disabled', 'disabled');
          buttonIndex += 1;
        }

        const currentButtonTextHolder = planCtaElInnerSpan.innerText;

        // Add loading animation
        planCtaElInnerSpan.innerText = '';
        const lottie = this._plansTableGenerator._createLottieAnimation(
          `document.querySelector('#${planCtaElId} .salable-plan-button-span')`,
          `${this._cdnDomain}/latest/lottie/dots-left-white.json`
        );
        this._plansTableGenerator._createInlineScript(
          lottie,
          availablePlansTableContainerEl,
          `SalableLottie${planCtaElId}LoadingAnimation`
        );

        // Make an API call to upgrade or downgrade user's plan
        try {
          const changePlan = new ChangePlan(this._apiKey);
          const {message} = await changePlan.upgradeOrDowngradePlanSync({
            planID: plan.uuid,
            subscriptionID: subscriptionData.uuid,
          });
          if (callback) {
            callback({message}, undefined);
          }
        } catch (error) {
          planCtaElInnerSpan.innerText = currentButtonTextHolder;
          for (const cta of planCTAs.filter((b) => b.id !== `button-${currentPlanIndex}-cta`)) {
            cta.classList.remove('salable-plan-button-disabled');
            cta.classList.remove('salable-disabled');
            cta.removeAttribute('disabled');
          }
          if (callback) {
            const message =
              error instanceof Error ? error.message : 'Unable to upgrade or downgrade plan. Please try again later';
            callback(undefined, {message});
          }
          return;
        }

        planCtaEl.removeAttribute('disabled');

        const newCurrentPlanIndex = plans.findIndex((DPlan) => DPlan.uuid === plan.uuid) ?? -1;

        planCtaElInnerSpan.innerText =
          planIndex > newCurrentPlanIndex && planIndex !== newCurrentPlanIndex ? planCtaElText : 'Downgrade';
        buttonIndex = 0;
        for (const cta of planCTAs) {
          cta.classList.remove('salable-plan-button-disabled');
          cta.classList.remove('salable-disabled');
          cta.removeAttribute('disabled');

          const buttonHTML = cta.getElementsByClassName(`${classPrefix}-plan-button-span`);
          buttonHTML[0].innerHTML =
            buttonIndex > newCurrentPlanIndex && buttonIndex !== newCurrentPlanIndex ? planCtaElText : 'Downgrade';

          if (buttonIndex === newCurrentPlanIndex) {
            buttonHTML[0].innerHTML = 'Current Plan';
            cta.classList.add('salable-plan-button-disabled');
            cta.classList.add('salable-disabled');
            cta.setAttribute('disabled', 'true');
          }
          buttonIndex += 1;
        }
      })();
    });
    return planCtaEl;
  }

  _createPlansPerInterval({
    plans,
    availablePlansTableContainerEl,
    classPrefix,
    envConfig,
    plansContainerEl,
    defaultCurrency,
    subscriptionData,
    currentPlanIndex,
    callback,
  }: ICreatePlansPerInterval) {
    const buttonTextDefaults = {
      Standard: {
        free: 'Create license',
        paid: 'Upgrade',
      },
      'Coming soon': 'Contact us',
      enterprise: 'Contact us',
    };

    let planIndex = 0;
    for (const plan of plans) {
      const planEl = this._plansTableGenerator._createPlan(classPrefix);

      const planHeadingEl = this._plansTableGenerator._createPlanHeading(classPrefix, plan);
      planEl.appendChild(planHeadingEl);
      this._plansTableGenerator._createPlanPrice(classPrefix, plan, planEl, defaultCurrency);

      const planFeaturesEl = this._plansTableGenerator._createPlansFeaturesList(classPrefix, plan);
      planEl.appendChild(planFeaturesEl);

      if (envConfig?.individualPlanOptions?.[plan?.uuid]?.cta?.visibility !== 'hidden') {
        if (envConfig?.globalPlanOptions?.cta?.visibility !== 'hidden') {
          const planCtaEl = this._createPlanCta({
            classPrefix,
            envConfig,
            plan,
            planIndex,
            buttonTextDefaults,
            availablePlansTableContainerEl,
            subscriptionData,
            currentPlanIndex,
            plans,
            callback,
          });
          if (this._envConfig?.state === 'preview') {
            if (plan.pricingType === 'free' && plan.planType !== 'Coming soon') {
              this._plansTableGenerator._createTooltip(
                planCtaEl,
                planEl,
                'Free licenses cannot be created when the pricing table is in preview state',
                `${planCtaEl.id}Tooltip`
              );
            } else {
              planEl.appendChild(planCtaEl);
            }
          } else {
            planEl.appendChild(planCtaEl);
          }
        }
      }

      // Add Plan to pricing table
      plansContainerEl.appendChild(planEl);
      availablePlansTableContainerEl.appendChild(plansContainerEl);
      planIndex++;
    }
  }
}
