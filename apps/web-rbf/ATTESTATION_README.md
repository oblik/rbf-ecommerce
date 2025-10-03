# Attestation v1 - Implementation Guide

## ✅ What's Been Implemented

**Attestation v1** is now complete! This system creates **cryptographically signed, IPFS-pinned monthly attestations** of merchant KPI data.

---

## ⚠️ **Trust Model & Centralization**

### **Understanding Attestation v1**

Attestation v1 uses a **single attestor** (the platform operator) to sign merchant KPIs. This is intentionally centralized for the initial release.

**How It Works:**
```
┌─────────────────────────────────────────────┐
│  Platform Operator (YOU)                    │
│                                             │
│  1. Fetch real data from Shopify API       │
│  2. Compute KPIs using verified logic      │
│  3. Sign with platform's private key       │
│  4. Pin to IPFS (immutable storage)        │
│                                             │
│  Trust Required: Investors trust YOU       │
└─────────────────────────────────────────────┘
```

### **What This Means**

**For Investors:**
- ✅ KPIs are **cryptographically signed** (can't be tampered with after creation)
- ✅ Data is **pinned to IPFS** (publicly auditable, immutable)
- ✅ Can verify signature matches the platform's attestor address
- ⚠️ Must **trust the platform** is reporting accurate Shopify data
- ⚠️ Cannot independently verify data without Shopify access

**For Merchants:**
- ✅ Data comes from their own Shopify store (real sales)
- ✅ Platform cannot modify historical attestations (IPFS immutability)
- ⚠️ Must trust platform's KPI computation logic

**Centralization Trade-offs:**
```
Pros:
  ✓ Fast to ship (no multi-party coordination)
  ✓ Simple setup (one private key)
  ✓ Low latency (no consensus delay)
  ✓ Easy to debug and iterate

Cons:
  ✗ Single point of trust (platform could lie)
  ✗ No external verification (must trust KPI logic)
  ✗ Platform controls attestation timing
  ✗ If platform key is compromised, attestations invalid
```

### **Why Start Centralized?**

This follows a **progressive decentralization** strategy:

1. **Week 2 (Now)**: Single attestor → Ship fast, learn from real usage
2. **Week 3-4**: Add multi-sig → 2-of-3 attestors (platform + auditors)
3. **Month 2**: On-chain registry → Merkle proofs for granular verification
4. **Month 3+**: TEE/Direct Shopify integration → Minimize trust assumptions

**Key Insight:** Most early users care more about:
- "Can I audit the data?" (Yes - IPFS)
- "Is it tamper-proof?" (Yes - signatures)

Than:
- "Is there a decentralized oracle network?" (Coming later)

### **Transparency Measures**

To mitigate centralization risks in v1:

1. **Public Attestations**: All data on IPFS, anyone can audit
2. **Immutability**: Cannot retroactively change past attestations
3. **Schema Versioning**: Changes to KPI logic are versioned
4. **Signature Chain**: Each attestation links to previous (via `previousCid`)
5. **Open Source**: KPI computation logic is public (this repo)

### **Decentralization Roadmap**

**Phase 2: Multi-Signature Attestations (Week 3-4)**
```
┌─────────────────────────────────────────────┐
│  Multiple Attestors (2-of-3 required)       │
│                                             │
│  Attestor 1 (Platform)    →  Signs         │
│  Attestor 2 (Audit Firm)  →  Signs         │
│  Attestor 3 (DAO/Partner) →  Signs         │
│                                             │
│  If attestors disagree:                     │
│    - Flag disputed attestation              │
│    - Trigger manual review                  │
│    - Potential slashing of dishonest signer │
└─────────────────────────────────────────────┘
```

**Phase 3: On-Chain Registry + Merkle Proofs (Month 2)**
```
┌─────────────────────────────────────────────┐
│  Smart Contract Attestation Registry        │
│                                             │
│  1. Post (month, CID, merkleRoot, hash)    │
│  2. Emit event for subgraph indexing        │
│  3. Anyone can verify on-chain             │
│                                             │
│  Merkle Tree:                               │
│    - Each KPI is a leaf                     │
│    - Investors can verify specific metrics  │
│    - Without revealing all data             │
└─────────────────────────────────────────────┘
```

**Phase 4: Trustless Verification (Month 3+)**
```
Options:
  A. Shopify Direct Integration
     - Shopify signs data themselves
     - Platform just aggregates signatures

  B. Trusted Execution Environment (TEE)
     - Run KPI computation in SGX/TrustZone
     - Cryptographic proof of correct execution

  C. Zero-Knowledge Proofs
     - Prove KPIs are correct without revealing data
     - Privacy-preserving verification
```

### **Recommendations for Using v1**

**If you're deploying to production:**

1. **Be Transparent**
   - Label as "Platform-Attested KPIs (Beta)"
   - Show decentralization roadmap to investors
   - Document the trust model in investor materials

2. **Add Safeguards**
   - Stake collateral on-chain (lose if caught lying)
   - Allow investors to request Shopify spot-checks
   - Publish attestor address publicly

3. **Build Trust Over Time**
   - Consistent, accurate attestations
   - Never miss a monthly attestation
   - Respond to disputes transparently

4. **Plan for Decentralization**
   - Identify potential co-attestors (audit firms, partners)
   - Design schema to support multi-sig in v2
   - Budget for on-chain registry development

**For Testing/Demos:**
- v1 is perfect as-is
- Centralization is acceptable for MVP
- Focus on gathering user feedback

---

## 📁 Files Created

### Core Library Files
- ✅ `src/lib/attestation/schema.ts` - Canonical JSON schema with deterministic serialization
- ✅ `src/lib/attestation/builder.ts` - Builds & hashes attestations from KPI data
- ✅ `src/lib/attestation/verify.ts` - Client-side signature verification

### API Endpoint
- ✅ `src/app/api/attest/route.ts` - Server-side signing & IPFS pinning endpoint

### UI Components
- ✅ `src/components/AttestationTimelineItem.tsx` - Timeline item with signature verification
- ✅ `src/components/RepaymentTimeline.tsx` - Updated to support attestation events

### Configuration
- ✅ `.env.example` - Updated with attestation environment variables

---

## 🔧 Setup Instructions

### 1. Install Dependencies

Already installed! The attestation uses existing dependencies:
- `viem` - For EIP-191 signing & signature recovery
- `date-fns` - For timestamp formatting

### 2. Configure Environment Variables

Add to your `.env.local`:

```bash
# Attestation v1 - Server-side signing
ATTESTOR_PRIVATE_KEY=0x...your_private_key
NEXT_PUBLIC_ATTESTOR_ADDRESS=0x...derived_from_private_key

# Pinata (IPFS pinning)
PINATA_API_KEY=your_pinata_api_key
PINATA_SECRET_KEY=your_pinata_secret_key
```

**Generate Attestor Key:**
```bash
cast wallet new
# Save the private key to ATTESTOR_PRIVATE_KEY
# Save the address to NEXT_PUBLIC_ATTESTOR_ADDRESS
```

**Get Pinata API Keys:**
1. Go to https://pinata.cloud
2. Create free account
3. Dashboard → API Keys → New Key
4. Copy API Key and Secret Key

### 3. Verify Server is Running

```bash
npm run dev
# Server should be at http://localhost:3000
```

---

## 🧪 Testing

### Test 1: Create an Attestation

```bash
curl -X POST http://localhost:3000/api/attest \
  -H "Content-Type: application/json" \
  -d '{
    "merchantAddress": "0x1234567890123456789012345678901234567890",
    "shop": "your-store.myshopify.com",
    "accessToken": "shpat_xxxxx",
    "timezone": "America/New_York",
    "month": "2025-01"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "attestation": {
    "payloadCid": "QmXx...",
    "signer": "0x...",
    "signature": "0x...",
    "hash": "0x...",
    "month": "2025-01",
    "merchantAddress": "0x...",
    "netRevenue": "12345.67"
  }
}
```

### Test 2: View on IPFS

```bash
# Use the CID from the response
open https://ipfs.io/ipfs/QmXx...
```

You should see the canonical JSON attestation with all metrics.

### Test 3: Verify in Timeline

Add an attestation event to your timeline:

```typescript
const events: TimelineEvent[] = [
  {
    type: 'attestation',
    timestamp: Math.floor(Date.now() / 1000),
    attestation: {
      month: '2025-01',
      payloadCid: 'QmXx...',
      signer: '0x...',
      signature: '0x...',
      hash: '0x...',
      netRevenue: '$12,345.67'
    }
  }
];
```

Click "Verify Signature" to check the cryptographic proof.

---

## 📊 Attestation Schema

Each attestation contains:

```typescript
{
  schemaVersion: '1.0.0',

  period: {
    start: '2025-01-01T00:00:00.000Z',
    end: '2025-01-31T23:59:59.999Z',
    timezone: 'America/New_York'
  },

  merchant: {
    merchantId: '0x...',  // Business wallet address
    currency: 'USD'
  },

  metrics: {
    // Revenue (2 decimals)
    gross_sales: "50000.00",
    discounts: "2500.00",
    refunds: "500.00",
    net_sales: "47000.00",

    // Volume
    orders_count: 245,
    items_sold: 612,

    // Value (2 decimals)
    aov: "191.84",

    // Customers
    new_customers: 89,
    returning_customer_rate: "0.4200",  // 4 decimals
    repeat_purchase_rate: "0.3600",

    // Pricing (4 decimals)
    discount_penetration: "0.6500",
    discount_rate: "0.0500",

    // Trend (4 decimals, optional)
    growth_t30: "15.5000"
  },

  nonce: "1633024800000",
  timestamp: "2025-02-01T00:00:00.000Z",
  previousCid: "QmPrevious..."  // Links to previous month
}
```

---

## 🔐 How Attestation Works

### 1. Monthly Data Collection
- Fetch orders, refunds, customers from Shopify for the month
- Normalize and compute KPIs using existing `computeKPIs()`

### 2. Build Canonical JSON
- Convert KPIs to fixed-decimal strings
- Sort all object keys alphabetically
- Create deterministic JSON structure

### 3. Hash & Sign
- `keccak256(canonicalJSON)` → hash
- Sign hash with `ATTESTOR_PRIVATE_KEY` (EIP-191)
- Returns `signature`

### 4. Pin to IPFS
- Upload canonical JSON to Pinata
- Get back immutable `payloadCid`

### 5. Verification (Client-Side)
- Fetch JSON from IPFS using CID
- Re-hash the JSON
- Recover signer from signature
- Check signer is in allowlist
- Display ✓ Verified badge

---

## 🚀 Production Deployment

### 1. Set Environment Variables

In Vercel:
1. Dashboard → Your Project → Settings → Environment Variables
2. Add:
   - `ATTESTOR_PRIVATE_KEY` (Secret)
   - `NEXT_PUBLIC_ATTESTOR_ADDRESS`
   - `PINATA_API_KEY` (Secret)
   - `PINATA_SECRET_KEY` (Secret)

### 2. Automated Monthly Attestations

Option A: **Vercel Cron**

Create `src/app/api/cron/attest/route.ts`:

```typescript
export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Get all merchants
  const merchants = await db.merchants.findMany();

  // Create attestations for each
  for (const merchant of merchants) {
    await fetch(`${process.env.APP_URL}/api/attest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        merchantAddress: merchant.address,
        shop: merchant.shopifyDomain,
        accessToken: merchant.shopifyAccessToken,
        timezone: merchant.timezone,
        month: new Date().toISOString().slice(0, 7) // YYYY-MM
      })
    });
  }

  return Response.json({ success: true });
}
```

Add to `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cron/attest",
    "schedule": "0 0 1 * *"
  }]
}
```

Option B: **GitHub Actions**

Create `.github/workflows/monthly-attestation.yml`:

```yaml
name: Monthly Attestation
on:
  schedule:
    - cron: '0 0 1 * *'  # 1st of every month
  workflow_dispatch:

