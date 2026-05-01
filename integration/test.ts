/**
 * Node.js SDK integration tests — 42 tests
 * Covers: SMS (1-6), MMS (7-17), Email (18-22), Webhook (23-29), Contact (30-31), Brands (32-36), Campaigns (37-42)
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

async function run(name: string, fn: () => Promise<void>): Promise<void> {
  try {
    await fn();
    console.log(`  PASS [${name}]`);
    passed++;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.log(`  FAIL [${name}]: ${msg}`);
    failed++;
  }
}

function mustEnv(key: string): string {
  const val = process.env[key];
  if (!val) {
    console.error(`ERROR: required env var ${key} is not set`);
    process.exit(2);
  }
  return val;
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

// ── Main ──────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  // Validate required env vars
  const clientId = mustEnv('CCAI_CLIENT_ID');
  const apiKey = mustEnv('CCAI_API_KEY');
  const phone1 = mustEnv('CCAI_TEST_PHONE');
  const phone2 = mustEnv('CCAI_TEST_PHONE_2');
  const phone3 = mustEnv('CCAI_TEST_PHONE_3');
  const email1 = mustEnv('CCAI_TEST_EMAIL');
  const email2 = mustEnv('CCAI_TEST_EMAIL_2');
  const email3 = mustEnv('CCAI_TEST_EMAIL_3');
  const firstName1 = mustEnv('CCAI_TEST_FIRST_NAME');
  const lastName1 = mustEnv('CCAI_TEST_LAST_NAME');
  const firstName2 = mustEnv('CCAI_TEST_FIRST_NAME_2');
  const lastName2 = mustEnv('CCAI_TEST_LAST_NAME_2');
  const firstName3 = mustEnv('CCAI_TEST_FIRST_NAME_3');
  const lastName3 = mustEnv('CCAI_TEST_LAST_NAME_3');
  const webhookURL = mustEnv('WEBHOOK_URL');

  // Create client
  const client = new CCAI({
    clientId,
    apiKey,
    useTestEnvironment: true,
  });

  console.log('==============================================');
  console.log('  CCAI Node.js SDK Integration Tests');
  console.log('==============================================');

  // Write temp PNG for MMS tests
  const pngPath = writeTempPNG();

  // ── SMS Tests (1-6) ──────────────────────────────────────────────────────────
  console.log('\n--- SMS ---');

  // 01 — SMS.sendSingle
  await run('01 SMS.sendSingle', async () => {
    await client.sms.sendSingle(firstName1, lastName1, phone1, 'Hello from Node SDK!', 'Node Test');
  });

  // 02 — SMS.send (1 recipient)
  await run('02 SMS.send (1 recipient)', async () => {
    await client.sms.send(
      [{ firstName: firstName1, lastName: lastName1, phone: phone1 }],
      'Hello 1 recipient!',
      'Node Test'
    );
  });

  // 03 — SMS.send (2 recipients)
  await run('03 SMS.send (2 recipients)', async () => {
    await client.sms.send(
      [
        { firstName: firstName1, lastName: lastName1, phone: phone1 },
        { firstName: firstName2, lastName: lastName2, phone: phone2 },
      ],
      'Hello 2 recipients!',
      'Node Test'
    );
  });

  // 04 — SMS.send (3 recipients)
  await run('04 SMS.send (3 recipients)', async () => {
    await client.sms.send(
      [
        { firstName: firstName1, lastName: lastName1, phone: phone1 },
        { firstName: firstName2, lastName: lastName2, phone: phone2 },
        { firstName: firstName3, lastName: lastName3, phone: phone3 },
      ],
      'Hello 3 recipients!',
      'Node Test'
    );
  });

  // 05 — SMS.send with data
  await run('05 SMS.send with data', async () => {
    await client.sms.send(
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
  });

  // 06 — SMS.send with messageData
  await run('06 SMS.send with messageData', async () => {
    await client.sms.send(
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
  });

  // ── MMS Tests (7-17) ─────────────────────────────────────────────────────────
  console.log('\n--- MMS ---');

  let signedUrlResp: { signedS3Url: string; fileKey: string } | null = null;
  let mmsDepFailed = false;

  // 07 — MMS.getSignedUploadUrl
  await run('07 MMS.getSignedUploadUrl', async () => {
    const resp = await client.mms.getSignedUploadUrl('test_image.png', 'image/png', undefined, true);
    if (!resp.signedS3Url) {
      mmsDepFailed = true;
      throw new Error('signedS3Url is empty');
    }
    signedUrlResp = resp;
  });

  // 08 — MMS.uploadImageToSignedUrl
  await run('08 MMS.uploadImageToSignedUrl', async () => {
    if (mmsDepFailed || !signedUrlResp) throw new Error('dependency test 07 failed');
    const ok = await client.mms.uploadImageToSignedUrl(signedUrlResp.signedS3Url, pngPath, 'image/png');
    if (!ok) throw new Error('upload returned false');
  });

  // 09 — MMS.sendSingle
  await run('09 MMS.sendSingle', async () => {
    if (mmsDepFailed || !signedUrlResp) throw new Error('dependency test 07 failed');
    await client.mms.sendSingle(signedUrlResp.fileKey, firstName1, lastName1, phone1, 'MMS single!', 'Node MMS Test');
  });

  // 10 — MMS.send (1 recipient)
  await run('10 MMS.send (1 recipient)', async () => {
    if (mmsDepFailed || !signedUrlResp) throw new Error('dependency test 07 failed');
    await client.mms.send(
      signedUrlResp.fileKey,
      [{ firstName: firstName1, lastName: lastName1, phone: phone1 }],
      'MMS 1 recipient!',
      'Node MMS Test'
    );
  });

  // 11 — MMS.send (2 recipients)
  await run('11 MMS.send (2 recipients)', async () => {
    if (mmsDepFailed || !signedUrlResp) throw new Error('dependency test 07 failed');
    await client.mms.send(
      signedUrlResp.fileKey,
      [
        { firstName: firstName1, lastName: lastName1, phone: phone1 },
        { firstName: firstName2, lastName: lastName2, phone: phone2 },
      ],
      'MMS 2 recipients!',
      'Node MMS Test'
    );
  });

  // 12 — MMS.send (3 recipients)
  await run('12 MMS.send (3 recipients)', async () => {
    if (mmsDepFailed || !signedUrlResp) throw new Error('dependency test 07 failed');
    await client.mms.send(
      signedUrlResp.fileKey,
      [
        { firstName: firstName1, lastName: lastName1, phone: phone1 },
        { firstName: firstName2, lastName: lastName2, phone: phone2 },
        { firstName: firstName3, lastName: lastName3, phone: phone3 },
      ],
      'MMS 3 recipients!',
      'Node MMS Test'
    );
  });

  // 13 — MMS.send with data
  await run('13 MMS.send with data', async () => {
    if (mmsDepFailed || !signedUrlResp) throw new Error('dependency test 07 failed');
    await client.mms.send(
      signedUrlResp.fileKey,
      [{ firstName: firstName1, lastName: lastName1, phone: phone1, data: { product: 'Widget' } }],
      'Check out ${product}!',
      'Node MMS Data'
    );
  });

  // 14 — MMS.send with messageData
  await run('14 MMS.send with messageData', async () => {
    if (mmsDepFailed || !signedUrlResp) throw new Error('dependency test 07 failed');
    await client.mms.send(
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
  });

  // 15 — MMS.checkFileUploaded
  await run('15 MMS.checkFileUploaded', async () => {
    if (mmsDepFailed || !signedUrlResp) throw new Error('dependency test 07 failed');
    await client.mms.checkFileUploaded(signedUrlResp.fileKey);
  });

  // 16 — MMS.sendWithImage (fresh upload)
  await run('16 MMS.sendWithImage (fresh upload)', async () => {
    if (mmsDepFailed) throw new Error('dependency test 07 failed');
    await client.mms.sendWithImage(
      pngPath,
      'image/png',
      [{ firstName: firstName1, lastName: lastName1, phone: phone1 }],
      'MMS with image!',
      'Node MMS Image',
      undefined,
      undefined,
      true
    );
  });

  // 17 — MMS.sendWithImage (cached)
  await run('17 MMS.sendWithImage (cached)', async () => {
    if (mmsDepFailed) throw new Error('dependency test 07 failed');
    await client.mms.sendWithImage(
      pngPath,
      'image/png',
      [{ firstName: firstName1, lastName: lastName1, phone: phone1 }],
      'MMS cached image!',
      'Node MMS Cache',
      undefined,
      undefined,
      true
    );
  });

  // ── Email Tests (18-22) ──────────────────────────────────────────────────────
  console.log('\n--- Email ---');

  const senderEmail = 'noreply@cloudcontactai.com';
  const senderName = 'CCAI Test';
  const replyEmail = 'noreply@cloudcontactai.com';

  // 18 — Email.sendSingle
  await run('18 Email.sendSingle', async () => {
    // sendSingle(firstName, lastName, email, subject, message, textContent?, senderEmail?, replyEmail?, senderName?, title?)
    await client.email.sendSingle(
      firstName1, lastName1, email1,
      'Node SDK Test Email',
      '<p>Hello from Node SDK!</p>',
      undefined,
      senderEmail, replyEmail, senderName,
      'Node Email Test'
    );
  });

  // 19 — Email.send (1 recipient)
  await run('19 Email.send (1 recipient)', async () => {
    await client.email.send(
      [{ firstName: firstName1, lastName: lastName1, phone: phone1, email: email1 }],
      'Node SDK Email 1',
      '<p>Hello 1!</p>',
      senderEmail, replyEmail, senderName,
      'Node Email Test'
    );
  });

  // 20 — Email.send (2 recipients)
  await run('20 Email.send (2 recipients)', async () => {
    await client.email.send(
      [
        { firstName: firstName1, lastName: lastName1, phone: phone1, email: email1 },
        { firstName: firstName2, lastName: lastName2, phone: phone2, email: email2 },
      ],
      'Node SDK Email 2',
      '<p>Hello 2!</p>',
      senderEmail, replyEmail, senderName,
      'Node Email Test'
    );
  });

  // 21 — Email.send (3 recipients)
  await run('21 Email.send (3 recipients)', async () => {
    await client.email.send(
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
    await client.email.sendCampaign(campaign);
  });

  // ── Webhook Tests (23-29) ────────────────────────────────────────────────────
  console.log('\n--- Webhook ---');

  const secret = 'test-webhook-secret-node';
  let registeredWebhookId = '';

  // 23 — Webhook.register
  await run('23 Webhook.register', async () => {
    const resp = await client.webhook.register({ url: webhookURL, secret });
    const id = resp?.id;
    if (!id) throw new Error('webhook ID is empty after register');
    registeredWebhookId = String(id);
  });

  // 24 — Webhook.list
  await run('24 Webhook.list', async () => {
    const hooks = await client.webhook.list();
    if (!Array.isArray(hooks) || hooks.length === 0)
      throw new Error('expected at least one webhook, got 0');
  });

  // 25 — Webhook.update
  await run('25 Webhook.update', async () => {
    if (!registeredWebhookId) throw new Error('no webhook ID from test 23');
    await client.webhook.update(registeredWebhookId, {
      url: webhookURL + '?updated=1',
      secret: 'updated-secret-node',
    });
  });

  // 26 — Webhook.verifySignature (valid)
  await run('26 Webhook.verifySignature (valid)', async () => {
    const eventHash = 'abc123eventHash';
    const sig = hmacSHA256Base64(secret, `${clientId}:${eventHash}`);
    const ok = client.webhook.verifySignature(sig, clientId, eventHash, secret);
    if (!ok) throw new Error('expected valid signature to return true');
  });

  // 27 — Webhook.verifySignature (invalid)
  await run('27 Webhook.verifySignature (invalid)', async () => {
    const ok = client.webhook.verifySignature('invalidsig==', clientId, 'somehash', secret);
    if (ok) throw new Error('expected invalid signature to return false');
  });

  // 28 — Webhook.parseEvent
  await run('28 Webhook.parseEvent', async () => {
    const payload = JSON.stringify({
      eventType: 'message.sent',
      data: { to: '+15005550001' },
      eventHash: 'abc123',
    });
    const event = client.webhook.parseEvent(payload);
    if (!event.eventType) throw new Error('eventType is empty after parseEvent');
  });

  // 29 — Webhook.delete
  await run('29 Webhook.delete', async () => {
    if (!registeredWebhookId) throw new Error('no webhook ID from test 23');
    await client.webhook.delete(registeredWebhookId);
  });

  // ── Contact Tests (30-31) ────────────────────────────────────────────────────
  console.log('\n--- Contact ---');

  // 30 — Contact.setDoNotText(true)
  await run('30 Contact.setDoNotText(true)', async () => {
    await client.contact.setDoNotText(true, undefined, phone1);
  });

  // 31 — Contact.setDoNotText(false)
  await run('31 Contact.setDoNotText(false)', async () => {
    await client.contact.setDoNotText(false, undefined, phone1);
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
    if (!resp?.id) throw new Error('Invalid brand id');
    brandId = resp.id;
  });

  // 33 — Brands.get
  await run('33 Brands.get', async () => {
    if (!brandId) throw new Error('dependency test 32 failed');
    const resp = await client.brands.get(brandId);
    if (resp?.id !== brandId) throw new Error('Brand id mismatch');
  });

  // 34 — Brands.list
  await run('34 Brands.list', async () => {
    const resp = await client.brands.list();
    if (!Array.isArray(resp)) throw new Error('Expected an array');
  });

  // 35 — Brands.update
  await run('35 Brands.update', async () => {
    if (!brandId) throw new Error('dependency test 32 failed');
    const resp = await client.brands.update(brandId, { city: 'Orlando' });
    if (resp?.id !== brandId) throw new Error('Brand id mismatch after update');
  });

  // 36 — Brands.delete
  await run('36 Brands.delete', async () => {
    if (!brandId) throw new Error('dependency test 32 failed');
    await client.brands.delete(brandId);
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
    if (!resp?.id) throw new Error('Invalid brand id');
    campaignBrandId = resp.id;
  });

  // 38 — Campaigns.create
  await run('38 Campaigns.create', async () => {
    if (!campaignBrandId) throw new Error('dependency test 37 failed');
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
    if (!resp?.id) throw new Error('Invalid campaign id');
    campaignId = resp.id;
  });

  // 39 — Campaigns.get
  await run('39 Campaigns.get', async () => {
    if (!campaignId) throw new Error('dependency test 38 failed');
    const resp = await client.campaigns.get(campaignId);
    if (resp?.id !== campaignId) throw new Error('Campaign id mismatch');
  });

  // 40 — Campaigns.list
  await run('40 Campaigns.list', async () => {
    const resp = await client.campaigns.list();
    if (!Array.isArray(resp)) throw new Error('Expected an array');
  });

  // 41 — Campaigns.update
  await run('41 Campaigns.update', async () => {
    if (!campaignId) throw new Error('dependency test 38 failed');
    const resp = await client.campaigns.update(campaignId, {
      description: 'Updated integration test campaign description',
    });
    if (resp?.id !== campaignId) throw new Error('Campaign id mismatch after update');
  });

  // 42 — Campaigns.delete + cleanup brand
  await run('42 Campaigns.delete', async () => {
    if (!campaignId) throw new Error('dependency test 38 failed');
    await client.campaigns.delete(campaignId);
    if (campaignBrandId) await client.brands.delete(campaignBrandId);
  });

  // ── Cleanup & Results ─────────────────────────────────────────────────────────
  fs.unlinkSync(pngPath);

  console.log('\n==============================================');
  console.log(`  RESULTS: ${passed} passed, ${failed} failed`);
  console.log('==============================================');

  const summary = JSON.stringify({ sdk: 'node', passed, failed, total: passed + failed });
  console.log(`\nSUMMARY_JSON: ${summary}`);

  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(2);
});
