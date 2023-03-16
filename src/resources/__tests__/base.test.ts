import {SalableBase} from '../base';

class TestSalableBase extends SalableBase {
  public async testRequest<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this._request<T>(endpoint, options);
  }

  get APIDomain() {
    return this._apiDomain;
  }
}

describe('Unit Test | Resource | Base', () => {
  let testSalableBase: TestSalableBase;
  const apiKey = 'testApiKey';

  beforeEach(() => {
    testSalableBase = new TestSalableBase(apiKey);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Request', () => {
    it('should call fetch with correct url and headers', async () => {
      const endpoint = '/test';
      global.fetch = jest.fn().mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(),
        })
      );
      await testSalableBase.testRequest(endpoint);
      expect(fetch).toHaveBeenCalledWith(`${testSalableBase.APIDomain}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
      });
    });

    it('should return json response when response is ok', async () => {
      const responseData = {test: 'data'};
      const endpoint = '/test';
      global.fetch = jest.fn().mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(responseData),
        })
      );
      const result = await testSalableBase.testRequest(endpoint);
      expect(result).toEqual(responseData);
    });

    it('should throw error when response is not ok', async () => {
      const errorResponse = {error: 'test error message'};
      const endpoint = '/test';
      global.fetch = jest.fn().mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: () => errorResponse,
        })
      );
      const result = await testSalableBase.testRequest(endpoint);
      expect(result).toEqual(errorResponse);
    });
  });
});
