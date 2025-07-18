/**
 * Example usage of the CCAI TypeScript module
 *
 * @license MIT
 * @copyright 2025 CloudContactAI LLC
 */

import { CCAI } from '../ccai';
import type { Account, SMSResponse } from '../index';

// Create a new CCAI client
// Replace these values with your actual credentials
const ccai = new CCAI({
  clientId: 'YOUR-CLIENT-ID',
  apiKey: 'YOUR-API-KEY'
});

// Example recipients
const accounts: Account[] = [
  {
    firstName: "John",
    lastName: "Doe",
    phone: "+15551234567"  // Use E.164 format
  }
];

// Message with variable placeholders
const message = "Hello ${firstName} ${lastName}, this is a test message!";
const title = "Test Campaign";

/**
 * Example of sending SMS messages using async/await
 */
async function sendMessages() {
  try {
    // Method 1: Send SMS to multiple recipients
    console.log('Sending campaign to multiple recipients...');
    const campaignResponse: SMSResponse = await ccai.sms.send(
      accounts,
      message,
      title
    );
    console.log('SMS campaign sent successfully!');
    console.log(campaignResponse);

    // Method 2: Send SMS to a single recipient
    console.log('\nSending message to a single recipient...');
    const singleResponse: SMSResponse = await ccai.sms.sendSingle(
      "Jane",
      "Smith",
      "+15559876543",
      "Hi ${firstName}, thanks for your interest!",
      "Single Message Test"
    );
    console.log('Single SMS sent successfully!');
    console.log(singleResponse);

    return { campaignResponse, singleResponse };
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Error sending SMS:', error.message);
    } else {
      console.error('Unknown error sending SMS');
    }
    throw error;
  }
}

// Execute the async function
sendMessages()
  .then(results => {
    console.log('\nAll messages sent successfully!');
    console.log('\nResults ' + results.toString());
  })
  .catch(() => {
    console.error('\nFailed to send one or more messages.');
  });
