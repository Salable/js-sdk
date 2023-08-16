export interface ICheckoutStyling {
  fontFamily: string;
  backgroundColor: string;
  primaryColor: string;
  spacingUnit: string;
  borderRadius: string;
}

export interface ICheckoutStylingResponse {
  checkoutStyling: ICheckoutStyling;
}

export interface ICheckoutStyle {
  fontFamily?: string;
  spacingUnit?: string;
  borderRadius?: string;
  primaryColor?: string;
  backgroundColor?: string;
}
