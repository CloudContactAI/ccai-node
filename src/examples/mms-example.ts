/**
 * MMS Example - Demonstrates how to use the MMS functionality
 * 
 * @license MIT
 * @copyright 2025 CloudContactAI LLC
 */

import dotenv from 'dotenv';
import { CCAI, Account, SMSOptions } from '../index';

// Load environment variables
dotenv.config();

// Initialize the CCAI client
const ccai = new CCAI({
  clientId: process.env.CCAI_CLIENT_ID || '',
  apiKey: process.env.CCAI_API_KEY || ''
});

// Define a progress callback
const trackProgress = (status: string) => {
  console.log(`Progress: ${status}`);
};

// Create options with progress tracking
const options: SMSOptions = {
  timeout: 60000,
  retries: 3,
  onProgress: trackProgress
};

/**
 * Example 1: Complete MMS workflow (get URL, upload image, send MMS)
 */
async function sendMmsWithImage() {
  try {
    // Path to your image file
    const imagePath = 'path/to/your/image.jpg';
    const contentType = 'image/jpeg';
    
    // Define recipient
    const account: Account = {
      firstName: 'John',
      lastName: 'Doe',
      phone: '+15551234567'  // Use E.164 format
    };
    
    // Message content and campaign title
    const message = 'Hello ${firstName}, check out this image!';
    const title = 'MMS Campaign Example';
    
    // Send MMS with image in one step
    const response = await ccai.mms.sendWithImage(
      imagePath,
      contentType,
      [account],
      message,
      title,
      options
    );
    
    console.log(`MMS sent! Campaign ID: ${response.campaignId}`);
    console.log(`Messages sent: ${response.messagesSent}`);
    console.log(`Status: ${response.status}`);
  } catch (error) {
    console.error('Error sending MMS:', error);
  }
}

/**
 * Example 2: Step-by-step MMS workflow
 */
async function sendMmsStepByStep() {
  try {
    // Path to your image file
    const imagePath = 'path/to/your/image.jpg';
    const fileName = imagePath.split('/').pop() || 'image.jpg';
    const contentType = 'image/jpeg';
    
    // Step 1: Get a signed URL for uploading
    console.log('Getting signed upload URL...');
    const uploadResponse = await ccai.mms.getSignedUploadUrl(
      fileName,
      contentType
    );
    
    const signedUrl = uploadResponse.signedS3Url;
    const fileKey = uploadResponse.fileKey;
    
    console.log(`Got signed URL: ${signedUrl}`);
    console.log(`File key: ${fileKey}`);
    
    // Step 2: Upload the image to the signed URL
    console.log('Uploading image...');
    const uploadSuccess = await ccai.mms.uploadImageToSignedUrl(
      signedUrl,
      imagePath,
      contentType
    );
    
    if (!uploadSuccess) {
      console.error('Failed to upload image');
      return;
    }
    
    console.log('Image uploaded successfully');
    
    // Step 3: Send the MMS with the uploaded image
    console.log('Sending MMS...');
    
    // Define recipients
    const accounts: Account[] = [
      { firstName: 'John', lastName: 'Doe', phone: '+15551234567' },
      { firstName: 'Jane', lastName: 'Smith', phone: '+15559876543' }
    ];
    
    // Message content and campaign title
    const message = 'Hello ${firstName}, check out this image!';
    const title = 'MMS Campaign Example';
    
    // Send the MMS
    const response = await ccai.mms.send(
      fileKey,
      accounts,
      message,
      title,
      options
    );
    
    console.log(`MMS sent! Campaign ID: ${response.campaignId}`);
    console.log(`Messages sent: ${response.messagesSent}`);
    console.log(`Status: ${response.status}`);
  } catch (error) {
    console.error('Error in MMS workflow:', error);
  }
}

/**
 * Example 3: Send a single MMS
 */
async function sendSingleMms() {
  try {
    // Define the file key of an already uploaded image
    const pictureFileKey = `${process.env.CCAI_CLIENT_ID}/campaign/your-image.jpg`;
    
    // Send a single MMS
    const response = await ccai.mms.sendSingle(
      pictureFileKey,
      'John',
      'Doe',
      '+15551234567',
      'Hello ${firstName}, check out this image!',
      'Single MMS Example',
      options
    );
    
    console.log(`MMS sent! Campaign ID: ${response.campaignId}`);
    console.log(`Status: ${response.status}`);
  } catch (error) {
    console.error('Error sending single MMS:', error);
  }
}

// Export functions to prevent unused warnings
export { sendMmsWithImage, sendMmsStepByStep, sendSingleMms };
