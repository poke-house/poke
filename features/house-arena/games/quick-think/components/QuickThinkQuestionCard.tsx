import React from 'react';
import { HelpCircle, Sparkles } from 'lucide-react';

interface QuickThinkQuestionCardProps {
  questionPt: string;
  questionEn: string;
  category?: string | null;
  difficulty?: string | null;
  language: 'pt' | 'en';
}

export const QuickThinkQuestionCard: React.FC<QuickThinkQuestionCardProps> = ({
  questionPt,
  questionEn,
  category,
  difficulty,
  language
}) => {
  const activeQuestionText = language === 'pt' ? questionPt : questionEn;

  // Style helper for difficulty levels
  const getDifficultyStyles = (diff: string) => {
    switch (diff?.toLowerCase()) {
      case 'easy':
        return 'bg-brand-green/20 text-brand-charcoal border-brand-green';
      case 'medium':
        return 'bg-brand-butter text-brand-charcoal border-brand-charcoal';
      case 'hard':
        return 'bg-brand-tomato/20 text-brand-tomato border-brand-tomato';
      default:
        return 'bg-gray-100 text-gray-500 border-gray-300';
    }
  };

  return (
    <div className="w-full bg-white border-4 border-brand-charcoal rounded-card p-6 md:p-8 shadow-elevated relative overflow-hidden flex flex-col gap-4">
      {/* Background Decorative Accent */}
      <div className="absolute top-0 right-0 -mr-6 -mt-6 w-24 h-24 bg-brand-linen/30 rounded-full flex items-center justify-center border border-brand-charcoal/10">
        <Sparkles size={32} className="text-brand-charcoal/5" />
      </div>

      {/* Meta tags */}
      <div className="flex flex-wrap gap-2 z-10">
        {category && (
          <span className="font-condensed font-black text-[10px] text-brand-charcoal bg-brand-linen border-2 border-brand-charcoal px-2.5 py-1 rounded-pill uppercase tracking-wider">
            {category}
          </span>
        )}
        {difficulty && (
          <span className={`font-condensed font-black text-[10px] border-2 px-2.5 py-1 rounded-pill uppercase tracking-wider ${getDifficultyStyles(difficulty)}`}>
            {language === 'pt'
              ? (difficulty.toLowerCase() === 'easy' ? 'Fácil' : difficulty.toLowerCase() === 'medium' ? 'Médio' : 'Difícil')
              : difficulty
            }
          </span>
        )}
      </div>

      {/* Question Text */}
      <div className="flex items-start gap-3 md:gap-4 mt-2">
        <div className="w-10 h-10 md:w-12 md:h-12 bg-brand-linen border-2 border-brand-charcoal rounded-full flex items-center justify-center shrink-0 shadow-soft">
          <HelpCircle size={24} className="text-brand-charcoal animate-pulse" />
        </div>
        <h3 className="font-display font-black text-xl md:text-2xl text-brand-charcoal leading-tight">
          {activeQuestionText}
        </h3>
      </div>
    </div>
  );
};
export default QuickThinkQuestionCard;
