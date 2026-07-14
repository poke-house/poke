import React from 'react';
import { CheckCircle2, AlertTriangle, Sparkles, AlertCircle } from 'lucide-react';

interface QuickThinkFeedbackProps {
  isAnswered: boolean;
  selectedOptionId: string | null;
  correctOptionId: string | null;
  explanationPt: string | null;
  explanationEn: string | null;
  timeLeft: number;
  language: 'pt' | 'en';
}

export const QuickThinkFeedback: React.FC<QuickThinkFeedbackProps> = ({
  isAnswered,
  selectedOptionId,
  correctOptionId,
  explanationPt,
  explanationEn,
  timeLeft,
  language
}) => {
  // If the user has not answered yet and time is still ticking, we show nothing
  if (!isAnswered && timeLeft > 0) return null;

  const isCorrect = selectedOptionId === correctOptionId;
  const isTimeUp = !isAnswered && timeLeft === 0;

  // Determine feedback theme
  let bannerBg = 'bg-brand-green/10 border-brand-green';
  let badgeColor = 'bg-brand-green text-white border-brand-green';
  let title = language === 'pt' ? 'Resposta Correta!' : 'Correct Answer!';
  let iconElement = <CheckCircle2 size={32} className="text-brand-green shrink-0" />;

  if (isTimeUp) {
    bannerBg = 'bg-brand-butter/30 border-brand-charcoal';
    badgeColor = 'bg-brand-butter text-brand-charcoal border-brand-charcoal';
    title = language === 'pt' ? 'Tempo Excedido!' : 'Time Expired!';
    iconElement = <AlertCircle size={32} className="text-brand-burgundy shrink-0" />;
  } else if (!isCorrect) {
    bannerBg = 'bg-brand-tomato/10 border-brand-tomato';
    badgeColor = 'bg-brand-tomato text-white border-brand-tomato';
    title = language === 'pt' ? 'Resposta Incorreta' : 'Incorrect Answer';
    iconElement = <AlertTriangle size={32} className="text-brand-tomato shrink-0" />;
  }

  const explanationText = language === 'pt' ? explanationPt : explanationEn;

  return (
    <div className={`w-full border-4 rounded-card p-5 md:p-6 shadow-elevated flex flex-col md:flex-row items-start gap-4 transition-all ${bannerBg}`}>
      {iconElement}
      <div className="space-y-2 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`font-condensed font-black text-xs border-2 px-3 py-1 rounded-pill uppercase tracking-wider ${badgeColor}`}>
            {title}
          </span>
          <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest font-bold">
            {language === 'pt' ? 'SOP REFORÇO' : 'SOP REINFORCEMENT'}
          </span>
        </div>

        {explanationText ? (
          <p className="font-body text-sm text-brand-charcoal leading-relaxed font-semibold">
            {explanationText}
          </p>
        ) : (
          <p className="font-body text-sm text-brand-charcoal/60 leading-relaxed italic">
            {language === 'pt'
              ? 'A guardar o início da próxima questão...'
              : 'Waiting for the next question to begin...'}
          </p>
        )}
      </div>
    </div>
  );
};
export default QuickThinkFeedback;
