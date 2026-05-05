/**
 * Campaign service for managing campaign registrations via CloudContactAI API
 *
 * @license MIT
 * @copyright 2025 CloudContactAI LLC
 */

import { CCAI } from '../ccai';

export type CampaignData = {
  brandId?: number;
  useCase?: string;
  subUseCases?: string[];
  description?: string;
  messageFlow?: string;
  termsLink?: string;
  privacyLink?: string;
  hasEmbeddedLinks?: boolean;
  hasEmbeddedPhone?: boolean;
  isAgeGated?: boolean;
  isDirectLending?: boolean;
  optInKeywords?: string[];
  optInMessage?: string;
  optInProofUrl?: string;
  helpKeywords?: string[];
  helpMessage?: string;
  optOutKeywords?: string[];
  optOutMessage?: string;
  sampleMessages?: string[];
};

export type CampaignResponse = CampaignData & {
  id: number;
  accountId: number;
  monthlyFee: number;
  createdAt: string;
  updatedAt: string;
};

const CAMPAIGN_USE_CASES = new Set([
  'TWO_FACTOR_AUTHENTICATION',
  'ACCOUNT_NOTIFICATION',
  'CUSTOMER_CARE',
  'DELIVERY_NOTIFICATION',
  'FRAUD_ALERT',
  'HIGHER_EDUCATION',
  'LOW_VOLUME_MIXED',
  'MARKETING',
  'MIXED',
  'POLLING_VOTING',
  'PUBLIC_SERVICE_ANNOUNCEMENT',
  'SECURITY_ALERT',
]);

const CAMPAIGN_SUB_USE_CASES = new Set([
  'TWO_FACTOR_AUTHENTICATION',
  'ACCOUNT_NOTIFICATION',
  'CUSTOMER_CARE',
  'DELIVERY_NOTIFICATION',
  'FRAUD_ALERT',
  'MARKETING',
  'POLLING_VOTING',
]);

const MIXED_USE_CASES = new Set(['MIXED', 'LOW_VOLUME_MIXED']);

const REQUIRED_FIELDS = [
  'brandId',
  'useCase',
  'description',
  'messageFlow',
  'hasEmbeddedLinks',
  'hasEmbeddedPhone',
  'isAgeGated',
  'isDirectLending',
  'optInKeywords',
  'optInMessage',
  'optInProofUrl',
  'helpKeywords',
  'helpMessage',
  'optOutKeywords',
  'optOutMessage',
  'sampleMessages',
] as const;

