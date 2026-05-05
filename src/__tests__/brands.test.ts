import { Brands } from '../brands/brands';
import { CCAI } from '../ccai';

const mockCustomRequest = jest.fn();

const mockCcai = {
  getClientId: () => 'client-123',
  getApiKey: () => 'api-key-456',
  getComplianceBaseUrl: () => 'https://compliance-test-cloudcontactai.allcode.com/api',
  customRequest: mockCustomRequest,
} as unknown as CCAI;

const validBrand = {
  legalCompanyName: 'Test Corp',
  entityType: 'PRIVATE_PROFIT',
  taxId: '123456789',
  taxIdCountry: 'US',
  country: 'US',
  verticalType: 'TECHNOLOGY',
  websiteUrl: 'https://test.com',
  street: '123 Main St',
  city: 'Austin',
  state: 'TX',
  postalCode: '78701',
  contactFirstName: 'John',
  contactLastName: 'Doe',
  contactEmail: 'john@test.com',
  contactPhone: '+15551234567',
};

const mockResponse = {
  id: 1,
  accountId: 42,
  ...validBrand,
  websiteMatchScore: null,
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
};

describe('Brands Service', () => {
  let brands: Brands;

  beforeEach(() => {
    jest.clearAllMocks();
    brands = new Brands(mockCcai);
    mockCustomRequest.mockResolvedValue(mockResponse);
  });

  describe('create()', () => {
    it('should create a brand with valid data', async () => {
      const result = await brands.create(validBrand);
      expect(mockCustomRequest).toHaveBeenCalledWith(
        'post',
        '/v1/brands',
        validBrand,
        'https://compliance-test-cloudcontactai.allcode.com/api'
      );
      expect(result).toEqual(mockResponse);
    });

    it('should throw if required fields are missing', async () => {
      await expect(brands.create({})).rejects.toThrow('Validation failed');
    });

    it('should throw for invalid entityType', async () => {
      await expect(brands.create({ ...validBrand, entityType: 'INVALID' })).rejects.toThrow(
        'Invalid entity type'
      );
    });

    it('should throw for invalid verticalType', async () => {
      await expect(brands.create({ ...validBrand, verticalType: 'INVALID' })).rejects.toThrow(
        'Invalid vertical type'
      );
    });

    it('should throw for invalid taxIdCountry', async () => {
      await expect(brands.create({ ...validBrand, taxIdCountry: 'XX' })).rejects.toThrow(
        'Invalid tax ID country'
      );
    });

    it('should throw for invalid websiteUrl', async () => {
      await expect(brands.create({ ...validBrand, websiteUrl: 'not-a-url' })).rejects.toThrow(
        'Website URL must start with'
      );
    });

    it('should throw for invalid contactEmail', async () => {
      await expect(brands.create({ ...validBrand, contactEmail: 'bad-email' })).rejects.toThrow(
        'Invalid email format'
      );
    });

    it('should throw for US taxId not 9 digits', async () => {
      await expect(brands.create({ ...validBrand, taxId: '12345' })).rejects.toThrow(
        'Tax ID must be exactly 9 digits'
      );
    });

    it('should throw if PUBLIC_PROFIT missing stockSymbol', async () => {
      await expect(brands.create({ ...validBrand, entityType: 'PUBLIC_PROFIT' })).rejects.toThrow(
        'Stock symbol is required'
      );
    });

    it('should throw for invalid stockExchange', async () => {
      await expect(
        brands.create({
          ...validBrand,
          entityType: 'PUBLIC_PROFIT',
          stockSymbol: 'TST',
          stockExchange: 'INVALID',
        })
      ).rejects.toThrow('Invalid stock exchange');
    });

    it('should accept PUBLIC_PROFIT with stock fields', async () => {
      const data = {
        ...validBrand,
        entityType: 'PUBLIC_PROFIT',
        stockSymbol: 'TST',
        stockExchange: 'NASDAQ',
      };
      await brands.create(data);
      expect(mockCustomRequest).toHaveBeenCalled();
    });
  });

  describe('get()', () => {
    it('should get a brand by ID', async () => {
      const result = await brands.get(1);
      expect(mockCustomRequest).toHaveBeenCalledWith(
        'get',
        '/v1/brands/1',
        undefined,
        'https://compliance-test-cloudcontactai.allcode.com/api'
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('list()', () => {
    it('should list all brands', async () => {
      mockCustomRequest.mockResolvedValue([mockResponse]);
      const result = await brands.list();
      expect(mockCustomRequest).toHaveBeenCalledWith(
        'get',
        '/v1/brands',
        undefined,
        'https://compliance-test-cloudcontactai.allcode.com/api'
      );
      expect(result).toEqual([mockResponse]);
    });
  });

  describe('update()', () => {
    it('should update a brand with partial data', async () => {
      const data = { street: '456 Oak Ave' };
      await brands.update(1, data);
      expect(mockCustomRequest).toHaveBeenCalledWith(
        'patch',
        '/v1/brands/1',
        data,
        'https://compliance-test-cloudcontactai.allcode.com/api'
      );
    });

    it('should validate fields present in update', async () => {
      await expect(brands.update(1, { entityType: 'INVALID' })).rejects.toThrow(
        'Invalid entity type'
      );
    });
  });

  describe('delete()', () => {
    it('should delete a brand', async () => {
      await brands.delete(1);
      expect(mockCustomRequest).toHaveBeenCalledWith(
        'delete',
        '/v1/brands/1',
        undefined,
        'https://compliance-test-cloudcontactai.allcode.com/api'
      );
    });
  });
});
