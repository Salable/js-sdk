import {ChangePlan, IChangePlan, ChangePlanCallbackProp} from './resources/change-plan';
import {SalableAvailablePlans} from './resources/available-plans';
import {SalableBase} from './resources/base';

interface IAvailablePlans {
  apiKey: string;
  granteeID: string;
  memberID: string;
  productID: string;
  subscriptionID?: string;
}

export class Salable extends SalableBase {
  _changePlan = new ChangePlan(this._apiKey);

  public availablePlans = (params: Omit<IAvailablePlans, 'apiKey'>) => {
    return new SalableAvailablePlans({...params, apiKey: this._apiKey});
  };

  public changePlanSync = (params: IChangePlan) => {
    return this._changePlan.upgradeOrDowngradePlanSync(params);
  };

  public changePlanAsync = (params: IChangePlan, callback?: ChangePlanCallbackProp) => {
    return this._changePlan.upgradeOrDowngradePlanAsync(params, callback);
  };
}

window.Salable = Salable;
