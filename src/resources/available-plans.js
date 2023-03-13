import {MissingPropertyError} from '../utils/errors';
import {SalableBase} from './base';
import {ChangePlan} from './change-plan';

export class SalableAvailablePlans extends SalableBase {
  _granteeID;
  _memberID;
  _productID;
  _subscriptionID;
  _element;
  _callback;

  constructor(params) {
    super(params.apiKey);
    this._granteeID = params.granteeID;
    this._memberID = params.memberID;
    this._productID = params.productID;
    this._subscriptionID = params.subscriptionID;
    this._element = null;
    const envConfig = {
      availablePlansTableNode: this._element,
    };
    const checkoutConfig = {
      member: params.memberID,
      customer: {
        email: params.granteeID,
      },
    };
    this.envConfig = envConfig;
    this.checkoutConfig = checkoutConfig;
    this.initialisers = new Initialisers(this._apiKey, envConfig, checkoutConfig);
  }

  mount(element, callback) {
    (async () => {
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

      this.initialisers.createCssStyleSheetLink(
        `${this.initialisers.getCdnDomain()}/latest/css/main.css`,
        'SalableCssMain'
      );
      this.initialisers.createCssStyleSheetLink(
        `${this.initialisers.getCdnDomain()}/latest/css/themes/${this.envConfig.theme ?? 'light'}.css`,
        `SalableCss${
          this.envConfig.theme ? this.envConfig.theme[0].toUpperCase() + this.envConfig.theme.substr(1) : 'Light'
        }`
      );

      const availablePlansTableContainerEl = this.initialisers.createElWithClass(
        'div',
        `${classPrefix}-pricing-table-container`
      );
      availablePlansTable.appendChild(availablePlansTableContainerEl);

      availablePlansTableContainerEl.setAttribute('data-interval', 'month');

      if (this.envConfig.globalPlanOptions?.cta?.visibility === 'hidden')
        availablePlansTableContainerEl.classList.add('salable-global-cta-hidden');
      if (this.envConfig.state)
        availablePlansTableContainerEl.classList.add(`salable-pricing-table-state-${this.envConfig.state}`);

      const loadingEl = this.initialisers.createElWithClass('div', `${classPrefix}-loading`);
      availablePlansTableContainerEl.appendChild(loadingEl);

      bodyMovinScript.addEventListener('load', () => {
        this.initialisers.createInlineScript(
          this.initialisers.createLottieAnimation(
            `document.getElementsByClassName('salable-loading')[0]`,
            `${this.initialisers.getCdnDomain()}/latest/lottie/dots-left-${
              this.envConfig.theme === 'dark' ? 'white' : 'blue'
            }.json`
          ),
          availablePlansTableContainerEl,
          'SalableLottiePricingTableLoadingAnimation'
        );
      });
      const [productResult, subscriptionResult] = await Promise.allSettled([
        this._request(
          encodeURI(
            `/products/${this._productID}?expand=[plans, currencies.currency, organisationPaymentIntegration, plans.currencies.currency, plans.features.feature, plans.features.enumValue]`
          )
        ),
        this._subscriptionID ? this._request(`/subscriptions/${this._subscriptionID}`) : null,
      ])
        .then((res) => res)
        .catch((error) => error);

      const handleError = (err) => {
        throw new Error(`SalableJS - ${err}`);
      };

      if (productResult.status === 'rejected') {
        const error = productResult.reason;
        handleError(error);
      }

      // process subscription
      if (subscriptionResult.status === 'rejected') {
        const error = subscriptionResult.reason;
        handleError(error);
      }

      if (productResult.status !== 'rejected') {
        const productData = productResult.value;
        const subscriptionData = subscriptionResult.value;
        const defaultCurrency = productData?.currencies?.find((c) => c.defaultCurrency);

        const plans = productData.plans
          .filter((p) => p.active && p.planType !== 'bespoke' && p.status === 'ACTIVE')
          .sort((a, b) => {
            if (a.pricingType === 'free' && a.planType !== 'Coming soon') return -1;
            if (a.planType === 'Coming soon') return 1;
            const priceA = a.currencies.find((c) => c.currencyUuid === defaultCurrency.currencyUuid)?.price || 0;
            const priceB = b.currencies.find((c) => c.currencyUuid === defaultCurrency.currencyUuid)?.price || 0;
            return priceA - priceB;
          });

        const currentPlanIndex = plans.findIndex((plan) => plan.uuid === subscriptionData.planUuid) ?? -1;

        if (plans.filter((p) => p.interval === 'month').length) {
          this.initialisers.createPlansPerInterval({
            interval: 'month',
            plans: plans.filter(
              (p) => p.interval === 'month' || (p.pricingType === 'free' && p.planType === 'Standard')
            ),
            availablePlansTableContainerEl,
            classPrefix,
            envConfig: this.envConfig,
            checkoutConfig: this.checkoutConfig,
            plansContainerEl: this.initialisers.createElWithClass(
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
          this.initialisers.createPlansPerInterval({
            interval: 'year',
            plans: plans.filter(
              (p) => p.interval === 'year' || (p.pricingType === 'free' && p.planType === 'Standard')
            ),
            availablePlansTableContainerEl,
            classPrefix,
            envConfig: this.envConfig,
            checkoutConfig: this.checkoutConfig,
            plansContainerEl: this.initialisers.createElWithClass(
              'div',
              `${classPrefix}-plans-container ${classPrefix}-plans-container-year`
            ),
            defaultCurrency,
            subscriptionData,
            currentPlanIndex,
            plans,
            callback,
          });
        }

        if (
          plans.filter((p) => p.interval === 'year' && p.pricingType === 'paid').length &&
          plans.filter((p) => p.interval === 'month').length
        ) {
          const monthlyEl = document.querySelector(`.${classPrefix}-plans-container-month`);
          const yearEl = document.querySelector(`.${classPrefix}-plans-container-year`);
          const plansIntervalToggleEl = this.initialisers.createAvailablePlansTableIntervalToggle(classPrefix);
          document
            .querySelectorAll(`.${classPrefix}-plans-container`)[0]
            .parentNode.insertBefore(
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
                .classList.add(`${classPrefix}-plans-interval-toggle-active`);
              document
                .querySelector(`.${classPrefix}-plans-interval-toggle-label-month`)
                .classList.remove(`${classPrefix}-plans-interval-toggle-active`);
            } else {
              availablePlansTableContainerEl.setAttribute('data-interval', 'month');
              monthlyEl.style.display = 'flex';
              yearEl.style.display = 'none';
              document
                .querySelector(`.${classPrefix}-plans-interval-toggle-label-year`)
                .classList.remove(`${classPrefix}-plans-interval-toggle-active`);
              document
                .querySelector(`.${classPrefix}-plans-interval-toggle-label-month`)
                .classList.add(`${classPrefix}-plans-interval-toggle-active`);
            }
          });
        }

        loadingEl.style.display = 'none';

        if (this.envConfig.stylingOptions && Object.keys(this.envConfig.stylingOptions).length) {
          const stylingOptionsKeyValues = Object.entries(this.envConfig.stylingOptions);
          const root = document.querySelector(':root');

          if (stylingOptionsKeyValues) {
            for (const option of stylingOptionsKeyValues) {
              root.style.setProperty(`--${option[0].split('_').join('-')}`, option[1]);
            }
          }
        }
      }
    })();
  }
}

class Initialisers {
  envConfig;
  checkoutConfig;
  _apiKey;

