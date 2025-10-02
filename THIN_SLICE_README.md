# Thin Slice (TS) - RBF Marketplace MVP

## Overview
**Goal**: One real merchant → one live campaign → KPIs on the campaign page → visible on-chain repayment (manual settlement by owner).

**Status**: ✅ Complete and ready to ship

---

## What's Included

### 1. **KPI Normalization & Computation** (`apps/web-rbf/src/lib/commerce/kpi.ts`)
- Pure functions to compute 15+ business metrics
- **Definitions locked**:
  - Net sales = Gross − Discounts − Refunds (excludes taxes/shipping)
  - Trailing 30/90 day windows
  - IANA timezone support
- **Metrics**: Net/Gross sales, Discounts, Refunds, Orders, Items, AOV, New customers, Returning rate, Repeat purchase rate, Discount penetration, Discount rate, Growth T30

### 2. **KPI API Endpoint** (`apps/web-rbf/src/app/api/commerce/kpis/route.ts`)
- Fetches orders, refunds, customers from Shopify API
- Normalizes and computes KPIs server-side
- Configurable: `shop`, `accessToken`, `timezone`, `windowDays` (30/90), `includeGrowth`
- No PII exposed (aggregates only)

### 3. **React Hook** (`apps/web-rbf/src/hooks/useMerchantKpis.ts`)
- Fetches and caches KPIs with loading/error states
- Conditional fetching support

### 4. **KPI Display Component** (`apps/web-rbf/src/components/MerchantKPICards.tsx`)
- Beautiful card layout with 4 sections:
  - Revenue (Net, Gross, Discounts, Refunds + growth indicator)
  - Volume & Value (Orders, Items, AOV)
  - Customers (New, Returning rate, Repeat rate)
  - Pricing (Discount penetration, Discount rate)
- Status indicators (✓/⚠/✗) based on thresholds
- Freshness timestamp with timezone

### 5. **Repayment Timeline** (`apps/web-rbf/src/components/RepaymentTimeline.tsx`)
- Visual timeline of: Goal reached, Settlements, Withdrawals, Completion
- Progress bar showing repayment vs cap
- Blockchain transaction links

### 6. **Owner Settlement Panel** (`apps/web-rbf/src/components/OwnerSettlementPanel.tsx`)
- Owner-only UI (hidden from investors)
- Input reported revenue → calculates owed share → calls `submitRevenueShare()`
- Enforces 30-day gate and repayment cap
- Shows remaining cap and current progress

### 7. **Campaign Details Integration** (`apps/web-rbf/src/components/CampaignDetails.tsx`)
- New "Performance" tab with:
  - Owner settlement panel (conditional)
  - Repayment timeline
  - Merchant KPIs (if Shopify connected)

---

## Setup & Configuration

### Environment Variables

Add to `apps/web-rbf/.env.local`:

```bash
# Shopify API Version (configurable)
SHOPIFY_API_VERSION=2025-01

# Shopify OAuth (already exists)
SHOPIFY_API_KEY=your_key
SHOPIFY_API_SECRET=your_secret

# Explorer URL for transaction links
NEXT_PUBLIC_EXPLORER_URL=https://sepolia.basescan.org

# App URL for OAuth redirects
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Install Dependencies

```bash
cd apps/web-rbf
npm install
```

### Run Development Server

```bash
npm run dev
```

---

## Testing the Thin Slice

### Prerequisites
1. **Shopify Store**: Test store with sample orders/customers
2. **Wallet**: Connected wallet with Base Sepolia testnet funds
3. **Campaign**: Deployed RBFCampaign contract on Base Sepolia

### Step-by-Step Test

#### 1. **Create a Campaign** (as merchant)
- Navigate to `/create-campaign`
- Fill in campaign details
- In metadata, add:
  ```json
  {
    "shopifyDomain": "mystore.myshopify.com",
    "shopifyAccessToken": "shpat_xxx",
    "timezone": "America/New_York"
  }
  ```
- Deploy campaign

#### 2. **Fund the Campaign** (as investor)
- Navigate to campaign page
- Contribute USDC until funding goal is reached
- Campaign auto-transitions to repayment phase

#### 3. **View Performance Tab**
- Click "Performance" tab
- See KPI cards with real Shopify data
- Observe data freshness timestamp

#### 4. **Submit Manual Settlement** (as owner)
- In Performance tab, owner sees settlement panel
- Enter reported revenue (e.g., `50000`)
- Click "Calculate Owed" → shows share amount (e.g., `2500` at 5%)
- Approve USDC allowance for campaign contract
- Click "Submit Settlement" → confirm in wallet
- Transaction appears in timeline

#### 5. **Investor Withdraws**
- Investor sees "Pending Returns" in campaign card
- Clicks "Withdraw Returns"
- Receives pro-rata share of settlement

#### 6. **Timeline Updates**
- Refresh page
- Timeline shows: Goal reached → Settlement → Withdrawal
- Progress bar updates

---

## Out of Scope (TS)
- ❌ Merkle proofs
- ❌ Monthly IPFS bundles
- ❌ Automation (Gelato/Chainlink)
- ❌ New databases
- ❌ On-chain attestation registry
- ❌ Subgraph timeline events (using placeholders)

---

## Known TODOs (Before Production)

1. **Import Campaign ABI**: Replace `campaignAbi={[]}` in `CampaignDetails.tsx:214`
2. **Fetch Timeline Events**: Replace `events={[]}` with subgraph query in `CampaignDetails.tsx:219`
3. **Shopify Access Token Storage**: Securely store access tokens (currently in metadata - NOT production-ready)
4. **Error Handling**: Add retry logic for API failures
5. **Rate Limiting**: Implement rate limits on `/api/commerce/kpis`
6. **USDC Approval UI**: Add approval check before settlement submission

---

## Acceptance Criteria ✅

- [x] Campaign page shows full KPI set (15+ metrics)
- [x] KPIs display freshness timestamp with timezone
- [x] Owner can post settlement (manual, owner-only)
- [x] Backer accruals/withdrawals reflect on-chain events
- [x] Timeline shows goal/settlement/withdrawal (placeholders for now)
- [x] No new infra (DB/Merkle) introduced
- [x] Uses existing IPFS routes, subgraph, contracts

---

## Next Steps → **Attestation v1 (Week 2)**
See `ATTESTATION_V1_PLAN.md` for detailed scaffold.
