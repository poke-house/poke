import React from 'react';
import { motion } from 'motion/react';
import { Clock } from 'lucide-react';

interface QuickThinkProgressProps {
  timeLeft: number;
  totalTime?: number; // defaults to 20s
  language: 'pt' | 'en';
}

export const QuickThinkProgress: React.FC<QuickThinkProgressProps> = ({
  timeLeft,
  totalTime = 20,
  language
}) => {
  const percentage = Math.min(100, Math.max(0, (timeLeft / totalTime) * 100));

  // Determine indicator color based on time remaining
  let barColor = 'bg-brand-green';
  let textColor = 'text-brand-green';
  
  if (timeLeft <= 5) {
    barColor = 'bg-brand-tomato animate-pulse';
    textColor = 'text-brand-tomato animate-pulse font-black';
  } else if (timeLeft <= 10) {
    barColor = 'bg-brand-butter';
    textColor = 'text-brand-burgundy font-bold';
  }

  return (
    <div className="w-full bg-white border-4 border-brand-charcoal rounded-card p-4 shadow-elevated flex flex-col gap-2">
      <div className="flex justify-between items-center">
        <span className="font-mono text-[10px] text-gray-500 uppercase tracking-widest flex items-center gap-1.5 font-bold">
          <Clock size={12} />
          {language === 'pt' ? 'Tempo para responder' : 'Time to answer'}
        </span>
        <span className={`font-mono text-lg md:text-xl font-bold tabular-nums ${textColor}`}>
          {timeLeft}s
        </span>
      </div>

      {/* Progress Track */}
      <div className="w-full h-4 bg-brand-linen border-2 border-brand-charcoal rounded-full overflow-hidden p-0.5">
        <motion.div
          initial={{ width: '100%' }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className={`h-full rounded-full border border-brand-charcoal ${barColor}`}
        />
      </div>
    </div>
  );
};
export default QuickThinkProgress;