  constructor(apiKey, envConfig, checkoutConfig) {
    this._apiKey = apiKey;
    this.envConfig = envConfig;
    this.checkoutConfig = checkoutConfig;
  }

  createElWithClass(type, className) {
    const el = document.createElement(type);
    el.className = className;
    return el;
  }

  createAvailablePlansTableIntervalToggle(classPrefix) {
    const plansIntervalToggleEl = this.createElWithClass('button', `${classPrefix}-plans-interval-toggle`);
    const plansIntervalToggleMonthLabel = this.createElWithClass(
      'span',
      `${classPrefix}-plans-interval-toggle-label ${classPrefix}-plans-interval-toggle-label-month ${classPrefix}-plans-interval-toggle-active`
    );
    const plansIntervalToggleYearLabel = this.createElWithClass(
      'span',
      `${classPrefix}-plans-interval-toggle-label ${classPrefix}-plans-interval-toggle-label-year`
    );
    plansIntervalToggleMonthLabel.innerText = 'Monthly Plans';
    plansIntervalToggleYearLabel.innerText = 'Yearly Plans';
    plansIntervalToggleEl.appendChild(plansIntervalToggleMonthLabel);
    plansIntervalToggleEl.appendChild(plansIntervalToggleYearLabel);

    return plansIntervalToggleEl;
  }

