// Simple manual webhook handler
// This would be in pages/api/simple-webhook.js in a Next.js app

export default (req, res) => {
  if (req.method === 'POST') {
    const payload = req.body;
    console.log('Webhook payload:', payload);
    
    // Process the webhook based on its type
    if (payload.type === 'message.sent') {
      console.log('Message sent to:', payload.to);
      // Handle outbound message event
    } else if (payload.type === 'message.received') {
      console.log('Message received from:', payload.from);
      // Handle inbound message event
    }
    
    // Always respond with a 200 status code
    res.status(200).json({ received: true });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
};