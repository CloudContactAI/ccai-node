import dotenv from 'dotenv';
import { CCAI } from './ccai';

// Load environment variables
dotenv.config();

const ccai = new CCAI({
  clientId: process.env.CCAI_CLIENT_ID || '',
  apiKey: process.env.CCAI_API_KEY || ''
});

async function sendMMS() {
  try {
    // Replace with actual image path - update this to point to a real image
    const imagePath = './image.jpg'; // Make sure image.jpg exists in the project root
    const contentType = 'image/jpeg';
    
    const accounts = [{
      firstName: "Thavas",
      lastName: "Antonio",
      phone: "+15551234567"  // Update with actual phone number
    }];

    const response = await ccai.mms.sendWithImage(
      imagePath,
      contentType,
      accounts,
      "Hello ${firstName}, check out this image!",
      "MMS Test"
    );
    console.log('MMS sent successfully:', response);
  } catch (error) {
    console.error('Error sending MMS:', error);
  }
}

sendMMS();