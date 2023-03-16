import {SALABLE_BASE_URL, SALABLE_BASE_CDN} from '../constants';
import {MissingPropertyError} from '../utils/errors';

export interface IOptions {
  theme?: 'dark' | 'light';
}

export interface IBaseResource {
  apiKey: string;
  options?: IOptions;
}

export class SalableBase {
  protected _apiKey: string;
  protected _apiDomain: string;
  protected _cdnDomain: string;
  protected _options?: IOptions;

  constructor(apiKey: string, options?: IOptions) {
    this._apiKey = (apiKey || '').trim();
    this._apiDomain = SALABLE_BASE_URL;
    this._cdnDomain = SALABLE_BASE_CDN;

    if (new.target === SalableBase) {
      throw new Error('You cannot instantiate an abstract class!');
    }

    if (!apiKey) MissingPropertyError('apiKey');

    this._options = options;
  }

  protected _request = async <T>(endpoint: string, options?: RequestInit): Promise<T> => {
    const url = `${this._apiDomain}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      'x-api-key': this._apiKey,
    };

    const config = {
      ...options,
      headers,
    };

    return fetch(url, config).then(async (response) => {
      if (response.ok) {
        return response.json() as Promise<T>;
      }
      const error = (await response.json()) as {error: string};
      throw new Error(error?.error ?? response.statusText);
    });
  };
}
