# Email Functionality for CCAI Node

This module provides functionality to send email campaigns through the Cloud Contact AI platform.

## Installation

The Email functionality is included in the CCAI Node package:

```bash
npm install ccai-node
```

## Usage

### Initialize the CCAI client

```typescript
import { CCAI } from 'ccai-node';

const ccai = new CCAI({
  clientId: 'YOUR_CLIENT_ID',
  apiKey: 'YOUR_API_KEY'
});
```

### Send a single email

```typescript
const response = await ccai.email.sendSingle(
  'John',                                    // First name
  'Doe',                                     // Last name
  'john@example.com',                        // Email address
  'Welcome to Our Service',                  // Subject
  '<p>Hello John,</p><p>Welcome!</p>',       // HTML message content
  'noreply@yourcompany.com',                 // Sender email
  'support@yourcompany.com',                 // Reply-to email
  'Your Company',                            // Sender name
  'Welcome Email'                            // Campaign title
);

console.log('Email sent successfully:', response);
```

### Send an email campaign to multiple recipients

```typescript
import { CCAI, EmailCampaign } from 'ccai-node';

const campaign: EmailCampaign = {
  subject: 'Monthly Newsletter',
  title: 'July 2025 Newsletter',
  message: `
    <h1>Monthly Newsletter - July 2025</h1>
    <p>Hello \${firstName},</p>
    <p>Here are our updates for this month...</p>
  `,
  senderEmail: 'newsletter@yourcompany.com',
  replyEmail: 'support@yourcompany.com',
  senderName: 'Your Company Newsletter',
  accounts: [
    {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phone: ''  // Required by Account type but not used for email
    },
    {
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane@example.com',
      phone: ''
    }
  ],
  campaignType: 'EMAIL',
  addToList: 'noList',
  contactInput: 'accounts',
  fromType: 'single',
  senders: []
};

const response = await ccai.email.sendCampaign(campaign);
console.log('Email campaign sent successfully:', response);
```

### Schedule an email campaign for future delivery

```typescript
// Schedule for tomorrow at 10:00 AM
const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
tomorrow.setHours(10, 0, 0, 0);

const campaign: EmailCampaign = {
  // ... other campaign properties as shown above
  scheduledTimestamp: tomorrow.toISOString(),
  scheduledTimezone: 'America/New_York'
};

const response = await ccai.email.sendCampaign(campaign);
console.log('Email campaign scheduled successfully:', response);
```

### Track progress with callback

```typescript
const options = {
  onProgress: (status) => console.log(`Status: ${status}`)
};

const response = await ccai.email.sendCampaign(campaign, options);
```

## API Reference

### EmailCampaign

The `EmailCampaign` type represents an email campaign configuration:

```typescript
type EmailCampaign = {
  subject: string;                   // Email subject
  title: string;                     // Campaign title
  message: string;                   // HTML message content
  editor?: string | null;            // Optional editor information
  fileKey?: string | null;           // Optional file key
  senderEmail: string;               // Sender's email address
  replyEmail: string;                // Reply-to email address
  senderName: string;                // Sender's name
  accounts: EmailAccount[];          // Recipients
  campaignType: "EMAIL";             // Must be "EMAIL"
  scheduledTimestamp?: string | null; // Optional ISO timestamp for scheduling
  scheduledTimezone?: string | null;  // Optional timezone for scheduling
  addToList: string;                 // List handling ("noList" or other options)
  selectedList?: { value: string | null }; // Optional selected list
  listId?: string | null;            // Optional list ID
  contactInput: string;              // How contacts are provided ("accounts")
  replaceContacts?: boolean | null;  // Optional replace contacts flag
  emailTemplateId?: string | null;   // Optional template ID
  fluxId?: string | null;            // Optional flux ID
  fromType: string;                  // From type ("single" or other options)
  senders: any[];                    // Additional senders (usually empty)
};
```

### EmailAccount

The `EmailAccount` type represents a recipient:

```typescript
type EmailAccount = {
  firstName: string;   // Recipient's first name
  lastName: string;    // Recipient's last name
  email: string;       // Recipient's email address
  phone: string;       // Required by Account type but not used for email
};
```

### EmailOptions

The `EmailOptions` type represents optional settings for email operations:

```typescript
type EmailOptions = {
  timeout?: number;                    // Optional timeout in milliseconds
  retries?: number;                    // Optional retry count for failed requests
  onProgress?: (status: string) => void; // Optional callback for tracking progress
};
```

## Error Handling

```typescript
try {
  const response = await ccai.email.sendCampaign(campaign);
  console.log('Email campaign sent successfully:', response);
} catch (error) {
  console.error('Error sending email campaign:', error);
}
```

## Examples

See the [examples directory](../examples/email-examples.ts) for more examples of using the Email functionality.
