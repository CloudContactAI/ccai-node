const { CCAI } = require('./dist/index.js');

// Initialize CCAI client with your credentials
const ccai = new CCAI({
  clientId: '2682',
  apiKey: 'eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiJpbmZvQGFsbGNvZGUuY29tIiwiaXNzIjoiY2xvdWRjb250YWN0IiwibmJmIjoxNzE5NDQwMjM2LCJpYXQiOjE3MTk0NDAyMzYsInJvbGUiOiJVU0VSIiwiY2xpZW50SWQiOjI2ODIsImlkIjoyNzY0LCJ0eXBlIjoiQVBJX0tFWSIsImtleV9yYW5kb21faWQiOiI1MGRiOTUzZC1hMjUxLTRmZjMtODI5Yi01NjIyOGRhOGE1YTAifQ.PKVjXYHdjBMum9cTgLzFeY2KIb9b2tjawJ0WXalsb8Bckw1RuxeiYKS1bw5Cc36_Rfmivze0T7r-Zy0PVj2omDLq65io0zkBzIEJRNGDn3gx_AqmBrJ3yGnz9s0WTMr2-F1TFPUByzbj1eSOASIKeI7DGufTA5LDrRclVkz32Oo'
});

async function testWebhook() {
  console.log('🚀 Sending test SMS to trigger webhook...');
  
  try {
    const response = await ccai.sms.sendSingle(
      'Test',
      'User',
      '+14156961732',
      'Hello ${firstName}! This is a webhook test message.',
      'Webhook Test Campaign'
    );
    
    console.log('✅ SMS sent successfully:', response);
    console.log('📡 Check your webhook server console for the webhook event!');
  } catch (error) {
    console.error('❌ Error sending SMS:', error);
  }
}

testWebhook();