import { CCAI } from './ccai';

const ccai = new CCAI({
  clientId: '2682',
  apiKey: 'eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiJpbmZvQGFsbGNvZGUuY29tIiwiaXNzIjoiY2xvdWRjb250YWN0IiwibmJmIjoxNzE5NDQwMjM2LCJpYXQiOjE3MTk0NDAyMzYsInJvbGUiOiJVU0VSIiwiY2xpZW50SWQiOjI2ODIsImlkIjoyNzY0LCJ0eXBlIjoiQVBJX0tFWSIsImtleV9yYW5kb21faWQiOiI1MGRiOTUzZC1hMjUxLTRmZjMtODI5Yi01NjIyOGRhOGE1YTAifQ.PKVjXYHdjBMum9cTgLzFeY2KIb9b2tjawJ0WXalsb8Bckw1RuxeiYKS1bw5Cc36_Rfmivze0T7r-Zy0PVj2omDLq65io0zkBzIEJRNGDn3gx_AqmBrJ3yGnz9s0WTMr2-F1TFPUByzbj1eSOASIKeI7DGufTA5LDrRclVkz32Oo'
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
