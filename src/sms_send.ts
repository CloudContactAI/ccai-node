import { CCAI } from './ccai';

const ccai = new CCAI({
  clientId: 'YOUR-CLIENT-ID',
  apiKey: 'YOUR-API-KEY'
});

async function sendSMS() {
  try {
    const response = await ccai.sms.sendSingle(
      "John",
      "Doe", 
"+15551234567",
      "Hello ${firstName}, this is a test SMS!",
      "SMS Test"
    );
    console.log('SMS sent successfully:', response);
  } catch (error) {
    console.error('Error sending SMS:', error);
  }
}

sendSMS();