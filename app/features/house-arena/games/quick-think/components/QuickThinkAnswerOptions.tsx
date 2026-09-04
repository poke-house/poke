import React from 'react';
import { QuickThinkQuestionOption } from '../quickThink.types';
import { Check, X, Sparkles } from 'lucide-react';

interface QuickThinkAnswerOptionsProps {
  options: QuickThinkQuestionOption[];
  selectedOptionId: string | null;
  correctOptionId: string | null;
  isAnswered: boolean;
  submitting: boolean;
  language: 'pt' | 'en';
  onSelectOption: (optionId: string) => void;
}

export const QuickThinkAnswerOptions: React.FC<QuickThinkAnswerOptionsProps> = ({
  options,
  selectedOptionId,
  correctOptionId,
  isAnswered,
  submitting,
  language,
  onSelectOption
}) => {
  return (
    <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
      {options.map((option, idx) => {
        const isSelected = selectedOptionId === option.id;
        const isCorrectOption = correctOptionId === option.id;
        const isIncorrectSelection = isSelected && correctOptionId && correctOptionId !== option.id;

        // Visual states styling
        let borderClass = 'border-brand-charcoal hover:bg-brand-linen/40 hover:scale-[1.01] hover:shadow-[4px_4px_0px_0px_#080D09]';
        let bgClass = 'bg-white';
        let iconElement = null;

        if (isAnswered) {
          if (isCorrectOption) {
            borderClass = 'border-brand-green border-4';
            bgClass = 'bg-brand-green/10 text-brand-charcoal';
            iconElement = (
              <div className="w-6 h-6 rounded-full bg-brand-green border-2 border-brand-charcoal flex items-center justify-center text-white shrink-0">
                <Check size={12} strokeWidth={4} />
              </div>
            );
          } else if (isIncorrectSelection) {
            borderClass = 'border-brand-tomato border-4';
            bgClass = 'bg-brand-tomato/10 text-brand-charcoal';
            iconElement = (
              <div className="w-6 h-6 rounded-full bg-brand-tomato border-2 border-brand-charcoal flex items-center justify-center text-white shrink-0">
                <X size={12} strokeWidth={4} />
              </div>
            );
          } else {
            // Other options once answered
            borderClass = 'border-brand-charcoal/20 opacity-50 cursor-not-allowed';
            bgClass = 'bg-brand-linen/10';
          }
        } else {
          // Normal state before answering
          if (isSelected) {
            borderClass = 'border-brand-charcoal border-4';
            bgClass = 'bg-brand-butter';
          }
          if (submitting) {
            borderClass = 'border-brand-charcoal/20 opacity-50 cursor-not-allowed';
          }
        }

        const optionText = language === 'pt' ? option.text_pt : option.text_en;
        const alphabet = ['A', 'B', 'C', 'D'];

        return (
          <button
            key={option.id}
            disabled={isAnswered || submitting}
            onClick={() => onSelectOption(option.id)}
            className={`w-full p-4.5 rounded-card border-2 flex items-center justify-between gap-4 font-display font-black text-sm text-left shadow-soft cursor-pointer transition-all ${borderClass} ${bgClass}`}
          >
            <div className="flex items-center gap-3">
              {/* Option Index Label */}
              <div className="w-7 h-7 rounded-full border-2 border-brand-charcoal bg-brand-linen flex items-center justify-center text-xs font-mono font-black text-brand-charcoal">
                {alphabet[idx] || (idx + 1)}
              </div>
              <span className="leading-tight text-brand-charcoal font-semibold">{optionText}</span>
            </div>

            {/* Icon overlay for answer validation */}
            {iconElement}
          </button>
        );
      })}
    </div>
  );
};
export default QuickThinkAnswerOptions;
