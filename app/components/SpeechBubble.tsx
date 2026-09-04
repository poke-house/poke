import React from 'react';

interface SpeechBubbleProps {
  speakerName?: string;
  speakerEmoji?: string;
  speakerRole?: string;
  message: React.ReactNode;
  variant?: 'butter' | 'linen' | 'white';
  className?: string;
}

export const SpeechBubble: React.FC<SpeechBubbleProps> = ({
  speakerName,
  speakerEmoji = '👤',
  speakerRole,
  message,
  variant = 'butter',
  className = ''
}) => {
  const bgStyles = {
    butter: 'bg-brand-butter text-brand-charcoal border-brand-charcoal',
    linen: 'bg-brand-linen text-brand-charcoal border-brand-charcoal',
    white: 'bg-white text-brand-charcoal border-brand-charcoal'
  }[variant];

  const tailFill = {
    butter: '#F3E39F',
    linen: '#F5F6E6',
    white: '#FFFFFF'
  }[variant];

  return (
    <div className={`speech-bubble-container flex flex-col sm:flex-row items-start gap-3 w-full ${className}`}>
      {/* Speaker Avatar */}
      {(speakerEmoji || speakerName) && (
        <div className="flex sm:flex-col items-center gap-2 shrink-0">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full border-3 border-brand-charcoal bg-white flex items-center justify-center text-2xl sm:text-3xl shadow-[3px_3px_0px_0px_#080D09] shrink-0">
            <span role="img" aria-label={speakerName || "Cliente"}>
              {speakerEmoji}
            </span>
          </div>
          {speakerName && (
            <div className="text-left sm:text-center">
              <p className="text-xs font-display font-black text-brand-charcoal leading-tight truncate max-w-[120px]">
                {speakerName}
              </p>
              {speakerRole && (
                <p className="text-[9px] font-condensed font-black text-brand-charcoal/60 uppercase tracking-wider">
                  {speakerRole}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Bubble with Tail */}
      <div className="relative flex-1 min-w-0 w-full mt-1 sm:mt-0">
        {/* Left pointing tail for desktop (sm+) */}
        <div className="hidden sm:block absolute -left-[14px] top-4 w-4 h-5 overflow-visible pointer-events-none z-10">
          <svg width="15" height="18" viewBox="0 0 15 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 0 L0 9 L15 18 Z" fill={tailFill} stroke="#080D09" strokeWidth="3" strokeLinejoin="round" />
            <path d="M14 1.5 L1.5 9 L14 16.5 Z" fill={tailFill} />
          </svg>
        </div>

        {/* Top pointing tail for mobile */}
        <div className="sm:hidden absolute left-5 -top-[12px] w-5 h-3 overflow-visible pointer-events-none z-10">
          <svg width="18" height="13" viewBox="0 0 18 13" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 13 L9 0 L18 13 Z" fill={tailFill} stroke="#080D09" strokeWidth="3" strokeLinejoin="round" />
            <path d="M1.5 12 L9 1.5 L16.5 12 Z" fill={tailFill} />
          </svg>
        </div>

        {/* Bubble Body */}
        <div className={`border-3 rounded-card p-4 sm:p-5 shadow-[4px_4px_0px_0px_#080D09] relative ${bgStyles}`}>
          <div className="font-body font-bold text-sm sm:text-base leading-relaxed break-words">
            {message}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpeechBubble;
