import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  totalReviews: number;
  size?: 'sm' | 'md';
}

export function StarRating({ rating, totalReviews, size = 'sm' }: StarRatingProps) {
  if (totalReviews === 0) return null;

  const starSize = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4';
  const textSize = size === 'sm' ? 'text-[11px]' : 'text-xs';

  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center gap-px">
        {[1, 2, 3, 4, 5].map((s) => {
          const fill = Math.min(1, Math.max(0, rating - (s - 1)));
          const isFull = fill >= 0.75;
          const isHalf = fill >= 0.25 && fill < 0.75;

          return (
            <div key={s} className="relative">
              {/* Empty star (background) */}
              <Star className={`${starSize} text-border-strong`} />
              {/* Filled star (foreground) */}
              {(isFull || isHalf) && (
                <div
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: isFull ? '100%' : '50%' }}
                >
                  <Star className={`${starSize} fill-amber-400 text-amber-400`} />
                </div>
              )}
            </div>
          );
        })}
      </div>
      <span className={`${textSize} font-medium text-text-faint`}>
        ({totalReviews})
      </span>
    </div>
  );
}
