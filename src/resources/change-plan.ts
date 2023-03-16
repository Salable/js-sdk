import {MissingPropertyError} from '../utils/errors';
import {SalableBase} from './base';

export interface IChangePlan {
  planID: string;
  subscriptionID: string;
}

export type ChangePlanCallbackProp = (
  success?: {
    message: string;
  },
  error?: string
) => void;

export class ChangePlan extends SalableBase {
  protected _defaultErrorMessage: string;
  constructor(apiKey: string) {
    super(apiKey);
    this._defaultErrorMessage = 'Unknown error while changing plan. Please try again later';
  }

  upgradeOrDowngradePlanSync = async ({planID, subscriptionID}: IChangePlan) => {
    if (typeof planID !== 'string' || !planID.trim()) {
      MissingPropertyError('planID');
    }
    if (typeof subscriptionID !== 'string' || !subscriptionID.trim()) {
      MissingPropertyError('subscriptionID');
    }
    try {
      await this._request(`/subscriptions/${subscriptionID}/updateplan/${planID}`, {
        method: 'PUT',
      });
      return {message: 'Plan changed successfully'};
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(error.message);
      }
      throw new Error(this._defaultErrorMessage);
    }
  };
  upgradeOrDowngradePlanAsync = ({planID, subscriptionID}: IChangePlan, callback?: ChangePlanCallbackProp) => {
    if (typeof planID !== 'string' || !planID.trim()) {
      MissingPropertyError('planID');
    }
    if (typeof subscriptionID !== 'string' || !subscriptionID.trim()) {
      MissingPropertyError('subscriptionID');
    }
    this._request(`/subscriptions/${subscriptionID}/updateplan/${planID}`, {
      method: 'PUT',
    })
      .then(() => {
        if (callback) {
          callback({message: 'Plan changed successfully'}, undefined);
          return;
        }
      })
      .catch((error) => {
        if (callback) {
          if (error instanceof Error) {
            callback(undefined, error.message);
            return;
          }
          callback(undefined, this._defaultErrorMessage);
          return;
        }
      });
  };
}
