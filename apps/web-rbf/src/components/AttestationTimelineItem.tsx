'use client';

import { useState } from 'react';
import { verifyAttestationSignature } from '@/lib/attestation/verify';
import type { Hash } from 'viem';

interface AttestationTimelineItemProps {
  month: string; // 'YYYY-MM'
  payloadCid: string;
  signer: `0x${string}`;
  signature: Hash;
  hash: Hash;
  netRevenue: string;
}

export function AttestationTimelineItem({
  month,
  payloadCid,
  signer,
  signature,
  hash,
  netRevenue
}: AttestationTimelineItemProps) {
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState<boolean | null>(null);

  // Allowlist of trusted attestor addresses
  const ALLOWED_SIGNERS: `0x${string}`[] = [
    process.env.NEXT_PUBLIC_ATTESTOR_ADDRESS as `0x${string}`
  ].filter(Boolean);

  const handleVerify = async () => {
    setVerifying(true);
    try {
      const result = await verifyAttestationSignature(hash, signature, signer, ALLOWED_SIGNERS);
      setVerified(result.valid);
    } catch (err) {
      console.error('Verification failed:', err);
      setVerified(false);
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="flex gap-3 border-l-4 border-green-400 pl-4 py-3">
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-lg">
        📜
      </div>
      <div className="flex-1">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-medium text-gray-900">Monthly Attestation</p>
            <p className="text-sm text-gray-600 mt-1">
              {new Date(month + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </p>
            <p className="text-sm text-gray-700 mt-1">
              Net Revenue: <span className="font-semibold">{netRevenue}</span>
            </p>
          </div>
          {verified !== null && (
            <span className={`px-2 py-1 text-xs rounded-full ${
              verified ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {verified ? '✓ Verified' : '✗ Invalid'}
            </span>
          )}
        </div>

        <div className="mt-2 space-y-1">
          <a
            href={`https://ipfs.io/ipfs/${payloadCid}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-sky-600 hover:underline block"
          >
            View on IPFS →
          </a>

          <button
            onClick={handleVerify}
            disabled={verifying || verified !== null}
            className="text-xs text-gray-600 hover:text-gray-900 disabled:text-gray-400"
          >
            {verifying ? 'Verifying...' : verified !== null ? 'Verified' : 'Verify Signature'}
          </button>

          <details className="text-xs text-gray-500 mt-2">
            <summary className="cursor-pointer hover:text-gray-700">Technical Details</summary>
            <div className="mt-2 space-y-1 font-mono text-[10px] bg-gray-50 p-2 rounded">
              <p>CID: {payloadCid}</p>
              <p>Hash: {hash.slice(0, 10)}...{hash.slice(-8)}</p>
              <p>Signer: {signer.slice(0, 6)}...{signer.slice(-4)}</p>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}
