import { IntegrationComponents } from '../components/checkout';
import { ICheckoutStyle } from '../interfaces/checkout.interface';
import { IBaseResource, SalableBase } from '../resources/base';
import { Stripe } from '../resources/external';
import {
  StripeElements,
  StripeElementsOptions,
  StripePaymentElementOptions,
} from '@stripe/stripe-js';
import { extractStyles } from '../utils/functions';
import { SkeletonComponents } from '../components/skeleton';

interface IBase {
  granteeID: string;
  memberID: string;
}
interface IStripeProvider extends IBase, IBaseResource {
  successURL: string;
}

interface IStripeRender {
  planID: string;
  stripePubKey: string;
  accountID: string;
  customerEmail?: string;
  node: string;
  styles: ICheckoutStyle;
}

interface IRenderElementRender extends IStripeRender {
  clientSecret: string;
  successURL: string;
}

interface ICreateSubscriptionIntent extends IBase {
  userEmail: string;
  planID: string;
  accountID: string;
}

interface IInputEmail {
  label?: string;
  errorMessage?: string;
  styles: ICheckoutStyle;
  className?: string;
}

export class StripeProvider extends SalableBase {
  protected _granteeID: string;
  protected _memberID: string;
  protected _successURL: string;
  protected _skeleton: SkeletonComponents;
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
    this._skeleton = new SkeletonComponents();

