export class Salable {
  envConfig;
  checkoutConfig;
  initialisers;

  constructor(envConfig, checkoutConfig) {
    this.envConfig = new EnvConfig(envConfig);
    this.checkoutConfig = new CheckoutConfig(checkoutConfig);
    this.initialisers = new Initialisers(envConfig, checkoutConfig)
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
        value: this.envConfig.pricingTableNode
      },
      apiKey: {
        value: this.envConfig.apiKey
      },
      productUuid: {
        value: this.envConfig.productUuid
      },
      cancelUrl: {
        value: this.envConfig.globalPlanOptions.cancelUrl
      },
      member: {
        value: this.checkoutConfig.member
      }
    }

    for (const key of Object.keys(requiredFields)) {
      if (!requiredFields[key].value) throw Error(`Salable pricing table - missing property ${key}`)
    }

    if (this.envConfig.apiKey) {
      const classPrefix = 'salable'
      const pricingTable = this.envConfig.pricingTableNode
      const bodyMovinScript = document.createElement('script')
      bodyMovinScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/bodymovin/5.7.7/lottie.min.js'
      bodyMovinScript.integrity = 'sha512-HDCfX3BneBQMfloBfluMQe6yio+OfXnbKAbI0SnfcZ4YfZL670nc52Aue1bBhgXa+QdWsBdhMVR2hYROljf+Fg=='
      bodyMovinScript.crossOrigin = 'anonymous'
      bodyMovinScript.defer = true
      bodyMovinScript.id = "SalableLottieCdn"
      document.body.appendChild(bodyMovinScript)

      this.initialisers.createCssStyleSheetLink(`${this.initialisers.getCdnDomain()}/latest/css/main.css`, "SalableCssMain")
      this.initialisers.createCssStyleSheetLink(`${this.initialisers.getCdnDomain()}/latest/css/themes/${this.envConfig.theme ?? 'light'}.css`, `SalableCss${this.envConfig.theme ? this.envConfig.theme[0].toUpperCase()+this.envConfig.theme.substr(1) : 'Light'}`)

      const pricingTableContainerEl = this.initialisers.createElWithClass('div', `${classPrefix}-pricing-table-container`)
      pricingTable.appendChild(pricingTableContainerEl)

      pricingTableContainerEl.setAttribute("data-interval", "month")

      if (this.envConfig.globalPlanOptions?.cta?.visibility === "hidden") pricingTableContainerEl.classList.add("salable-global-cta-hidden")
      if (this.envConfig.state) pricingTableContainerEl.classList.add(`salable-pricing-table-state-${this.envConfig.state}`)

      const loadingEl = this.initialisers.createElWithClass('div', `${classPrefix}-loading`)
      pricingTableContainerEl.appendChild(loadingEl)

      bodyMovinScript.addEventListener('load', () => {
        this.initialisers.createInlineScript(this.initialisers.createLottieAnimation(`document.getElementsByClassName('salable-loading')[0]`, `${this.initialisers.getCdnDomain()}/latest/lottie/dots-left-${this.envConfig.theme === 'dark' ? "white" : "blue"}.json`), pricingTableContainerEl, "SalableLottiePricingTableLoadingAnimation")
      })

      if(!this.envConfig.globalPlanOptions.successUrl) this.envConfig.globalPlanOptions.successUrl = document.URL

      const granteeIdsWithHashes = this.envConfig.individualPlanOptions ? Object.keys(this.envConfig.individualPlanOptions)?.map((key) => {
        const granteeId = this.envConfig.individualPlanOptions[key].granteeId ?? this.envConfig.globalPlanOptions.granteeId
        return `${key},${granteeId}`
      }) : []

      const successUrlsWithHashes = this.envConfig.individualPlanOptions ? Object.keys(this.envConfig.individualPlanOptions)?.map((key) => {
        const successUrl = this.envConfig.individualPlanOptions[key].successUrl ?? this.envConfig.globalPlanOptions.successUrl
        return `${key},${successUrl}`
      }) : []

      const cancelUrlsWithHashes = this.envConfig.individualPlanOptions ? Object.keys(this.envConfig.individualPlanOptions)?.map((key) => {
        const cancelUrl = this.envConfig.individualPlanOptions[key].cancelUrl ?? this.envConfig.globalPlanOptions.cancelUrl
        return `${key},${cancelUrl}`
      }) : []

      let response = {}
      let encoded = null
      if (this.envConfig.pricingTableUuid) {
        encoded = encodeURI(`${this.initialisers.getApiDomain()}/pricing-tables/${this.envConfig.pricingTableUuid}?globalGranteeId=${this.envConfig.globalPlanOptions.granteeId}&granteeIds=[${granteeIdsWithHashes}]&globalSuccessUrl=${this.envConfig.globalPlanOptions.successUrl}&successUrls=[${successUrlsWithHashes}]&globalCancelUrl=${this.envConfig.globalPlanOptions.cancelUrl}&cancelUrls=[${cancelUrlsWithHashes}]&member=${this.checkoutConfig.member}${this.initialisers.queryParametersFactory(this.checkoutConfig)}`)
      } else {
        encoded = encodeURI(`${this.initialisers.getApiDomain()}/products/${this.envConfig.productUuid}/pricingtable?globalGranteeId=${this.envConfig.globalPlanOptions.granteeId}&granteeIds=[${granteeIdsWithHashes}]&globalSuccessUrl=${this.envConfig.globalPlanOptions.successUrl}&successUrls=[${successUrlsWithHashes}]&globalCancelUrl=${this.envConfig.globalPlanOptions.cancelUrl}&cancelUrls=[${cancelUrlsWithHashes}]&member=${this.checkoutConfig.member}${this.initialisers.queryParametersFactory(this.checkoutConfig)}`)
      }
      try {
        response = await fetch(encoded, {
          method: "GET",
          headers: {
            "x-api-key": this.envConfig.apiKey,
            "version": "v1",
          }
        })
      } catch(error) {
        throw new Error("Salable - Failed to fetch pricing table")
      }

      if (response.status === 200) {
        let data = await response.json()
        if (this.envConfig.pricingTableUuid) {
          data = this.initialisers.getPricingTableFactory(data)
        }
        const defaultCurrency = data?.currencies?.find((c) => c.defaultCurrency)

        let plans = data.plans.filter((p) => p.active && p.planType !== 'bespoke' && p.status === 'ACTIVE').sort((a, b) => {
          if (this.envConfig.pricingTableUuid) return a.sortOrder - b.sortOrder
          if (a.pricingType === 'free' && a.planType !== 'Coming soon') return -1
          if (a.planType === 'Coming soon' || b.planType === 'Coming soon') return 1
          return a.currencies.find((c) => c.currencyUuid === defaultCurrency.currencyUuid)?.price - b.currencies.find((c) => c.currencyUuid === defaultCurrency.currencyUuid)?.price
        })

        if (plans.filter((p) => p.interval === 'month').length) {
          this.initialisers.createPlansPerInterval({
            interval: "month",
            plans: plans.filter((p) => p.interval === 'month' || (p.pricingType === 'free' && p.planType === 'Standard')),
            pricingTableContainerEl,
            classPrefix,
            envConfig: this.envConfig,
            checkoutConfig: this.checkoutConfig,
            plansContainerEl: this.initialisers.createElWithClass('div', `${classPrefix}-plans-container ${classPrefix}-plans-container-month`),
            defaultCurrency
          })
        }

        if (plans.filter((p) => p.interval === 'year' && p.pricingType === 'paid').length) {
          this.initialisers.createPlansPerInterval({
            interval: "year",
            plans: plans.filter((p) => p.interval === 'year' || (p.pricingType === 'free' && p.planType === 'Standard')),
            pricingTableContainerEl,
            classPrefix,
            envConfig: this.envConfig,
            checkoutConfig: this.checkoutConfig,
            plansContainerEl: this.initialisers.createElWithClass('div', `${classPrefix}-plans-container ${classPrefix}-plans-container-year`),
            defaultCurrency
          })
        }

        if (plans.filter((p) => p.interval === 'year' && p.pricingType === 'paid').length && plans.filter((p) => p.interval === 'month').length) {
          const monthlyEl = document.querySelector(`.${classPrefix}-plans-container-month`)
          const yearEl = document.querySelector(`.${classPrefix}-plans-container-year`)
          const plansIntervalToggleEl = this.initialisers.createPricingTableIntervalToggle(classPrefix)
          document.querySelectorAll(`.${classPrefix}-plans-container`)[0].parentNode.insertBefore(plansIntervalToggleEl, document.querySelectorAll(`.${classPrefix}-plans-container`)[0])
          yearEl.style.display = "none"
          plansIntervalToggleEl.addEventListener('click', () => {
            if (yearEl.style.display === "none") {
              pricingTableContainerEl.setAttribute("data-interval", "year")
              monthlyEl.style.display = "none"
              yearEl.style.display = "flex"
              document.querySelector(`.${classPrefix}-plans-interval-toggle-label-year`).classList.add(`${classPrefix}-plans-interval-toggle-active`)
              document.querySelector(`.${classPrefix}-plans-interval-toggle-label-month`).classList.remove(`${classPrefix}-plans-interval-toggle-active`)
            } else {
              pricingTableContainerEl.setAttribute("data-interval", "month")
              monthlyEl.style.display = "flex"
              yearEl.style.display = "none"
              document.querySelector(`.${classPrefix}-plans-interval-toggle-label-year`).classList.remove(`${classPrefix}-plans-interval-toggle-active`)
              document.querySelector(`.${classPrefix}-plans-interval-toggle-label-month`).classList.add(`${classPrefix}-plans-interval-toggle-active`)
            }
          })
        }

        loadingEl.style.display = "none"

        if (this.envConfig.stylingOptions && Object.keys(this.envConfig.stylingOptions).length) {
          const stylingOptionsKeyValues = Object.entries(this.envConfig.stylingOptions)
          const root = document.querySelector(':root')

          if (stylingOptionsKeyValues) {
            for (const option of stylingOptionsKeyValues) {
              root.style.setProperty(`--${option[0].split('_').join('-')}`, option[1]);
            }
          }
        }
      }

    } else {
      console.error("Api key is missing from environment config passed into Salable init() function")
    }
  }

  removeScripts() {
    const script = document.createElement('script');
    script.textContent = `
      bodymovin.destroy();
    `
    document.body.appendChild(script);
    const scripts = document.querySelectorAll("script");
    if (scripts.length) {
      for (const s of scripts) {
        if (s.id.includes("SalableLottie")) s.remove();
      }
    }
    const cssLinks = document.querySelectorAll("link");
    if (cssLinks.length) {
      for (const c of cssLinks) {
        if (c.id.includes("SalableCss")) c.remove();
      }
    }
    script.remove();
  }

  destroy () {
    this.removeScripts();
    this.envConfig.pricingTableNode.remove();
  }
}

