import { BaseComponent } from '../components/base';
import { environment } from './config';
import { MissingPropertyError } from '../utils/errors';

export interface IOptions {
  theme?: 'dark' | 'light' | 'auto';
}

export const defaultStyles = {
  fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif',
  backgroundColor: '#F8F9FF',
  primaryColor: '#554FFD',
  spacingUnit: '4px',
  borderRadius: '4px',
};

export interface IBaseResource {
  APIKey: string;
  options?: IOptions;
}

export class SalableBase extends BaseComponent {
  protected _apiKey: string;
  protected _apiDomain: string;
  protected _cdnDomain: string;
  protected _options?: IOptions;

  constructor(apiKey: string, options?: IOptions) {
    super();
    this._apiKey = (apiKey || '').trim();
    this._apiDomain = environment.baseURL;
    this._cdnDomain = environment.baseCDN;

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
      const error = (await response.json()) as { error: string };
      throw new Error(error?.error ?? response.statusText);
    });
  };
}
