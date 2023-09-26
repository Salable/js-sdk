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
}

export class SalableCheckout extends SalableBase {
  protected _planID: string;
  protected _successURL: string;
  protected _cancelURL: string;
  protected _granteeID: string;
  protected _memberID: string;
  protected _customerEmail?: string;
  protected _checkoutNode: string | null;
  protected _styling: ICheckoutStyling | null;
  protected _skeleton: SkeletonComponents;
  protected _components: CheckoutComponents;

  constructor({ APIKey, options, ...params }: ISalableCheckout) {
    super(APIKey, options);
    this._planID = params.planID;
    this._granteeID = params.granteeID;
    this._memberID = params.memberID;
    this._successURL = params.successURL;
    this._customerEmail = params.customerEmail;
    this._cancelURL = params.cancelURL;
    this._checkoutNode = null;
    this._styling = null;
    this._skeleton = new SkeletonComponents();
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
          styles: defaultStyles,
        });

        let integrationType: string | null = null;

        // 2. Get data
        let planData: IPlan | null = null;
        let stylingData: ICheckoutStylingResponse | null = null;
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
        } else {
          integrationType = 'stripe';
          planErrorMessage =
            (planResponse.reason as { stack: string; message: string }).message ||
            'Failed to get plan required for payment';
        }

        if (stylingResponse.status === 'fulfilled') {
          stylingData = stylingResponse.value;
        } else {
          // Do nothing
        }
        // 3. Display variant output
        // Render error message
        if (planErrorMessage && !planData) {
          checkoutNode.innerHTML = this._skeleton._IntegrationWrapper({
            integrationType: 'stripe',
            children: this._skeleton._FormFieldError(planErrorMessage),
            styles: stylingData || defaultStyles,
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
          styles: stylingData || defaultStyles,
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
        });
        const paymentType = decryptAccount<'stripe'>(
          paymentIntegration.accountData?.encryptedData,
          paymentIntegration.accountData.key
        );

        if (!paymentType || paymentType.status !== 'ACTIVE') {
          checkoutNode.innerHTML = this._skeleton._IntegrationWrapper({
            integrationType: 'stripe',
            children: this._skeleton._FormFieldError(
              'Payment Integration for this product not fully setup yet'
            ),
            styles: stylingData || defaultStyles,
          });
          return;
        }
        if (paymentType.paymentProvider === 'stripe') {
          stripeProvider._render({
            node: paymentNodeID,
            planID: planData?.uuid || '',
            stripePubKey: environment.publishableKey,
            customerEmail: this._customerEmail,
            accountID: paymentType.accountId,
            styles: stylingData || defaultStyles,
          });
        }
      } catch (error) {
        checkoutNode.innerHTML = this._skeleton._IntegrationWrapper({
          integrationType: 'stripe',
          children: this._skeleton._FormFieldError('Something went wrong. Please try again'),
          styles: defaultStyles,
        });
      }
    })();
  }
}