class EnvConfig {
  pricingTableNode
  productUuid
  pricingTableUuid
  apiKey
  stylingOptions
  theme
  contactUsLink
  currency
  globalPlanOptions
  individualPlanOptions
  state
  environment

  constructor(config) {
    this.pricingTableNode = config.pricingTableNode;
    this.productUuid = config.productUuid;
    this.pricingTableUuid = config.pricingTableUuid;
    this.organisationId = config.organisationId;
    this.apiKey = config.apiKey;
    this.authToken = config.authToken;
    this.stylingOptions = config.stylingOptions
    this.theme = config.theme
    this.contactUsLink = config.contactUsLink
    this.currency = config.currency
    this.globalPlanOptions = config.globalPlanOptions
    this.individualPlanOptions = config.individualPlanOptions
    this.state = config.state
    this.environment = config.environment
  }

  get pricingTableNode() {
    return this.pricingTableNode
  }

  get productUuid() {
    return this.productUuid
  }

  get apiKey() {
    return this.apiKey
  }

  get globalPlanOptions() {
    return this.globalPlanOptions
  }

  get individualPlanOptions() {
    return this.individualPlanOptions
  }

  get state() {
    return this.state
  }

  get environment() {
    return this.environment
  }

  get contactUsLink() {
    return this.contactUsLink
  }

}

