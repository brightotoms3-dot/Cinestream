import React from 'react';
import { Star } from 'lucide-react';

interface RatingBadgeProps {
  rating: number;
  size?: 'sm' | 'md' | 'lg';
  showStar?: boolean;
}

export const RatingBadge: React.FC<RatingBadgeProps> = ({ rating, size = 'sm', showStar = true }) => {
  const formatted = rating > 0 ? rating.toFixed(1) : 'NR';

  const sizeClasses = {
    sm: 'text-[11px] px-1.5 py-0.5 gap-1',
    md: 'text-xs px-2 py-0.5 gap-1 font-semibold',
    lg: 'text-sm px-2.5 py-1 gap-1.5 font-bold',
  };

  return (
    <span
      className={`inline-flex items-center rounded-md bg-[#1C2535]/90 border border-[#273144] text-[#D6A85F] backdrop-blur-sm ${sizeClasses[size]}`}
    >
      {showStar && <Star className="w-3 h-3 fill-[#D6A85F] text-[#D6A85F]" />}
      <span>{formatted}</span>
    </span>
  );
};
