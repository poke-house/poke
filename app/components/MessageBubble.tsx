import React from 'react';

export const MessageBubble = ({ text, isTitle = false, className = "bg-white" }: { text: string; isTitle?: boolean; className?: string }) => {
    // Determine text color class. If className provides a text color, it will be used.
    // If not, we fallback to default logic.
    // However, Tailwind classes don't automatically override unless configured or using !important,
    // so we rely on the parent component passing the correct full class string if they want to change color.
    // The previous implementation had 'text-brand-dark' hardcoded in ternary. 
    // We will conditionally apply the default color only if no 'text-' class is present in className (simple check) 
    // or just assume the parent knows what they are doing by putting defaults last.
    
    // Better approach: allow default text color, but if parent passes a text color class, it should take precedence.
    // We will use a standard default variable.
    
    const defaultTextColor = isTitle ? 'text-pastel-blue-500 font-bold' : 'text-brand-dark';
    
    return (
        <div className={`font-sans text-lg leading-relaxed p-6 rounded-win shadow-fluent border border-gray-200 animate-slide-up max-w-lg mx-auto ${defaultTextColor} ${className}`}>
            {text}
        </div>
    );
};