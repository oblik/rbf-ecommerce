# Next Steps - RBF Attestation System

## ✅ **Completed**
- [x] Thin Slice MVP (KPIs + Timeline + Manual Settlement)
- [x] Attestation v1 (Canonical JSON + EIP-191 Signing + IPFS)

---

## 🎯 **This Week: Test & Deploy**

### **Step 1: Configure Attestor (15 min)**

1. **Generate Attestor Key:**
   ```bash
   cd apps/web-rbf
   cast wallet new
   ```

   Output will look like:
   ```
   Successfully created new keypair.
   Address:     0x1234567890123456789012345678901234567890
   Private key: 0xabcdef...
   ```

2. **Get Pinata API Keys:**
   - Go to https://pinata.cloud
   - Sign up for free account
   - Dashboard → API Keys → New Key
   - Select "Admin" permissions
   - Copy API Key and Secret

3. **Update `.env.local`:**
   ```bash
   # Attestation v1
   ATTESTOR_PRIVATE_KEY=0xabcdef... # From step 1
   NEXT_PUBLIC_ATTESTOR_ADDRESS=0x1234... # From step 1

   # Pinata
   PINATA_API_KEY=... # From step 2
   PINATA_SECRET_KEY=... # From step 2
   ```

4. **Restart Dev Server:**
   ```bash
   npm run dev
   ```

### **Step 2: Create Test Attestation (5 min)**

```bash
# Replace with your actual values
curl -X POST http://localhost:3000/api/attest \
  -H "Content-Type: application/json" \
  -d '{
    "merchantAddress": "0xYourMerchantAddress",
    "shop": "your-store.myshopify.com",
    "accessToken": "shpat_...",
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
    "signer": "0x1234...",
    "signature": "0xabc...",
    "hash": "0xdef...",
    "month": "2025-01",
    "netRevenue": "47000.00"
  }
}
```

### **Step 3: Verify on IPFS (2 min)**

```bash
# Open in browser (use CID from response)
open https://ipfs.io/ipfs/QmXx...
```

You should see the full attestation JSON with all 15+ KPIs.

### **Step 4: Test Signature Verification (5 min)**

1. Add attestation to your timeline (manually for now)
2. Navigate to campaign page
3. Click "Verify Signature" button
4. Should show ✓ Verified badge

---

## 📦 **Next Week: Deploy to Production**

### **Step 1: Deploy to Vercel**

```bash
# From project root
vercel

# Set environment variables in Vercel dashboard:
# - ATTESTOR_PRIVATE_KEY (Secret)
# - NEXT_PUBLIC_ATTESTOR_ADDRESS
# - PINATA_API_KEY (Secret)
# - PINATA_SECRET_KEY (Secret)
```

### **Step 2: Test Production Endpoint**

```bash
curl -X POST https://your-app.vercel.app/api/attest \
  -H "Content-Type: application/json" \
  -d '{...}'
```

### **Step 3: Monitor First Production Attestation**

- Check Vercel logs
- Verify IPFS pin succeeded
- Confirm signature verification works for investors

---

## 🚀 **Week 3: On-Chain Registry**

### **Goal**: Store attestation references on-chain for subgraph indexing

### **Tasks**

1. **Write Smart Contract** (`contracts/src/AttestationRegistry.sol`)
   ```solidity
   contract AttestationRegistry {
       struct Attestation {
           string month;
           string payloadCid;
           bytes32 hash;
           address signer;
           uint256 timestamp;
       }

       mapping(address => Attestation[]) public attestations;

       event AttestationPosted(
           address indexed merchant,
           string month,
           string payloadCid
       );

       function postAttestation(...) external;
       function getAttestations(address merchant) external view;
   }
   ```

2. **Deploy Contract**
   ```bash
   cd contracts
   forge script script/DeployAttestationRegistry.s.sol \
     --rpc-url base_sepolia \
     --broadcast \
     --verify
   ```

