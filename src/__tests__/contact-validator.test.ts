import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import axios from 'axios';
import { CCAI } from '../ccai';
import type {
  BulkEmailValidationResult,
  EmailValidationResult,
} from '../contact-validator/contact-validator';

jest.mock('axios');
const mockedAxios = axios as jest.MockedFunction<typeof axios>;

/** Responses recorded from the contact-validator API, as the backend sends them */
const recorded = <T>(name: string): T =>
  JSON.parse(
    readFileSync(join(__dirname, 'fixtures', 'contact-validator', `${name}.json`), 'utf8')
  );

const apiError = (status: number, data: unknown) => ({ response: { status, data } });

describe('ContactValidator email validation', () => {
  let ccai: CCAI;

  beforeEach(() => {
    jest.clearAllMocks();
    ccai = new CCAI({ clientId: 'client-123', apiKey: 'api-key-456' });
  });

  const respondWith = (data: unknown) => mockedAxios.mockResolvedValue({ data } as never);

  describe('validateEmail()', () => {
    it('posts the address to the email endpoint', async () => {
      respondWith(recorded('email-valid'));

      await ccai.contactValidator.validateEmail('jane@example.com');

      expect(mockedAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'POST',
          url: expect.stringMatching(/\/v1\/contact-validator\/email$/),
          data: { email: 'jane@example.com' },
        })
      );
    });

    it('returns the verdict, the six checks, the date and whether the result was reused', async () => {
      respondWith(recorded('email-valid'));

      const result = await ccai.contactValidator.validateEmail('jane@example.com');

      expect(result.status).toBe('valid');
      expect(result.metadata.safe_to_send).toBe(true);
      expect(result.metadata.ai_verdict).toBe('valid');
      expect(result.metadata.verdict).toBe('HIGH');
      expect(result.metadata.checks).toEqual({
        hasValidSyntax: 'HIGH',
        hasValidDnsRecords: 'HIGH',
        mailboxExists: 'HIGH',
        isRoleAddress: 'LOW',
        isDisposable: 'LOW',
        isRandomInput: 'LOW',
      });
      expect(result.metadata.validatedAt).toBe('2026-11-13T15:02:11Z');
      expect(result.metadata.reused).toBe(false);
    });

    it('says when the result is a saved check', async () => {
      respondWith(recorded('email-reused'));
      const result = await ccai.contactValidator.validateEmail('jane@example.com');
      expect(result.metadata.reused).toBe(true);
    });

    it('returns a disposable address as risky, with the disposable check HIGH', async () => {
      respondWith(recorded('email-risky-disposable'));
      const result = await ccai.contactValidator.validateEmail('temp@mailinator.com');
      expect(result.status).toBe('risky');
      expect(result.metadata.safe_to_send).toBe(false);
      expect(result.metadata.checks?.isDisposable).toBe('HIGH');
    });

    it('returns a LOW address as invalid', async () => {
      respondWith(recorded('email-invalid-low'));
      const result = await ccai.contactValidator.validateEmail('nobody@no-such-domain-example.xyz');
      expect(result.status).toBe('invalid');
      expect(result.metadata.verdict).toBe('LOW');
      expect(result.metadata.checks?.hasValidDnsRecords).toBe('LOW');
    });

    it('returns an address rejected before asking SES with UNKNOWN checks, no date and the reason', async () => {
      respondWith(recorded('email-rejected-format'));
      const result = await ccai.contactValidator.validateEmail('not-an-email');
      expect(result.status).toBe('invalid');
      expect(result.metadata.verdict).toBe('UNKNOWN');
      expect(Object.values(result.metadata.checks ?? {})).toEqual(Array(6).fill('UNKNOWN'));
      expect(result.metadata.validatedAt).toBeNull();
      expect(result.metadata.error).toBe('Invalid email format');
    });

    it('still reads a response without the new fields: they are optional', async () => {
      respondWith(recorded('email-legacy'));

      const result: EmailValidationResult =
        await ccai.contactValidator.validateEmail('jane@example.com');

      expect(result.status).toBe('valid');
      expect(result.metadata.safe_to_send).toBe(true);
      expect(result.metadata.verdict).toBeUndefined();
      expect(result.metadata.checks).toBeUndefined();
      expect(result.metadata.validatedAt).toBeUndefined();
      expect(result.metadata.reused).toBeUndefined();
    });

    it('fails with the 403 of an account that does not have Email Address Validation', async () => {
      mockedAxios.mockRejectedValue(apiError(403, recorded('error-403')));

      const failure = ccai.contactValidator.validateEmail('jane@example.com');

      await expect(failure).rejects.toThrow('API Error: 403');
      await expect(failure).rejects.toThrow('Email validation is not enabled for this account');
    });

    it('fails with the 502 of an SES refusal, with the message from AWS', async () => {
      mockedAxios.mockRejectedValue(apiError(502, recorded('error-502')));

      const failure = ccai.contactValidator.validateEmail('jane@example.com');

      await expect(failure).rejects.toThrow('API Error: 502');
      await expect(failure).rejects.toThrow('ses:GetEmailAddressInsights');
    });
  });

  describe('validateEmails()', () => {
    it('posts the addresses to the bulk endpoint', async () => {
      respondWith(recorded('emails-bulk'));

      await ccai.contactValidator.validateEmails([
        'jane@example.com',
        'temp@mailinator.com',
        'bad@example.com',
      ]);

      expect(mockedAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'POST',
          url: expect.stringMatching(/\/v1\/contact-validator\/emails$/),
          data: { emails: ['jane@example.com', 'temp@mailinator.com', 'bad@example.com'] },
        })
      );
    });

    it('returns the new fields on every result, and the summary as before', async () => {
      respondWith(recorded('emails-bulk'));

      const bulk: BulkEmailValidationResult = await ccai.contactValidator.validateEmails([
        'jane@example.com',
        'temp@mailinator.com',
        'bad@example.com',
      ]);

      expect(bulk.summary).toEqual({ total: 3, valid: 1, invalid: 1, risky: 1 });
      const [reused, risky, failed] = bulk.results as [
        EmailValidationResult,
        EmailValidationResult,
        EmailValidationResult,
      ];
      expect(reused.metadata.reused).toBe(true);
      expect(reused.metadata.verdict).toBe('HIGH');
      expect(risky.metadata.verdict).toBe('MEDIUM');
      expect(risky.metadata.checks?.isDisposable).toBe('HIGH');
      expect(risky.metadata.validatedAt).toBe('2026-11-13T15:05:40Z');
      // An address SES failed to check comes back invalid with the reason, and none of the new fields
      expect(failed.status).toBe('invalid');
      expect(failed.metadata.error).toBe('The domain is not allowed');
      expect(failed.metadata.verdict).toBeUndefined();
    });

    it('fails with the 403 of an account that does not have Email Address Validation', async () => {
      mockedAxios.mockRejectedValue(apiError(403, recorded('error-403')));
      await expect(ccai.contactValidator.validateEmails(['jane@example.com'])).rejects.toThrow(
        'API Error: 403'
      );
    });
  });
});
