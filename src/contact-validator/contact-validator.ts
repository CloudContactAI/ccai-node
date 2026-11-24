/**
 * contact-validator.ts - A TypeScript module for validating email and phone contacts via CloudContactAI
 *
 * @license MIT
 * @copyright 2025 CloudContactAI LLC
 */

import { CCAI } from '../ccai';

export type ValidationStatus = 'valid' | 'invalid' | 'risky' | 'landline';

/** An Amazon SES verdict for an email address. A verdict SES did not return is `UNKNOWN`. */
export type EmailVerdict = 'HIGH' | 'MEDIUM' | 'LOW' | 'UNKNOWN';

/** The six checks of an email validation, each with its own verdict. */
export type EmailValidationChecks = {
  /** The address follows RFC format rules (good value: `HIGH`) */
  hasValidSyntax?: EmailVerdict;
  /** The domain exists and has DNS/MX records to receive mail (good value: `HIGH`) */
  hasValidDnsRecords?: EmailVerdict;
  /** The mailbox exists and can receive messages (good value: `HIGH`) */
  mailboxExists?: EmailVerdict;
  /** A role address such as `admin@`, `support@` or `info@` (good value: `LOW`) */
  isRoleAddress?: EmailVerdict;
  /** A disposable or temporary email provider (good value: `LOW`) */
  isDisposable?: EmailVerdict;
  /** The address looks randomly generated (good value: `LOW`) */
  isRandomInput?: EmailVerdict;
};

export type EmailValidationMetadata = {
  safe_to_send?: boolean;
  ai_verdict?: string | null;
  /** The overall verdict. Only present when the account has Email Address Validation enabled. */
  verdict?: EmailVerdict;
  /** The six checks, each with its own verdict */
  checks?: EmailValidationChecks;
  /** When Amazon SES checked the address (ISO 8601). `null` when the address was rejected without a check. */
  validatedAt?: string | null;
  /** `true` when the result is a saved check from the last 30 days instead of a new one */
  reused?: boolean;
  /** Why the address was rejected or could not be checked, for example `Invalid email format` */
  error?: string;
  [key: string]: unknown;
};

export type PhoneValidationMetadata = {
  country_code?: string | null;
  national_number?: string | null;
  carrier_type?: string | null;
  [key: string]: unknown;
};

export type EmailValidationResult = {
  contactField: string;
  type: 'email';
  status: ValidationStatus;
  metadata: EmailValidationMetadata;
};

export type PhoneValidationResult = {
  contactField: string;
  type: 'phone';
  status: ValidationStatus;
  metadata: PhoneValidationMetadata;
};

export type ValidationSummary = {
  total: number;
  valid: number;
  invalid: number;
  risky: number;
  landline?: number;
};

export type BulkEmailValidationResult = {
  results: EmailValidationResult[];
  summary: ValidationSummary;
};

export type BulkPhoneValidationResult = {
  results: PhoneValidationResult[];
  summary: ValidationSummary;
};

export type PhoneInput = {
  phone: string;
  countryCode?: string;
};

/**
 * Service for validating email addresses and phone numbers
 */
export class ContactValidator {
  private ccai: CCAI;

  constructor(ccai: CCAI) {
    this.ccai = ccai;
  }

  /**
   * Validate a single email address
   * @param email - Email address to validate
   * @returns Promise resolving to the validation result
   */
  validateEmail(email: string): Promise<EmailValidationResult> {
    return this.ccai.request<EmailValidationResult>('POST', '/v1/contact-validator/email', {
      email,
    });
  }

  /**
   * Validate multiple email addresses (up to 50)
   * @param emails - List of email addresses to validate
   * @returns Promise resolving to bulk validation results with summary
   */
  validateEmails(emails: string[]): Promise<BulkEmailValidationResult> {
    return this.ccai.request<BulkEmailValidationResult>('POST', '/v1/contact-validator/emails', {
      emails,
    });
  }

  /**
   * Validate a single phone number
   * @param phone - Phone number in E.164 format (e.g. +15551234567)
   * @param countryCode - Optional ISO 3166-1 alpha-2 country code (e.g. "US")
   * @returns Promise resolving to the validation result
   */
  validatePhone(phone: string, countryCode?: string): Promise<PhoneValidationResult> {
    return this.ccai.request<PhoneValidationResult>('POST', '/v1/contact-validator/phone', {
      phone,
      countryCode,
    });
  }

  /**
   * Validate multiple phone numbers (up to 50)
   * @param phones - List of phone inputs with optional country codes
   * @returns Promise resolving to bulk validation results with summary
   */
  validatePhones(phones: PhoneInput[]): Promise<BulkPhoneValidationResult> {
    return this.ccai.request<BulkPhoneValidationResult>('POST', '/v1/contact-validator/phones', {
      phones,
    });
  }
}
