import {SALABLE_BASE_URL, SALABLE_BASE_CDN} from '../constants';
import {MissingPropertyError} from '../utils/errors';

export class SalableBase {
  protected _apiKey: string;
  // protected _request;
  // protected _handlePromiseAllResults;
  // protected _createElWithClass;
  protected _apiDomain: string;
  protected _cdnDomain: string;

  constructor(apiKey: string) {
    this._apiKey = (apiKey || '').trim();
    this._apiDomain = SALABLE_BASE_URL;
    this._cdnDomain = SALABLE_BASE_CDN;

    if (new.target === SalableBase) {
      throw new Error('You cannot instantiate an abstract class!');
    }

    if (!apiKey) MissingPropertyError('apiKey');
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

  /**
   * Create a HTML element in the document along with the class
   *
   * @export createElWithClass
   * @param {string} type
   * @param {string} className
   * @return {HTMLElement}
   */
  protected _createElWithClass = (type: string, className?: string) => {
    const el = document.createElement(type);
    el.className = className || '';
    return el;
  };
}
