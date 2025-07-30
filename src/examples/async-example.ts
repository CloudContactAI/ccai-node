/**
 * Advanced example using async/await with progress tracking
 * 
 * @license MIT
 * @copyright 2025 CloudContactAI LLC
 */

import dotenv from 'dotenv';
import { CCAI } from '../ccai';
import type { Account, SMSOptions, SMSResponse } from '../index';

// Load environment variables
dotenv.config();

// Create a new CCAI client
const ccai = new CCAI({
  clientId: process.env.CCAI_CLIENT_ID || '',
  apiKey: process.env.CCAI_API_KEY || ''
});

// Example recipients
const accounts: Account[] = [
  {
    firstName: "John",
    lastName: "Doe",
    phone: "+15551234567"
  },
  {
    firstName: "Jane",
    lastName: "Smith",
    phone: "+15559876543"
  }
];

// Options for SMS sending with progress tracking
const options: SMSOptions = {
  timeout: 30000, // 30 seconds
  retries: 2,
  onProgress: (status: string) => {
    console.log(`Progress: ${status}`);
  }
};

/**
 * Example of sending SMS messages with progress tracking
 */
async function sendMessagesWithTracking() {
  try {
    console.log('Starting SMS campaign...');
    
    // Send campaign with progress tracking
    const response = await ccai.sms.send(
      accounts,
      "Hello ${firstName}, this is a tracked message!",
      "Tracked Campaign",
      options
    );
    
    console.log('Campaign completed successfully!');
    console.log('Response:', JSON.stringify(response, null, 2));
    
    return response;
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Campaign failed:', error.message);
    } else {
      console.error('Campaign failed with unknown error');
    }
    throw error;
  }
}

/**
 * Example of sequential SMS sending with error handling
 */
async function sendSequentialMessages() {
  const results: SMSResponse[] = [];
  
  try {
    // Send first message
    console.log('Sending first message...');
    const firstResponse = await ccai.sms.sendSingle(
      "Alex",
      "Johnson",
      "+15551112222",
      "Hi ${firstName}, this is message 1!",
      "Sequential Test 1"
    );
    results.push(firstResponse);
    console.log('First message sent successfully!');
    
    // Send second message only if first one succeeds
    console.log('Sending second message...');
    const secondResponse = await ccai.sms.sendSingle(
      "Maria",
      "Garcia",
      "+15553334444",
      "Hi ${firstName}, this is message 2!",
      "Sequential Test 2"
    );
    results.push(secondResponse);
    console.log('Second message sent successfully!');
    
    return results;
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Sequential sending failed:', error.message);
    } else {
      console.error('Sequential sending failed with unknown error');
    }
    
    // Return partial results if any
    if (results.length > 0) {
      console.log(`Successfully sent ${results.length} messages before failure`);
      return results;
    }
    throw error;
  }
}

// Execute the async functions
async function runExamples() {
  try {
    // Run the tracked example
    await sendMessagesWithTracking();
    
    console.log('\n-----------------------------------\n');
    
    // Run the sequential example
    await sendSequentialMessages();
    
    console.log('\nAll examples completed successfully!');
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('\nOne or more examples failed:', error.message);
    } else {
      console.error('\nOne or more examples failed with unknown error');
    }
  }
}

// Start the examples
runExamples();
