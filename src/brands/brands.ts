/**
 * Brand service for managing brand registrations via CloudContactAI API
 *
 * @license MIT
 * @copyright 2025 CloudContactAI LLC
 */

import { CCAI } from '../ccai';

export type BrandData = {
  legalCompanyName?: string;
  dba?: string;
  entityType?: string;
  taxId?: string;
  taxIdCountry?: string;
  country?: string;
  verticalType?: string;
  websiteUrl?: string;
  stockSymbol?: string;
  stockExchange?: string;
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  contactFirstName?: string;
  contactLastName?: string;
  contactEmail?: string;
  contactPhone?: string;
  websiteMatch?: boolean;
};

export type BrandResponse = BrandData & {
  id: number;
  accountId: number;
  websiteMatchScore: number | null;
  createdAt: string;
  updatedAt: string;
};

const ENTITY_TYPES = new Set([
  'PRIVATE_PROFIT',
  'PUBLIC_PROFIT',
  'NON_PROFIT',
  'GOVERNMENT',
  'SOLE_PROPRIETOR',
]);
const VERTICAL_TYPES = new Set([
  'AUTOMOTIVE',
  'AGRICULTURE',
  'BANKING',
  'COMMUNICATION',
  'CONSTRUCTION',
  'EDUCATION',
  'ENERGY',
  'ENTERTAINMENT',
  'GOVERNMENT',
  'HEALTHCARE',
  'HOSPITALITY',
  'INSURANCE',
  'LEGAL',
  'MANUFACTURING',
  'NON_PROFIT',
  'PROFESSIONAL',
  'REAL_ESTATE',
  'RETAIL',
  'TECHNOLOGY',
  'TRANSPORTATION',
]);
const TAX_ID_COUNTRIES = new Set(['US', 'CA', 'GB', 'AU']);
const STOCK_EXCHANGES = new Set(['NASDAQ', 'NYSE', 'AMEX', 'TSX', 'LON', 'JPX', 'HKEX', 'OTHER']);

function validateBrand(data: BrandData, isCreate: boolean): void {
  const errors: { field: string; message: string }[] = [];

  if (isCreate) {
    const required = [
      'legalCompanyName',
      'entityType',
      'taxId',
      'taxIdCountry',
      'country',
      'verticalType',
      'websiteUrl',
      'street',
      'city',
      'state',
      'postalCode',
      'contactFirstName',
      'contactLastName',
      'contactEmail',
      'contactPhone',
    ] as const;
    for (const field of required) {
      if (!data[field]) errors.push({ field, message: `${field} is required` });
    }
  }

  if (data.entityType && !ENTITY_TYPES.has(data.entityType))
    errors.push({ field: 'entityType', message: 'Invalid entity type' });
  if (data.verticalType && !VERTICAL_TYPES.has(data.verticalType))
    errors.push({ field: 'verticalType', message: 'Invalid vertical type' });
  if (data.taxIdCountry && !TAX_ID_COUNTRIES.has(data.taxIdCountry))
    errors.push({ field: 'taxIdCountry', message: 'Invalid tax ID country' });
  if (data.stockExchange && !STOCK_EXCHANGES.has(data.stockExchange))
    errors.push({ field: 'stockExchange', message: 'Invalid stock exchange' });

  if (
    data.websiteUrl &&
    !data.websiteUrl.startsWith('http://') &&
    !data.websiteUrl.startsWith('https://')
  ) {
    errors.push({
      field: 'websiteUrl',
      message: 'Website URL must start with http:// or https://',
    });
  }

  if (data.contactEmail && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(data.contactEmail)) {
    errors.push({ field: 'contactEmail', message: 'Invalid email format' });
  }

  if (
    data.taxId &&
    data.taxIdCountry &&
    (data.taxIdCountry === 'US' || data.taxIdCountry === 'CA')
  ) {
    if (!/^\d{9}$/.test(data.taxId)) {
      errors.push({
        field: 'taxId',
        message: `Tax ID must be exactly 9 digits for ${data.taxIdCountry}`,
      });
    }
  }

  if (data.entityType === 'PUBLIC_PROFIT') {
    if (!data.stockSymbol)
      errors.push({
        field: 'stockSymbol',
        message: 'Stock symbol is required for PUBLIC_PROFIT entities',
      });
    if (!data.stockExchange)
      errors.push({
        field: 'stockExchange',
        message: 'Stock exchange is required for PUBLIC_PROFIT entities',
      });
  }

  if (errors.length > 0) {
    throw new Error(`Validation failed: ${JSON.stringify(errors)}`);
  }
}

export class Brands {
  private ccai: CCAI;

  constructor(ccai: CCAI) {
    this.ccai = ccai;
  }

  async create(data: BrandData): Promise<BrandResponse> {
    validateBrand(data, true);
    return this.ccai.customRequest<BrandResponse>(
      'post',
      '/v1/brands',
      data,
      this.ccai.getComplianceBaseUrl()
    );
  }

  async get(id: number): Promise<BrandResponse> {
    return this.ccai.customRequest<BrandResponse>(
      'get',
      `/v1/brands/${id}`,
      undefined,
      this.ccai.getComplianceBaseUrl()
    );
  }

  async list(): Promise<BrandResponse[]> {
    return this.ccai.customRequest<BrandResponse[]>(
      'get',
      '/v1/brands',
      undefined,
      this.ccai.getComplianceBaseUrl()
    );
  }

  async update(id: number, data: BrandData): Promise<BrandResponse> {
    validateBrand(data, false);
    return this.ccai.customRequest<BrandResponse>(
      'patch',
      `/v1/brands/${id}`,
      data,
      this.ccai.getComplianceBaseUrl()
    );
  }

  async delete(id: number): Promise<void> {
    await this.ccai.customRequest<void>(
      'delete',
      `/v1/brands/${id}`,
      undefined,
      this.ccai.getComplianceBaseUrl()
    );
  }
}
