export class SalablePricingTable {
  envConfig;
  checkoutConfig;
  initialisers;

  constructor(envConfig, checkoutConfig) {
    this.envConfig = new EnvConfig(envConfig);
    this.checkoutConfig = new CheckoutConfig(checkoutConfig);
    this.initialisers = new Initialisers(envConfig, this.checkoutConfig);
  }

  get envConfig() {
    return this.envConfig;
  }

  get checkoutConfig() {
    return this.checkoutConfig;
  }

  async init() {
    const requiredFields = {
      pricingTableNode: {
        value: this.envConfig.pricingTableNode,
      },
      apiKey: {
        value: this.envConfig.apiKey,
      },
      productUuidOrPricingTableUuid: {
        productUuid: this.envConfig.productUuid,
        pricingTableUuid: this.envConfig.pricingTableUuid,
      },
      cancelUrl: {
        value: this.envConfig.globalPlanOptions.cancelUrl,
      },
      member: {
        value: this.checkoutConfig.member,
      },
    };

    for (const key of Object.keys(requiredFields)) {
      if (key === 'productUuidOrPricingTableUuid') {
        if (!requiredFields[key].productUuid && !requiredFields[key].pricingTableUuid) {
          throw Error(
            `Salable Pricing Table - one of productUuid or pricingTableUuid must be added to Pricing Table config`
          );
        }
        continue;
      }
      if (!requiredFields[key].value) {
        throw Error(`Salable pricing table - missing property ${key}`);
      }
    }

    if (this.envConfig.apiKey) {
      const classPrefix = 'salable';
      const pricingTable = this.envConfig.pricingTableNode;
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

      const pricingTableContainerEl = this.initialisers.createElWithClass(
        'div',
        `${classPrefix}-pricing-table-container`
      );
      pricingTable.appendChild(pricingTableContainerEl);

      pricingTableContainerEl.setAttribute('data-interval', 'month');

      if (this.envConfig.globalPlanOptions?.cta?.visibility === 'hidden')
        pricingTableContainerEl.classList.add('salable-global-cta-hidden');
      if (this.envConfig.state)
        pricingTableContainerEl.classList.add(
          `salable-pricing-table-state-${this.envConfig.state}`
        );

      const loadingEl = this.initialisers.createElWithClass('div', `${classPrefix}-loading`);
      pricingTableContainerEl.appendChild(loadingEl);

      bodyMovinScript.addEventListener('load', () => {
        this.initialisers.createInlineScript(
          this.initialisers.createLottieAnimation(
            `document.getElementsByClassName('salable-loading')[0]`,
            `${this.initialisers.getCdnDomain()}/latest/lottie/dots-left-${
              this.envConfig.theme === 'dark' ? 'white' : 'blue'
            }.json`
          ),
          pricingTableContainerEl,
          'SalableLottiePricingTableLoadingAnimation'
        );
      });

      if (!this.envConfig.globalPlanOptions.successUrl)
        this.envConfig.globalPlanOptions.successUrl = document.URL;

      const successUrlsWithHashes = this.envConfig.individualPlanOptions
        ? Object.keys(this.envConfig.individualPlanOptions)?.map((key) => {
            const successUrl =
              this.envConfig.individualPlanOptions[key].successUrl ??
              this.envConfig.globalPlanOptions.successUrl;
            return `${key},${successUrl}`;
          })
        : [];

      const cancelUrlsWithHashes = this.envConfig.individualPlanOptions
        ? Object.keys(this.envConfig.individualPlanOptions)?.map((key) => {
            const cancelUrl =
              this.envConfig.individualPlanOptions[key].cancelUrl ??
              this.envConfig.globalPlanOptions.cancelUrl;
            return `${key},${cancelUrl}`;
          })
        : [];

      let response = {};
      let encoded = null;
      const queryParams = `?granteeId=${this.envConfig.globalPlanOptions.granteeId}&globalSuccessUrl=${this.envConfig.globalPlanOptions.successUrl}&successUrls=${successUrlsWithHashes}&globalCancelUrl=${this.envConfig.globalPlanOptions.cancelUrl}&cancelUrls=${cancelUrlsWithHashes}&member=${this.checkoutConfig.member}`;

      if (this.envConfig.pricingTableUuid) {
        encoded = encodeURI(
          `${this.initialisers.getApiDomain()}/pricing-tables/${
            this.envConfig.pricingTableUuid
          }${queryParams}`
        );
      } else {
        encoded = encodeURI(
          `${this.initialisers.getApiDomain()}/products/${
            this.envConfig.productUuid
          }/pricingtable${queryParams}`
        );
      }
      try {
        response = await fetch(encoded, {
          method: 'GET',
          headers: {
            'x-api-key': this.envConfig.apiKey,
            version: 'v2',
          },
        });
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error);
        }
      } catch (error) {
        loadingEl.style.display = 'none';
        // eslint-disable-next-line no-console
        console.error(error.error ? `Salable - ${error.error}` : 'Failed to load pricing table');
        const errorAlertEl = this.initialisers.createElWithClass('div', `${classPrefix}-error`);
        errorAlertEl.innerText = `Error: Failed to load Pricing Table`;
        pricingTableContainerEl.appendChild(errorAlertEl);
      }

