import 'dotenv/config';
import { CCAI } from './ccai';

const ccai = new CCAI({
  clientId: process.env.CCAI_CLIENT_ID || '',
  apiKey: process.env.CCAI_API_KEY || '',
});

async function sendEmail() {
  try {
    const response = await ccai.email.sendSingle(
      "Andreas",
      "Doe",
      "andreas@allcode.com",
      "Test Email Subject",
      "<p>Hello ${firstName},</p><p>This is a test email.</p><p>Thanks,<br>AllCode Team</p>",
      "noreply@allcode.com",
      "support@allcode.com",
      "AllCode Team",
      "Email Test Campaign"
    );
    console.log('Email sent successfully:', response);
  } catch (error) {
    console.error('Error sending email:', error);
  }
}

sendEmail();