class CheckoutConfig {
  customerEmail
  customerPostcode
  customerCountry
  vatNumber
  vatCompanyName
  vatStreet
  vatCity
  vatState
  vatCountry
  vatPostcode
  member
  marketingConsent
  couponCode

  constructor(config) {
    this.customerEmail = config.customer.email
    this.customerPostcode = config.customer.postcode
    this.customerCountry = config.customer.country
    this.vatNumber = config.vat?.number
    this.vatCompanyName = config.vat?.companyName
    this.vatStreet = config.vat?.street
    this.vatState = config.vat?.state
    this.vatCity = config.vat?.city
    this.vatCountry = config.vat?.country
    this.vatPostcode = config.vat?.postcode
    this.member = config.member
    this.marketingConsent = config.marketingConsent
    this.couponCode = config.couponCode
  }

  get customerEmail() {
    return this.customerEmail
  }

  get customerPostcode() {
    return this.customerPostcode
  }

  get customerCountry() {
    return this.customerCountry
  }

  get vatNumber() {
    return this.vatNumber
  }

  get vatCompanyName() {
    return this.vatCompanyName
  }

  get vatStreet() {
    return this.vatStreet
  }

  get vatState() {
    return this.vatState
  }

  get vatCity() {
    return this.vatCity
  }

