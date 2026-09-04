import React from 'react';
import { ShieldAlert, HelpCircle } from 'lucide-react';

interface QuickThinkLateJoinNoticeProps {
  language: 'pt' | 'en';
}

export const QuickThinkLateJoinNotice: React.FC<QuickThinkLateJoinNoticeProps> = ({ language }) => {
  return (
    <div className="w-full bg-brand-butter/10 border-4 border-brand-charcoal rounded-card p-5 shadow-elevated flex gap-4 items-start">
      <ShieldAlert className="text-brand-burgundy shrink-0 animate-pulse" size={28} />
      <div className="space-y-1.5">
        <h4 className="font-display font-black text-sm text-brand-charcoal uppercase tracking-tight">
          {language === 'pt' ? 'Entraste a meio da ronda!' : 'Joined Mid-Round!'}
        </h4>
        <p className="font-body text-xs text-brand-burgundy leading-relaxed font-semibold">
          {language === 'pt'
            ? 'Esta ronda do Pensa Rápido já começou. Entraste diretamente na questão ativa atual. As perguntas anteriores contarão com 0 pontos.'
            : 'This round of Fast Thinker is already in progress. You joined directly at the current active question. Previous unplayed questions are graded with 0 points.'}
        </p>
      </div>
    </div>
  );
};
export default QuickThinkLateJoinNotice;
