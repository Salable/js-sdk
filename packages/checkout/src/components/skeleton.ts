import { ICheckoutStyle } from '../interfaces/checkout.interface';
import { extractStyles } from '../utils/functions';
import { BaseComponent } from './base';

interface IBackground {
  height?: string;
  width?: string;
  none?: boolean;
}

interface IIntegrationWrapper {
  children?: string | string[];
  integrationType: 'stripe' | 'paddle';
  preview?: boolean;
  width?: string;
  background?: IBackground;
  styles: ICheckoutStyle;
}

export class SkeletonComponents extends BaseComponent {
  constructor() {
    super();
    // DEV environment
    this._createCssStyleSheetLink(`../../../dist/css/skeleton.css`, 'SalableCssSkeleton');
  }

  protected _getStyleValueString(key: keyof Omit<IBackground, 'none'>, background?: IBackground) {
    if (!background || background?.none) return undefined;
    return background[key];
  }

  _InputLabelSkeleton(message = 'loading') {
    return `
     <div class="salable_skeleton__label">
      <span class="salable_skeleton__discernable_text">${message}</span>
     </div>
    `;
  }

  _InputSkeleton(message = 'loading') {
    const label = this._InputLabelSkeleton();
    return `
    <div class="salable_skeleton__input_wrapper salable_skeleton__cursor_loading">
      ${label}
      <div class="salable_skeleton__input">
        <span class="salable_skeleton__discernable_text" style="opacity: 0;">${message}</span>
      </div>
    </div>
    `;
  }

  protected _components = ({ children }: Pick<IIntegrationWrapper, 'children'>): string => {
    if (children && typeof children === 'string') {
      return children;
    }
    if (typeof children === 'object' && children.length) {
      // return {...children},
      return children.join('');
    }
    return '';
  };

  _FormFieldLoading(children?: string) {
    return `
        <div class="salable_addressFormFieldsBox">
        ${this._InputSkeleton()}
        ${this._InputSkeleton()}
        ${this._InputSkeleton()}
        ${children ? children : ''}
        </div>
    `;
  }

  _FormFieldError(message: string) {
    const errorContent = `
    <div class="salable_errorBox">
        <div class="salable_errorBox__container">
          <p>${message}</p>
        </div>
      </div>
    `;
    return this._FormFieldLoading(errorContent);
  }
  _FormFieldMessage(message: string) {
    const errorContent = `
    <div class="salable_errorBox">
        <div class="salable_messageBox__container">
          <p>${message}</p>
        </div>
      </div>
    `;
    return this._FormFieldLoading(errorContent);
  }

  _IntegrationWrapper({
    integrationType,
    preview,
    children,
    styles,
    width = '458px',
  }: IIntegrationWrapper) {
    const stylings = extractStyles(styles, {
      fontFamily: true,
      backgroundColor: true,
      borderRadius: false,
    });

    return `
            <div aria-readonly
                class="salable_integrationWrapper${preview ? 'salable_previewWrapper' : ''} ${
      integrationType === 'stripe' ? 'salable_stripeWrapper' : ''
    } ${integrationType === 'paddle' ? 'salable_paddleWrapper' : ''}"
                tabIndex=${preview ? -1 : 0}
                style="${stylings};min-width:${width};"
            >
                ${
                  integrationType === 'paddle' && preview
                    ? `
                <div class="salable_paddlePreview">
                    <div class="salable_paddlePreview__message">
                    <h2>You will need to customize your Paddle Checkout from your Paddle Dashboard.</h2>
                    <p class="salable_paddlePreview__message_sub">
                        You can find the customization page under <br /> <strong>Checkout</strong> &#8594;{' '}
                        <strong>Checkout settings</strong>.
                    </p>
                    </div>
                </div>`
                    : ''
                }
                ${this._components({ children })}
            </div>
    `;
  }
}
