import { IPlan, IPlanCurrency } from '../interfaces/plan.interface';
import { BaseComponent } from './base';

export class CheckoutComponents extends BaseComponent {
  constructor() {
    super();
    // DEV environment
    this._createCssStyleSheetLink(`../../../dist/css/checkout.css`, 'SalableCssCheckout');
  }

  _pricingDetails(plan: IPlan | null, planCurrency: IPlanCurrency | null) {
    return `
    <p class="slb_pricing">
        <span class="slb_pricing__label">Price</span>
        <span class="slb_pricing__price">
        ${
          plan && plan.pricingType === 'paid' && planCurrency
            ? `${new Intl.NumberFormat(planCurrency.currency.shortName, {
                style: 'currency',
                currency: planCurrency.currency.shortName,
              }).format(planCurrency.price / 100)} / ${plan?.interval}`
            : 'Free'
        }
        </span>
    </p>
    `;
  }

  _addStripeEmailForm() {
    return `
        <form onSubmit={createSubscriptionIntent}>
            <InputEmail className={styles['mb-24']} onChange={onEmailChange} errorMessage={emailError} />
            <button
                disabled={creatingIntent}
                id="submit"
                type="submit"
                style={{
                borderRadius: customStyles?.borderRadius,
                padding: customStyles?.spacingUnit3,
                backgroundColor: customStyles?.primaryColor,
                }}
            >
                <span id="button-text">
                {creatingIntent ? <div className="spinner" id="spinner" /> : 'Continue'}
                </span>
            </button>
            <ErrorMessage message={errorMessage} />
        </form>
    `;
  }

  _addStripePaymentForm() {
    return `
        <form id="payment-form">
            <div id="link-authentication-element"></div>
            <div id="payment-element"></div>
            <button id="submit">
                <div class="spinner hidden" id="spinner"></div>
                <span id="button-text">Pay now</span>
            </button>
            <div id="payment-message" class="hidden"></div>
        </form>
    `;
  }

  _StripeProvider() {
    // 1. Load stripe library

    void (async () => {
      try {
        //   this._addScript('https://js.stripe.com/v3/', 'salableStripeScript');

        await this._loadScript('https://js.stripe.com/v3/', 'salableStripeScript');
      } catch (error) {}
    })();

    // 2. Load
    return this._addStripeEmailForm();
  }
}

export class IntegrationComponents {
  _showMessage(messageText?: string, autoHide = true) {
    const errorNode = document.querySelector('#slb_errorMessage');
    if (!errorNode || !messageText) return;

    errorNode.classList.remove('hidden');
    errorNode.textContent = messageText;

    setTimeout(function () {
      if (!errorNode || !autoHide) return;

      errorNode.classList.add('hidden');
      errorNode.textContent = '';
    }, 4000);
  }

  _setLoading(isLoading: boolean) {
    if (isLoading) {
      // Disable the button and show a spinner
      document.querySelector('#submit')?.setAttribute('disabled', 'true');
      document.querySelector('#spinner')?.classList.remove('hidden');
      document.querySelector('#button-text')?.classList.add('hidden');
    } else {
      document.querySelector('#submit')?.removeAttribute('disabled');
      document.querySelector('#spinner')?.classList.add('hidden');
      document.querySelector('#button-text')?.classList.remove('hidden');
    }
  }
}
