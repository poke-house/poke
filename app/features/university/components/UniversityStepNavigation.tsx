import React from 'react';
import { TranslationKey } from '../../../translations';
import { IconHome, IconArrowLeft, IconArrowRight } from '../../../components/Icons';

interface UniversityStepNavigationProps {
    uniCurrentStep: number;
    totalSteps: number;
    handleUniPrev: () => void;
    handleUniNext: () => void;
    resetToHome: () => void;
    t: (key: TranslationKey, params?: Record<string, string | number>) => string;
}

export function UniversityStepNavigation({
    uniCurrentStep,
    totalSteps,
    handleUniPrev,
    handleUniNext,
    resetToHome,
    t
}: UniversityStepNavigationProps) {
    const isLastStep = uniCurrentStep === totalSteps - 1;

    return (
        <div className="p-4 md:p-6 bg-white/80 border-t border-gray-100 flex items-center justify-between gap-4 shrink-0 z-20">
            <button 
                onClick={resetToHome} 
                className="p-3 text-gray-400 hover:text-brand-pink transition-colors"
                title={t('btn_home_tooltip')}
            >
                <IconHome size={24}/>
            </button>
            <div className="flex items-center gap-4 flex-1 justify-end">
                <button 
                    onClick={handleUniPrev} 
                    disabled={uniCurrentStep === 0} 
                    className="p-3 md:p-4 rounded-win bg-gray-100 text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-200 transition-all font-bold shadow-sm"
                >
                    <IconArrowLeft size={24} />
                </button>
                <button 
                    onClick={handleUniNext} 
                    className={`px-6 py-3 md:px-8 md:py-4 rounded-win bg-brand-blue text-white font-bold shadow-md hover:bg-blue-600 transition-all flex items-center gap-2 transform active:scale-95 ${
                        isLastStep ? 'bg-green-500 hover:bg-green-600' : ''
                    }`}
                >
                    {isLastStep ? (
                        <span>{t('btn_continue')}</span>
                    ) : (
                        <IconArrowRight size={24} />
                    )}
                </button>
            </div>
        </div>
    );
}
