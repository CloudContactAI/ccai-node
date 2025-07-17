import { CCAI } from './ccai';

const ccai = new CCAI({
  clientId: 'YOUR-CLIENT-ID',
  apiKey: 'YOUR-API-KEY'
});

async function sendMMS() {
  try {
    // Replace with actual image path - update this to point to a real image
    const imagePath = './image.jpg'; // Make sure image.jpg exists in the project root
    const contentType = 'image/jpeg';
    
    const accounts = [{
      firstName: "John",
      lastName: "Doe",
      phone: "+15551234567"
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