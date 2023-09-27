import { ICheckoutStyle } from '../interfaces/checkout.interface';
import { IPlan, IPlanCurrency } from '../interfaces/plan.interface';
import { environment } from '../resources/config';
import { extractStyles } from '../utils/functions';
import { BaseComponent } from './base';

export class CheckoutComponents extends BaseComponent {
  constructor() {
    super();
    // DEV environment
    this._createCssStyleSheetLink(`${environment.assert}/css/checkout.css`, 'SalableCssCheckout');
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
}

export class IntegrationComponents {
  _ErrorMessage() {
    return `
        <div class="slb_errorMessageBox">
            <span class="slb_errorMessage" id="slb_errorMessage_email"></span>
        </div>`;
  }

  _showMessage(
    messageText?: string,
    type: 'info' | 'error' | 'success' | 'warning' = 'info',
    autoHide = true
  ) {
    const errorNode = document.querySelector('#slb_payment_message');
    if (!errorNode || !messageText) return;

    errorNode.classList.add('slb_payment_message');
    switch (type) {
      case 'error':
        errorNode.classList.add('slb_payment_message_error');
        break;
      case 'success':
        errorNode.classList.add('slb_payment_message_success');
        break;
      case 'warning':
        errorNode.classList.add('slb_payment_message_warning');
        break;
      case 'info':
      default:
        errorNode.classList.add('slb_payment_message_info');
        break;
    }
    errorNode.textContent = messageText;

    setTimeout(function () {
      if (!errorNode || !autoHide) return;

      errorNode.classList.remove('slb_payment_message');
      errorNode.textContent = '';
    }, 4000);
  }

  _FormButton(text: string, styles: ICheckoutStyle) {
    const styling = extractStyles(styles, { primaryColor: 'background-color' });
    return `
        <button id="slb_button_submit" class="slb_button_submit" type="submit" style="${styling}">
          <div id="slb_button_spinner" class="slb_button_spinner slb_hidden"></div>
          <span id="slb_button_text">${text}</span>
        </button>
    `;
  }

  _setLoadingForSubmitButton(isLoading: boolean) {
    if (isLoading) {
      // Disable the button and show a spinner
      document.querySelector('#slb_button_submit')?.setAttribute('disabled', 'true');
      document.querySelector('#slb_button_spinner')?.classList.remove('slb_hidden');
      document.querySelector('#slb_button_text')?.classList.add('slb_hidden');
    } else {
      document.querySelector('#slb_button_submit')?.removeAttribute('disabled');
      document.querySelector('#slb_button_spinner')?.classList.add('slb_hidden');
      document.querySelector('#slb_button_text')?.classList.remove('slb_hidden');
    }
  }
}
