export interface IProduct {
  uuid: string;
  organisationPaymentIntegration: {
    accountData: {
      publishableKey: string;
      secretKey: string;
    };
    accountName: string;
    integrationName: 'stripe' | 'paddle' | string;
    organisation: string;
    updatedAt: string;
    uuid: string;
  };
}

export interface IPlanLabels {
  name: string;
  displayName: string;
  description?: string;
}

export interface IPlanLicenseType {
  licenseType: string;
  active: boolean;
  visibility: string;
  interval: string;
  pricingType: string;
  evaluation: boolean;
  paddlePlanId?: number | null;
  type: string;
  capabilities: string[];
  evalDays: number | undefined;
  length: number;
  planType: string;
}

export enum IStatus {
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  CANCELED = 'CANCELED',
  DEPRECATED = 'DEPRECATED',
}

export interface IFeatureOnPlan {
  featureUuid: string;
  enumValue: string;
  value: string;
  isUnlimited: boolean;
}

export interface IPlanCurrency {
  currencyUuid: string;
  planUuid: string;
  price: number;
}

export interface ICapability {
  uuid: string;
  name: string;
  description: string | null;
  status: IStatus;
  productUuid: string;
  updatedAt: string;
}

export interface IPlan {
  uuid: string;
  displayName: string;
  price: number;
  interval: string;
  length: number;
  pricingType: string;
  currency: {
    shortName: string;
    locale: string;
  };
}

// export interface IPlan
//   extends IPlanLabels,
//     Omit<IPlanLicenseType, 'capabilities'> {
//   environment: string;
//   productUuid: string;
//   type: string;
//   uuid: string;
//   price: number;
//   status: IStatus;
//   features: IFeatureOnPlan[];
//   currencies: IPlanCurrency[];
//   capabilities: ICapability[];
// }