  createPlanPrice(classPrefix, plan, planEl, defaultCurrency) {
    const planPriceEl = this.createElWithClass('div', `${classPrefix}-plan-price`);
    if (plan.pricingType === 'free') {
      planPriceEl.innerText = 'Free';
    } else {
      if (plan.currencies?.length) {
        const matchedCurrency = plan.currencies.find((c) => {
          if (this.envConfig.currency) return c.currency.shortName === this.envConfig.currency;
          return c.currency.uuid === defaultCurrency.currencyUuid;
        });
        if (this.envConfig.currency && !matchedCurrency)
          throw Error('Salable pricing table - currency provided does not exist on product');
        if (matchedCurrency) {
          const price = (matchedCurrency.price / 100).toFixed(2);
          planPriceEl.innerText = `${matchedCurrency.currency.symbol}${
            price.toString().includes('.00') ? price.replace('.00', '') : price
          }`;
        }
        const planPriceIntervalEl = this.createElWithClass('span', `${classPrefix}-plan-price-interval`);
        planPriceIntervalEl.innerText = `per ${plan.licenseType !== 'metered' ? plan.interval : 'unit'}`;
        planPriceEl.appendChild(planPriceIntervalEl);
      }
    }
    if (plan.planType === 'Coming soon') {
      planPriceEl.innerText = 'Coming soon';
    }
    planEl.appendChild(planPriceEl);
  }

  createPlanHeading(classPrefix, plan) {
    const planHeadingEl = this.createElWithClass('h3', `${classPrefix}-plan-heading`);
    planHeadingEl.innerText = plan.displayName;
    return planHeadingEl;
  }

  createFeatureIcon(classPrefix, feature) {
    return feature.value === 'false' ? '&#10007;' : '&#10004;';
  }

  createFeatureLabel(classPrefix) {
    const featureLabelEl = this.createElWithClass('span', `${classPrefix}-feature-list-item-label`);
    return featureLabelEl;
  }

  createFeatureValue(classPrefix) {
    const featureValueEl = this.createElWithClass('span', `${classPrefix}-feature-list-item-value`);
    return featureValueEl;
  }

  createPlansFeaturesList(classPrefix, plan) {
    const planFeaturesEl = this.createElWithClass('ul', `${classPrefix}-feature-list`);
    for (const feature of plan.features.filter((p) => p.feature.visibility === 'public')) {
      const featureEl = this.createElWithClass('li', `${classPrefix}-feature-list-item`);
      const featureLabelEl = this.createFeatureLabel(classPrefix);
      featureLabelEl.innerText = feature.feature.displayName;
      featureEl.appendChild(featureLabelEl);
      const getValueText = (value) => {
        switch (value.toString()) {
          case '-1':
            return 'Unlimited';
          case 'true':
            return this.createFeatureIcon(classPrefix, feature);
          case 'false':
            return this.createFeatureIcon(classPrefix, feature);
          default:
            return feature?.feature.valueType === 'enum' && feature.enumValue.name ? feature.enumValue.name : value;
        }
      };
      const featureValueEl = this.createFeatureValue(classPrefix);
      featureValueEl.innerHTML = getValueText(feature.value);
      featureEl.appendChild(featureValueEl);
      planFeaturesEl.appendChild(featureEl);
    }
    return planFeaturesEl;
  }

