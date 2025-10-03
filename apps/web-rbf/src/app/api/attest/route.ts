import { NextRequest, NextResponse } from 'next/server';
import { privateKeyToAccount } from 'viem/accounts';
import { buildAttestation, hashAttestation } from '@/lib/attestation/builder';
import { computeKPIs, normalizeShopifyOrder, normalizeShopifyRefund, normalizeShopifyCustomer } from '@/lib/commerce/kpi';

// Attestor EOA (server-side signing key)
const ATTESTOR_PRIVATE_KEY = process.env.ATTESTOR_PRIVATE_KEY as `0x${string}`;

if (!ATTESTOR_PRIVATE_KEY) {
  throw new Error('ATTESTOR_PRIVATE_KEY not configured');
}

const attestorAccount = privateKeyToAccount(ATTESTOR_PRIVATE_KEY);

/**
 * POST /api/attest
 *
 * Build, sign, and pin monthly attestation
 *
 * Body:
 * {
 *   merchantAddress: string,
 *   shop: string,
 *   accessToken: string,
 *   timezone: string,
 *   month: string // 'YYYY-MM'
 *   previousCid?: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { merchantAddress, shop, accessToken, timezone, month, previousCid } = body;

    if (!merchantAddress || !shop || !accessToken || !month) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // 1. Fetch KPI data for the month
    const [year, monthNum] = month.split('-').map(Number);
    const startDate = new Date(year, monthNum - 1, 1);
    const endDate = new Date(year, monthNum, 0, 23, 59, 59); // Last day of month

    // Fetch orders/refunds/customers for the month
    const SHOPIFY_API_VERSION = process.env.SHOPIFY_API_VERSION || '2025-01';

    const ordersUrl = `https://${shop}/admin/api/${SHOPIFY_API_VERSION}/orders.json` +
      `?status=any` +
      `&created_at_min=${startDate.toISOString()}` +
      `&created_at_max=${endDate.toISOString()}` +
      `&limit=250`;

    const ordersResponse = await fetch(ordersUrl, {
      headers: { 'X-Shopify-Access-Token': accessToken }
    });

    if (!ordersResponse.ok) {
      throw new Error('Failed to fetch orders');
    }

    const ordersData = await ordersResponse.json();
    const rawOrders = ordersData.orders || [];
    const orders = rawOrders.map(normalizeShopifyOrder);

    console.log(`[Attest] Fetched ${orders.length} orders for ${month}`);

    // Fetch refunds (simplified)
    let allRefunds: any[] = [];
    for (const order of rawOrders.slice(0, 50)) { // Limit to avoid rate limits
      if (order.refunds && order.refunds.length > 0) {
        order.refunds.forEach((refund: any) => {
          allRefunds.push(normalizeShopifyRefund(refund, order.id.toString()));
        });
      }
    }

    // Fetch customers (optional)
    let customers: any[] = [];
    try {
      const customersUrl = `https://${shop}/admin/api/${SHOPIFY_API_VERSION}/customers.json` +
        `?created_at_min=${startDate.toISOString()}` +
        `&created_at_max=${endDate.toISOString()}` +
        `&limit=250`;

      const customersResponse = await fetch(customersUrl, {
        headers: { 'X-Shopify-Access-Token': accessToken }
      });

      if (customersResponse.ok) {
        const customersData = await customersResponse.json();
        customers = (customersData.customers || []).map(normalizeShopifyCustomer);
      }
    } catch (err) {
      console.warn('[Attest] Failed to fetch customers:', err);
    }

    // Compute KPIs for the month
    const kpis = computeKPIs({
      orders,
      refunds: allRefunds,
      customers: customers.length > 0 ? customers : undefined,
      timezone: timezone || 'America/New_York',
      windowDays: 30,
      priorWindowDays: 30 // For growth calc
    });

    // 2. Build attestation
    const attestation = buildAttestation(kpis, merchantAddress, previousCid);

    // 3. Hash attestation
    const hash = hashAttestation(attestation);

    // 4. EIP-191 Sign
    const signature = await attestorAccount.signMessage({
      message: { raw: hash }
    });

    // 5. Pin to IPFS (Pinata)
    const pinataApiKey = process.env.PINATA_API_KEY;
    const pinataSecretKey = process.env.PINATA_SECRET_KEY;

    if (!pinataApiKey || !pinataSecretKey) {
      throw new Error('Pinata credentials not configured');
    }

    const pinataResponse = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'pinata_api_key': pinataApiKey,
        'pinata_secret_api_key': pinataSecretKey
      },
      body: JSON.stringify({
        pinataContent: attestation,
        pinataMetadata: {
          name: `Attestation-${merchantAddress}-${month}`
        }
      })
    });

    if (!pinataResponse.ok) {
      const errorText = await pinataResponse.text();
      throw new Error(`Failed to pin to IPFS: ${errorText}`);
    }

    const pinataData = await pinataResponse.json();
    const payloadCid = pinataData.IpfsHash;

    console.log(`[Attest] Pinned attestation: ${payloadCid}`);

    // 6. Return result
    return NextResponse.json({
      success: true,
      attestation: {
        payloadCid,
        signer: attestorAccount.address,
        signature,
        hash,
        month,
        merchantAddress,
        netRevenue: attestation.metrics.net_sales
      }
    });

  } catch (error) {
    console.error('[Attest] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to create attestation',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
