import { CheckoutComponents } from './components/skeleton';
import { ICheckoutStyling, ICheckoutStylingResponse } from './interfaces/checkout.interface';
import { IPlan } from './interfaces/plan.interface';
import { IBaseResource, SalableBase } from './resources/base';
import { MissingPropertyError } from './utils/errors';

export interface ISalableCheckout extends IBaseResource {
  planID: string;
  successURL: string;
  cancelURL: string;
  granteeID: string;
  memberID: string;
}

export class SalableCheckout extends SalableBase {
  protected _planID: string;
  protected _successURL: string;
  protected _cancelURL: string;
  protected _granteeID: string;
  protected _memberID: string;
  protected _checkoutNode: string | null;
  protected _styling: ICheckoutStyling | null;
  protected _components: CheckoutComponents;

  constructor({ APIKey, options, ...params }: ISalableCheckout) {
    super(APIKey, options);
    this._planID = params.planID;
    this._granteeID = params.granteeID;
    this._memberID = params.memberID;
    this._successURL = params.successURL;
    this._cancelURL = params.cancelURL;
    this._checkoutNode = null;
    this._styling = null;
    this._components = new CheckoutComponents();
  }

  mount(checkoutNode: Element) {
    void (async () => {
      if (!checkoutNode) MissingPropertyError('element');
      try {
        // 1. Loading
        checkoutNode.innerHTML = this._components._IntegrationWrapper({
          integrationType: 'paddle',
          children: this._components._FormFieldLoading(),
          styles: null,
        });
        let planData: IPlan | null = null;
        let stylingData: ICheckoutStylingResponse | null = null;
        let planErrorMessage: string | null = null;

        const [planResponse, stylingResponse] = await Promise.allSettled([
          this._request<IPlan>(
            `/plans/${this._planID}?expand=[product.organisationPaymentIntegration,features.feature,features.enumValue, currencies.currency]`,
            {
              method: 'GET',
            }
          ),
          this._request<ICheckoutStylingResponse>('/checkout/styling', {
            method: 'GET',
          }),
        ]);

        if (planResponse.status === 'fulfilled') {
          planData = planResponse.value;
        } else {
          planErrorMessage =
            (planResponse.reason as { stack: string; message: string }).message ||
            'Failed to get plan required for payment';
        }

        if (stylingResponse.status === 'fulfilled') {
          stylingData = stylingResponse.value;
        } else {
          // Do nothing
        }
        // Render error message
        if (planErrorMessage && !planData) {
          checkoutNode.innerHTML = this._components._IntegrationWrapper({
            integrationType: 'stripe',
            children: this._components._FormFieldError(planErrorMessage),
            styles: stylingData?.checkoutStyling || null,
          });
          return;
        }
        // TODO: Render plan
      } catch (error) {
        checkoutNode.innerHTML = this._components._IntegrationWrapper({
          integrationType: 'paddle',
          children: this._components._FormFieldError('Something went wrong. Please try again'),
          styles: null,
        });
      }
    })();
  }
}