  get vatCountry() {
    return this.vatCountry
  }

  get vatPostcode() {
    return this.vatPostcode
  }

  get member() {
    return this.member
  }

  get marketingConsent() {
    return this.marketingConsent
  }

  get couponCode() {
    return this.couponCode
  }
}

class Initialisers {
  envConfig
  checkoutConfig

  constructor(envConfig, checkoutConfig) {
    this.envConfig = envConfig;
    this.checkoutConfig = checkoutConfig;
  }

  createElWithClass (type, className) {
    const el = document.createElement(type)
    el.className = className
    return el
  }

  createPricingTableIntervalToggle (classPrefix) {
    const plansIntervalToggleEl = this.createElWithClass('button', `${classPrefix}-plans-interval-toggle`)
    const plansIntervalToggleMonthLabel = this.createElWithClass('span', `${classPrefix}-plans-interval-toggle-label ${classPrefix}-plans-interval-toggle-label-month ${classPrefix}-plans-interval-toggle-active`)
    const plansIntervalToggleYearLabel = this.createElWithClass('span', `${classPrefix}-plans-interval-toggle-label ${classPrefix}-plans-interval-toggle-label-year`)
    plansIntervalToggleMonthLabel.innerText = "Monthly Plans"
    plansIntervalToggleYearLabel.innerText = "Yearly Plans"
    plansIntervalToggleEl.appendChild(plansIntervalToggleMonthLabel)
    plansIntervalToggleEl.appendChild(plansIntervalToggleYearLabel)

    return plansIntervalToggleEl
  }

  createPlanPrice (classPrefix, plan, planEl, defaultCurrency) {
    const planPriceEl = this.createElWithClass('div', `${classPrefix}-plan-price`);
    if (plan.pricingType === 'free') {
      planPriceEl.innerText = 'Free'
    } else {
      if (plan.currencies?.length) {
        const matchedCurrency = plan.currencies.find((c) => {
          if (this.envConfig.currency) return c.currency.shortName === this.envConfig.currency
          return c.currency.uuid === defaultCurrency.currencyUuid
        })
        if (this.envConfig.currency && !matchedCurrency) throw Error ('Salable pricing table - currency provided does not exist on product')
        if (matchedCurrency) {
          const price = (matchedCurrency.price / 100).toFixed(2)
          planPriceEl.innerText = `${matchedCurrency.currency.symbol}${price.toString().includes('.00') ? price.replace('.00','') : price}`;
        }
        const planPriceIntervalEl = this.createElWithClass('span', `${classPrefix}-plan-price-interval`)
        planPriceIntervalEl.innerText = `per ${plan.interval}`
        planPriceEl.appendChild(planPriceIntervalEl)
      }
    }
    if (plan.planType === 'Coming soon') {
      planPriceEl.innerText = "Coming soon"
    }
    planEl.appendChild(planPriceEl);
  }

