import React from 'react';
import { TranslationKey } from '../../../translations';

interface UniversityProgressProps {
    recipeName: string;
    uniCurrentStep: number;
    totalSteps: number;
    borderClass: string;
    t: (key: TranslationKey, params?: Record<string, string | number>) => string;
}

export function UniversityProgress({
    recipeName,
    uniCurrentStep,
    totalSteps,
    borderClass,
    t
}: UniversityProgressProps) {
    const percentage = totalSteps > 0 ? ((uniCurrentStep + 1) / totalSteps) * 100 : 0;

    return (
        <div className={`p-4 md:p-6 border-b ${borderClass} bg-white/50 flex flex-col items-center justify-center shrink-0 z-20`}>
             <span className="text-xl md:text-2xl font-bold uppercase tracking-tight text-brand-dark">
                 {recipeName}
             </span>
             <div className="w-full max-w-md bg-gray-200 h-1.5 mt-4 rounded-full overflow-hidden">
                <div 
                    className="bg-brand-blue h-full transition-all duration-500" 
                    style={{ width: `${percentage}%` }}
                ></div>
             </div>
             <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-2">
                 {t('uni_step_progress', { current: uniCurrentStep + 1, total: totalSteps })}
             </div>
        </div>
    );
}
