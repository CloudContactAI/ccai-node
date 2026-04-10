const nodemailer = require('nodemailer');

// Create a test email sender using Gmail
async function sendTestEmail() {
  // Create transporter (using Gmail as example)
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'your-email@gmail.com', // Replace with your email
      pass: 'your-app-password'     // Replace with your app password
    }
  });

  // Email options
  const mailOptions = {
    from: 'your-email@gmail.com',
    to: 'andreas@allcode.com',
    subject: 'Test Email from Node.js',
    html: `
      <h1>Hello Andreas!</h1>
      <p>This is a test email sent directly from Node.js using nodemailer.</p>
      <p>No CloudContactAI API needed!</p>
      <p>Best regards,<br>Your Node.js App</p>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully!');
    console.log('Message ID:', info.messageId);
  } catch (error) {
    console.error('❌ Error sending email:', error.message);
    console.log('\n📝 To use Gmail:');
    console.log('1. Enable 2-factor authentication');
    console.log('2. Generate an app password');
    console.log('3. Update the credentials above');
  }
}

sendTestEmail();