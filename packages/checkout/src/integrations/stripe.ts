import { BaseComponent } from '../components/base';
import { Stripe } from '../resources/external';
import {
  StripeElements,
  StripeElementsOptions,
  StripePaymentElementOptions,
} from '@stripe/stripe-js';

interface IStripeProvider {
  granteeID: string;
  memberID: string;
}

interface IStripeRender {
  planID: string;
  stripePubKey: string;
  node: string;
}

export class StripeProvider extends BaseComponent {
  protected _granteeID: string;
  protected _memberID: string;
  constructor({ granteeID, memberID }: Omit<IStripeProvider, 'planID' | 'stripePubKey'>) {
    super();
    this._granteeID = granteeID;
    this._memberID = memberID;

    // DEV environment
    this._createCssStyleSheetLink(
      `../../../dist/css/stripe-checkout.css`,
      'SalableCssStripeCheckout'
    );
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
    // return elements;
    if (rootNode) rootNode.innerHTML = elements;
  }

  _render({ stripePubKey, node }: IStripeRender) {
    void (async () => {
      await this._loadScript('https://js.stripe.com/v3/', 'salableStripeScript');
      this._bedrock(node);
      // This is your test publishable API key.
      if (typeof Stripe === 'undefined') return;
      const stripe = Stripe(stripePubKey);

      if (typeof stripe === 'undefined') return;

      // The items the customer wants to buy
      const items = [{ id: 'xl-tshirt' }];

      let elements: StripeElements;

      await initialize();
      await checkStatus();

      document.querySelector('#payment-form')?.addEventListener('submit', handleSubmit);

      //   let emailAddress = '';
      // Fetches a payment intent and captures the client secret
      async function initialize() {
        if (typeof stripe === 'undefined') return;
        const response = await fetch('http://localhost:4242/create-payment-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items }),
        });
        const { clientSecret } = (await response.json()) as { clientSecret: string };

        const options: StripeElementsOptions = {
          clientSecret,
          appearance: {
            theme: 'stripe',
          },
        };
        elements = stripe.elements(options);

        // const linkAuthenticationElement = elements.create('linkAuthentication');
        // linkAuthenticationElement.mount('#link-authentication-element');

        // linkAuthenticationElement.on('change', (event) => {
        //   emailAddress = event.value.email;
        // });

        const paymentElementOptions: StripePaymentElementOptions = {
          layout: 'tabs',
        };

        const paymentElement = elements.create('payment', paymentElementOptions);
        paymentElement.mount('#payment-element');
      }

      async function handleSubmit(e: Event) {
        e.preventDefault();

        if (!stripe || !elements) {
          // Stripe.js has not yet loaded.
          // Make sure to disable form submission until Stripe.js has loaded.
          return;
        }

        setLoading(true);

        const { error } = await stripe.confirmPayment({
          elements,
          confirmParams: {
            // Make sure to change this to your payment completion page
            return_url: 'http://127.0.0.1:5500/packages/checkout/example/index.html',
            // receipt_email: emailAddress,
          },
        });

        // This point will only be reached if there is an immediate error when
        // confirming the payment. Otherwise, your customer will be redirected to
        // your `return_url`. For some payment methods like iDEAL, your customer will
        // be redirected to an intermediate site first to authorize the payment, then
        // redirected to the `return_url`.
        if (error.type === 'card_error' || error.type === 'validation_error') {
          showMessage(error.message || undefined);
        } else {
          showMessage('An unexpected error occurred.');
        }

        setLoading(false);
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
            showMessage('Payment succeeded!');
            break;
          case 'processing':
            showMessage('Your payment is processing.');
            break;
          case 'requires_payment_method':
            showMessage('Your payment was not successful, please try again.');
            break;
          default:
            showMessage('Something went wrong.');
            break;
        }
      }

      // ------- UI helpers -------

      function showMessage(messageText?: string) {
        const messageContainer = document.querySelector('#payment-message');

        if (!messageContainer || !messageText) return;

        messageContainer.classList.remove('hidden');
        messageContainer.textContent = messageText;

        setTimeout(function () {
          messageContainer.classList.add('hidden');
          messageContainer.textContent = '';
        }, 4000);
      }

      // Show a spinner on payment submission
      function setLoading(isLoading: boolean) {
        if (isLoading) {
          // Disable the button and show a spinner
          document.querySelector('#submit')?.setAttribute('disabled', 'true');
          document.querySelector('#spinner')?.classList.remove('hidden');
          document.querySelector('#button-text')?.classList.add('hidden');
        } else {
          document.querySelector('#submit')?.setAttribute('disabled', 'false');
          document.querySelector('#spinner')?.classList.add('hidden');
          document.querySelector('#button-text')?.classList.remove('hidden');
        }
      }
    })();
    return '';
  }
}
