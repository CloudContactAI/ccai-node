/**
 * Main export file for the CCAI module
 *
 * @license MIT
 * @copyright 2025 CloudContactAI LLC
 */

import { Brands } from './brands/brands';
import type { BrandData, BrandResponse } from './brands/brands';
import { Campaigns } from './campaigns/campaigns';
import type { CampaignData, CampaignResponse } from './campaigns/campaigns';
import { CCAI } from './ccai';
import type { Account, CCAIConfig } from './ccai';
import { Contact } from './contact/contact';
import type { SetDoNotTextResponse } from './contact/contact';
import { Email } from './email/email';
import type { EmailAccount, EmailCampaign, EmailOptions, EmailResponse } from './email/email';
import { MMS } from './sms/mms';
import type { SignedUrlResponse } from './sms/mms';
import { SMS } from './sms/sms';
import type { SMSCampaign, SMSOptions, SMSResponse } from './sms/sms';
import { createWebhookHandler } from './webhook/nextjs';
import type { WebhookHandlerOptions } from './webhook/nextjs';
import type { WebhookConfig, WebhookEvent } from './webhook/types';
import { WebhookEventType } from './webhook/types';
import { Webhook } from './webhook/webhook';

// Re-export classes
export {
  CCAI,
  SMS,
  MMS,
  Email,
  Webhook,
  WebhookEventType,
  createWebhookHandler,
  Contact,
  Brands,
  Campaigns,
};

// Re-export types using 'export type'
export type {
  Account,
  CCAIConfig,
  SMSCampaign,
  SMSResponse,
  SMSOptions,
  SignedUrlResponse,
  EmailCampaign,
  EmailResponse,
  EmailOptions,
  EmailAccount,
  WebhookConfig,
  WebhookEvent,
  WebhookHandlerOptions,
  SetDoNotTextResponse,
  BrandData,
  BrandResponse,
  CampaignData,
  CampaignResponse,
};
