import {SALABLE_BASE_URL} from './constants';
import {MissingPropertyError} from './utils/errors';

export class BaseResource {
  protected _apiKey;
  protected _request;
  protected _createElWithClass;
  protected _apiDomain: string;

  constructor(apiKey: string) {
    this._apiKey = (apiKey || '').trim();
    this._apiDomain = SALABLE_BASE_URL;

    if (new.target === BaseResource) {
      throw new Error('You cannot instantiate an abstract class!');
    }

    if (!apiKey) MissingPropertyError('apiKey');

    this._request = async <T>(endpoint: string, options?: RequestInit): Promise<T> => {
      const url = `${this._apiDomain}${endpoint}`;
      const headers = {
        'Content-Type': 'application/json',
        'x-api-key': this._apiKey,
      };

      const config = {
        ...options,
        headers,
      };

      return fetch(url, config).then((response) => {
        if (response.ok) {
          return response.json() as Promise<T>;
        }
        throw new Error(response.statusText);
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
    this._createElWithClass = (type: string, className?: string) => {
      const el = document.createElement(type);
      el.className = className || '';
      return el;
    };
  }
}
