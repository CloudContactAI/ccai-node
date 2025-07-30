/**
 * Examples of using the Email functionality in the CCAI library
 */

import 'dotenv/config';
import { CCAI, EmailCampaign } from '../index';

// Initialize the CCAI client
const ccai = new CCAI({
  clientId: process.env.CCAI_CLIENT_ID || '',
  apiKey: process.env.CCAI_API_KEY || '',
});

/**
 * Example 1: Send a single email
 */
async function sendSingleEmail() {
  try {
    const response = await ccai.email.sendSingle(
      'Andreas',
      'Doe',
      'andreas@allcode.com',
      'Welcome to Our Service',
      '<p>Hello Andreas,</p><p>Thank you for signing up for our service!</p><p>Best regards,<br>AllCode Team</p>',
      'noreply@allcode.com',
      'support@allcode.com',
      'AllCode',
      'Welcome Email'
    );
    
    console.log('Email sent successfully:', response);
  } catch (error) {
    console.error('Error sending email:', error);
  }
}

/**
 * Example 2: Send an email campaign to multiple recipients
 */
async function sendEmailCampaign() {
  try {
    const campaign: EmailCampaign = {
      subject: 'Monthly Newsletter',
      title: 'July 2025 Newsletter',
      message: `
        <h1>Monthly Newsletter - July 2025</h1>
        <p>Hello \${firstName},</p>
        <p>Here are our updates for this month:</p>
        <ul>
          <li>New feature: Email campaigns</li>
          <li>Improved performance</li>
          <li>Bug fixes</li>
        </ul>
        <p>Thank you for being a valued customer!</p>
        <p>Best regards,<br>The Team</p>
      `,
      senderEmail: 'newsletter@yourcompany.com',
      replyEmail: 'support@yourcompany.com',
      senderName: 'Your Company Newsletter',
      accounts: [
        {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phone: ''
        },
        {
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane@example.com',
          phone: ''
        },
        {
          firstName: 'Bob',
          lastName: 'Johnson',
          email: 'bob@example.com',
          phone: ''
        }
      ],
      campaignType: 'EMAIL',
      addToList: 'noList',
      contactInput: 'accounts',
      fromType: 'single',
      senders: []
    };
    
    const response = await ccai.email.sendCampaign(campaign, {
      onProgress: (status) => console.log(`Status: ${status}`)
    });
    
    console.log('Email campaign sent successfully:', response);
  } catch (error) {
    console.error('Error sending email campaign:', error);
  }
}

/**
 * Example 3: Schedule an email campaign for future delivery
 */
async function scheduleEmailCampaign() {
  try {
    // Schedule for tomorrow at 10:00 AM
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    
    const campaign: EmailCampaign = {
      subject: 'Upcoming Event Reminder',
      title: 'Event Reminder Campaign',
      message: `
        <h1>Reminder: Upcoming Event</h1>
        <p>Hello \${firstName},</p>
        <p>This is a reminder about our upcoming event tomorrow at 2:00 PM.</p>
        <p>We look forward to seeing you there!</p>
        <p>Best regards,<br>The Events Team</p>
      `,
      senderEmail: 'events@yourcompany.com',
      replyEmail: 'events@yourcompany.com',
      senderName: 'Your Company Events',
      accounts: [
        {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phone: ''
        }
      ],
      campaignType: 'EMAIL',
      scheduledTimestamp: tomorrow.toISOString(),
      scheduledTimezone: 'America/New_York',
      addToList: 'noList',
      contactInput: 'accounts',
      fromType: 'single',
      senders: []
    };
    
    const response = await ccai.email.sendCampaign(campaign);
    
    console.log('Email campaign scheduled successfully:', response);
  } catch (error) {
    console.error('Error scheduling email campaign:', error);
  }
}

/**
 * Example 4: Send an email with HTML template
 */
async function sendHtmlTemplateEmail() {
  try {
    const htmlTemplate = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; }
          .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .footer { background-color: #f1f1f1; padding: 10px; text-align: center; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Welcome, \${firstName}!</h1>
        </div>
        <div class="content">
          <p>Thank you for joining our platform.</p>
          <p>Here are some resources to get you started:</p>
          <ul>
            <li><a href="https://example.com/docs">Documentation</a></li>
            <li><a href="https://example.com/tutorials">Tutorials</a></li>
            <li><a href="https://example.com/support">Support</a></li>
          </ul>
        </div>
        <div class="footer">
          <p>&copy; 2025 Your Company. All rights reserved.</p>
        </div>
      </body>
      </html>
    `;
    
    const response = await ccai.email.sendSingle(
      'John',
      'Doe',
      'john@example.com',
      'Welcome to Our Platform',
      htmlTemplate,
      'welcome@yourcompany.com',
      'support@yourcompany.com',
      'Your Company',
      'Welcome HTML Template Email'
    );
    
    console.log('HTML template email sent successfully:', response);
  } catch (error) {
    console.error('Error sending HTML template email:', error);
  }
}

// Run the examples
// Uncomment the example you want to run
sendSingleEmail();
sendEmailCampaign();
scheduleEmailCampaign();
sendHtmlTemplateEmail();