      if (response.status === 200) {
        let data = await response.json();
        if (this.envConfig.pricingTableUuid) {
          data = this.initialisers.getPricingTableFactory(data);
          this.envConfig.theme = data.theme;
        }
        this.initialisers.createCssStyleSheetLink(
          `${this.initialisers.getCdnDomain()}/latest/css/themes/${
            this.envConfig.theme ?? 'light'
          }.css`,
          `SalableCss${
            this.envConfig.theme
              ? this.envConfig.theme[0].toUpperCase() + this.envConfig.theme.substr(1)
              : 'Light'
          }`
        );
        if (this.envConfig.pricingTableUuid) {
          const customThemeDefaultButton = data.customTheme?.elements?.buttons?.default;
          if (customThemeDefaultButton) {
            this.initialisers.setCssVariables({
              ...(customThemeDefaultButton.backgroundColor && {
                '--salable-button-background-colour': customThemeDefaultButton.backgroundColor,
                // '--salable-button-coming-soon-colour': customThemeDefaultButton.backgroundColor,
                // '--salable-button-coming-soon-hover-colour': customThemeDefaultButton.backgroundColor,
                // '--salable-button-coming-soon-hover-border-colour':
                //   customThemeDefaultButton.backgroundColor,
              }),
              ...(customThemeDefaultButton.hover.backgroundColor && {
                '--salable-button-hover-background-colour':
                  customThemeDefaultButton.hover.backgroundColor,
                // '--salable-button-coming-soon-hover-background-colour':
                //   customThemeDefaultButton.hover.backgroundColor + 15,
              }),
              ...(customThemeDefaultButton.color && {
                '--salable-button-colour': customThemeDefaultButton.color,
                '--salable-button-hover-colour': customThemeDefaultButton.color,
              }),
            });
          }
        }
        const defaultCurrency = data?.currencies?.find((c) => c.defaultCurrency);

        const plans = data.plans.filter((p) => p.status === 'ACTIVE' && p.planType !== 'bespoke');

        const hasFreeYearlyPlans = plans.filter(
          (p) => p.interval === 'year' && p.pricingType === 'free'
        ).length;
        const hasPaidYearlyPlans = plans.filter(
          (p) => p.interval === 'year' && p.pricingType === 'paid'
        ).length;

        const hasFreeMonthlyPlans = plans.filter(
          (p) => p.interval === 'month' && p.pricingType === 'free'
        ).length;
        const hasPaidMonthlyPlans = plans.filter(
          (p) => p.interval === 'month' && p.pricingType === 'paid'
        ).length;
        const hasYearlyPlans = plans.filter((p) => p.interval === 'year').length;
        const hasMonthlyPlans = plans.filter((p) => p.interval === 'month').length;

        const monthlyPlans =
          (hasPaidMonthlyPlans && hasFreeYearlyPlans && !hasPaidYearlyPlans) ||
          (hasPaidMonthlyPlans && hasPaidYearlyPlans) ||
          !hasPaidYearlyPlans
            ? plans.filter(
                (p) =>
                  p.interval === 'month' || (p.pricingType === 'free' && p.planType === 'Standard')
              )
            : [];

        const yearlyPlans =
          (hasPaidYearlyPlans && hasFreeMonthlyPlans && !hasPaidMonthlyPlans) ||
          (hasPaidMonthlyPlans && hasPaidYearlyPlans) ||
          (hasYearlyPlans && !hasMonthlyPlans)
            ? plans.filter(
                (p) =>
                  p.interval === 'year' || (p.pricingType === 'free' && p.planType === 'Standard')
              )
            : [];

        this.initialisers.createPlansPerInterval({
          interval: 'month',
          plans: monthlyPlans,
          pricingTableContainerEl,
          classPrefix,
          envConfig: this.envConfig,
          checkoutConfig: this.checkoutConfig,
          plansContainerEl: this.initialisers.createElWithClass(
            'div',
            `${classPrefix}-plans-container ${classPrefix}-plans-container-month`
          ),
          defaultCurrency,
          featuredPlanUuid: data.featuredPlanUuid,
          customTheme: data.customTheme,
        });

        this.initialisers.createPlansPerInterval({
          interval: 'year',
          plans: yearlyPlans,
          pricingTableContainerEl,
          classPrefix,
          envConfig: this.envConfig,
          checkoutConfig: this.checkoutConfig,
          plansContainerEl: this.initialisers.createElWithClass(
            'div',
            `${classPrefix}-plans-container ${classPrefix}-plans-container-year`
          ),
          defaultCurrency,
          featuredPlanUuid: data.featuredPlanUuid,
          customTheme: data.customTheme,
        });

        if (monthlyPlans.length && yearlyPlans.length) {
          const monthlyEl = document.querySelector(`.${classPrefix}-plans-container-month`);
          const yearEl = document.querySelector(`.${classPrefix}-plans-container-year`);
          const plansIntervalToggleEl =
            this.initialisers.createPricingTableIntervalToggle(classPrefix);
          document
            .querySelectorAll(`.${classPrefix}-plans-container`)[0]
            .parentNode.insertBefore(
              plansIntervalToggleEl,
              document.querySelectorAll(`.${classPrefix}-plans-container`)[0]
            );
          yearEl.style.display = 'none';
          plansIntervalToggleEl.addEventListener('click', () => {
            if (yearEl.style.display === 'none') {
              pricingTableContainerEl.setAttribute('data-interval', 'year');
              monthlyEl.style.display = 'none';
              yearEl.style.display = 'flex';
              document
                .querySelector(`.${classPrefix}-plans-interval-toggle-label-year`)
                .classList.add(`${classPrefix}-plans-interval-toggle-active`);
              document
                .querySelector(`.${classPrefix}-plans-interval-toggle-label-month`)
                .classList.remove(`${classPrefix}-plans-interval-toggle-active`);
            } else {
              pricingTableContainerEl.setAttribute('data-interval', 'month');
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
    } else {
      // eslint-disable-next-line no-console
      console.error(
        'Api key is missing from environment config passed into Salable init() function'
      );
    }
  }

  removeScripts() {
    const script = document.createElement('script');
    script.textContent = `
      bodymovin.destroy();
    `;
    document.body.appendChild(script);
    const scripts = document.querySelectorAll('script');
    if (scripts.length) {
      for (const s of scripts) {
        if (s.id.includes('SalableLottie')) s.remove();
      }
    }
    const cssLinks = document.querySelectorAll('link');
    if (cssLinks.length) {
      for (const c of cssLinks) {
        if (c.id.includes('SalableCss')) c.remove();
      }
    }
    script.remove();
  }

  destroy() {
    this.removeScripts();
    this.envConfig.pricingTableNode.remove();
  }
}

class EnvConfig {
  pricingTableNode;
  productUuid;
  apiKey;
  stylingOptions;
  theme;
  contactUsUrl;
  currency;
  globalPlanOptions;
  individualPlanOptions;
  state;
  environment;

  constructor(config) {
    this.pricingTableNode = config.pricingTableNode;
    this.productUuid = config.productUuid;
    this.pricingTableUuid = config.pricingTableUuid;
    this.organisationId = config.organisationId;
    this.apiKey = config.apiKey;
    this.authToken = config.authToken;
    this.stylingOptions = config.stylingOptions;
    this.theme = config.theme;
    this.contactUsUrl = config.contactUsUrl;
    this.currency = config.currency;
    this.globalPlanOptions = config.globalPlanOptions;
    this.individualPlanOptions = config.individualPlanOptions;
    this.state = config.state;
    this.environment = config.environment;
  }

  get pricingTableNode() {
    return this.pricingTableNode;
  }

  get productUuid() {
    return this.productUuid;
  }

  get apiKey() {
    return this.apiKey;
  }

  get globalPlanOptions() {
    return this.globalPlanOptions;
  }

  get individualPlanOptions() {
    return this.individualPlanOptions;
  }

  get state() {
    return this.state;
  }

  get environment() {
    return this.environment;
  }

  get contactUsUrl() {
    return this.contactUsUrl;
  }
}

class CheckoutConfig {
  customerId;
  customerEmail;
  customerPostcode;
  customerCountry;
  member;
  marketingConsent;
  promoCode;
  allowPromoCode;
  changeQuantity;

  constructor(config) {
    this.customerId = config.customer.id;
    this.customerEmail = config.customer.email;
    this.customerPostcode = config.customer.postcode;
    this.customerCountry = config.customer.country;
    this.member = config.member;
    this.marketingConsent = config.marketingConsent;
    this.promoCode = config.promoCode;
    this.allowPromoCode = config.allowPromoCode;
    this.changeQuantity = config.changeQuantity;
  }

  get customerEmail() {
    return this.customerEmail;
  }

  get customerPostcode() {
    return this.customerPostcode;
  }

  get customerCountry() {
    return this.customerCountry;
  }

  get member() {
    return this.member;
  }

  get marketingConsent() {
    return this.marketingConsent;
  }

  get promoCode() {
    return this.promoCode;
  }

  get allowPromoCode() {
    return this.allowPromoCode;
  }

  get changeQuantity() {
    return this.changeQuantity;
  }
}

class Initialisers {
  envConfig;
  checkoutConfig;

  constructor(envConfig, checkoutConfig) {
    this.envConfig = envConfig;
    this.checkoutConfig = checkoutConfig;
  }

  createElWithClass(type, className) {
    const el = document.createElement(type);
    el.className = className;
    return el;
  }

  createPricingTableIntervalToggle(classPrefix) {
    const plansIntervalToggleEl = this.createElWithClass(
      'button',
      `${classPrefix}-plans-interval-toggle`
    );
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
    const matchedCurrency = plan.currencies.find((c) => {
      if (this.envConfig.currency) return c.currency.shortName === this.envConfig.currency;
      return c.currency.uuid === defaultCurrency.currencyUuid;
    });
    switch (true) {
      case plan.pricingType !== 'free':
        if (!plan.currencies?.length) {
          throw Error('Salable pricing table - no currencies found on Product');
        }
        if (this.envConfig.currency && !matchedCurrency) {
          throw Error('Salable pricing table - currency provided does not exist on product');
        }
        const price = (
          (matchedCurrency.price * (this.checkoutConfig.changeQuantity ? 1 : plan.perSeatAmount)) /
          100
        ).toFixed(2);
        planPriceEl.innerText = `${matchedCurrency.currency.symbol}${this.formatPrice(price)}`;
        const planPriceIntervalEl = this.createElWithClass(
          'span',
          `${classPrefix}-plan-price-interval`
        );
        planPriceIntervalEl.innerText = `per ${this.planUnitValue(
          plan.licenseType,
          plan.interval
        )}`;
        planPriceEl.appendChild(planPriceIntervalEl);
        break;
      case plan.pricingType === 'free':
        planPriceEl.innerText = 'Free';
        break;
      case plan.planType === 'Coming soon':
        planPriceEl.innerText = 'Coming soon';
        break;
    }
    if (plan.licenseType === 'perSeat') {
      const planPerSeatDetailsEl = this.createPlanPerSeatDetails(
        classPrefix,
        plan,
        matchedCurrency
      );
      planPriceEl.appendChild(planPerSeatDetailsEl);
    }
    planEl.appendChild(planPriceEl);
  }

  createPlanPerSeatDetails(classPrefix, plan, currency) {
    const perSeatDetailsEl = this.createElWithClass('div', `${classPrefix}-plan-per-seat-details`);
    if (plan.pricingType === 'free') {
      perSeatDetailsEl.innerText = `${plan.perSeatAmount} seat${plan.perSeatAmount > 1 ? 's' : ''}`;
      return perSeatDetailsEl;
    }
    const price = (currency.price / 100).toFixed(2);
    perSeatDetailsEl.innerText = this.checkoutConfig.changeQuantity
      ? `per ${plan.interval}`
      : `${plan.perSeatAmount} seats`;
    const perSeatPriceEl = this.createElWithClass('span', `${classPrefix}-plan-per-seat-price`);
    perSeatPriceEl.innerText = !this.checkoutConfig.changeQuantity
      ? ` (${currency.currency.symbol}${this.formatPrice(price)} each)`
      : ` (min ${plan.perSeatAmount} seats)`;
    perSeatDetailsEl.appendChild(perSeatPriceEl);
    return perSeatDetailsEl;
  }

  planUnitValue(licenseType, interval) {
    switch (licenseType) {
      case 'licensed':
        return interval;
      case 'metered':
        return 'unit';
      case 'perSeat':
        return this.checkoutConfig.changeQuantity ? 'seat' : interval;
      default:
        return null;
    }
  }

  formatPrice(price) {
    return price.toString().includes('.00') ? price.replace('.00', '') : price;
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
    for (const feature of plan.features
      ?.filter((p) => p.feature.visibility === 'public')
      .sort((a, b) => a.sortOrder - b.sortOrder)) {
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
            return feature?.feature.valueType === 'enum' && feature.enumValue.name
              ? feature.enumValue.name
              : value;
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
    pricingTableContainerEl,
    interval,
    featuredPlanUuid,
    customTheme,
  }) {
    const defaultCallback = (planId, paddlePlanId, type) => {
      const checkoutConfig = this.checkoutConfig;
      switch (type) {
        case 'Standard':
          // Paddle.Checkout.open({
          //   product: paddlePlanId,
          //   email: checkoutConfig.email ?? null,
          //   postcode: checkoutConfig.postcode ?? null,
          //   country: checkoutConfig.country ?? null
          // });
          break;
        case 'Coming soon':
          alert(`Default\nid: ${planId}\ntype: Coming soon `);
          break;
        default:
          // eslint-disable-next-line no-console
          console.error('Salable pricing table - Unhandled plan type');
          break;
      }
    };

    const disableButton =
      plan.licenseType === 'metered' &&
      ((plan.pricingType === 'paid' && plan.grantee?.isSubscribed) ||
        (plan.pricingType === 'free' && plan.grantee?.isLicensed));

    const planCtaEl = this.createElWithClass(
      'a',
      `${classPrefix}-plan-button${
        disableButton
          ? ` ${classPrefix}-plan-button-disabled`
          : ` ${classPrefix}-plan-button-active`
      }`
    );

    if (featuredPlanUuid === plan.uuid && this.envConfig.pricingTableUuid) {
      planCtaEl.classList.add('salable-plan-button-featured');
      this.setCssVariables({
        ...(customTheme.elements.buttons.featured.backgroundColor && {
          '--salable-button-featured-button-background-colour':
            customTheme.elements.buttons.featured.backgroundColor,
        }),
        ...(customTheme.elements.buttons.featured.hover.backgroundColor && {
          '--salable-button-featured-button-hover-background-colour':
            customTheme.elements.buttons.featured.hover.backgroundColor,
        }),
        ...(customTheme.elements.buttons.featured.color && {
          '--salable-button-featured-button-text-colour':
            customTheme.elements.buttons.featured.color,
          '--salable-button-featured-button-hover-text-colour':
            customTheme.elements.buttons.featured.color,
        }),
      });
    }

    const planCtaText = (plan, envConfig, buttonTextDefaults) => {
      switch (true) {
        case envConfig.individualPlanOptions?.[plan?.uuid]?.cta?.text !== undefined:
          return envConfig.individualPlanOptions[plan.uuid].cta.text;
        case envConfig.globalPlanOptions?.cta?.text?.[plan.planType.toLowerCase()] !== undefined:
          return envConfig.globalPlanOptions.cta.text[plan.planType.toLowerCase()];
        case buttonTextDefaults?.[plan?.planType] !== undefined:
          if (plan?.planType === 'Standard') {
            if (disableButton) return '&#10004; Subscribed';
            return buttonTextDefaults?.[plan?.planType]?.[plan?.pricingType];
          }
          return buttonTextDefaults?.[plan.planType];
        default:
          return 'Buy';
      }
    };

    const planCtaElId = `${interval === 'year' ? 'year' : plan.interval}${planIndex}Cta`;
    if (plan.planType !== 'Coming soon') {
      const planCtaElInnerSpan = this.createElWithClass('span', 'salable-plan-button-span');
      planCtaElInnerSpan.innerHTML = planCtaText(plan, envConfig, buttonTextDefaults);
      planCtaEl.appendChild(planCtaElInnerSpan);
      planCtaEl.id = planCtaElId;
      if (plan.pricingType === 'free') planCtaEl.classList.add('salable-plan-button-free');
    } else {
      planCtaEl.innerHTML = planCtaText(plan, envConfig, buttonTextDefaults);
    }

    if (disableButton) {
      planCtaEl.setAttribute('disabled', 'disabled');
      return planCtaEl;
    }

    if (plan.planType === 'Coming soon') {
      const contactUsUrl =
        this.envConfig?.individualPlanOptions?.[plan.uuid]?.contactUsUrl ??
        this.envConfig?.globalPlanOptions?.contactUsUrl;
      if (!contactUsUrl)
        throw Error(`Salable pricing table - missing contact us url on ${plan.uuid}`);
      planCtaEl.setAttribute('href', contactUsUrl);
      return planCtaEl;
    }

    if (plan.pricingType === 'paid' && plan.planType !== 'Coming soon') {
      planCtaEl.addEventListener('click', async (event) => {
        event.preventDefault();
        if (planCtaEl.getAttribute('disabled')) return null;
        planCtaEl.classList.add('salable-disabled');

        const otherCtas = Array.from(document.querySelectorAll('.salable-plan-button')).filter(
          (b) => b.id !== planCtaElId
        );
        for (const cta of otherCtas) {
          cta.classList.add('salable-plan-button-disabled');
          cta.classList.add('salable-disabled');
          cta.setAttribute('disabled', 'disabled');
        }
        const planCtaElInnerSpan = document.getElementById(planCtaElId).children[0];
        planCtaElInnerSpan.innerText = '';
        planCtaEl.setAttribute('disabled', 'disabled');
        this.createInlineScript(
          this.createLottieAnimation(
            `document.querySelector('#${planCtaElId} .salable-plan-button-span')`,
            `${this.getCdnDomain()}/latest/lottie/dots-left-white.json`
          ),
          pricingTableContainerEl,
          `SalableLottie${planCtaElId}LoadingAnimation`
        );
        const successUrl =
          this.envConfig?.individualPlanOptions?.[plan.uuid]?.successUrl ??
          this.envConfig.globalPlanOptions.successUrl;
        const cancelUrl =
          this.envConfig?.individualPlanOptions?.[plan.uuid]?.cancelUrl ??
          this.envConfig.globalPlanOptions.cancelUrl;
        const granteeId =
          this.envConfig?.individualPlanOptions?.[plan.uuid]?.granteeId ??
          this.envConfig.globalPlanOptions.granteeId;

        const params = `${this.queryParametersFactory(this.checkoutConfig)}${
          this.envConfig.currency ? `&currency=${this.envConfig.currency}` : ''
        }`;

        const checkoutLinkResponse = await fetch(
          `${this.getApiDomain()}/plans/${plan.uuid}/checkoutlink?granteeId=${granteeId}&member=${
            this.envConfig.member
          }&successUrl=${successUrl}&cancelUrl=${cancelUrl}&${params}`,
          {
            headers: {
              'x-api-key': this.envConfig.apiKey,
              version: 'v2',
            },
          }
        ).catch(() => {
          // eslint-disable-next-line no-console
          console.error('Salable pricing table - error creating license');
        });
        if (checkoutLinkResponse.status === 200) {
          const data = await checkoutLinkResponse.json();
          location.href = data.checkoutUrl;
        }
        planCtaEl.removeAttribute('disabled');
        for (const cta of otherCtas) {
          cta.classList.remove('salable-plan-button-disabled');
          cta.classList.remove('salable-disabled');
          cta.removeAttribute('disabled', true);
        }
        planCtaElInnerSpan.innerText = planCtaText(plan, envConfig, buttonTextDefaults);
      });
    }

    if (plan.pricingType === 'free' && plan.planType !== 'Coming soon') {
      planCtaEl.addEventListener('click', async (event) => {
        event.preventDefault();
        if (this.envConfig.state === 'preview') return;
        if (planCtaEl.getAttribute('disabled')) return null;
        planCtaEl.classList.add('salable-disabled');

        const planCtaElInnerSpan = document.getElementById(planCtaElId).children[0];
        const otherCtas = Array.from(document.querySelectorAll('.salable-plan-button')).filter(
          (b) => b.id !== planCtaElId
        );
        for (const cta of otherCtas) {
          cta.classList.add('salable-plan-button-disabled');
          cta.classList.add('salable-disabled');
          cta.setAttribute('disabled', 'disabled');
        }
        planCtaElInnerSpan.innerText = '';
        planCtaEl.setAttribute('disabled', 'disabled');
        this.createInlineScript(
          this.createLottieAnimation(
            `document.querySelector('#${planCtaElId} .salable-plan-button-span')`,
            `${this.getCdnDomain()}/latest/lottie/dots-left-white.json`
          ),
          pricingTableContainerEl,
          `SalableLottie${planCtaElId}LoadingAnimation`
        );
        const licenseBody = Array.from({ length: plan.perSeatAmount }, () => ({
          planUuid: plan.uuid,
          member: this.checkoutConfig.member,
          granteeId: null,
          ...(this.checkoutConfig.customerEmail && {
            email: this.checkoutConfig.customerEmail,
          }),
        }));
        licenseBody[0].granteeId =
          this.envConfig?.individualPlanOptions?.[plan.uuid]?.granteeId ??
          this.envConfig.globalPlanOptions.granteeId;
        const licensesResponse = await fetch(`${this.getApiDomain()}/licenses`, {
          method: 'POST',
          headers: {
            'x-api-key': this.envConfig.apiKey,
            version: 'v2',
          },
          body: JSON.stringify(licenseBody),
        }).catch(() => {
          // eslint-disable-next-line no-console
          console.error('Salable pricing table - error creating license');
        });
        if (licensesResponse.status === 200) {
          location.href =
            this.envConfig?.individualPlanOptions?.[plan.uuid]?.successUrl ??
            this.envConfig.globalPlanOptions.successUrl;
        }
        planCtaEl.removeAttribute('disabled');
        for (const cta of otherCtas) {
          cta.classList.remove('salable-plan-button-disabled');
          cta.classList.remove('salable-disabled');
          cta.removeAttribute('disabled', true);
        }
        planCtaElInnerSpan.innerText = planCtaText(plan, envConfig, buttonTextDefaults);
      });
    }

    // planCtaEl.addEventListener('click', (event) => {
    //   switch (true) {
    //     case envConfig.individualPlanOptions?.[plan?.uuid]?.cta.callback !== undefined :
    //       envConfig.individualPlanOptions[plan.uuid].cta.callback({
    //         planId: plan.uuid,
    //         paddlePlanId: plan.paddlePlanId,
    //         type: plan.planType,
    //         buttonEvent: event,
    //         callback: defaultCallback,
    //       })
    //       break
    //     case envConfig.globalPlanOptions?.cta?.callback !== undefined :
    //       envConfig.globalPlanOptions.cta.callback({
    //         planId: plan.uuid,
    //         paddlePlanId: plan.paddlePlanId,
    //         type: plan.licenseType,
    //         buttonEvent: event,
    //         callback: defaultCallback,
    //       })
    //       break
    //     default :
    //       defaultCallback(plan.uuid, plan.paddlePlanId, plan.planType)
    //       break
    //   }
    // })
    return planCtaEl;
  }

  createPlan(classPrefix) {
    return this.createElWithClass('div', `${classPrefix}-plan`);
  }

  createPlansPerInterval({
    interval,
    plans,
    pricingTableContainerEl,
    classPrefix,
    envConfig,
    plansContainerEl,
    defaultCurrency,
    featuredPlanUuid,
    customTheme,
  }) {
    if (!plans.length) return null;
    const buttonTextDefaults = {
      Standard: {
        free: 'Subscribe',
        paid: 'Subscribe',
      },
      'Coming soon': 'Contact us',
      enterprise: 'Contact us',
    };

    let planIndex = 0;
    for (const plan of plans) {
      const planEl = this.createPlan(classPrefix);
      if (plan.uuid === featuredPlanUuid) {
        planEl.classList.add('salable-plan-featured');
      }

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
            pricingTableContainerEl,
            interval,
            featuredPlanUuid,
            customTheme,
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
      pricingTableContainerEl.appendChild(plansContainerEl);
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

  queryParametersFactory(queryParams) {
    let paramsStr = '';

    const allowedQueryParams = [
      'customerCountry',
      'customerId',
      'customerEmail',
      'customerPostcode',
      'member',
      'promoCode',
      'allowPromoCode',
      'marketingConsent',
      'changeQuantity',
    ];

    for (const key of Object.keys(queryParams)) {
      if (allowedQueryParams.includes(key) && queryParams[key]) {
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

  getApiDomain() {
    return `https://api.salable.${this.envConfig.environment === 'stg' ? 'org' : 'app'}`;
  }

  getCdnDomain() {
    return `https://cdn.salable.${this.envConfig.environment === 'stg' ? 'org' : 'app'}`;
  }

  getPricingTableFactory(data) {
    if (data.featureOrder === 'custom') {
      for (const f of data.product.features) {
        f.sortOrder = data.features.find((feat) => feat.featureUuid === f.uuid)?.sortOrder;
      }
    }
    const plans = data.plans;
    const product = data.product;
    delete data.plans;
    delete data.product;
    return {
      ...data,
      ...product,
      plans: plans.map((p) => ({
        ...p.plan,
        sortOrder: p.sortOrder,
      })),
    };
  }

  setCssVariable(name, value) {
    const root = document.querySelector(':root');
    root.style.setProperty(name, value);
  }

  setCssVariables(variablesObj) {
    if (typeof variablesObj !== 'object') return;
    for (const key of Object.keys(variablesObj)) {
      this.setCssVariable(key, variablesObj[key]);
    }
  }
}
