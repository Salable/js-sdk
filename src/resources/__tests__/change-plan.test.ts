import {ChangePlan} from '../change-plan';

class TestChangePlan extends ChangePlan {
  constructor(apiKey: string) {
    super(apiKey);
  }
  public async testRequest<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this._request<T>(endpoint, options);
  }

  get APIDomain() {
    return this._apiDomain;
  }

  get request() {
    return this._request;
  }

  get defaultError() {
    return this._defaultErrorMessage;
  }
}

describe('Unit Test | Resource | Change Plan', () => {
  const apiKey = 'testApiKey';
  let testChangePlan: TestChangePlan;

  beforeEach(() => {
    testChangePlan = new TestChangePlan(apiKey);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('upgradeOrDowngradePlanSync', () => {
    const subscriptionID = 'test_subscription_id';
    const planID = 'test_plan_id';

    it('should throw error if planID is not provided', async () => {
      await expect(testChangePlan.upgradeOrDowngradePlanSync({subscriptionID, planID: ''})).rejects.toThrow(
        "SalableJS: Missing property: 'planID'"
      );
    });

    it('should throw error if subscriptionID is not provided', async () => {
      await expect(testChangePlan.upgradeOrDowngradePlanSync({subscriptionID: '', planID})).rejects.toThrow(
        "SalableJS: Missing property: 'subscriptionID'"
      );
    });

    it('should make PUT request to update plan and return success message', async () => {
      const endpoint = `/subscriptions/${subscriptionID}/updateplan/${planID}`;
      global.fetch = jest.fn().mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(),
        })
      );

      const result = await testChangePlan.upgradeOrDowngradePlanSync({planID, subscriptionID});

      expect(result).toEqual({message: 'Plan changed successfully'});
      expect(fetch).toHaveBeenCalledWith(`${testChangePlan.APIDomain}${endpoint}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
      });
    });

    it('should throw error with error message if request fails', async () => {
      global.fetch = jest.fn().mockImplementation(() =>
        Promise.resolve({
          ok: false,
          statusText: 'Server error',
          json: jest.fn().mockResolvedValue({}),
        })
      );

      await expect(testChangePlan.upgradeOrDowngradePlanSync({planID, subscriptionID})).rejects.toThrow('Server error');
    });

    it('should throw default error message if response is not ok and error message is not available', async () => {
      global.fetch = jest.fn().mockImplementation(() => Promise.reject());

      await expect(testChangePlan.upgradeOrDowngradePlanSync({planID, subscriptionID})).rejects.toThrow(
        testChangePlan.defaultError
      );
    });

    it('should throw error message if response is not ok and error message is available', async () => {
      global.fetch = jest.fn().mockImplementation(() =>
        Promise.resolve({
          ok: false,
          statusText: 'Server error',
          json: jest.fn().mockResolvedValue({error: 'Error message'}),
        })
      );

      await expect(testChangePlan.upgradeOrDowngradePlanSync({planID, subscriptionID})).rejects.toThrow(
        'Error message'
      );
    });
  });

  //   Async
  describe('upgradeOrDowngradePlanAsync', () => {
    const subscriptionID = 'sub456';
    const planID = 'plan123';

    it('should throw error if planID is not provided', () => {
      expect(() => testChangePlan.upgradeOrDowngradePlanAsync({subscriptionID, planID: ''})).toThrow(
        "SalableJS: Missing property: 'planID'"
      );
    });

    it('should throw error if subscriptionID is not provided', () => {
      expect(() => testChangePlan.upgradeOrDowngradePlanAsync({subscriptionID: '', planID})).toThrow(
        "SalableJS: Missing property: 'subscriptionID'"
      );
    });

    it('should call the _request method with correct parameters', () => {
      // Arrange
      const endpoint = `${testChangePlan.APIDomain}/subscriptions/${subscriptionID}/updateplan/${planID}`;
      global.fetch = jest.fn().mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(),
        })
      );

      // Act
      testChangePlan.upgradeOrDowngradePlanAsync({planID, subscriptionID});

      // Assert
      expect(fetch).toHaveBeenCalledWith(endpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
      });
    });

    it('should call the callback with a success message when the request succeeds', () => {
      // Arrange
      global.fetch = jest.fn().mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(),
        })
      );
      const expected = {message: 'Plan changed successfully'};

      // Act
      testChangePlan.upgradeOrDowngradePlanAsync({planID, subscriptionID}, (success, error) => {
        // Assert
        expect(success).toEqual(expected);
        expect(error).toEqual(undefined);
      });
    });

    it('should call the callback with an error message when the request fails with a non-Error object', () => {
      // Arrange
      global.fetch = jest.fn().mockImplementation(() =>
        Promise.reject({
          ok: false,
          json: () => Promise.reject(),
        })
      );

      // Act
      testChangePlan.upgradeOrDowngradePlanAsync({planID: 'plan123', subscriptionID: 'sub456'}, (success, error) => {
        // Assert
        expect(success).toEqual(undefined);
        expect(error).toEqual('Unknown error while changing plan. Please try again later');
      });
    });

    it('should call the callback with an error message when the request fails with an Error object', () => {
      const errorResponse = {error: 'Request failed'};
      // Arrange
      global.fetch = jest.fn().mockImplementation(() =>
        Promise.resolve({
          ok: false,
          statusText: 'Server error',
          json: jest.fn().mockResolvedValue(errorResponse),
        })
      );

      // Act
      testChangePlan.upgradeOrDowngradePlanAsync({planID: 'plan123', subscriptionID: 'sub456'}, (success, error) => {
        // Assert
        expect(success).toEqual(undefined);
        expect(error).toEqual(errorResponse.error);
      });
    });
  });
});
