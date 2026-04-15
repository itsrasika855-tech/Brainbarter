import { Star } from 'lucide-react';

const StarRating = ({ rating, onRate, interactive = false, size = 'md' }) => {
  const sizeMap = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onClick={() => interactive && onRate?.(star)}
          disabled={!interactive}
          className={`border-none bg-transparent p-0 transition-transform ${
            interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'
          }`}
        >
          <Star
            className={`${sizeMap[size]} transition-colors ${
              star <= rating
                ? 'text-amber-400 fill-amber-400'
                : 'text-slate-200 fill-slate-200'
            }`}
          />
        </button>
      ))}
    </div>
  );
};

export default StarRating;
