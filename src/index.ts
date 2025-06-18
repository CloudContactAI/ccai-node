/**
 * Main export file for the CCAI module
 * 
 * @license MIT
 * @copyright 2025 CloudContactAI LLC
 */

import { CCAI } from './ccai';
import type { Account, CCAIConfig } from './ccai';
import { SMS } from './sms/sms';
import type { SMSCampaign, SMSResponse, SMSOptions } from './sms/sms';
import { MMS } from './sms/mms';
import type { SignedUrlResponse } from './sms/mms';

// Re-export classes
export { CCAI, SMS, MMS };

// Re-export types using 'export type'
export type {
  Account,
  CCAIConfig,
  SMSCampaign,
  SMSResponse,
  SMSOptions,
  SignedUrlResponse
};
