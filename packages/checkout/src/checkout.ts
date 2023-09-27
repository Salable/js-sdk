import { CheckoutComponents } from './components/checkout';
import { SkeletonComponents } from './components/skeleton';
import { StripeProvider } from './integrations/stripe';
import { ICheckoutStyling, ICheckoutStylingResponse } from './interfaces/checkout.interface';
import { IOrganisationPaymentIntegration, IPlan } from './interfaces/plan.interface';
import { IBaseResource, SalableBase, defaultStyles } from './resources/base';
import { environment } from './resources/config';
import { decryptAccount } from './utils/decrypt-data';
import { MissingPropertyError } from './utils/errors';

export interface ISalableCheckout extends IBaseResource {
  planID: string;
  successURL: string;
  cancelURL: string;
  customerEmail?: string;
  granteeID: string;
  memberID: string;
  styling?: ICheckoutStyling;
}

export class SalableCheckout extends SalableBase {
  protected _planID: string;
  protected _successURL: string;
  protected _cancelURL: string;
  protected _granteeID: string;
  protected _memberID: string;
  protected _customerEmail?: string;
  protected _stylings: ICheckoutStyling;
  protected _testMode: boolean;
  protected _skeleton: SkeletonComponents;
  protected _components: CheckoutComponents;

  constructor({ APIKey, options, styling, ...params }: ISalableCheckout) {
    super(APIKey, options);
    this._createCssStyleSheetLink(`../../../dist/css/skeleton.css`, 'SalableCssSkeleton');
    this._planID = params.planID;
    this._granteeID = params.granteeID;
    this._memberID = params.memberID;
    this._successURL = params.successURL;
    this._customerEmail = params.customerEmail;
    this._cancelURL = params.cancelURL;
    this._stylings = { ...defaultStyles, ...styling };
    const testMode = APIKey.startsWith('test_') ? true : false;
    this._testMode = testMode;
    this._skeleton = new SkeletonComponents({ testMode });
    this._components = new CheckoutComponents();
  }

  mount(checkoutNode: Element) {
    void (async () => {
      if (!checkoutNode) MissingPropertyError('element');
      try {
        // 1. Loading
        checkoutNode.innerHTML = this._skeleton._IntegrationWrapper({
          integrationType: 'paddle',
          children: this._skeleton._FormFieldLoading(),
          styles: this._stylings,
        });

        let integrationType: string | null = null;

        // 2. Get data
        let planData: IPlan | null = null;
        let planErrorMessage: string | null = null;
        let paymentIntegration: IOrganisationPaymentIntegration | null = null;

        const [planResponse, stylingResponse] = await Promise.allSettled([
          this._request<IPlan>(
            `/plans/${this._planID}?expand=[product.organisationPaymentIntegration,features.feature,features.enumValue, currencies.currency]`,
            {
              method: 'GET',
            }
          ),
          this._request<ICheckoutStylingResponse>('/checkout/get-styling', {
            method: 'GET',
          }),
        ]);

        integrationType = 'stripe';
        if (planResponse.status === 'fulfilled') {
          planData = planResponse.value;
          integrationType =
            planData.product?.organisationPaymentIntegration?.integrationName || null;
          paymentIntegration = planData?.product.organisationPaymentIntegration;

          // check if plan is test mode
          this._testMode = this._testMode && planData.isTest;
          this._skeleton.changeTestMode(this._testMode);
        } else {
          integrationType = 'stripe';
          planErrorMessage =
            (planResponse.reason as { stack: string; message: string }).message ||
            'Failed to get plan required for payment';
        }

        if (stylingResponse.status === 'fulfilled') {
          this._stylings = { ...defaultStyles, ...stylingResponse.value, ...this._stylings };
        } else {
          this._stylings = { ...defaultStyles, ...this._stylings };
        }
        // 3. Display variant output
        // Render error message
        if (planErrorMessage && !planData) {
          checkoutNode.innerHTML = this._skeleton._IntegrationWrapper({
            integrationType: 'stripe',
            children: this._skeleton._FormFieldError(planErrorMessage),
            styles: this._stylings,
          });
          return;
        }

        const paymentNodeID = 'slb-stripe-root';
        checkoutNode.innerHTML = this._skeleton._IntegrationWrapper({
          integrationType: (integrationType as 'paddle' | 'stripe') || 'stripe',
          children: [
            this._components._pricingDetails(planData, planData?.currencies[0] || null),
            ` <div class=${paymentNodeID} id=${paymentNodeID}></div>`,
          ],
          styles: this._stylings,
        });

        if (!paymentIntegration) return;

        /**
         * Load CryptoJS package.
         * CryptoJS will be used for decrypting the payment integration
         * account data for consumption
         */
        await this._loadScript(
          'https://cdnjs.cloudflare.com/ajax/libs/crypto-js/3.1.9-1/crypto-js.js',
          'salableCrypto'
        );

        const stripeProvider = new StripeProvider({
          granteeID: this._granteeID,
          memberID: this._memberID,
          successURL: this._successURL,
          APIKey: this._apiKey,
          options: this._options,
          testMode: this._testMode,
          stripePubKey: environment.publishableKey,
          stipeLiveKey: environment.liveKey,
        });
        const paymentType = decryptAccount<'stripe'>(
          paymentIntegration.accountData?.encryptedData,
          paymentIntegration.accountData.key
        );

        /**
         * Check and display a message if the payment isn't fully setup
         */
        if (!paymentType || paymentType.status !== 'ACTIVE') {
          checkoutNode.innerHTML = this._skeleton._IntegrationWrapper({
            integrationType: 'stripe',
            children: this._skeleton._FormFieldError(
              'Payment Integration for this product not fully setup yet'
            ),
            styles: this._stylings,
          });
          return;
        }
        /**
         * Render Stripe Payment element if the payment method is Stripe
         */
        if (paymentType.paymentProvider === 'stripe') {
          stripeProvider._render({
            node: paymentNodeID,
            planID: planData?.uuid || '',
            customerEmail: this._customerEmail,
            accountID: paymentType.accountId,
            styles: this._stylings,
          });
        }
      } catch (error) {
        checkoutNode.innerHTML = this._skeleton._IntegrationWrapper({
          integrationType: 'stripe',
          children: this._skeleton._FormFieldError('Something went wrong. Please try again'),
          styles: this._stylings || defaultStyles,
        });
      }
    })();
  }
}