  createPlanHeading (classPrefix, plan) {
    const planHeadingEl = this.createElWithClass('h3', `${classPrefix}-plan-heading`)
    planHeadingEl.innerText = plan.displayName
    return planHeadingEl
  }

  createFeatureIcon (classPrefix, feature) {
    return feature.value === "false" ? '&#10007;' : '&#10004;';
  }

  createFeatureLabel (classPrefix) {
    const featureLabelEl = this.createElWithClass('span', `${classPrefix}-feature-list-item-label`)
    return featureLabelEl;
  }

  createFeatureValue (classPrefix) {
    const featureValueEl = this.createElWithClass('span', `${classPrefix}-feature-list-item-value`)
    return featureValueEl;
  }

  createPlansFeaturesList (classPrefix, plan) {
    const planFeaturesEl = this.createElWithClass('ul', `${classPrefix}-feature-list`)
    for (const feature of plan.features.filter((p) => p.feature.visibility === 'public')) {
      const featureEl = this.createElWithClass('li', `${classPrefix}-feature-list-item`)
      const featureLabelEl = this.createFeatureLabel(classPrefix);
      featureLabelEl.innerText = feature.feature.displayName
      featureEl.appendChild(featureLabelEl)
      const getValueText = (value) => {
        switch (value.toString()) {
          case "-1" :
            return "Unlimited"
          case "true" :
            return this.createFeatureIcon(classPrefix, feature)
          case "false" :
            return this.createFeatureIcon(classPrefix, feature)
          default :
            return feature?.feature.valueType === 'enum' && feature.enumValue.name ? feature.enumValue.name : value
        }
      }
      const featureValueEl = this.createFeatureValue(classPrefix)
      featureValueEl.innerHTML = getValueText(feature.value)
      featureEl.appendChild(featureValueEl)
      planFeaturesEl.appendChild(featureEl)
    }
    return planFeaturesEl;
  }