jobs:
  attest:
    runs-on: ubuntu-latest
    steps:
      - name: Create Attestations
        run: |
          curl -X POST https://your-app.vercel.app/api/cron/attest \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

---

## 🔍 Debugging

### Issue: "ATTESTOR_PRIVATE_KEY not configured"

**Solution:** Check `.env.local` has the private key set.

```bash
echo $ATTESTOR_PRIVATE_KEY
# Should output 0x...
```

### Issue: "Failed to pin to IPFS"

**Solution:** Verify Pinata credentials:

```bash
curl -X GET https://api.pinata.cloud/data/testAuthentication \
  -H "pinata_api_key: $PINATA_API_KEY" \
  -H "pinata_secret_api_key: $PINATA_SECRET_KEY"
```

### Issue: Signature verification fails

**Solution:** Ensure `NEXT_PUBLIC_ATTESTOR_ADDRESS` matches the private key:

```bash
cast wallet address --private-key $ATTESTOR_PRIVATE_KEY
# Should match NEXT_PUBLIC_ATTESTOR_ADDRESS
```

---

## 📈 Next Steps (Week 3+)

After Attestation v1, the roadmap includes:

### **On-Chain Registry**
- Store `(month, payloadCid, hash, timestamp)` on-chain
- Events for subgraph indexing
- Verifiable attestation chain