  createPlanCta({
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
  }) {
    const planCtaEl = this.createElWithClass(
      'button',
      `${classPrefix}-plan-button${plan.planType === 'Coming soon' ? ' salable-plan-button-coming-soon' : ''}`
    );
    const planCtaText = (plan, envConfig, buttonTextDefaults) => {
      switch (true) {
        case envConfig.individualPlanOptions?.[plan?.uuid]?.cta?.text !== undefined:
          return envConfig.individualPlanOptions[plan.uuid].cta.text;
        case envConfig.globalPlanOptions?.cta?.text?.[plan.planType.toLowerCase()] !== undefined:
          return envConfig.globalPlanOptions.cta.text[plan.planType.toLowerCase()];
        case buttonTextDefaults?.[plan?.planType] !== undefined:
          if (plan?.planType === 'Standard') return buttonTextDefaults?.[plan?.planType]?.[plan?.pricingType];
          return buttonTextDefaults?.[plan.planType];
        default:
          return 'Upgrade';
      }
    };

    const planCtaElText = planCtaText(plan, envConfig, buttonTextDefaults);

    const planCtaElId = `button-${planIndex}-cta`;
    const planCtaElInnerSpan = this.createElWithClass('span', 'salable-plan-button-span');
    planCtaEl.appendChild(planCtaElInnerSpan);
    planCtaEl.classList.add('salable-plan-button-free');
    planCtaEl.id = planCtaElId;

    if (subscriptionData?.planUuid === plan.uuid) {
      planCtaEl.setAttribute('disabled', 'true');
      planCtaEl.classList.add('salable-disabled');
      planCtaEl.classList.add('salable-plan-button-disabled');
      planCtaElInnerSpan.innerText = 'Current Plan';
    } else {
      planCtaElInnerSpan.innerText = planIndex > currentPlanIndex ? planCtaElText : 'Downgrade';
    }

    planCtaEl.id = planCtaElId;

    // Execute function to upgrade or downgrade user's plan
    planCtaEl.addEventListener('click', async (event) => {
      event.preventDefault();

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
      const lottie = this.createLottieAnimation(
        `document.querySelector('#${planCtaElId} .salable-plan-button-span')`,
        `${this.getCdnDomain()}/latest/lottie/dots-left-white.json`
      );
      this.createInlineScript(lottie, availablePlansTableContainerEl, `SalableLottie${planCtaElId}LoadingAnimation`);

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
          cta.removeAttribute('disabled', true);
        }
        if (callback) {
          callback(undefined, {message: error.message});
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
        cta.removeAttribute('disabled', true);

        const buttonHTML = cta.getElementsByClassName(`${classPrefix}-plan-button-span`);
        buttonHTML[0].innerHTML =
          buttonIndex > newCurrentPlanIndex && buttonIndex !== newCurrentPlanIndex ? planCtaElText : 'Downgrade';

        if (buttonIndex === newCurrentPlanIndex) {
          buttonHTML[0].innerHTML = 'Current Plan';
          cta.classList.add('salable-plan-button-disabled');
          cta.classList.add('salable-disabled');
          cta.setAttribute('disabled', true);
        }
        buttonIndex += 1;
      }
    });
    return planCtaEl;
  }

  createPlan(classPrefix) {
    const planEl = this.createElWithClass('div', `${classPrefix}-plan`);
    return planEl;
  }

