import { Campaigns } from '../campaigns/campaigns';
import { CCAI } from '../ccai';

const mockCustomRequest = jest.fn();

const mockCcai = {
  getClientId: () => 'client-123',
  getApiKey: () => 'api-key-456',
  getComplianceBaseUrl: () => 'https://compliance-test-cloudcontactai.allcode.com/api',
  customRequest: mockCustomRequest,
} as unknown as CCAI;

const validCampaign = {
  brandId: 1,
  useCase: 'MIXED',
  subUseCases: ['CUSTOMER_CARE', 'TWO_FACTOR_AUTHENTICATION', 'ACCOUNT_NOTIFICATION'],
  description: 'Test campaign',
  messageFlow: 'Users opt-in via signup form at https://example.com/signup',
  hasEmbeddedLinks: true,
  hasEmbeddedPhone: false,
  isAgeGated: false,
  isDirectLending: false,
  optInKeywords: ['START'],
  optInMessage: 'Welcome! Reply STOP to cancel.',
  optInProofUrl: 'https://example.com/opt-in.png',
  helpKeywords: ['HELP'],
  helpMessage: 'For HELP email support@example.com.',
  optOutKeywords: ['STOP'],
  optOutMessage: 'STOP received. You are unsubscribed.',
  sampleMessages: [
    'Your code is 554321. Reply STOP to cancel.',
    'Your ticket has been updated. Reply HELP for info.',
  ],
};

const mockResponse = {
  id: 1,
  accountId: 42,
  ...validCampaign,
  monthlyFee: 10,
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
};

describe('Campaigns Service', () => {
  let campaigns: Campaigns;

  beforeEach(() => {
    jest.clearAllMocks();
    campaigns = new Campaigns(mockCcai);
    mockCustomRequest.mockResolvedValue(mockResponse);
  });

  describe('create()', () => {
    it('should create a campaign with valid data', async () => {
      const result = await campaigns.create(validCampaign);
      expect(mockCustomRequest).toHaveBeenCalledWith(
        'post',
        '/v1/campaigns',
        validCampaign,
        'https://compliance-test-cloudcontactai.allcode.com/api'
      );
      expect(result).toEqual(mockResponse);
    });

    it('should throw if required fields are missing', async () => {
      await expect(campaigns.create({})).rejects.toThrow('Validation failed');
    });

    it('should throw for invalid useCase', async () => {
      await expect(campaigns.create({ ...validCampaign, useCase: 'INVALID' })).rejects.toThrow(
        'Invalid use case'
      );
    });

    it('should throw if MIXED has fewer than 2 subUseCases', async () => {
      await expect(
        campaigns.create({ ...validCampaign, subUseCases: ['CUSTOMER_CARE'] })
      ).rejects.toThrow('2-3 sub use cases');
    });

    it('should throw if MIXED has invalid subUseCase', async () => {
      await expect(
        campaigns.create({
          ...validCampaign,
          subUseCases: ['CUSTOMER_CARE', 'INVALID', 'MARKETING'],
        })
      ).rejects.toThrow('Invalid sub use case');
    });

    it('should throw if non-MIXED has subUseCases', async () => {
      await expect(
        campaigns.create({
          ...validCampaign,
          useCase: 'MARKETING',
          subUseCases: ['CUSTOMER_CARE', 'FRAUD_ALERT'],
        })
      ).rejects.toThrow('subUseCases should be empty');
    });

    it('should throw if sampleMessages has fewer than 2', async () => {
      await expect(campaigns.create({ ...validCampaign, sampleMessages: ['one'] })).rejects.toThrow(
        '2-5 items'
      );
    });

    it('should throw if sampleMessages missing STOP', async () => {
      await expect(
        campaigns.create({
          ...validCampaign,
          sampleMessages: ['Hello Reply HELP for info.', 'Another Reply HELP msg'],
        })
      ).rejects.toThrow('Reply STOP');
    });

    it('should throw if sampleMessages missing HELP', async () => {
      await expect(
        campaigns.create({
          ...validCampaign,
          sampleMessages: ['Reply STOP to cancel.', 'Another Reply STOP msg'],
        })
      ).rejects.toThrow('Reply HELP');
    });

    it('should throw if optOutMessage missing STOP keyword', async () => {
      await expect(
        campaigns.create({ ...validCampaign, optOutMessage: 'You are unsubscribed.' })
      ).rejects.toThrow('optOutMessage must contain');
    });

    it('should throw if helpMessage missing HELP keyword', async () => {
      await expect(
        campaigns.create({ ...validCampaign, helpMessage: 'Email support@example.com.' })
      ).rejects.toThrow('helpMessage must contain');
    });

    it('should throw if optInProofUrl is not http(s)', async () => {
      await expect(
        campaigns.create({ ...validCampaign, optInProofUrl: 'ftp://bad.com' })
      ).rejects.toThrow('optInProofUrl must start with');
    });

    it('should throw if termsLink is not http(s)', async () => {
      await expect(
        campaigns.create({ ...validCampaign, termsLink: 'ftp://bad.com' })
      ).rejects.toThrow('termsLink must start with');
    });

    it('should throw if privacyLink is not http(s)', async () => {
      await expect(
        campaigns.create({ ...validCampaign, privacyLink: 'ftp://bad.com' })
      ).rejects.toThrow('privacyLink must start with');
    });
  });

  describe('get()', () => {
    it('should get a campaign by ID', async () => {
      const result = await campaigns.get(1);
      expect(mockCustomRequest).toHaveBeenCalledWith(
        'get',
        '/v1/campaigns/1',
        undefined,
        'https://compliance-test-cloudcontactai.allcode.com/api'
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('list()', () => {
    it('should list all campaigns', async () => {
      mockCustomRequest.mockResolvedValue([mockResponse]);
      const result = await campaigns.list();
      expect(mockCustomRequest).toHaveBeenCalledWith(
        'get',
        '/v1/campaigns',
        undefined,
        'https://compliance-test-cloudcontactai.allcode.com/api'
      );
      expect(result).toEqual([mockResponse]);
    });
  });

  describe('update()', () => {
    it('should update a campaign with partial data', async () => {
      const data = { description: 'Updated' };
      await campaigns.update(1, data);
      expect(mockCustomRequest).toHaveBeenCalledWith(
        'patch',
        '/v1/campaigns/1',
        data,
        'https://compliance-test-cloudcontactai.allcode.com/api'
      );
    });

    it('should validate fields present in update', async () => {
      await expect(campaigns.update(1, { useCase: 'INVALID' })).rejects.toThrow('Invalid use case');
    });
  });

  describe('delete()', () => {
    it('should delete a campaign', async () => {
      await campaigns.delete(1);
      expect(mockCustomRequest).toHaveBeenCalledWith(
        'delete',
        '/v1/campaigns/1',
        undefined,
        'https://compliance-test-cloudcontactai.allcode.com/api'
      );
    });
  });
});
