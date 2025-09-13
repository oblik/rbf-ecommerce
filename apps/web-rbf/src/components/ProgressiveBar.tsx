'use client';

export interface ProgressiveBarProps {
  rating: number; // 1-5
  size?: 'sm' | 'md';
}

export function ProgressiveBar({ rating, size = 'sm' }: ProgressiveBarProps) {
  const barCount = 5;
  const barWidth = size === 'sm' ? 'w-1.5' : 'w-2';
  const gapSize = size === 'sm' ? 'gap-0.5' : 'gap-1';
  
  return (
    <div className={`flex items-end ${gapSize}`}>
      {[...Array(barCount)].map((_, index) => {
        const barNumber = index + 1;
        const isActive = barNumber <= rating;
        
        return (
          <div
            key={index}
            className={`${barWidth} transition-colors duration-200 rounded-sm ${
              isActive 
                ? rating >= 4 ? 'bg-green-500' : rating >= 3 ? 'bg-sky-500' : 'bg-orange-500'
                : 'bg-gray-200'
            }`}
            style={{
              height: `${barNumber * (size === 'sm' ? 3 : 4)}px`
            }}
          />
        );
      })}
    </div>
  );
}