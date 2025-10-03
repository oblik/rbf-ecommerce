'use client';

import { formatDistanceToNow } from 'date-fns';
import { formatUnits } from 'viem';
import { AttestationTimelineItem } from './AttestationTimelineItem';

interface TimelineEvent {
  type: 'goal_reached' | 'settlement' | 'withdrawal' | 'completed' | 'attestation';
  timestamp: number; // Unix timestamp
  amount?: bigint;
  address?: string;
  txHash?: string;
  // Attestation-specific fields
  attestation?: {
    month: string;
    payloadCid: string;
    signer: `0x${string}`;
    signature: `0x${string}`;
    hash: `0x${string}`;
    netRevenue: string;
  };
}

interface RepaymentTimelineProps {
  events: TimelineEvent[];
  totalRepaid: bigint;
  repaymentCap: bigint;
  fundingGoal: bigint;
}

export function RepaymentTimeline({
  events,
  totalRepaid,
  repaymentCap,
  fundingGoal
}: RepaymentTimelineProps) {
  // Calculate max repayment
  const maxRepayment = (fundingGoal * repaymentCap) / 10000n;
  const progressPercent = Number((totalRepaid * 10000n) / maxRepayment) / 100;

  // Sort events by timestamp (newest first)
  const sortedEvents = [...events].sort((a, b) => b.timestamp - a.timestamp);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Repayment Progress</h3>
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-gray-600">Total Repaid</span>
          <span className="font-semibold">
            ${formatUnits(totalRepaid, 6)} / ${formatUnits(maxRepayment, 6)}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className="bg-green-500 h-full transition-all duration-500"
            style={{ width: `${Math.min(progressPercent, 100)}%` }}
          />
        </div>
        <div className="text-xs text-gray-500 mt-1 text-right">
          {progressPercent.toFixed(1)}% of cap reached
        </div>
      </div>

      <div>
        <h4 className="font-medium text-gray-900 mb-4">Timeline</h4>
        {sortedEvents.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-4">
            No repayment activity yet
          </p>
        ) : (
          <div className="space-y-4">
            {sortedEvents.map((event, idx) => (
              <TimelineItem key={idx} event={event} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TimelineItem({ event }: { event: TimelineEvent }) {
  // Handle attestation events separately
  if (event.type === 'attestation' && event.attestation) {
    return (
      <AttestationTimelineItem
        month={event.attestation.month}
        payloadCid={event.attestation.payloadCid}
        signer={event.attestation.signer}
        signature={event.attestation.signature}
        hash={event.attestation.hash}
        netRevenue={event.attestation.netRevenue}
      />
    );
  }

  const timeAgo = formatDistanceToNow(event.timestamp * 1000, { addSuffix: true });

  const iconBg = {
    goal_reached: 'bg-blue-100',
    settlement: 'bg-green-100',
    withdrawal: 'bg-purple-100',
    completed: 'bg-yellow-100'
  }[event.type];

  const iconColor = {
    goal_reached: 'text-blue-600',
    settlement: 'text-green-600',
    withdrawal: 'text-purple-600',
    completed: 'text-yellow-600'
  }[event.type];

  const icon = {
    goal_reached: '🎯',
    settlement: '💰',
    withdrawal: '🏦',
    completed: '✅'
  }[event.type];

  const title = {
    goal_reached: 'Funding Goal Reached',
    settlement: 'Revenue Settlement Posted',
    withdrawal: 'Investor Withdrawal',
    completed: 'Repayment Completed'
  }[event.type];

  return (
    <div className="flex gap-3">
      <div className={`flex-shrink-0 w-10 h-10 rounded-full ${iconBg} ${iconColor} flex items-center justify-center text-lg`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-medium text-gray-900">{title}</p>
            {event.amount && (
              <p className="text-sm text-gray-600 mt-1">
                Amount: ${formatUnits(event.amount, 6)}
              </p>
            )}
            {event.address && (
              <p className="text-xs text-gray-500 mt-1 font-mono">
                {event.address.slice(0, 6)}...{event.address.slice(-4)}
              </p>
            )}
          </div>
          <span className="text-xs text-gray-500 whitespace-nowrap">
            {timeAgo}
          </span>
        </div>
        {event.txHash && (
          <a
            href={`${process.env.NEXT_PUBLIC_EXPLORER_URL || 'https://sepolia.basescan.org'}/tx/${event.txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-sky-600 hover:text-sky-800 mt-1 inline-block"
          >
            View transaction →
          </a>
        )}
      </div>
    </div>
  );
}
