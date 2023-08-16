export interface IOrganisationPaymentIntegrationAccountData {
  key: string;
  encryptedData: string;
}

export interface IOrganisationPaymentIntegration {
  uuid: string;
  organisation: string;
  integrationName: string;
  accountName: string;
  accountData: IOrganisationPaymentIntegrationAccountData;
  accountId: string;
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
  organisationPaymentIntegration: IOrganisationPaymentIntegration;
}

export interface IPlan {
  uuid: string;
  name: string;
  description: null | string;
  displayName: string;
  status: string;
  trialDays: null | string;
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
  paddlePlanId: null | string;
  productUuid: string;
  salablePlan: boolean;
  updatedAt: string;
  product: IProduct;
  features: IFeatures[];
  currencies: IPlanCurrency[];
}

export interface IFeature {
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

export interface IFeatures {
  planUuid: string;
  featureUuid: string;
  value: string;
  enumValueUuid: null | string;
  isUnlimited: boolean;
  updatedAt: string;
  feature: IFeature;
  enumValue: null | string;
}

export interface IPlanCurrency {
  planUuid: string;
  currencyUuid: string;
  price: number;
  paymentIntegrationPlanId: string;
  currency: ICurrency;
}
export interface ICurrency {
  uuid: string;
  shortName: string;
  longName: string;
  symbol: string;
}
