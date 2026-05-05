/**
 * Example usage of the CCAI Brands API
 *
 * @license MIT
 * @copyright 2025 CloudContactAI LLC
 */

import dotenv from 'dotenv';
import { CCAI } from '../ccai';

// Load environment variables
dotenv.config();

// Create a new CCAI client
const ccai = new CCAI({
  clientId: process.env.CCAI_CLIENT_ID || '',
  apiKey: process.env.CCAI_API_KEY || '',
});

async function brandExamples() {
  try {
    // Create a brand
    console.log('Creating a brand...');
    const brand = await ccai.brands.create({
      legalCompanyName: 'Collect.org Inc.',
      dba: 'Collect',
      entityType: 'NON_PROFIT',
      taxId: '123456789',
      taxIdCountry: 'US',
      country: 'US',
      verticalType: 'NON_PROFIT',
      websiteUrl: 'https://www.collect.org',
      street: '123 Main Street',
      city: 'San Francisco',
      state: 'CA',
      postalCode: '94105',
      contactFirstName: 'Jane',
      contactLastName: 'Doe',
      contactEmail: 'jane@collect.org',
      contactPhone: '+14155551234',
    });
    console.log('Brand created:', brand);

    // Get brand by ID
    console.log('\nFetching brand by ID...');
    const fetched = await ccai.brands.get(brand.id);
    console.log('Brand details:', fetched);

    // List all brands
    console.log('\nListing all brands...');
    const brands = await ccai.brands.list();
    console.log(`Found ${brands.length} brand(s)`);

    // Update a brand
    console.log('\nUpdating brand...');
    const updated = await ccai.brands.update(brand.id, {
      street: '456 Oak Avenue',
      city: 'Los Angeles',
      contactEmail: 'admin@collect.org',
    });
    console.log('Brand updated:', updated);

    // Delete a brand
    console.log('\nDeleting brand...');
    await ccai.brands.delete(brand.id);
    console.log('Brand deleted successfully');
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Error:', error.message);
    } else {
      console.error('Error:', error);
    }
  }
}

brandExamples();
