import { IntegrationComponents } from '../components/checkout';
import { ICheckoutStyle } from '../interfaces/checkout.interface';
import { IBaseResource, SalableBase } from '../resources/base';
import { Stripe } from '../resources/external';
import {
  StripeElements,
  StripeElementsOptions,
  StripePaymentElementOptions,
} from '@stripe/stripe-js';

interface IStripeProvider extends IBaseResource {
  granteeID: string;
  memberID: string;
  successURL: string;
}

interface IStripeRender {
  planID: string;
  stripePubKey: string;
  accountID: string;
  node: string;
}

interface IRenderElementRender {
  planID: string;
  stripePubKey: string;
  clientSecret: string;
  successURL: string;
  accountID: string;
  node: string;
}

interface ICreateSubscriptionIntent {
  userEmail: string;
  planID: string;
  memberId: string;
  granteeID: string;
  accountID: string;
}

interface IInputEmail {
  label?: string;
  errorMessage?: string;
  style?: ICheckoutStyle;
  className?: string;
}

export class StripeProvider extends SalableBase {
  protected _granteeID: string;
  protected _memberID: string;
  protected _successURL: string;
  protected _components: IntegrationComponents;
  protected _validateEmailRegex = /\S+@\S+\.\S+/;
  constructor({
    granteeID,
    memberID,
    APIKey,
    options,
    successURL,
  }: Omit<IStripeProvider, 'planID' | 'stripePubKey'>) {
    super(APIKey, options);
    this._granteeID = granteeID;
    this._memberID = memberID;
    this._successURL = successURL;

    // DEV environment
    this._createCssStyleSheetLink(
      `../../../dist/css/stripe-checkout.css`,
      'SalableCssStripeCheckout'
    );
    this._components = new IntegrationComponents();
  }

  protected _bedrock(node: string) {
    const rootNode = document.getElementById(node);
    const elements = `
            <form id="payment-form">
              <div id="link-authentication-element">
                <!--Stripe.js injects the Link Authentication Element-->
              </div>
              <div id="payment-element">
                <!--Stripe.js injects the Payment Element-->
              </div>
              <button id="submit">
              <div class="spinner hidden" id="spinner"></div>
                <span id="button-text">Pay now</span>
              </button>
              <div id="payment-message" class="hidden"></div>
            </form>
            `;
    if (rootNode) rootNode.innerHTML = elements;
  }

  _InputEmail({ label = 'Email', style, className }: IInputEmail) {
    return `
        <div data-field="email" class="${className ? className : ''}">
        <label htmlFor="slb_email-input" class="slb_input_label">
            ${label}
        </label>
        <input
            id="slb-email-input"
            dir="ltr"
            type="email"
            inputMode="email"
            name="slb-email"
            autoComplete="email"
            class="slb_input"
            style=${style ? JSON.stringify(style) : ''}
        />
        <div class="slb_errorMessageBox">
            <span class="slb_errorMessage" id="slb_errorMessage_email"></span>
        </div>
        </div>
    `;
  }

  _FormButton(style?: ICheckoutStyle) {
    const styling = `
    ${style?.borderRadius ? `border-radius: ${style.borderRadius}` : ''}
    ${style?.spacingUnit ? `padding: ${style.spacingUnit}` : ''}
    ${style?.backgroundColor ? `background-color: ${style.backgroundColor}` : ''}
    `;
    return `
        <button
            disabled={isLoading || !stripe || !elements}
            id="submit"
            style=${styling}
        >
            <span id="slb_button-text">
            {isLoading ? <div class="spinner" id="spinner" /> : 'Pay now'}
            </span>
        </button>
    `;
  }

  protected _createSubscriptionIntent = ({
    userEmail,
    granteeID,
    memberId,
    planID,
    node,
    stripePubKey,
    accountID,
  }: ICreateSubscriptionIntent & Omit<IRenderElementRender, 'clientSecret' | 'successURL'>) => {
    const emailInputErrorNode = document.getElementById('slb_errorMessage_email');
    const emailValid = this._validateEmailRegex.test(userEmail);
    // Validate email address
    if (!userEmail || !emailValid) {
      document.getElementById('slb-email-input')?.classList.add('slb-email-input-invalid');

      if (emailInputErrorNode) {
        emailInputErrorNode.textContent = 'Invalid email address';
      }

      return;
    }
    //After email is validated, create client secrete for stripe form
    this._components._setLoading(true);
    void (async () => {
      try {
        const res = await this._request<{ clientSecret: string }>(
          '/checkout/create-subscription-intent',
          {
            method: 'POST',
            body: JSON.stringify({
              planUuid: planID,
              email: userEmail,
              member: memberId,
              granteeId: granteeID,
            }),
          }
        );
        const clientSecret = res.clientSecret;
        if (clientSecret) {
          this._renderStripeElement({
            planID,
            node,
            stripePubKey,
            clientSecret,
            accountID,
            successURL: this._successURL,
          });
        }
      } catch (error) {
        this._components._showMessage('Failed to create payment intent. Please try again');
      }
      this._components._setLoading(false);
    })();
  };

