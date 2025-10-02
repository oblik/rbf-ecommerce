'use client';

import { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits, formatUnits, type Address } from 'viem';

interface OwnerSettlementPanelProps {
  campaignAddress: Address;
  ownerAddress: Address;
  revenueSharePercent: number; // Basis points (e.g., 500 = 5%)
  repaymentCap: number; // Basis points (e.g., 15000 = 1.5x)
  totalRepaid: bigint;
  fundingGoal: bigint;
  lastRevenueReport: number; // Unix timestamp
  campaignAbi: any;
}

export function OwnerSettlementPanel({
  campaignAddress,
  ownerAddress,
  revenueSharePercent,
  repaymentCap,
  totalRepaid,
  fundingGoal,
  lastRevenueReport,
  campaignAbi
}: OwnerSettlementPanelProps) {
  const { address } = useAccount();
  const [revenueAmount, setRevenueAmount] = useState('');
  const [calculating, setCalculating] = useState(false);
  const [calculatedShare, setCalculatedShare] = useState<bigint | null>(null);

  const { writeContract, data: hash, isPending, isError, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  // Check if connected wallet is owner
  const isOwner = address?.toLowerCase() === ownerAddress.toLowerCase();

  // Check if 30 days have passed since last report
  const now = Math.floor(Date.now() / 1000);
  const daysSinceLastReport = (now - lastRevenueReport) / (24 * 60 * 60);
  const canReport = daysSinceLastReport >= 30;

  // Calculate max repayment
  const maxRepayment = (fundingGoal * BigInt(repaymentCap)) / 10000n;
  const remainingCap = maxRepayment - totalRepaid;
  const isRepaymentComplete = totalRepaid >= maxRepayment;

  const handleCalculate = () => {
    if (!revenueAmount || isNaN(parseFloat(revenueAmount))) {
      alert('Please enter a valid revenue amount');
      return;
    }

    setCalculating(true);

    try {
      const revenueBigInt = parseUnits(revenueAmount, 6); // USDC has 6 decimals
      const shareAmount = (revenueBigInt * BigInt(revenueSharePercent)) / 10000n;

      // Cap at remaining repayment
      const finalShare = shareAmount > remainingCap ? remainingCap : shareAmount;

      setCalculatedShare(finalShare);
    } catch (err) {
      console.error('Calculation error:', err);
      alert('Error calculating share amount');
    } finally {
      setCalculating(false);
    }
  };

  const handleSubmit = async () => {
    if (!calculatedShare) {
      alert('Please calculate the share amount first');
      return;
    }

    try {
      const revenueBigInt = parseUnits(revenueAmount, 6);

      writeContract({
        address: campaignAddress,
        abi: campaignAbi,
        functionName: 'submitRevenueShare',
        args: [revenueBigInt]
      });
    } catch (err) {
      console.error('Submit error:', err);
    }
  };

  if (!isOwner) {
    return null; // Only show to owner
  }

  if (isRepaymentComplete) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-6">
        <div className="flex items-center gap-3">
          <span className="text-3xl">✅</span>
          <div>
            <h3 className="font-semibold text-green-900">Repayment Complete!</h3>
            <p className="text-sm text-green-700 mt-1">
              You've reached the repayment cap of ${formatUnits(maxRepayment, 6)}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-sky-50 border border-sky-200 rounded-xl p-6 space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-2xl">👤</span>
        <h3 className="font-semibold text-sky-900">Owner Panel: Submit Revenue Settlement</h3>
      </div>

      {!canReport && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-sm text-yellow-800">
            ⏰ Next settlement available in {Math.ceil(30 - daysSinceLastReport)} days (30-day minimum between reports)
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
        <div>
          <span className="text-gray-600">Revenue Share:</span>
          <span className="ml-2 font-semibold">{revenueSharePercent / 100}%</span>
        </div>
        <div>
          <span className="text-gray-600">Total Repaid:</span>
          <span className="ml-2 font-semibold">${formatUnits(totalRepaid, 6)}</span>
        </div>
        <div>
          <span className="text-gray-600">Remaining Cap:</span>
          <span className="ml-2 font-semibold">${formatUnits(remainingCap, 6)}</span>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Reported Revenue (This Period)
          </label>
          <input
            type="number"
            value={revenueAmount}
            onChange={(e) => setRevenueAmount(e.target.value)}
            placeholder="e.g., 50000"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
            disabled={!canReport}
          />
          <p className="text-xs text-gray-500 mt-1">
            Enter the total revenue for this period (in USD)
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleCalculate}
            disabled={!revenueAmount || !canReport || calculating}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm"
          >
            {calculating ? 'Calculating...' : 'Calculate Owed'}
          </button>

          {calculatedShare !== null && (
            <button
              onClick={handleSubmit}
              disabled={!canReport || isPending || isConfirming}
              className="flex-1 px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm font-medium"
            >
              {isPending ? 'Confirm in Wallet...' : isConfirming ? 'Submitting...' : `Submit Settlement: $${formatUnits(calculatedShare, 6)}`}
            </button>
          )}
        </div>

        {calculatedShare !== null && (
          <div className="bg-white border border-sky-300 rounded-lg p-3">
            <p className="text-sm">
              <span className="text-gray-700">Revenue:</span>{' '}
              <span className="font-semibold">${revenueAmount}</span>
            </p>
            <p className="text-sm">
              <span className="text-gray-700">Your Share ({revenueSharePercent / 100}%):</span>{' '}
              <span className="font-semibold text-sky-700">${formatUnits(calculatedShare, 6)}</span>
            </p>
            {calculatedShare !== (parseUnits(revenueAmount, 6) * BigInt(revenueSharePercent)) / 10000n && (
              <p className="text-xs text-yellow-700 mt-1">
                ⚠️ Capped at remaining repayment limit
              </p>
            )}
          </div>
        )}

        {isSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-sm text-green-800">
              ✅ Settlement submitted successfully!
            </p>
            <a
              href={`${process.env.NEXT_PUBLIC_EXPLORER_URL || 'https://sepolia.basescan.org'}/tx/${hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-sky-600 hover:underline mt-1 inline-block"
            >
              View transaction →
            </a>
          </div>
        )}

        {isError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-800">
              ❌ Error: {error?.message || 'Transaction failed'}
            </p>
          </div>
        )}
      </div>

      <div className="text-xs text-gray-600 bg-gray-50 rounded-lg p-3">
        <p className="font-medium mb-1">How it works:</p>
        <ol className="list-decimal list-inside space-y-1">
          <li>Enter your total revenue for this period</li>
          <li>Click "Calculate Owed" to see the {revenueSharePercent / 100}% share</li>
          <li>Approve USDC allowance for the campaign contract (if needed)</li>
          <li>Click "Submit Settlement" to distribute to investors</li>
        </ol>
      </div>
    </div>
  );
}
