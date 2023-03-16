export interface IProductCurrency {
  productUuid: string;
  currencyUuid: string;
  defaultCurrency: boolean;
  currency: {
    uuid: string;
    shortName: string;
    longName: string;
    symbol: string;
  };
}

export interface IPlanCurrency {
  planUuid: string;
  currencyUuid: string;
  price: number;
  paymentIntegrationPlanId: string;
  currency: {
    uuid: string;
    shortName: string;
    longName: string;
    symbol: string;
  };
}

export interface IProductPaymentIntegration {
  uuid: string;
  organisation: string;
  integrationName: string;
  accountName: string;
  accountData: {
    key: string;
    encryptedData: string;
  };
  accountId: string;
  updatedAt: string;
}

export interface IPlan {
  uuid: string;
  name: string;
  description: null;
  displayName: string;
  status: string;
  trialDays: null;
  evaluation: boolean;
  evalDays: number;
  organisation: string;
  visibility: string;
  licenseType: string;
  interval: string;
  length: number;
  active: boolean;
  planType: string;
  pricingType: string;
  environment: string;
  type: string;
  paddlePlanId: null | number;
  productUuid: string;
  salablePlan: boolean;
  updatedAt: string;
  features: IPlanFeature[];
  currencies: IPlanCurrency[];
}

export interface IPlanFeature {
  planUuid: string;
  featureUuid: string;
  value: string;
  enumValueUuid: string | null;
  isUnlimited: boolean;
  updatedAt: string;
  feature: IPlanFeatureFeature;
  enumValue: null | {
    name: string;
  };
}

export interface IPlanFeatureFeature {
  uuid: string;
  name: string;
  description: string;
  displayName: string;
  variableName: string;
  status: string;
  visibility: string;
  valueType: string;
  defaultValue: string;
  showUnlimited: boolean;
  productUuid: string;
  updatedAt: string;
}

export interface IProduct {
  uuid: string;
  name: string;
  description: string;
  logoUrl: null | string;
  displayName: string;
  organisation: string;
  status: string;
  paid: boolean;
  organisationPaymentIntegrationUuid: string;
  paymentIntegrationProductId: string;
  updatedAt: string;
  currencies: IProductCurrency[];
  organisationPaymentIntegration: IProductPaymentIntegration;
  plans: IPlan[];
}
