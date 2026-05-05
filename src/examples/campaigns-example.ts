/**
 * Example usage of the CCAI Campaigns API
 *
 * @license MIT
 * @copyright 2025 CloudContactAI LLC
 */

import dotenv from 'dotenv';
import { CCAI } from '../ccai';

dotenv.config();

const ccai = new CCAI({
  clientId: process.env.CCAI_CLIENT_ID || '',
  apiKey: process.env.CCAI_API_KEY || '',
});

async function campaignExamples() {
  try {
    // Create a campaign (assumes brand ID 1 exists)
    console.log('Creating a campaign...');
    const campaign = await ccai.campaigns.create({
      brandId: 1,
      useCase: 'MIXED',
      subUseCases: ['CUSTOMER_CARE', 'TWO_FACTOR_AUTHENTICATION', 'ACCOUNT_NOTIFICATION'],
      description: 'This campaign handles security codes and support for Collect.org.',
      messageFlow: 'Users opt-in via our signup form checkbox at https://collect.org/signup',
      termsLink: 'https://collect.org/terms',
      privacyLink: 'https://collect.org/privacy',
      hasEmbeddedLinks: true,
      hasEmbeddedPhone: false,
      isAgeGated: false,
      isDirectLending: false,
      optInKeywords: ['START', 'JOIN'],
      optInMessage: 'Welcome to Collect.org! Msg&Data rates may apply. Reply STOP to cancel.',
      optInProofUrl: 'https://collect.org/images/opt-in-proof.png',
      helpKeywords: ['HELP', 'INFO'],
      helpMessage: 'Collect.org: For help email support@collect.org. Reply STOP to cancel.',
      optOutKeywords: ['STOP', 'UNSUBSCRIBE'],
      optOutMessage: 'Collect.org: You have been unsubscribed. STOP received.',
      sampleMessages: [
        'Your Collect.org security code is 554321. Reply STOP to cancel.',
        'Hi [Name], your ticket #[ID] has been updated. Reply HELP for more info.',
      ],
    });
    console.log('Campaign created:', campaign.id, `fee: $${campaign.monthlyFee}/mo`);

    // Get campaign by ID
    console.log('\nFetching campaign by ID...');
    const fetched = await ccai.campaigns.get(campaign.id);
    console.log('Campaign:', fetched.useCase, 'Brand:', fetched.brandId);

    // List all campaigns
    console.log('\nListing all campaigns...');
    const campaigns = await ccai.campaigns.list();
    console.log(`Found ${campaigns.length} campaign(s)`);

    // Update a campaign
    console.log('\nUpdating campaign...');
    const updated = await ccai.campaigns.update(campaign.id, {
      description: 'Updated campaign description for Collect.org messaging.',
      sampleMessages: [
        'Your Collect.org code is 123456. Reply STOP to opt-out.',
        'Your support ticket has been resolved. Reply HELP for more info.',
        'Your payment of $50.00 was received. Reply STOP to cancel.',
      ],
    });
    console.log('Campaign updated:', updated.description);

    // Delete a campaign
    console.log('\nDeleting campaign...');
    await ccai.campaigns.delete(campaign.id);
    console.log('Campaign deleted successfully');
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Error:', error.message);
    } else {
      console.error('Error:', error);
    }
  }
}

campaignExamples();
