import { CCAI } from './ccai';

const ccai = new CCAI({
  clientId: 'YOUR-CLIENT-ID',
  apiKey: 'YOUR-API-KEY'
});

async function sendEmail() {
  try {
    const response = await ccai.email.sendSingle(
      "John",
      "Doe",
      "recipient@example.com",
      "Test Email Subject",
      "<p>Hello ${firstName},</p><p>This is a test email.</p><p>Thanks,<br>Sender</p>",
      "sender@example.com",
      "reply@example.com",
      "Sender Name",
      "Email Test Campaign"
    );
    console.log('Email sent successfully:', response);
  } catch (error) {
    console.error('Error sending email:', error);
  }
}

sendEmail();