  /**
   * Render function renders components needed to
   * handle and process payment for a plan with
   * Stripe payment method
   * @param IStripeRender
   * @returns empty string
   */
  _render({ node, stripePubKey, planID, accountID }: IStripeRender) {
    // Get the element the form will be rendered on
    const rootNode = document.getElementById(node);

    // function for handling and creating payment intent with stripe and client secret
    const handleSubmit = (e: Event) => {
      e.preventDefault();

      const inputEmail = document.getElementById('slb-email-input') as HTMLInputElement;
      this._createSubscriptionIntent({
        granteeID: this._granteeID,
        memberId: this._memberID,
        planID,
        userEmail: inputEmail.value,
        node,
        stripePubKey,
        accountID,
      });
    };

    /**
     * Form will handle and process the necessary information needed
     * to create payment intent and return client secret
     **/
    const elements = `
          <form id="email-form">
            ${this._InputEmail({ label: 'Email' })}
            <button id="submit" type="submit" >
              <span id="button-text">Continue</span>
            </button>
            <div class="slb_errorMessageBox">
              <span class="slb_errorMessage" id="slb_errorMessage"></span>
            </div>
          </form>
    `;
    if (rootNode) rootNode.innerHTML = elements;
    document.querySelector('#email-form')?.addEventListener('submit', handleSubmit);
    const emailInput = document.getElementById('slb-email-input') as HTMLInputElement;
    const emailInputErrorNode = document.getElementById('slb_errorMessage_email');

    emailInput?.addEventListener('input', () => {
      const emailValid = this._validateEmailRegex.test(emailInput.value);
      // Validate email address
      if (!emailInput.value || !emailValid) {
        emailInput?.classList.add('slb-email-input-invalid');
      } else {
        if (emailInputErrorNode) {
          emailInputErrorNode.textContent = '';
        }
        emailInput?.classList.remove('slb-email-input-invalid');
      }
    });
    return '';
  }

  protected _renderStripeElement({
    stripePubKey,
    node,
    clientSecret,
    successURL,
  }: IRenderElementRender) {
    void (async () => {
      await this._loadScript('https://js.stripe.com/v3/', 'salableStripeScript');

      if (typeof Stripe === 'undefined') return;
      const stripe = Stripe(stripePubKey, {
        stripeAccount: 'acct_1NiiWSQNgztiveVE',
      });

      if (typeof stripe === 'undefined') return;
      let elements: StripeElements;

      // render elements in dom for stripe to render its element
      this._bedrock(node);

      initialize();
      await checkStatus();

      document.querySelector('#payment-form')?.addEventListener('submit', handleSubmit);

      function initialize() {
        if (typeof stripe === 'undefined') return;
        const options: StripeElementsOptions = {
          clientSecret,
          appearance: {
            theme: 'stripe',
          },
        };
        elements = stripe.elements(options);

        const paymentElementOptions: StripePaymentElementOptions = {
          layout: 'tabs',
        };

        const paymentElement = elements.create('payment', paymentElementOptions);
        paymentElement.mount('#payment-element');
      }

      const components = new IntegrationComponents();

      async function handleSubmit(e: Event) {
        e.preventDefault();

        if (!stripe || !elements) {
          // Stripe.js has not yet loaded.
          // Make sure to disable form submission until Stripe.js has loaded.
          return;
        }

        components._setLoading(true);

        const { error } = await stripe.confirmPayment({
          elements,
          confirmParams: {
            // Make sure to change this to your payment completion page
            return_url: successURL,
            // receipt_email: emailAddress,
          },
        });

        // This point will only be reached if there is an immediate error when
        // confirming the payment. Otherwise, your customer will be redirected to
        // your `return_url`. For some payment methods like iDEAL, your customer will
        // be redirected to an intermediate site first to authorize the payment, then
        // redirected to the `return_url`.
        if (error.type === 'card_error' || error.type === 'validation_error') {
          components._showMessage(error.message || undefined);
        } else {
          components._showMessage('An unexpected error occurred.');
        }

        components._setLoading(false);
      }

      // Fetches the payment intent status after payment submission
      async function checkStatus() {
        const clientSecret = new URLSearchParams(window.location.search).get(
          'payment_intent_client_secret'
        );

        if (!clientSecret || !stripe) {
          return;
        }

        const { paymentIntent } = await stripe.retrievePaymentIntent(clientSecret);

        switch (paymentIntent?.status) {
          case 'succeeded':
            components._showMessage('Payment succeeded!');
            break;
          case 'processing':
            components._showMessage('Your payment is processing.');
            break;
          case 'requires_payment_method':
            components._showMessage('Your payment was not successful, please try again.');
            break;
          default:
            components._showMessage('Something went wrong.');
            break;
        }
      }

      // Show a spinner on payment submission
    })();
  }
}