  createPlansPerInterval({
    interval,
    plans,
    availablePlansTableContainerEl,
    classPrefix,
    envConfig,
    plansContainerEl,
    defaultCurrency,
    subscriptionData,
    currentPlanIndex,
    callback,
  }) {
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
      const planEl = this.createPlan(classPrefix);

      const planHeadingEl = this.createPlanHeading(classPrefix, plan, planEl);
      planEl.appendChild(planHeadingEl);
      this.createPlanPrice(classPrefix, plan, planEl, defaultCurrency);

      const planFeaturesEl = this.createPlansFeaturesList(classPrefix, plan);
      planEl.appendChild(planFeaturesEl);

      if (envConfig?.individualPlanOptions?.[plan?.uuid]?.cta?.visibility !== 'hidden') {
        if (envConfig?.globalPlanOptions?.cta?.visibility !== 'hidden') {
          const planCtaEl = this.createPlanCta({
            classPrefix,
            envConfig,
            plan,
            planIndex,
            buttonTextDefaults,
            availablePlansTableContainerEl,
            interval,
            subscriptionData,
            currentPlanIndex,
            plans,
            callback,
          });
          if (this.envConfig.state === 'preview') {
            if (plan.pricingType === 'free' && plan.planType !== 'Coming soon') {
              this.createTooltip(
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

  createCssStyleSheetLink(link, id) {
    const head = document.getElementsByTagName('head')[0];
    const linkStylesheet = document.createElement('link');
    linkStylesheet.setAttribute('href', link);
    linkStylesheet.setAttribute('rel', 'stylesheet');
    if (id) linkStylesheet.id = id;
    head.appendChild(linkStylesheet);
  }

  createInlineScript(script, sibling, id) {
    const inlineScript = document.createElement('script');
    inlineScript.textContent = script;
    if (id) inlineScript.id = id;
    sibling.insertBefore(inlineScript, null);
  }

  createLottieAnimation(element, lottieFilePath) {
    return `
      bodymovin.loadAnimation({
        container: ${element}, 
        path: '${lottieFilePath}', 
        renderer: 'svg', 
        loop: true, 
        autoplay: true, 
      });
    `;
  }

  removeLottieAnimation(element, lottieFilePath) {
    return `
      bodymovin.destroy({
        container: ${element}, 
        path: '${lottieFilePath}', 
        renderer: 'svg', 
        loop: true, 
        autoplay: false, 
      });
    `;
  }

  queryParametersFactory(queryParams) {
    let paramsStr = '';

    const allowedQueryParams = [
      'customerCountry',
      'customerEmail',
      'customerPostcode',
      'member',
      'couponCode',
      'marketingConsent',
      'vatCity',
      'vatCompanyName',
      'vatCountry',
      'vatNumber',
      'vatPostcode',
      'vatState',
      'vatStreet',
    ];

    for (const key of Object.keys(queryParams)) {
      if (allowedQueryParams.includes(key)) {
        if (!queryParams[key]) break;
        switch (key) {
          case 'marketingConsent':
            paramsStr += `&${key}=${queryParams[key] ? '1' : '0'}`;
            break;
          default:
            paramsStr += `&${key}=${queryParams[key]}`;
            break;
        }
      }
    }

    return paramsStr;
  }

  createTooltip(el, elParent, tooltipText, id) {
    const toolTipElHolder = this.createElWithClass('div', 'salable-tooltip-holder');
    const toolTipEl = this.createElWithClass('span', 'salable-tooltip');
    toolTipEl.innerText = tooltipText;
    toolTipEl.id = id;
    toolTipEl.setAttribute('role', 'tooltip');
    toolTipElHolder.appendChild(toolTipEl);
    el.setAttribute('aria-describedby', id);
    toolTipElHolder.appendChild(el);
    elParent.appendChild(toolTipElHolder);

    el.addEventListener('mouseover', () => toolTipEl.classList.add('salable-tooltip-visible'));
    el.addEventListener('mouseleave', () => toolTipEl.classList.remove('salable-tooltip-visible'));
  }

  getCdnDomain() {
    return `https://cdn.salable.${this.envConfig.environment === 'stg' ? 'org' : 'app'}`;
  }
}
