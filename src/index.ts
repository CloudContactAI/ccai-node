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
import { Email } from './email/email';
import type { EmailCampaign, EmailResponse, EmailOptions, EmailAccount } from './email/email';
import { Webhook } from './webhook/webhook';
import { createWebhookHandler } from './webhook/nextjs';
import type { WebhookHandlerOptions } from './webhook/nextjs';
import type { 
  WebhookConfig, 
  WebhookEvent, 
  WebhookEventBase,
  WebhookCampaign,
  MessageSentEvent,
  MessageReceivedEvent
} from './webhook/types';
import { WebhookEventType } from './webhook/types';

// Re-export classes
export { CCAI, SMS, MMS, Email, Webhook, WebhookEventType, createWebhookHandler };

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
  WebhookEventBase,
  WebhookCampaign,
  MessageSentEvent,
  MessageReceivedEvent,
  WebhookHandlerOptions
};