function validateCampaign(data: CampaignData, isCreate: boolean): void {
  const errors: { field: string; message: string }[] = [];

  if (isCreate) {
    for (const field of REQUIRED_FIELDS) {
      const value = (data as Record<string, unknown>)[field];
      if (value === undefined || value === null || value === '') {
        errors.push({ field, message: `${field} is required` });
      }
    }
  }

  if (data.useCase && !CAMPAIGN_USE_CASES.has(data.useCase)) {
    errors.push({ field: 'useCase', message: 'Invalid use case' });
  }

  const useCase = data.useCase;
  const subUseCases = data.subUseCases;

  if (useCase && MIXED_USE_CASES.has(useCase)) {
    if (
      !subUseCases ||
      !Array.isArray(subUseCases) ||
      subUseCases.length < 2 ||
      subUseCases.length > 3
    ) {
      errors.push({
        field: 'subUseCases',
        message: 'MIXED/LOW_VOLUME_MIXED requires 2-3 sub use cases',
      });
    } else {
      for (const suc of subUseCases) {
        if (!CAMPAIGN_SUB_USE_CASES.has(suc)) {
          errors.push({ field: 'subUseCases', message: `Invalid sub use case: ${suc}` });
        }
      }
    }
  } else if (useCase && subUseCases) {
    errors.push({
      field: 'subUseCases',
      message: 'subUseCases should be empty for non-MIXED use cases',
    });
  }

  if (data.sampleMessages !== undefined) {
    if (
      !Array.isArray(data.sampleMessages) ||
      data.sampleMessages.length < 2 ||
      data.sampleMessages.length > 5
    ) {
      errors.push({ field: 'sampleMessages', message: 'sampleMessages must contain 2-5 items' });
    } else {
      const optOutKeywords = data.optOutKeywords || [];
      const helpKeywords = data.helpKeywords || [];

      const hasOptOut = data.sampleMessages.some(
        (msg) =>
          msg.includes('Reply STOP') || optOutKeywords.some((kw) => msg.includes(`Reply ${kw}`))
      );
      if (!hasOptOut) {
        errors.push({
          field: 'sampleMessages',
          message: "At least one sample must contain 'Reply STOP' or 'Reply {optOutKeyword}'",
        });
      }

      const hasHelp = data.sampleMessages.some(
        (msg) =>
          msg.includes('Reply HELP') || helpKeywords.some((kw) => msg.includes(`Reply ${kw}`))
      );
      if (!hasHelp) {
        errors.push({
          field: 'sampleMessages',
          message: "At least one sample must contain 'Reply HELP' or 'Reply {helpKeyword}'",
        });
      }
    }
  }

  if (data.optOutMessage !== undefined) {
    const optOutKeywords = data.optOutKeywords || [];
    if (
      !data.optOutMessage.includes('STOP') &&
      !optOutKeywords.some((kw) => data.optOutMessage?.includes(kw))
    ) {
      errors.push({
        field: 'optOutMessage',
        message: "optOutMessage must contain 'STOP' or at least one optOutKeyword",
      });
    }
  }

  if (data.helpMessage !== undefined) {
    const helpKeywords = data.helpKeywords || [];
    if (
      !data.helpMessage.includes('HELP') &&
      !helpKeywords.some((kw) => data.helpMessage?.includes(kw))
    ) {
      errors.push({
        field: 'helpMessage',
        message: "helpMessage must contain 'HELP' or at least one helpKeyword",
      });
    }
  }

  if (data.optInProofUrl !== undefined) {
    if (!data.optInProofUrl.startsWith('http://') && !data.optInProofUrl.startsWith('https://')) {
      errors.push({
        field: 'optInProofUrl',
        message: 'optInProofUrl must start with http:// or https://',
      });
    }
  }

  for (const linkField of ['termsLink', 'privacyLink'] as const) {
    const val = data[linkField];
    if (val) {
      if (!val.startsWith('http://') && !val.startsWith('https://')) {
        errors.push({
          field: linkField,
          message: `${linkField} must start with http:// or https://`,
        });
      }
    }
  }

  if (errors.length > 0) {
    throw new Error(`Validation failed: ${JSON.stringify(errors)}`);
  }
}

export class Campaigns {
  private ccai: CCAI;

  constructor(ccai: CCAI) {
    this.ccai = ccai;
  }

  async create(data: CampaignData): Promise<CampaignResponse> {
    validateCampaign(data, true);
    return this.ccai.customRequest<CampaignResponse>(
      'post',
      '/v1/campaigns',
      data,
      this.ccai.getComplianceBaseUrl()
    );
  }

  async get(id: number): Promise<CampaignResponse> {
    return this.ccai.customRequest<CampaignResponse>(
      'get',
      `/v1/campaigns/${id}`,
      undefined,
      this.ccai.getComplianceBaseUrl()
    );
  }

  async list(): Promise<CampaignResponse[]> {
    return this.ccai.customRequest<CampaignResponse[]>(
      'get',
      '/v1/campaigns',
      undefined,
      this.ccai.getComplianceBaseUrl()
    );
  }

  async update(id: number, data: CampaignData): Promise<CampaignResponse> {
    validateCampaign(data, false);
    return this.ccai.customRequest<CampaignResponse>(
      'patch',
      `/v1/campaigns/${id}`,
      data,
      this.ccai.getComplianceBaseUrl()
    );
  }

  async delete(id: number): Promise<void> {
    await this.ccai.customRequest<void>(
      'delete',
      `/v1/campaigns/${id}`,
      undefined,
      this.ccai.getComplianceBaseUrl()
    );
  }
}
