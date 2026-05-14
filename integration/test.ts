/**
 * Node.js SDK integration tests — 52 tests
 * Covers: SMS (1-6), MMS (7-17), Email (18-22), Webhook (23-29), Contact (30-31),
 * Brands (32-36), Campaigns (37-42), ContactValidator (43-46), Negative cases (47-52)
 *
 * Test results use three states:
 *   PASS — the test ran and all assertions held
 *   FAIL — the test ran and an assertion (or the API call) failed
 *   SKIP — a prerequisite test failed, so this test could not run
 *
 * Resources created during the run (webhooks, brands, campaigns) are tracked and
 * deleted in a final cleanup block even if tests fail midway.
 */

import * as crypto from 'crypto';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

// Import from the locally built SDK
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { CCAI } = require('../dist/index.js');

// ── Helpers ───────────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;
let skipped = 0;

/** Thrown when a test cannot run because a prerequisite test failed. */
class SkipTest extends Error {}

function skip(reason: string): never {
  throw new SkipTest(reason);
}

async function run(name: string, fn: () => Promise<void>): Promise<void> {
  try {
    await fn();
    console.log(`  PASS [${name}]`);
    passed++;
  } catch (err: unknown) {
    if (err instanceof SkipTest) {
      console.log(`  SKIP [${name}]: ${err.message}`);
      skipped++;
      return;
    }
    const msg = err instanceof Error ? err.message : String(err);
    console.log(`  FAIL [${name}]: ${msg}`);
    failed++;
  }
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

/** Asserts that a send-style response carries a campaign/message identifier. */
function assertSendResponse(resp: { id?: unknown; campaignId?: unknown } | null | undefined): void {
  assert(resp, 'empty response');
  assert(resp.id || resp.campaignId, `response has no id/campaignId: ${JSON.stringify(resp).slice(0, 200)}`);
}

/** Runs fn and asserts that it throws — used by the negative test cases. */
async function expectError(fn: () => Promise<unknown>, what: string): Promise<void> {
  try {
    await fn();
  } catch {
    return; // failed as expected
  }
  throw new Error(`expected ${what} to fail, but it succeeded`);
}

function hmacSHA256Base64(secret: string, message: string): string {
  return crypto.createHmac('sha256', secret).update(message).digest('base64');
}

function writeTempPNG(): string {
  const pngB64 =
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwADhQGAWjR9awAAAABJRU5ErkJggg==';
  const buf = Buffer.from(pngB64, 'base64');
  const tmpPath = path.join(os.tmpdir(), `ccai_test_${Date.now()}.png`);
  fs.writeFileSync(tmpPath, buf);
  return tmpPath;
}

// IDs of resources created by the tests; anything still listed here at the end
// of the run is deleted by cleanupResources (tests remove entries they already
// deleted themselves).
const cleanup = {
  webhookIds: [] as string[],
  brandIds: [] as number[],
  campaignIds: [] as number[],
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function cleanupResources(client: any): Promise<void> {
  for (const id of cleanup.campaignIds) {
    try {
      await client.campaigns.delete(id);
      console.log(`  CLEANUP: deleted leftover campaign ${id}`);
    } catch (err: unknown) {
      console.log(`  CLEANUP: could not delete campaign ${id}: ${err instanceof Error ? err.message : err}`);
    }
  }
  for (const id of cleanup.brandIds) {
    try {
      await client.brands.delete(id);
      console.log(`  CLEANUP: deleted leftover brand ${id}`);
    } catch (err: unknown) {
      console.log(`  CLEANUP: could not delete brand ${id}: ${err instanceof Error ? err.message : err}`);
    }
  }
  for (const id of cleanup.webhookIds) {
    try {
      await client.webhook.delete(id);
      console.log(`  CLEANUP: deleted leftover webhook ${id}`);
    } catch (err: unknown) {
      console.log(`  CLEANUP: could not delete webhook ${id}: ${err instanceof Error ? err.message : err}`);
    }
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  // Validate ALL required env vars up front and report every missing one,
  // instead of failing later with a cryptic API error.
  const REQUIRED_ENV = [
    'CCAI_CLIENT_ID',
    'CCAI_API_KEY',
    'CCAI_TEST_PHONE',
    'CCAI_TEST_PHONE_2',
    'CCAI_TEST_PHONE_3',
    'CCAI_TEST_EMAIL',
    'CCAI_TEST_EMAIL_2',
    'CCAI_TEST_EMAIL_3',
    'CCAI_TEST_FIRST_NAME',
    'CCAI_TEST_LAST_NAME',
    'CCAI_TEST_FIRST_NAME_2',
    'CCAI_TEST_LAST_NAME_2',
    'CCAI_TEST_FIRST_NAME_3',
    'CCAI_TEST_LAST_NAME_3',
    'WEBHOOK_URL',
  ];
  const missing = REQUIRED_ENV.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    console.error(`ERROR: required env vars are not set: ${missing.join(', ')}`);
    process.exit(2);
  }

  const clientId = process.env.CCAI_CLIENT_ID!;
  const apiKey = process.env.CCAI_API_KEY!;
  const phone1 = process.env.CCAI_TEST_PHONE!;
  const phone2 = process.env.CCAI_TEST_PHONE_2!;
  const phone3 = process.env.CCAI_TEST_PHONE_3!;
  const email1 = process.env.CCAI_TEST_EMAIL!;
  const email2 = process.env.CCAI_TEST_EMAIL_2!;
  const email3 = process.env.CCAI_TEST_EMAIL_3!;
  const firstName1 = process.env.CCAI_TEST_FIRST_NAME!;
  const lastName1 = process.env.CCAI_TEST_LAST_NAME!;
  const firstName2 = process.env.CCAI_TEST_FIRST_NAME_2!;
  const lastName2 = process.env.CCAI_TEST_LAST_NAME_2!;
  const firstName3 = process.env.CCAI_TEST_FIRST_NAME_3!;
  const lastName3 = process.env.CCAI_TEST_LAST_NAME_3!;

  // Unique per-run suffix so parallel SDK runs don't collide on the same webhook URL
  const runId = `node-${Date.now().toString(36)}`;
  const webhookBase = process.env.WEBHOOK_URL!;
  const webhookURL = `${webhookBase}${webhookBase.includes('?') ? '&' : '?'}run=${runId}`;

  const senderEmail = process.env.CCAI_TEST_SENDER_EMAIL || 'noreply@cloudcontactai.com';
  const replyEmail = senderEmail;
  const senderName = 'CCAI Test';
  const webhookSecret = process.env.CCAI_WEBHOOK_SECRET || 'test-webhook-secret-node';

  // Create client — use CCAI_BASE_URL if set (local dev), otherwise fall back to test environment
  const client = new CCAI({
    clientId,
    apiKey,
    useTestEnvironment: !process.env.CCAI_BASE_URL,
  });

  console.log('==============================================');
  console.log('  CCAI Node.js SDK Integration Tests');
  console.log('==============================================');

  // Write temp PNG for MMS tests
  const pngPath = writeTempPNG();

  try {
    // ── SMS Tests (1-6) ──────────────────────────────────────────────────────────
    console.log('\n--- SMS ---');

    // 01 — SMS.sendSingle
    await run('01 SMS.sendSingle', async () => {
      const resp = await client.sms.sendSingle(firstName1, lastName1, phone1, 'Hello from Node SDK!', 'Node Test');
      assertSendResponse(resp);
    });

    // 02 — SMS.send (1 recipient)
    await run('02 SMS.send (1 recipient)', async () => {
      const resp = await client.sms.send(
        [{ firstName: firstName1, lastName: lastName1, phone: phone1 }],
        'Hello 1 recipient!',
        'Node Test'
      );
      assertSendResponse(resp);
    });

    // 03 — SMS.send (2 recipients)
    await run('03 SMS.send (2 recipients)', async () => {
      const resp = await client.sms.send(
        [
          { firstName: firstName1, lastName: lastName1, phone: phone1 },
          { firstName: firstName2, lastName: lastName2, phone: phone2 },
        ],
        'Hello 2 recipients!',
        'Node Test'
      );
      assertSendResponse(resp);
    });

    // 04 — SMS.send (3 recipients)
    await run('04 SMS.send (3 recipients)', async () => {
      const resp = await client.sms.send(
        [
          { firstName: firstName1, lastName: lastName1, phone: phone1 },
          { firstName: firstName2, lastName: lastName2, phone: phone2 },
          { firstName: firstName3, lastName: lastName3, phone: phone3 },
        ],
        'Hello 3 recipients!',
        'Node Test'
      );
      assertSendResponse(resp);
    });

    // 05 — SMS.send with data
    await run('05 SMS.send with data', async () => {
      const resp = await client.sms.send(
        [
          {
            firstName: firstName1,
            lastName: lastName1,
            phone: phone1,
            data: { city: 'Miami', offer: '20% off' },
          },
        ],
        'Hello from ${city}! Claim your ${offer}.',
        'Node Test Data'
      );
      assertSendResponse(resp);
    });

    // 06 — SMS.send with messageData
    await run('06 SMS.send with messageData', async () => {
      const resp = await client.sms.send(
        [
          {
            firstName: firstName1,
            lastName: lastName1,
            phone: phone1,
            customData: '{"trackingId":"abc123"}',
          },
        ],
        'Hello with messageData!',
        'Node Test MsgData'
      );
      assertSendResponse(resp);
    });

    // ── MMS Tests (7-17) ─────────────────────────────────────────────────────────
    console.log('\n--- MMS ---');

    let signedUrlResp: { signedS3Url: string; fileKey: string } | null = null;
    let uploadOk = false;

    // 07 — MMS.getSignedUploadUrl
    await run('07 MMS.getSignedUploadUrl', async () => {
      const resp = await client.mms.getSignedUploadUrl('test_image.png', 'image/png', undefined, true);
      assert(resp?.signedS3Url, 'signedS3Url is empty');
      assert(resp?.fileKey, 'fileKey is empty');
      signedUrlResp = resp;
    });

    // 08 — MMS.uploadImageToSignedUrl
    await run('08 MMS.uploadImageToSignedUrl', async () => {
      if (!signedUrlResp) skip('dependency test 07 failed');
      const ok = await client.mms.uploadImageToSignedUrl(signedUrlResp.signedS3Url, pngPath, 'image/png');
      assert(ok, 'upload returned false');
      uploadOk = true;
    });

    // 09 — MMS.sendSingle
    await run('09 MMS.sendSingle', async () => {
      if (!signedUrlResp) skip('dependency test 07 failed');
      const resp = await client.mms.sendSingle(
        signedUrlResp.fileKey, firstName1, lastName1, phone1, 'MMS single!', 'Node MMS Test'
      );
      assertSendResponse(resp);
    });

    // 10 — MMS.send (1 recipient)
    await run('10 MMS.send (1 recipient)', async () => {
      if (!signedUrlResp) skip('dependency test 07 failed');
      const resp = await client.mms.send(
        signedUrlResp.fileKey,
        [{ firstName: firstName1, lastName: lastName1, phone: phone1 }],
        'MMS 1 recipient!',
        'Node MMS Test'
      );
      assertSendResponse(resp);
    });

    // 11 — MMS.send (2 recipients)
    await run('11 MMS.send (2 recipients)', async () => {
      if (!signedUrlResp) skip('dependency test 07 failed');
      const resp = await client.mms.send(
        signedUrlResp.fileKey,
        [
          { firstName: firstName1, lastName: lastName1, phone: phone1 },
          { firstName: firstName2, lastName: lastName2, phone: phone2 },
        ],
        'MMS 2 recipients!',
        'Node MMS Test'
      );
      assertSendResponse(resp);
    });

    // 12 — MMS.send (3 recipients)
    await run('12 MMS.send (3 recipients)', async () => {
      if (!signedUrlResp) skip('dependency test 07 failed');
      const resp = await client.mms.send(
        signedUrlResp.fileKey,
        [
          { firstName: firstName1, lastName: lastName1, phone: phone1 },
          { firstName: firstName2, lastName: lastName2, phone: phone2 },
          { firstName: firstName3, lastName: lastName3, phone: phone3 },
        ],
        'MMS 3 recipients!',
        'Node MMS Test'
      );
      assertSendResponse(resp);
    });

    // 13 — MMS.send with data
    await run('13 MMS.send with data', async () => {
      if (!signedUrlResp) skip('dependency test 07 failed');
      const resp = await client.mms.send(
        signedUrlResp.fileKey,
        [{ firstName: firstName1, lastName: lastName1, phone: phone1, data: { product: 'Widget' } }],
        'Check out ${product}!',
        'Node MMS Data'
      );
      assertSendResponse(resp);
    });

    // 14 — MMS.send with messageData
    await run('14 MMS.send with messageData', async () => {
      if (!signedUrlResp) skip('dependency test 07 failed');
      const resp = await client.mms.send(
        signedUrlResp.fileKey,
        [
          {
            firstName: firstName1,
            lastName: lastName1,
            phone: phone1,
            customData: '{"campaignId":"mms-test-001"}',
          },
        ],
        'MMS with messageData!',
        'Node MMS MsgData'
      );
      assertSendResponse(resp);
    });

    // 15 — MMS.checkFileUploaded — the file uploaded in test 08 must actually exist
    await run('15 MMS.checkFileUploaded', async () => {
      if (!signedUrlResp) skip('dependency test 07 failed');
      if (!uploadOk) skip('dependency test 08 failed');
      const resp = await client.mms.checkFileUploaded(signedUrlResp.fileKey);
      assert(resp?.storedUrl, `expected non-empty storedUrl for uploaded file ${signedUrlResp.fileKey}`);
    });

    // 16 — MMS.sendWithImage (fresh upload)
    await run('16 MMS.sendWithImage (fresh upload)', async () => {
      const resp = await client.mms.sendWithImage(
        pngPath,
        'image/png',
        [{ firstName: firstName1, lastName: lastName1, phone: phone1 }],
        'MMS with image!',
        'Node MMS Image',
        undefined,
        undefined,
        true
      );
      assertSendResponse(resp);
    });

    // 17 — MMS.sendWithImage (cached)
    await run('17 MMS.sendWithImage (cached)', async () => {
      const resp = await client.mms.sendWithImage(
        pngPath,
        'image/png',
        [{ firstName: firstName1, lastName: lastName1, phone: phone1 }],
        'MMS cached image!',
        'Node MMS Cache',
        undefined,
        undefined,
        true
      );
      assertSendResponse(resp);
    });

    // ── Email Tests (18-22) ──────────────────────────────────────────────────────
    console.log('\n--- Email ---');

    // 18 — Email.sendSingle
    await run('18 Email.sendSingle', async () => {
      // sendSingle(firstName, lastName, email, subject, message, textContent?, senderEmail?, replyEmail?, senderName?, title?)
      const resp = await client.email.sendSingle(
        firstName1, lastName1, email1,
        'Node SDK Test Email',
        '<p>Hello from Node SDK!</p>',
        undefined,
        senderEmail, replyEmail, senderName,
        'Node Email Test'
      );
      assertSendResponse(resp);
    });

    // 19 — Email.send (1 recipient)
    await run('19 Email.send (1 recipient)', async () => {
      const resp = await client.email.send(
        [{ firstName: firstName1, lastName: lastName1, phone: phone1, email: email1 }],
        'Node SDK Email 1',
        '<p>Hello 1!</p>',
        senderEmail, replyEmail, senderName,
        'Node Email Test'
      );
      assertSendResponse(resp);
    });

    // 20 — Email.send (2 recipients)
    await run('20 Email.send (2 recipients)', async () => {
      const resp = await client.email.send(
        [
          { firstName: firstName1, lastName: lastName1, phone: phone1, email: email1 },
          { firstName: firstName2, lastName: lastName2, phone: phone2, email: email2 },
        ],
        'Node SDK Email 2',
        '<p>Hello 2!</p>',
        senderEmail, replyEmail, senderName,
        'Node Email Test'
      );
      assertSendResponse(resp);
    });

    // 21 — Email.send (3 recipients)
    await run('21 Email.send (3 recipients)', async () => {
      const resp = await client.email.send(
        [
          { firstName: firstName1, lastName: lastName1, phone: phone1, email: email1 },
          { firstName: firstName2, lastName: lastName2, phone: phone2, email: email2 },
          { firstName: firstName3, lastName: lastName3, phone: phone3, email: email3 },
        ],
        'Node SDK Email 3',
        '<p>Hello 3!</p>',
        senderEmail, replyEmail, senderName,
        'Node Email Test'
      );
      assertSendResponse(resp);
    });

    // 22 — Email.sendCampaign (direct campaign object)
    await run('22 Email.sendCampaign', async () => {
      const campaign = {
        subject: 'Node SDK Campaign Test',
        title: 'Node Email Campaign',
        message: '<p>Campaign email from Node SDK!</p>',
        senderEmail,
        replyEmail,
        senderName,
        accounts: [
          { firstName: firstName1, lastName: lastName1, phone: phone1, email: email1 },
          { firstName: firstName2, lastName: lastName2, phone: phone2, email: email2 },
        ],
        campaignType: 'EMAIL' as const,
        addToList: 'noList',
        contactInput: 'accounts',
        fromType: 'single',
        senders: [],
      };
      const resp = await client.email.sendCampaign(campaign);
      assertSendResponse(resp);
    });

    // ── Webhook Tests (23-29) ────────────────────────────────────────────────────
    console.log('\n--- Webhook ---');

    let registeredWebhookId = '';

    // 23 — Webhook.register
    await run('23 Webhook.register', async () => {
      const resp = await client.webhook.register({ url: webhookURL, secret: webhookSecret });
      const id = resp?.id;
      assert(id, 'webhook ID is empty after register');
      registeredWebhookId = String(id);
      cleanup.webhookIds.push(registeredWebhookId);
    });

    // 24 — Webhook.list — must contain the webhook registered in test 23
    await run('24 Webhook.list', async () => {
      const hooks = await client.webhook.list();
      assert(Array.isArray(hooks) && hooks.length > 0, 'expected at least one webhook, got 0');
      if (registeredWebhookId) {
        const found = hooks.some((h: { id: unknown }) => String(h.id) === registeredWebhookId);
        assert(found, `webhook ${registeredWebhookId} registered in test 23 not present in list()`);
      }
    });

    // 25 — Webhook.update — then verify via list() that the URL actually changed
    await run('25 Webhook.update', async () => {
      if (!registeredWebhookId) skip('dependency test 23 failed');
      const updatedURL = `${webhookURL}&updated=1`;
      await client.webhook.update(registeredWebhookId, {
        url: updatedURL,
        secret: 'updated-secret-node',
      });
      const hooks = await client.webhook.list();
      const hook = hooks.find((h: { id: unknown }) => String(h.id) === registeredWebhookId);
      assert(hook, `webhook ${registeredWebhookId} not found in list() after update`);
      assert(
        String(hook.url).includes('updated=1'),
        `webhook URL was not updated: expected to contain "updated=1", got "${hook.url}"`
      );
    });

    // 26 — Webhook.verifySignature (valid)
    await run('26 Webhook.verifySignature (valid)', async () => {
      const eventHash = 'abc123eventHash';
      const sig = hmacSHA256Base64(webhookSecret, `${clientId}:${eventHash}`);
      const ok = client.webhook.verifySignature(sig, clientId, eventHash, webhookSecret);
      assert(ok, 'expected valid signature to return true');
    });

    // 27 — Webhook.verifySignature (invalid)
    await run('27 Webhook.verifySignature (invalid)', async () => {
      const ok = client.webhook.verifySignature('invalidsig==', clientId, 'somehash', webhookSecret);
      assert(!ok, 'expected invalid signature to return false');
    });

    // 28 — Webhook.parseEvent
    await run('28 Webhook.parseEvent', async () => {
      const payload = JSON.stringify({
        eventType: 'message.sent',
        data: { to: '+15005550001' },
        eventHash: 'abc123',
      });
      const event = client.webhook.parseEvent(payload);
      assert(event?.eventType === 'message.sent', `expected eventType "message.sent", got "${event?.eventType}"`);
      assert(event?.eventHash === 'abc123', `expected eventHash "abc123", got "${event?.eventHash}"`);
    });

    // 29 — Webhook.delete — then verify via list() that it is gone
    await run('29 Webhook.delete', async () => {
      if (!registeredWebhookId) skip('dependency test 23 failed');
      await client.webhook.delete(registeredWebhookId);
      cleanup.webhookIds = cleanup.webhookIds.filter((id) => id !== registeredWebhookId);
      const hooks = await client.webhook.list();
      const stillThere = Array.isArray(hooks) && hooks.some((h: { id: unknown }) => String(h.id) === registeredWebhookId);
      assert(!stillThere, `webhook ${registeredWebhookId} still present in list() after delete`);
    });

    // ── Contact Tests (30-31) ────────────────────────────────────────────────────
    console.log('\n--- Contact ---');

    // 30 — Contact.setDoNotText(true)
    await run('30 Contact.setDoNotText(true)', async () => {
      const resp = await client.contact.setDoNotText(true, undefined, phone1);
      assert(resp !== undefined && resp !== null, 'empty response');
    });

    // 31 — Contact.setDoNotText(false)
    await run('31 Contact.setDoNotText(false)', async () => {
      const resp = await client.contact.setDoNotText(false, undefined, phone1);
      assert(resp !== undefined && resp !== null, 'empty response');
    });

    // ── Brand Tests (32-36) ──────────────────────────────────────────────────────
    console.log('\n--- Brands ---');

    let brandId: number | null = null;

    // 32 — Brands.create
    await run('32 Brands.create', async () => {
      const resp = await client.brands.create({
        legalCompanyName: 'Test Company LLC',
        entityType:       'PRIVATE_PROFIT',
        taxId:            '123456789',
        taxIdCountry:     'US',
        country:          'US',
        verticalType:     'TECHNOLOGY',
        websiteUrl:       'https://example.com',
        street:           '123 Main St',
        city:             'Miami',
        state:            'FL',
        postalCode:       '33101',
        contactFirstName: firstName1,
        contactLastName:  lastName1,
        contactEmail:     email1,
        contactPhone:     phone1,
      });
      assert(resp?.id, 'Invalid brand id');
      brandId = resp.id;
      cleanup.brandIds.push(resp.id);
    });

    // 33 — Brands.get
    await run('33 Brands.get', async () => {
      if (!brandId) skip('dependency test 32 failed');
      const resp = await client.brands.get(brandId);
      assert(resp?.id === brandId, 'Brand id mismatch');
      assert(
        resp?.legalCompanyName === 'Test Company LLC',
        `expected legalCompanyName "Test Company LLC", got "${resp?.legalCompanyName}"`
      );
    });

    // 34 — Brands.list — must contain the brand created in test 32
    await run('34 Brands.list', async () => {
      const resp = await client.brands.list();
      assert(Array.isArray(resp), 'Expected an array');
      if (brandId) {
        assert(
          resp.some((b: { id: unknown }) => b.id === brandId),
          `brand ${brandId} created in test 32 not present in list()`
        );
      }
    });

    // 35 — Brands.update — then verify via get() that the field actually changed
    await run('35 Brands.update', async () => {
      if (!brandId) skip('dependency test 32 failed');
      const resp = await client.brands.update(brandId, { city: 'Orlando' });
      assert(resp?.id === brandId, 'Brand id mismatch after update');
      const fetched = await client.brands.get(brandId);
      assert(fetched?.city === 'Orlando', `expected city "Orlando" after update, got "${fetched?.city}"`);
    });

    // 36 — Brands.delete — then verify via get() that it is gone
    await run('36 Brands.delete', async () => {
      if (!brandId) skip('dependency test 32 failed');
      await client.brands.delete(brandId);
      cleanup.brandIds = cleanup.brandIds.filter((id) => id !== brandId);
      await expectError(() => client.brands.get(brandId!), `get of deleted brand ${brandId}`);
    });

    // ── Campaign Tests (37-42) ────────────────────────────────────────────────────
    console.log('\n--- Campaigns ---');

    let campaignBrandId: number | null = null;
    let campaignId: number | null = null;

    // 37 — Campaign setup: create brand
    await run('37 Campaign setup — Brands.create', async () => {
      const resp = await client.brands.create({
        legalCompanyName: 'Campaign Test LLC',
        entityType:       'PRIVATE_PROFIT',
        taxId:            '987654321',
        taxIdCountry:     'US',
        country:          'US',
        verticalType:     'TECHNOLOGY',
        websiteUrl:       'https://example.com',
        street:           '456 Test Ave',
        city:             'Miami',
        state:            'FL',
        postalCode:       '33101',
        contactFirstName: firstName1,
        contactLastName:  lastName1,
        contactEmail:     email1,
        contactPhone:     phone1,
      });
      assert(resp?.id, 'Invalid brand id');
      campaignBrandId = resp.id;
      cleanup.brandIds.push(resp.id);
    });

    // 38 — Campaigns.create
    await run('38 Campaigns.create', async () => {
      if (!campaignBrandId) skip('dependency test 37 failed');
      const resp = await client.campaigns.create({
        brandId:          campaignBrandId,
        useCase:          'MARKETING',
        description:      'Integration test campaign for automated testing',
        messageFlow:      'Customers opt-in via website form at https://example.com/sms-signup',
        hasEmbeddedLinks: false,
        hasEmbeddedPhone: false,
        isAgeGated:       false,
        isDirectLending:  false,
        optInKeywords:    ['START', 'YES'],
        optInMessage:     'You have opted in to receive messages. Reply STOP to unsubscribe.',
        optInProofUrl:    'https://example.com/opt-in-proof',
        helpKeywords:     ['HELP', 'INFO'],
        helpMessage:      'For help reply HELP or call 1-800-555-0000.',
        optOutKeywords:   ['STOP', 'END'],
        optOutMessage:    'You have been unsubscribed. Reply START to opt back in. STOP',
        sampleMessages:   [
          'Hello ${firstName}, this is a test message. Reply STOP to unsubscribe.',
          'Reminder: your appointment is tomorrow. Reply HELP for assistance.',
        ],
      });
      assert(resp?.id, 'Invalid campaign id');
      campaignId = resp.id;
      cleanup.campaignIds.push(resp.id);
    });

    // 39 — Campaigns.get
    await run('39 Campaigns.get', async () => {
      if (!campaignId) skip('dependency test 38 failed');
      const resp = await client.campaigns.get(campaignId);
      assert(resp?.id === campaignId, 'Campaign id mismatch');
      assert(resp?.brandId === campaignBrandId, `expected brandId ${campaignBrandId}, got ${resp?.brandId}`);
    });

    // 40 — Campaigns.list — must contain the campaign created in test 38
    await run('40 Campaigns.list', async () => {
      const resp = await client.campaigns.list();
      assert(Array.isArray(resp), 'Expected an array');
      if (campaignId) {
        assert(
          resp.some((c: { id: unknown }) => c.id === campaignId),
          `campaign ${campaignId} created in test 38 not present in list()`
        );
      }
    });

    // 41 — Campaigns.update — then verify via get() that the field actually changed
    await run('41 Campaigns.update', async () => {
      if (!campaignId) skip('dependency test 38 failed');
      const newDescription = 'Updated integration test campaign description';
      const resp = await client.campaigns.update(campaignId, { description: newDescription });
      assert(resp?.id === campaignId, 'Campaign id mismatch after update');
      const fetched = await client.campaigns.get(campaignId);
      assert(
        fetched?.description === newDescription,
        `expected updated description after update, got "${fetched?.description}"`
      );
    });

    // 42 — Campaigns.delete + cleanup brand — then verify via get() that it is gone
    await run('42 Campaigns.delete', async () => {
      if (!campaignId) skip('dependency test 38 failed');
      await client.campaigns.delete(campaignId);
      cleanup.campaignIds = cleanup.campaignIds.filter((id) => id !== campaignId);
      await expectError(() => client.campaigns.get(campaignId!), `get of deleted campaign ${campaignId}`);
      if (campaignBrandId) {
        await client.brands.delete(campaignBrandId);
        cleanup.brandIds = cleanup.brandIds.filter((id) => id !== campaignBrandId);
      }
    });

    // ── Contact Validator (43-46) ────────────────────────────────────────────────
    console.log('\n--- ContactValidator ---');

    // 43 — ContactValidator.validateEmail
    await run('43 ContactValidator.validateEmail', async () => {
      const resp = await client.contactValidator.validateEmail(email1);
      assert(resp?.status, 'status is empty');
    });

    // 44 — ContactValidator.validateEmails
    await run('44 ContactValidator.validateEmails', async () => {
      const resp = await client.contactValidator.validateEmails([email1, email2]);
      assert(resp?.summary?.total === 2, `expected summary.total=2, got ${resp?.summary?.total}`);
      assert(Array.isArray(resp?.results) && resp.results.length === 2, 'expected 2 results');
    });

    // 45 — ContactValidator.validatePhone
    await run('45 ContactValidator.validatePhone', async () => {
      const resp = await client.contactValidator.validatePhone(phone1);
      assert(resp?.status, 'status is empty');
    });

    // 46 — ContactValidator.validatePhones
    await run('46 ContactValidator.validatePhones', async () => {
      const resp = await client.contactValidator.validatePhones([{ phone: phone1 }, { phone: phone2 }]);
      assert(resp?.summary?.total === 2, `expected summary.total=2, got ${resp?.summary?.total}`);
      assert(Array.isArray(resp?.results) && resp.results.length === 2, 'expected 2 results');
    });

    // ── Negative & Permissive Tests (47-52) ──────────────────────────────────────
    // 47/49/50 PASS when the operation fails as expected. 48/51/52 document
    // permissive behavior observed in the test API: those
    // operations succeed even with invalid input, so the tests assert success.
    console.log('\n--- Negative cases ---');

    // 47 — invalid API key must be rejected
    await run('47 NEGATIVE: SMS.sendSingle with invalid API key', async () => {
      const badClient = new CCAI({
        clientId,
        apiKey: 'invalid-api-key-for-negative-test',
        useTestEnvironment: !process.env.CCAI_BASE_URL,
      });
      await expectError(
        () => badClient.sms.sendSingle(firstName1, lastName1, phone1, 'should fail', 'Node Negative 47'),
        'send with invalid API key'
      );
    });

    // 48 — the test API accepts malformed phone numbers: the
    // send succeeds instead of failing. If the API starts validating phone format,
    // change this back to expect an error.
    await run('48 PERMISSIVE: SMS.sendSingle with malformed phone (API accepts)', async () => {
      const resp = await client.sms.sendSingle(firstName1, lastName1, 'abc', 'malformed phone accepted', 'Node Permissive 48');
      assertSendResponse(resp);
    });

    // 49 — getting a nonexistent brand must fail
    await run('49 NEGATIVE: Brands.get(nonexistent)', async () => {
      await expectError(() => client.brands.get(99999999), 'get of nonexistent brand');
    });

    // 50 — deleting a nonexistent webhook must fail
    await run('50 NEGATIVE: Webhook.delete(nonexistent)', async () => {
      await expectError(() => client.webhook.delete('99999999'), 'delete of nonexistent webhook');
    });

    // 51 — the test environment's validator reports "valid" even for syntactically
    // invalid emails — upstream validation is not enforced
    // there, so only assert that a status is returned.
    await run('51 PERMISSIVE: ContactValidator.validateEmail(invalid input)', async () => {
      const resp = await client.contactValidator.validateEmail('not-an-email');
      assert(resp?.status, 'status is empty');
    });

    // 52 — the test API accepts MMS sends with a nonexistent fileKey: it does not
    // verify the file exists at send time. If the API
    // starts validating the fileKey, change this back to expect an error.
    await run('52 PERMISSIVE: MMS.send with nonexistent fileKey (API accepts)', async () => {
      const resp = await client.mms.send(
        `${clientId}/campaign/nonexistent_${Date.now()}.png`,
        [{ firstName: firstName1, lastName: lastName1, phone: phone1 }],
        'nonexistent fileKey accepted',
        'Node Permissive 52'
      );
      assertSendResponse(resp);
    });
  } finally {
    // ── Cleanup ─────────────────────────────────────────────────────────────────
    // Always runs, even if the test body threw: delete leftover resources and the temp PNG.
    await cleanupResources(client);
    try {
      fs.unlinkSync(pngPath);
    } catch {
      /* already removed */
    }
  }

  // ── Results ─────────────────────────────────────────────────────────────────
  console.log('\n==============================================');
  console.log(`  RESULTS: ${passed} passed, ${failed} failed, ${skipped} skipped`);
  console.log('==============================================');

  const summary = JSON.stringify({ sdk: 'node', passed, failed, skipped, total: passed + failed + skipped });
  console.log(`\nSUMMARY_JSON: ${summary}`);

  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(2);
});
