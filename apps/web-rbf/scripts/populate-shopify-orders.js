#!/usr/bin/env node
/**
 * Populate Shopify Development Store with Sample Orders
 *
 * Usage:
 *   node scripts/populate-shopify-orders.js
 *
 * Requirements:
 *   - SHOPIFY_STORE_DOMAIN environment variable (e.g., bloombeam1.myshopify.com)
 *   - SHOPIFY_ACCESS_TOKEN environment variable (e.g., shpat_xxx)
 */

const https = require('https');

// Configuration
const STORE_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN || 'bloombeam1.myshopify.com';
const ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
const API_VERSION = '2025-01';

if (!ACCESS_TOKEN) {
  console.error('❌ Error: SHOPIFY_ACCESS_TOKEN environment variable is required');
  console.error('Usage: SHOPIFY_ACCESS_TOKEN=shpat_xxx node scripts/populate-shopify-orders.js');
  process.exit(1);
}

// Sample customer data
const SAMPLE_CUSTOMERS = [
  { first_name: 'Alice', last_name: 'Johnson', email: 'alice@example.com' },
  { first_name: 'Bob', last_name: 'Smith', email: 'bob@example.com' },
  { first_name: 'Charlie', last_name: 'Brown', email: 'charlie@example.com' },
  { first_name: 'Diana', last_name: 'Davis', email: 'diana@example.com' },
  { first_name: 'Eve', last_name: 'Wilson', email: 'eve@example.com' },
];

// Helper function to make Shopify API requests
function shopifyRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: STORE_DOMAIN,
      port: 443,
      path: `/admin/api/${API_VERSION}${path}`,
      method: method,
      headers: {
        'X-Shopify-Access-Token': ACCESS_TOKEN,
        'Content-Type': 'application/json',
      },
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(body));
          } catch (e) {
            resolve(body);
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${body}`));
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// Fetch all products
async function fetchProducts() {
  console.log('📦 Fetching products from store...');
  const response = await shopifyRequest('GET', '/products.json?limit=250');
  return response.products || [];
}

// Generate random date in the past 90 days
function randomPastDate(daysAgo = 90) {
  const now = new Date();
  const past = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
  const randomTime = past.getTime() + Math.random() * (now.getTime() - past.getTime());
  return new Date(randomTime).toISOString();
}

// Generate random order
function generateOrder(products, customerIndex) {
  const customer = SAMPLE_CUSTOMERS[customerIndex % SAMPLE_CUSTOMERS.length];

  // Random 1-3 products per order
  const numItems = Math.floor(Math.random() * 3) + 1;
  const lineItems = [];

  for (let i = 0; i < numItems; i++) {
    const product = products[Math.floor(Math.random() * products.length)];
    const variant = product.variants && product.variants[0];

    if (variant) {
      lineItems.push({
        variant_id: variant.id,
        quantity: Math.floor(Math.random() * 3) + 1,
        price: variant.price,
      });
    }
  }

  // Random financial status
  const financialStatuses = ['paid', 'paid', 'paid', 'pending', 'refunded'];
  const financialStatus = financialStatuses[Math.floor(Math.random() * financialStatuses.length)];

  return {
    order: {
      line_items: lineItems,
      customer: {
        first_name: customer.first_name,
        last_name: customer.last_name,
        email: customer.email,
      },
      financial_status: financialStatus,
      created_at: randomPastDate(90),
      processed_at: randomPastDate(90),
      currency: 'USD',
      total_price: lineItems.reduce((sum, item) => sum + parseFloat(item.price) * item.quantity, 0).toFixed(2),
      shipping_address: {
        first_name: customer.first_name,
        last_name: customer.last_name,
        address1: '123 Main St',
        city: 'New York',
        province: 'NY',
        country: 'United States',
        zip: '10001',
      },
      billing_address: {
        first_name: customer.first_name,
        last_name: customer.last_name,
        address1: '123 Main St',
        city: 'New York',
        province: 'NY',
        country: 'United States',
        zip: '10001',
      },
    },
  };
}

// Create order
async function createOrder(orderData) {
  try {
    await shopifyRequest('POST', '/orders.json', orderData);
    return true;
  } catch (error) {
    console.error(`❌ Failed to create order: ${error.message}`);
    return false;
  }
}

// Main function
async function main() {
  console.log('🚀 Starting Shopify order population...\n');
  console.log(`Store: ${STORE_DOMAIN}`);
  console.log(`API Version: ${API_VERSION}\n`);

  try {
    // Fetch products
    const products = await fetchProducts();

    if (products.length === 0) {
      console.error('❌ No products found in store. Please add products first.');
      process.exit(1);
    }

    console.log(`✅ Found ${products.length} products\n`);

    // Ask for number of orders to create
    const numOrders = parseInt(process.env.NUM_ORDERS || '20');
    console.log(`📝 Creating ${numOrders} sample orders...\n`);

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < numOrders; i++) {
      const orderData = generateOrder(products, i);
      const success = await createOrder(orderData);

      if (success) {
        successCount++;
        process.stdout.write(`✓`);
      } else {
        failCount++;
        process.stdout.write(`✗`);
      }

      // Rate limiting: wait 500ms between requests
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    console.log('\n\n📊 Results:');
    console.log(`✅ Successfully created: ${successCount} orders`);
    console.log(`❌ Failed: ${failCount} orders`);
    console.log('\n🎉 Done! Check your Shopify admin to see the orders.');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the script
main();
