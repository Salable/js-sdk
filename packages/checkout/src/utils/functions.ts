import { ICheckoutStyle } from '../interfaces/checkout.interface';

interface IMapProperty {
  /**
   * This can be - color or background-color
   */
  primaryColor?: string | false;
  fontFamily?: boolean;
  borderRadius?: boolean;
  backgroundColor?: boolean;
}
export const extractStyles = (styles: ICheckoutStyle, mapProperty?: IMapProperty) => {
  const stylings = [];
  // Border Radius
  if (
    styles.borderRadius &&
    (mapProperty?.borderRadius || typeof mapProperty?.borderRadius == 'undefined')
  ) {
    stylings.push(`border-radius: ${styles.borderRadius}`);
  }
  // Primary color
  if (styles.primaryColor && mapProperty?.primaryColor) {
    stylings.push(`${mapProperty?.primaryColor || 'color'}: ${styles.primaryColor}`);
  }
  // Font family
  if (styles?.fontFamily && mapProperty?.fontFamily) {
    stylings.push(`font-family: ${styles.fontFamily}`);
  }
  //  Background color
  if (styles?.backgroundColor && mapProperty?.backgroundColor) {
    stylings.push(`background-color: ${styles.backgroundColor}`);
  }

  if (stylings.length) {
    return stylings.join(';');
  }
  return '';
};