  createPlanCta ({
                   classPrefix,
                   envConfig,
                   plan,
                   planIndex,
                   buttonTextDefaults,
                   pricingTableContainerEl,
                   interval
                 }) {
    const defaultCallback = (planId, paddlePlanId, type) => {
      const checkoutConfig = this.checkoutConfig
      switch (type) {
        case "Standard" :
          // Paddle.Checkout.open({
          //   product: paddlePlanId,
          //   email: checkoutConfig.email ?? null,
          //   postcode: checkoutConfig.postcode ?? null,
          //   country: checkoutConfig.country ?? null
          // });
          break
        case "Coming soon" :
          alert(`Default\nid: ${planId}\ntype: Coming soon `)
          break
        default :
          console.error('Salable pricing table - Unhandled plan type')
          break
      }
    }
    const planCtaEl = this.createElWithClass('a', `${classPrefix}-plan-button${plan.planType === 'Coming soon' ? " salable-plan-button-coming-soon" : ""}`)
    const planCtaText = (plan, envConfig, buttonTextDefaults) => {
      switch (true) {
        case envConfig.individualPlanOptions?.[plan?.uuid]?.cta?.text !== undefined :
          return envConfig.individualPlanOptions[plan.uuid].cta.text
        case envConfig.globalPlanOptions?.cta?.text?.[plan.planType.toLowerCase()] !== undefined :
          return envConfig.globalPlanOptions.cta.text[plan.planType.toLowerCase()]
        case buttonTextDefaults?.[plan?.planType] !== undefined :
          if (plan?.planType === 'Standard') return buttonTextDefaults?.[plan?.planType]?.[plan?.pricingType]
          return buttonTextDefaults?.[plan.planType]
        default :
          return "Buy"
      }
    }

    const planCtaUrl = (plan) => {
      switch (plan.planType) {
        case "Standard" :
          return plan.pricingType === 'paid' ? plan.checkoutUrl : `${this.getApiDomain()}/licenses`
        case "Coming soon" :
          const comingSoonUrl = this.envConfig?.individualPlanOptions?.[plan.uuid]?.contactUsLink ?? this.envConfig?.globalPlanOptions?.contactUsLink
          if (!comingSoonUrl) throw Error(`Salable pricing table - missing contact us link on ${plan.uuid}`)
          return comingSoonUrl
      }
    }

    planCtaEl.setAttribute('href', planCtaUrl(plan));
    planCtaEl.setAttribute('target', '_top')
    const planCtaElText = planCtaText(plan, envConfig, buttonTextDefaults)
    planCtaEl.innerText = planCtaElText

    if (plan.pricingType === 'free' && plan.planType !== 'Coming soon') {
      planCtaEl.innerText = ''
      const planCtaElId = `${interval === "year" ? "year" : plan.interval}${planIndex}Cta`
      const planCtaElInnerSpan = this.createElWithClass('span', 'salable-plan-button-span')
      planCtaElInnerSpan.innerText = planCtaText(plan, envConfig, buttonTextDefaults)
      planCtaEl.appendChild(planCtaElInnerSpan)
      planCtaEl.classList.add('salable-plan-button-free')
      planCtaEl.id = planCtaElId

      planCtaEl.addEventListener('click', async (event) => {
        event.preventDefault();
        if (this.envConfig.state !== "preview") {
          if (planCtaEl.getAttribute('disabled')) return null
          planCtaEl.classList.add('salable-disabled')

          const otherCtas = Array.from(document.querySelectorAll('.salable-plan-button')).filter((b) => b.id !== planCtaElId)
          for (const cta of otherCtas) {
            cta.classList.add('salable-plan-button-disabled')
            cta.classList.add('salable-disabled')
            cta.setAttribute('disabled', 'disabled')
          }
          planCtaElInnerSpan.innerText = ''
          planCtaEl.setAttribute('disabled', 'disabled');
          this.createInlineScript(this.createLottieAnimation(`document.querySelector('#${planCtaElId} .salable-plan-button-span')`, `${this.getCdnDomain()}/latest/lottie/dots-left-white.json`), pricingTableContainerEl, `SalableLottie${planCtaElId}LoadingAnimation`)
          const licensesResponse = await fetch(`${this.getApiDomain()}/licenses`, {
            method: "POST",
            headers: {
              "x-api-key": this.envConfig.apiKey,
            },
            body: JSON.stringify({
              planUuid: plan.uuid,
              member: this.checkoutConfig.member,
              granteeId: this.envConfig?.individualPlanOptions?.[plan.uuid]?.granteeId ?? this.envConfig.globalPlanOptions.granteeId,
              ...(this.checkoutConfig.customer.email && {email: this.checkoutConfig.customer.email})
            })
          }).catch((error) => {
            console.error('Salable pricing table - error creating license');
          })
          if (licensesResponse.status === 200) {
            const planSuccessUrl = this.envConfig?.individualPlanOptions?.[plan.uuid]?.successUrl ?? this.envConfig.globalPlanOptions.successUrl
            location.href = planSuccessUrl
          }
          planCtaEl.removeAttribute('disabled')
          for (const cta of otherCtas) {
            cta.classList.remove('salable-plan-button-disabled')
            cta.classList.remove('salable-disabled')
            cta.removeAttribute('disabled', true)
          }
          planCtaElInnerSpan.innerText = planCtaText(plan, envConfig, buttonTextDefaults)
        }
      })
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
    const planEl = this.createElWithClass('div', `${classPrefix}-plan`)
    return planEl;
  }

  createPlansPerInterval ({
                            interval,
                            plans,
                            pricingTableContainerEl,
                            classPrefix,
                            envConfig,
                            plansContainerEl,
                            defaultCurrency
                          }) {
    const buttonTextDefaults =  {
      Standard: {
        free: "Create license",
        paid: "Buy"
      },
      "Coming soon": "Contact us",
      enterprise: "Contact us"
    }

    let planIndex = 0
    for (const plan of plans) {
      const planEl = this.createPlan(classPrefix);

      const planHeadingEl = this.createPlanHeading(classPrefix, plan, planEl);
      planEl.appendChild(planHeadingEl)
      this.createPlanPrice(classPrefix, plan, planEl, defaultCurrency);

      const planFeaturesEl = this.createPlansFeaturesList(classPrefix, plan);
      planEl.appendChild(planFeaturesEl)

      if (envConfig?.individualPlanOptions?.[plan?.uuid]?.cta?.visibility !== "hidden") {
        if (envConfig?.globalPlanOptions?.cta?.visibility !== "hidden") {
          const planCtaEl = this.createPlanCta({
            classPrefix,
            envConfig,
            plan,
            planIndex,
            buttonTextDefaults,
            pricingTableContainerEl,
            interval
          });
          if (this.envConfig.state === "preview") {
            if (plan.pricingType === 'free' && plan.planType !== 'Coming soon') {
              this.createTooltip(planCtaEl, planEl, "Free licenses cannot be created when the pricing table is in preview state", `${planCtaEl.id}Tooltip`)
            } else {
              planEl.appendChild(planCtaEl);
            }
          } else {
            planEl.appendChild(planCtaEl);
          }
        }
      }

      // Add Plan to pricing table
      plansContainerEl.appendChild(planEl)
      pricingTableContainerEl.appendChild(plansContainerEl)
      planIndex++
    }
  }

  createCssStyleSheetLink(link, id) {
    const head = document.getElementsByTagName('head')[0]
    const linkStylesheet = document.createElement('link')
    linkStylesheet.setAttribute('href', link)
    linkStylesheet.setAttribute('rel','stylesheet')
    if (id) linkStylesheet.id = id
    head.appendChild(linkStylesheet)
  }

  createInlineScript(script, sibling, id) {
    const inlineScript = document.createElement('script')
    inlineScript.textContent = script
    if (id) inlineScript.id = id
    sibling.insertBefore(inlineScript, null)
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
    `
  }

  queryParametersFactory(queryParams) {
    let paramsStr = ""

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
      'vatStreet'
    ]

    for (const key of Object.keys(queryParams)) {
      if (allowedQueryParams.includes(key)) {
        if (!queryParams[key]) break
        switch (key) {
          case "marketingConsent" :
            paramsStr += `&${key}=${queryParams[key] ? "1" : "0"}`
            break;
          default:
            paramsStr += `&${key}=${queryParams[key]}`
            break;
        }
      }
    }

    return paramsStr
  }

  createTooltip(el, elParent, tooltipText, id) {
    const toolTipElHolder = this.createElWithClass("div", "salable-tooltip-holder")
    const toolTipEl = this.createElWithClass("span", "salable-tooltip")
    toolTipEl.innerText = tooltipText
    toolTipEl.id = id
    toolTipEl.setAttribute('role', 'tooltip')
    toolTipElHolder.appendChild(toolTipEl)
    el.setAttribute("aria-describedby", id)
    toolTipElHolder.appendChild(el)
    elParent.appendChild(toolTipElHolder)

    el.addEventListener('mouseover', () => toolTipEl.classList.add('salable-tooltip-visible'))
    el.addEventListener('mouseleave', () => toolTipEl.classList.remove('salable-tooltip-visible'))
  }

  getApiDomain() {
    // return `https://api.salable.${this.envConfig.environment === "stg" ? "org" : "app"}`
    return `https://atbe8wc0u7.execute-api.eu-west-2.amazonaws.com/dev`
  }

  getCdnDomain() {
    return `https://cdn.salable.${this.envConfig.environment === "stg" ? "org" : "app"}`
  }

  getPricingTableFactory(data) {
    const plans = data.plans
    const product = data.product
    delete data.plans
    delete data.product
    return {
      ...data,
      ...product,
      plans: plans.map((p) => ({
        ...p.plan,
        sortOrder: p.sortOrder
      }))
    }
  }
}