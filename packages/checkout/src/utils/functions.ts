import { ICheckoutStyle } from '../interfaces/checkout.interface';

export const removeQuotes = (item: string) => item.replace(/['"]+/g, '');

interface IMapProperty {
  /**
   * This can be - color or background-color
   */
  primaryColor?: string | false;
}
export const extractStyles = (styles: ICheckoutStyle, mapProperty?: IMapProperty) => {
  const styling = `
    ${styles?.borderRadius ? `border-radius: ${styles.borderRadius};` : ''}
    ${
      styles?.primaryColor && mapProperty?.primaryColor
        ? `${mapProperty?.primaryColor || 'color'}: ${styles.primaryColor};`
        : ''
    }
    `;
  return styling;
};