3. **Update API Endpoint**
   ```typescript
   // After pinning to IPFS, post to on-chain registry
   await registryContract.write.postAttestation([
     merchantAddress,
     month,
     payloadCid,
     hash
   ]);
   ```

4. **Update Subgraph**
   - Add AttestationRegistry as data source
   - Index AttestationPosted events
   - Query attestations in UI

**Estimated Time**: 3-4 days

---

## 📅 **Week 4: Multi-Signature Attestations**

### **Goal**: Require 2-of-3 signatures for increased trust

### **Tasks**

1. **Identify Co-Attestors**
   - Option A: Partner with audit firm
   - Option B: Community DAO multi-sig
   - Option C: Another platform operator

2. **Update Schema**
   ```typescript
   interface AttestationV2 {
     // ... existing fields
     signers: {
       platform: { address: string; signature: string };
       auditor: { address: string; signature: string };
       dao?: { address: string; signature: string };
     };
     threshold: number; // e.g., 2
   }
   ```

3. **Coordination Flow**
   ```typescript
   // Platform computes KPIs
   const attestation = buildAttestation(kpis);
   const hash = hashAttestation(attestation);

   // Send hash to co-attestors
   const sig1 = await platformAttestor.sign(hash);
   const sig2 = await auditFirmAttestor.sign(hash);
   const sig3 = await daoAttestor.sign(hash);

   // Verify M-of-N
   const validSigs = verifySigs([sig1, sig2, sig3]);
   if (validSigs.length < 2) throw Error('Insufficient sigs');

   // Pin to IPFS with all signatures
   ```

4. **Update UI**
   - Show all 3 signers
   - Display "2-of-3 Verified" badge
   - Flag if attestors disagree

**Estimated Time**: 5-7 days (coordination overhead)

---

## 🔮 **Month 2+: Advanced Features**

### **Merkle Proofs**
- Build Merkle tree of all KPIs
- Store root on-chain
- Allow verification of individual metrics
- Privacy-preserving selective disclosure

### **Automated Monthly Cron**
- Vercel Cron or GitHub Actions
- Automatic attestation on 1st of month
- Email notifications
- Error handling & retries

### **TEE Integration**
- Run KPI computation in SGX/TrustZone
- Cryptographic proof of correct execution
- Minimize trust in platform

### **ZK Proofs**
- Prove KPIs are correct without revealing data
- Privacy-preserving verification
- Ultimate decentralization

---

## 🎯 **Immediate Action Items**

**Today:**
- [ ] Generate attestor key with `cast wallet new`
- [ ] Get Pinata API credentials
- [ ] Update `.env.local`
- [ ] Test `/api/attest` endpoint locally

**This Week:**
- [ ] Create 2-3 test attestations
- [ ] Verify signatures in UI
- [ ] Deploy to Vercel staging
- [ ] Test production endpoint

**Next Week:**
- [ ] Write AttestationRegistry smart contract
- [ ] Deploy to Base Sepolia
- [ ] Update API to post on-chain
- [ ] Update subgraph schema

---

## 📊 **Success Metrics**

**Week 2 (Attestation v1):**
- ✅ Can create attestations via API
- ✅ Attestations pinned to IPFS
- ✅ Signatures verify correctly
- ✅ Timeline displays attestations

**Week 3 (On-Chain Registry):**
- ✅ Attestations posted to smart contract
- ✅ Subgraph indexes attestation events
- ✅ UI queries attestations from subgraph

**Week 4 (Multi-Sig):**
- ✅ 2-of-3 attestors signing
- ✅ UI shows all signers
- ✅ Disputed attestations flagged

---

## 🆘 **Getting Help**

**Issues?**
- Check `ATTESTATION_README.md` for detailed docs
- Review `TESTING_WALKTHROUGH.md` for test flows
- Open issue on GitHub with logs

**Questions?**
- Is centralization blocking users? → Prioritize multi-sig
- Need faster iteration? → Stay with v1, gather feedback
- Investor concerns? → Add on-chain registry next

---

**Last Updated**: October 2, 2025
**Status**: Attestation v1 Complete ✅ | Ready for Testing 🧪