### **Multi-Oracle Consensus**
- Multiple attestor EOAs
- M-of-N signature verification
- Slashing for incorrect attestations

### **Merkle Proofs**
- Merkle trees for granular KPI verification
- Privacy-preserving selective disclosure
- On-chain verification of specific metrics

---

## 📚 Reference

### Key Functions

**Build Attestation:**
```typescript
import { buildAttestation } from '@/lib/attestation/builder';

const attestation = buildAttestation(kpis, merchantAddress, previousCid);
```

**Hash Attestation:**
```typescript
import { hashAttestation } from '@/lib/attestation/builder';

const hash = hashAttestation(attestation);
```

**Verify Signature:**
```typescript
import { verifyAttestationSignature } from '@/lib/attestation/verify';

const result = await verifyAttestationSignature(
  hash,
  signature,
  signer,
  allowedSigners
);
console.log(result.valid); // true/false
```

### Timeline Integration

```typescript
import { RepaymentTimeline } from '@/components/RepaymentTimeline';

const events = [
  {
    type: 'attestation',
    timestamp: 1704067200,
    attestation: {
      month: '2025-01',
      payloadCid: 'QmXx...',
      signer: '0x...',
      signature: '0x...',
      hash: '0x...',
      netRevenue: '$47,000.00'
    }
  }
];

<RepaymentTimeline events={events} ... />
```

---

## ✅ Acceptance Criteria

- [x] Canonical JSON schema defined and implemented
- [x] Server-side signing with EIP-191 (deterministic)
- [x] `/api/attest` endpoint builds, signs, and pins attestation
- [x] IPFS pinning via Pinata
- [x] Frontend verification UI with "Verify Signature" button
- [x] Timeline shows "Attested" badge with IPFS link
- [x] No PII in attestations
- [x] Schema versioning (`schemaVersion: '1.0.0'`)
- [x] Chain attestations via `previousCid` link

---

**🎉 Attestation v1 is complete and ready to use!**