    // DEV environment
    this._createCssStyleSheetLink(
      `../../../dist/css/stripe-checkout.css`,
      'SalableCssStripeCheckout'
    );
    this._components = new IntegrationComponents();
  }

  protected _bedrock(node: string, styles: ICheckoutStyle) {
    const rootNode = document.getElementById(node);
    const elements = `
            <form id="slb_payment_form">
              <div id="link-authentication-element">
                <!--Stripe.js injects the Link Authentication Element-->
              </div>
              <div id="slb_payment_element"></div>
              ${this._components._FormButton('Pay now', styles)}
              <div id="slb_payment_message" class=""></div>
            </form>
            `;
    if (rootNode) rootNode.innerHTML = elements;
  }

  _InputEmail({ label = 'Email', styles, className }: IInputEmail) {
    const stylings = extractStyles(styles);
    return `
        <div data-field="email" class="${className ? className : ''}">
        <label htmlFor="slb_email_input" class="slb_input_label">
            ${label}
        </label>
        <input
            id="slb_email_input"
            dir="ltr"
            type="email"
            inputMode="email"
            name="slb_email"
            autoComplete="email"
            class="slb_input"
            style="${stylings}"
        />
        ${this._components._ErrorMessage()}
        </div>
    `;
  }

  protected _createSubscriptionIntent = ({
    userEmail,
    granteeID,
    memberID,
    planID,
    node,
    stripePubKey,
    accountID,
    styles,
  }: ICreateSubscriptionIntent &
    Omit<IRenderElementRender, 'clientSecret' | 'successURL' | 'customerEmail'>) => {
    const emailInputErrorNode = document.getElementById('slb_errorMessage_email');
    const emailValid = this._validateEmailRegex.test(userEmail);
    // Validate email address
    if (!userEmail || !emailValid) {
      document.getElementById('slb_email_input')?.classList.add('slb_email_input_invalid');

      if (emailInputErrorNode) {
        emailInputErrorNode.textContent = 'Your email is invalid.';
      }

      return;
    }
    //After email is validated, create client secrete for stripe form
    this._components._setLoadingForSubmitButton(true);
    void (async () => {
      try {
        const res = await this._request<{ clientSecret: string }>(
          '/checkout/create-subscription-intent',
          {
            method: 'POST',
            body: JSON.stringify({
              planUuid: planID,
              email: userEmail,
              member: memberID,
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
            clientSecret: 'pi_3NtEyOQNgztiveVE0ukRHDt4_secret_SMgDXBKxBIIDGKSkDMKV8JFeE',
            accountID,
            successURL: this._successURL,
            styles,
          });
        }
      } catch (error) {
        this._components._showMessage('Failed to create payment intent. Please try again');
      }
      this._components._setLoadingForSubmitButton(false);
    })();
  };

  /**
   * Render function renders components needed to
   * handle and process payment for a plan with
   * Stripe payment method
   * @param IStripeRender
   * @returns empty string
   */
  _render({ node, stripePubKey, planID, accountID, customerEmail, styles }: IStripeRender) {
    // Get the element the form will be rendered on
    const rootNode = document.getElementById(node);

    // function for handling and creating payment intent with stripe and client secret
    const handleSubmit = (e: Event) => {
      e.preventDefault();

      const inputEmail = document.getElementById('slb_email_input') as HTMLInputElement;
      this._createSubscriptionIntent({
        granteeID: this._granteeID,
        memberID: this._memberID,
        planID,
        userEmail: inputEmail.value,
        node,
        stripePubKey,
        accountID,
        styles,
      });
    };

    /**
     * If prefill email is provided,
     * validate email, show message, and create payment intent
     */
    if (customerEmail) {
      const emailValid = this._validateEmailRegex.test(customerEmail);
      if (emailValid) {
        const elements = `
        <form id="slb_email_form">
        ${this._skeleton._IntegrationWrapper({
          integrationType: 'paddle',
          width: '375px',
          children: this._skeleton._FormFieldMessage('Initializing checkout...'),
          styles: styles,
        })}
        </form>
        `;
        if (rootNode) rootNode.innerHTML = elements;
        this._createSubscriptionIntent({
          granteeID: this._granteeID,
          memberID: this._memberID,
          planID,
          userEmail: customerEmail,
          node,
          stripePubKey,
          accountID,
          styles,
        });
        return '';
      }
    }

    /**
     * Form will handle and process the necessary information needed
     * to create payment intent and return client secret
     **/
    const elements = `
          <form id="slb_email_form">
            ${this._InputEmail({ label: 'Email', styles })}
            ${this._components._FormButton('Continue', styles)}
            ${this._components._ErrorMessage()}
          </form>
    `;
    if (rootNode) rootNode.innerHTML = elements;
    document.querySelector('#slb_email_form')?.addEventListener('submit', handleSubmit);
    const emailInput = document.getElementById('slb_email_input') as HTMLInputElement;
    const emailInputErrorNode = document.getElementById('slb_errorMessage_email');

    emailInput?.addEventListener('input', () => {
      const emailValid = this._validateEmailRegex.test(emailInput.value);
      // Validate email address
      if (!emailInput.value || !emailValid) {
        emailInput?.classList.add('slb_email_input_invalid');
      } else {
        if (emailInputErrorNode) {
          emailInputErrorNode.textContent = '';
        }
        emailInput?.classList.remove('slb_email_input_invalid');
      }
    });

    return '';
  }

  protected _renderStripeElement({
    stripePubKey,
    node,
    clientSecret,
    successURL,
    accountID,
    styles,
  }: IRenderElementRender) {
    void (async () => {
      await this._loadScript('https://js.stripe.com/v3/', 'salableStripeScript');

      if (typeof Stripe === 'undefined') return;
      const stripe = Stripe(stripePubKey, {
        stripeAccount: accountID,
      });

      if (typeof stripe === 'undefined') return;
      let elements: StripeElements;

      // render elements in dom for stripe to render its element
      this._bedrock(node, styles);

      initialize();
      await checkStatus();

      document.querySelector('#slb_payment_form')?.addEventListener('submit', handleSubmit);

      function initialize() {
        if (typeof stripe === 'undefined') return;
        const options: StripeElementsOptions = {
          clientSecret,
          appearance: {
            theme: 'stripe',
            variables: {
              borderRadius: styles.borderRadius,
              colorPrimary: styles.primaryColor,
            },
          },
        };
        elements = stripe.elements(options);

        const paymentElementOptions: StripePaymentElementOptions = {
          layout: 'tabs',
        };

        const paymentElement = elements.create('payment', paymentElementOptions);
        paymentElement.mount('#slb_payment_element');
      }

      const components = new IntegrationComponents();

      async function handleSubmit(e: Event) {
        e.preventDefault();

        if (!stripe || !elements) {
          // Stripe.js has not yet loaded.
          // Make sure to disable form submission until Stripe.js has loaded.
          return;
        }

        components._setLoadingForSubmitButton(true);

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
          components._showMessage(error.message || undefined, 'error');
        } else {
          components._showMessage('An unexpected error occurred.', 'error');
        }

        components._setLoadingForSubmitButton(false);
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
            components._showMessage('Payment succeeded!', 'success');
            break;
          case 'processing':
            components._showMessage('Your payment is processing.', 'info');
            break;
          case 'requires_payment_method':
            components._showMessage('Your payment was not successful, please try again.', 'error');
            break;
          default:
            components._showMessage('Something went wrong.', 'error');
            break;
        }
      }
    })();
  }
}
