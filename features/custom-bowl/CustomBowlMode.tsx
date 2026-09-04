import React, { useEffect, useState, useRef } from 'react';
import { useCustomBowl } from './useCustomBowl';
import { calculateCustomBowlPrice, CUSTOM_STEPS } from './customBowl.utils';
import { INGREDIENTS_DB } from '../../constants';
import { IconArrowLeft, IconArrowRight, IconHome, IconCheck, IconX, IconBowl } from '../../components/Icons';
import { PopupModal } from '../../components/Modals';
import { MessageBubble } from '../../components/MessageBubble';
import { Language } from '../../types';

interface CustomBowlModeProps {
    gameState: string;
    setGameState: (state: any) => void;
    resetToHome: () => void;
    t: (key: any, params?: any) => string;
    language: Language;
}

export function CustomBowlMode({
    gameState,
    setGameState,
    resetToHome,
    t,
    language
}: CustomBowlModeProps) {
    const {
        customPhase,
        paPersona,
        currentSelections,
        allSelections,
        resultMessage,
        showPopup,
        setShowPopup,
        startCustomBowl,
        handleCustomSize,
        handleCustomDining,
        handleCustomSesame,
        handleCustomNext,
        handleCustomBack,
        finishCustomBowl,
        handleCustomSelection,
        checkStepComplete
    } = useCustomBowl();

    const [showExitConfirm, setShowExitConfirm] = useState(false);
    const exitModalRef = useRef<HTMLDivElement>(null);

    // Focus trapping and Escape key support for exit modal (Accessibility)
    useEffect(() => {
        if (!showExitConfirm) return;

        const modalElement = exitModalRef.current;
        if (!modalElement) return;

        // Save previous active element to restore later
        const previousActiveElement = document.activeElement as HTMLElement;

        // Query all focusable elements inside the modal
        const focusableSelector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
        const focusableElements = modalElement.querySelectorAll(focusableSelector);
        const firstFocusable = focusableElements[0] as HTMLElement;
        const lastFocusable = focusableElements[focusableElements.length - 1] as HTMLElement;

        // Set initial focus to the first interactive button
        if (firstFocusable) {
            firstFocusable.focus();
        }

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setShowExitConfirm(false);
                return;
            }

            if (e.key === 'Tab') {
                if (e.shiftKey) {
                    if (document.activeElement === firstFocusable) {
                        lastFocusable?.focus();
                        e.preventDefault();
                    }
                } else {
                    if (document.activeElement === lastFocusable) {
                        firstFocusable?.focus();
                        e.preventDefault();
                    }
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            if (previousActiveElement && typeof previousActiveElement.focus === 'function') {
                previousActiveElement.focus();
            }
        };
    }, [showExitConfirm]);

    useEffect(() => {
        startCustomBowl();
    }, []);

    // Price calculation
    const priceDetails = calculateCustomBowlPrice(allSelections, currentSelections, customPhase);

    const size = (allSelections['size'] as string) || "Regular";

    const getPhaseName = (phase: number): string => {
        if (phase === 2) return t('phase_dining');
        if (phase === 3) return t('phase_size');
        if (phase === 4) return t('phase_base');
        if (phase === 5) return t('phase_greens');
        if (phase === 6) return t('phase_protein');
        if (phase === 7) return t('phase_sauce_final');
        if (phase === 8) return t('phase_crispy');
        if (phase === 9) return t('phase_sesame');
        if (phase === 10) return t('custom_bowl_review_order');
        return "";
    };

    const handleExitClick = () => {
        if (customPhase > 1 && customPhase < 11) {
            setShowExitConfirm(true);
        } else {
            resetToHome();
        }
    };

    const handleBackClick = () => {
        handleCustomBack(handleExitClick);
    };

    const renderGreenSection = (title: string, items: string[]) => (
        <div className="mb-6 last:mb-0" id={`green-section-${title.toLowerCase().replace(/\s+/g, '-')}`}>
            <h4 className="text-brand-charcoal font-bold text-xs mb-3 px-1 uppercase tracking-wider opacity-70 border-b border-brand-charcoal/10 pb-1">
                {title}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {items.map(ing => {
                    const count = currentSelections.filter(i => i === ing).length;
                    const isSelected = currentSelections.includes(ing);
                    const isAbacate = ing === "Abacate" || ing === "Guacamole";
                    const isOtherPremium = ["Philadelphia", "Wakame", "Manga"].includes(ing);
                    
                    return (
                        <button
                            key={ing}
                            id={`btn-ing-${ing.toLowerCase().replace(/\s+/g, '-')}`}
                            onClick={() => handleCustomSelection(ing, 'green', t)}
                            className={`group relative p-4 rounded-button border-2 text-left transition-all flex items-center justify-between cursor-pointer ${
                                isSelected
                                    ? "bg-brand-butter border-brand-charcoal text-brand-charcoal shadow-[2px_2px_0px_0px_#080D09]"
                                    : "bg-white border-brand-charcoal/15 text-brand-charcoal hover:border-brand-charcoal/40 hover:bg-brand-linen"
                            }`}
                        >
                            <div className="flex flex-col">
                                <span className="font-body font-bold text-sm leading-tight">{ing}</span>
                                {(isAbacate || isOtherPremium) && (
                                    <span className="text-[10px] font-mono text-brand-burgundy/80 mt-0.5">
                                        Premium (+{isAbacate ? "1.00" : "0.30"}€)
                                    </span>
                                )}
                            </div>
                            {isSelected && (
                                <div className="bg-brand-charcoal text-brand-butter w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 shadow-sm animate-scale-in">
                                    {count > 0 ? count : <IconCheck size={14} />}
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );

    const renderCustomBowlContent = () => {
        switch (customPhase) {
            case 1:
                return (
                    <div className="flex flex-col items-center justify-center h-full min-h-[400px] p-8 text-center space-y-8 animate-fade-in" id="cb-step-1">
                        <div className="w-24 h-24 bg-brand-sorbet border-4 border-brand-charcoal rounded-full flex items-center justify-center text-5xl shadow-[4px_4px_0px_0px_#080D09] animate-bounce">
                            {paPersona.emoji}
                        </div>
                        <div className="max-w-md">
                            <h3 className="font-display font-black text-2xl text-brand-charcoal mb-2 leading-tight">
                                {paPersona.name}
                            </h3>
                            <MessageBubble className="bg-white border-2 border-brand-charcoal text-brand-charcoal shadow-[4px_4px_0px_0px_#080D09]" text={t('cb_intro', { name: paPersona.name })} />
                        </div>
                        <button
                            id="btn-cb-start"
                            onClick={handleCustomNext}
                            className="bg-brand-sorbet text-brand-charcoal px-8 py-3.5 rounded-button border-2 border-brand-charcoal font-display font-bold text-lg shadow-[4px_4px_0px_0px_#080D09] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#080D09] active:scale-95 transition-all cursor-pointer"
                        >
                            {t('cb_intro_btn')}
                        </button>
                    </div>
                );
            case 2:
                return (
                    <div className="flex flex-col items-center justify-center h-full min-h-[350px] p-6 text-center space-y-8 animate-fade-in" id="cb-step-2">
                        <div className="max-w-md w-full">
                            <h3 className="font-display font-bold text-lg text-brand-charcoal mb-4 uppercase tracking-wider opacity-60">
                                {t('phase_dining')}
                            </h3>
                            <MessageBubble className="bg-white border-2 border-brand-charcoal text-brand-charcoal shadow-[4px_4px_0px_0px_#080D09] text-base" text={t('cb_here_togo')} />
                        </div>
                        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm">
                            <button
                                id="btn-cb-here"
                                onClick={() => handleCustomDining("Eat In")}
                                className="flex-1 bg-white text-brand-charcoal p-4 rounded-button border-2 border-brand-charcoal font-display font-bold text-lg shadow-[4px_4px_0px_0px_#080D09] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#080D09] active:scale-95 transition-all cursor-pointer"
                            >
                                {t('cb_btn_here')}
                            </button>
                            <button
                                id="btn-cb-togo"
                                onClick={() => setShowPopup({
                                    msg: t('cb_togo_confirm'),
                                    callback: () => {
                                        setShowPopup(null);
                                        handleCustomDining("Takeaway");
                                    }
                                })}
                                className="flex-1 bg-brand-butter text-brand-charcoal p-4 rounded-button border-2 border-brand-charcoal font-display font-bold text-lg shadow-[4px_4px_0px_0px_#080D09] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#080D09] active:scale-95 transition-all cursor-pointer"
                            >
                                {t('cb_btn_togo')}
                            </button>
                        </div>
                    </div>
                );
            case 3:
                return (
                    <div className="flex flex-col items-center justify-center h-full min-h-[350px] p-6 text-center space-y-8 animate-fade-in" id="cb-step-3">
                        <div className="max-w-md w-full">
                            <h3 className="font-display font-bold text-lg text-brand-charcoal mb-4 uppercase tracking-wider opacity-60">
                                {t('phase_size')}
                            </h3>
                            <MessageBubble className="bg-white border-2 border-brand-charcoal text-brand-charcoal shadow-[4px_4px_0px_0px_#080D09] text-base" text={t('cb_size_q')} />
                        </div>
                        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm">
                            <button
                                id="btn-cb-size-large"
                                onClick={() => handleCustomSize("Large")}
                                className="flex-1 bg-brand-sorbet text-brand-charcoal p-5 rounded-button border-2 border-brand-charcoal font-display font-black text-xl shadow-[4px_4px_0px_0px_#080D09] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#080D09] active:scale-95 transition-all cursor-pointer flex flex-col items-center"
                            >
                                <span className="text-xl">LARGE</span>
                                <span className="text-xs font-mono font-bold mt-1 opacity-70">12.90€ Base</span>
                            </button>
                            <button
                                id="btn-cb-size-regular"
                                onClick={() => handleCustomSize("Regular")}
                                className="flex-1 bg-white text-brand-charcoal p-5 rounded-button border-2 border-brand-charcoal font-display font-black text-xl shadow-[4px_4px_0px_0px_#080D09] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#080D09] active:scale-95 transition-all cursor-pointer flex flex-col items-center"
                            >
                                <span className="text-xl">REGULAR</span>
                                <span className="text-xs font-mono font-bold mt-1 opacity-70">9.90€ Base</span>
                            </button>
                        </div>
                    </div>
                );
            case 4: {
                const sizeForBases = (allSelections['size'] as string) || "Regular";
                const filteredBases = INGREDIENTS_DB.bases.filter(b => {
                    if (b.includes("Arroz de sushi")) {
                        if (sizeForBases === "Regular" && b === "180g Arroz de sushi") return true;
                        if (sizeForBases === "Large" && b === "270g Arroz de sushi") return true;
                        return false;
                    }
                    return true;
                });
                return (
                    <div className="flex flex-col h-full animate-fade-in" id="cb-step-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                            {filteredBases.map(ing => {
                                const isSelected = currentSelections.includes(ing);
                                return (
                                    <button
                                        key={ing}
                                        id={`btn-ing-${ing.toLowerCase().replace(/\s+/g, '-')}`}
                                        onClick={() => handleCustomSelection(ing, 'base', t)}
                                        className={`group p-4 rounded-button border-2 text-left transition-all flex items-center justify-between cursor-pointer ${
                                            isSelected
                                                ? "bg-brand-butter border-brand-charcoal text-brand-charcoal shadow-[2px_2px_0px_0px_#080D09]"
                                                : "bg-white border-brand-charcoal/15 text-brand-charcoal hover:border-brand-charcoal/40 hover:bg-brand-linen"
                                        }`}
                                    >
                                        <span className="font-body font-bold text-sm leading-tight">
                                            {ing.includes("Arroz de sushi") ? "Arroz de sushi" : ing}
                                        </span>
                                        {isSelected && (
                                            <div className="bg-brand-charcoal text-brand-butter w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 shadow-sm animate-scale-in">
                                                <IconCheck size={14} />
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                );
            }
            case 5:
                return (
                    <div className="flex flex-col h-full animate-fade-in" id="cb-step-5">
                        {renderGreenSection(t('sec_naturals'), ["Hummus", "Abacaxi", "Edamame", "Tomate Cherry", "Couve roxa", "Courgette", "Cenoura", "Grana Padano", "Pepino", "Feta", "Azeitonas", "Cebola Roxa", "Morangos"])}
                        {renderGreenSection(t('sec_cooked'), ["Batata Doce com Alecrim", "Brócolis", "Milho", "Espargos Grelhados"])}
                        {renderGreenSection(t('sec_premium'), ["Abacate", "Guacamole", "Philadelphia", "Wakame", "Manga"])}
                    </div>
                );
            case 6:
                return (
                    <div className="flex flex-col h-full animate-fade-in" id="cb-step-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                            {INGREDIENTS_DB.proteins.filter(p => p !== "Wakame").map(ing => {
                                const isSelected = currentSelections.includes(ing);
                                const isExpensive = ing === "Salmão Braseado" || ing === "Miso Glazed Salmon";
                                return (
                                    <button
                                        key={ing}
                                        id={`btn-ing-${ing.toLowerCase().replace(/\s+/g, '-')}`}
                                        onClick={() => handleCustomSelection(ing, 'protein', t)}
                                        className={`group p-4 rounded-button border-2 text-left transition-all flex items-center justify-between cursor-pointer ${
                                            isSelected
                                                ? "bg-brand-butter border-brand-charcoal text-brand-charcoal shadow-[2px_2px_0px_0px_#080D09]"
                                                : "bg-white border-brand-charcoal/15 text-brand-charcoal hover:border-brand-charcoal/40 hover:bg-brand-linen"
                                        }`}
                                    >
                                        <div className="flex flex-col">
                                            <span className="font-body font-bold text-sm leading-tight">{ing}</span>
                                            {isExpensive && (
                                                <span className="text-[10px] font-mono text-brand-burgundy/80 mt-0.5">
                                                    Premium (+0.50€)
                                                </span>
                                            )}
                                        </div>
                                        {isSelected && (
                                            <div className="bg-brand-charcoal text-brand-butter w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 shadow-sm animate-scale-in">
                                                <IconCheck size={14} />
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                );
            case 7:
                return (
                    <div className="flex flex-col h-full animate-fade-in" id="cb-step-7">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                            {INGREDIENTS_DB.sauces_final.map(ing => {
                                const isSelected = currentSelections.includes(ing);
                                const isAvo = ing === "Creme de Abacate";
                                return (
                                    <button
                                        key={ing}
                                        id={`btn-ing-${ing.toLowerCase().replace(/\s+/g, '-')}`}
                                        onClick={() => handleCustomSelection(ing, 'sauce', t)}
                                        className={`group p-4 rounded-button border-2 text-left transition-all flex items-center justify-between cursor-pointer ${
                                            isSelected
                                                ? "bg-brand-butter border-brand-charcoal text-brand-charcoal shadow-[2px_2px_0px_0px_#080D09]"
                                                : "bg-white border-brand-charcoal/15 text-brand-charcoal hover:border-brand-charcoal/40 hover:bg-brand-linen"
                                        }`}
                                    >
                                        <div className="flex flex-col">
                                            <span className="font-body font-bold text-sm leading-tight">{ing}</span>
                                            {isAvo && (
                                                <span className="text-[10px] font-mono text-brand-burgundy/80 mt-0.5">
                                                    Premium (+0.30€)
                                                </span>
                                            )}
                                        </div>
                                        {isSelected && (
                                            <div className="bg-brand-charcoal text-brand-butter w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 shadow-sm animate-scale-in">
                                                <IconCheck size={14} />
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                );
            case 8:
                return (
                    <div className="flex flex-col h-full animate-fade-in" id="cb-step-8">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                            {INGREDIENTS_DB.crispies.map(ing => {
                                const isSelected = currentSelections.includes(ing);
                                return (
                                    <button
                                        key={ing}
                                        id={`btn-ing-${ing.toLowerCase().replace(/\s+/g, '-')}`}
                                        onClick={() => handleCustomSelection(ing, 'crispy', t)}
                                        className={`group p-4 rounded-button border-2 text-left transition-all flex items-center justify-between cursor-pointer ${
                                            isSelected
                                                ? "bg-brand-butter border-brand-charcoal text-brand-charcoal shadow-[2px_2px_0px_0px_#080D09]"
                                                : "bg-white border-brand-charcoal/15 text-brand-charcoal hover:border-brand-charcoal/40 hover:bg-brand-linen"
                                        }`}
                                    >
                                        <span className="font-body font-bold text-sm leading-tight">{ing}</span>
                                        {isSelected && (
                                            <div className="bg-brand-charcoal text-brand-butter w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 shadow-sm animate-scale-in">
                                                <IconCheck size={14} />
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                );
            case 9:
                return (
                    <div className="flex flex-col items-center justify-center h-full min-h-[350px] p-6 text-center space-y-8 animate-fade-in" id="cb-step-9">
                        <div className="max-w-md w-full">
                            <h3 className="font-display font-bold text-lg text-brand-charcoal mb-4 uppercase tracking-wider opacity-60">
                                {t('phase_sesame')}
                            </h3>
                            <MessageBubble className="bg-white border-2 border-brand-charcoal text-brand-charcoal shadow-[4px_4px_0px_0px_#080D09] text-base" text={t('cb_sesame_q')} />
                        </div>
                        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm">
                            <button
                                id="btn-cb-sesame-yes"
                                onClick={() => handleCustomSesame("Yes")}
                                className="flex-1 bg-brand-butter text-brand-charcoal p-4 rounded-button border-2 border-brand-charcoal font-display font-bold text-lg shadow-[4px_4px_0px_0px_#080D09] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#080D09] active:scale-95 transition-all cursor-pointer"
                            >
                                {t('cb_btn_yes')}
                            </button>
                            <button
                                id="btn-cb-sesame-no"
                                onClick={() => handleCustomSesame("No")}
                                className="flex-1 bg-white text-brand-charcoal p-4 rounded-button border-2 border-brand-charcoal font-display font-bold text-lg shadow-[4px_4px_0px_0px_#080D09] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#080D09] active:scale-95 transition-all cursor-pointer"
                            >
                                {t('cb_btn_no')}
                            </button>
                        </div>
                    </div>
                );
            case 10:
                return (
                    <div className="flex flex-col h-full animate-fade-in" id="cb-step-10">
                        <div className="bg-brand-linen rounded-button border-2 border-brand-charcoal p-6 space-y-6 shadow-[4px_4px_0px_0px_#080D09]">
                            <div className="flex items-center gap-4 border-b border-brand-charcoal/10 pb-4">
                                <span className="text-4xl">{paPersona.emoji}</span>
                                <div>
                                    <h4 className="font-display font-black text-lg text-brand-charcoal">{paPersona.name}</h4>
                                    <p className="text-xs font-body font-bold text-brand-burgundy/80">
                                        {size === "Large" ? "Large Bowl" : "Regular Bowl"} • {allSelections.dining === "Takeaway" ? t('custom_bowl_takeaway') : t('custom_bowl_dine_in')}
                                    </p>
                                </div>
                            </div>
                            
                            <div className="space-y-4">
                                <h5 className="font-display font-bold text-sm text-brand-charcoal uppercase tracking-wider">
                                    {t('custom_bowl_review_order')}
                                </h5>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm font-body font-bold text-brand-charcoal/90">
                                    {allSelections.base && (
                                        <div className="bg-white p-3 rounded-button border border-brand-charcoal/10">
                                            <span className="text-xs opacity-60 block">{t('phase_base')}</span>
                                            <span>{Array.isArray(allSelections.base) ? allSelections.base.join(", ") : allSelections.base}</span>
                                        </div>
                                    )}
                                    {allSelections.green && (
                                        <div className="bg-white p-3 rounded-button border border-brand-charcoal/10">
                                            <span className="text-xs opacity-60 block">{t('phase_greens')}</span>
                                            <span>{Array.isArray(allSelections.green) ? allSelections.green.join(", ") : allSelections.green}</span>
                                        </div>
                                    )}
                                    {allSelections.protein && (
                                        <div className="bg-white p-3 rounded-button border border-brand-charcoal/10">
                                            <span className="text-xs opacity-60 block">{t('phase_protein')}</span>
                                            <span>{Array.isArray(allSelections.protein) ? allSelections.protein.join(", ") : allSelections.protein}</span>
                                        </div>
                                    )}
                                    {allSelections.sauce && (
                                        <div className="bg-white p-3 rounded-button border border-brand-charcoal/10">
                                            <span className="text-xs opacity-60 block">{t('phase_sauce_final')}</span>
                                            <span>{Array.isArray(allSelections.sauce) ? allSelections.sauce.join(", ") : allSelections.sauce}</span>
                                        </div>
                                    )}
                                    {allSelections.crispy && (
                                        <div className="bg-white p-3 rounded-button border border-brand-charcoal/10">
                                            <span className="text-xs opacity-60 block">{t('phase_crispy')}</span>
                                            <span>{Array.isArray(allSelections.crispy) ? allSelections.crispy.join(", ") : allSelections.crispy}</span>
                                        </div>
                                    )}
                                    {allSelections.sesame && (
                                        <div className="bg-white p-3 rounded-button border border-brand-charcoal/10">
                                            <span className="text-xs opacity-60 block">{t('phase_sesame')}</span>
                                            <span>{allSelections.sesame === "Yes" ? t('cb_btn_yes') : t('cb_btn_no')}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Pricing breakdown inside review */}
                            <div className="border-t border-brand-charcoal/10 pt-4 space-y-2">
                                <div className="flex justify-between text-xs font-body font-bold text-brand-charcoal/60">
                                    <span>Base ({size})</span>
                                    <span>{priceDetails.basePrice.toFixed(2)}€</span>
                                </div>
                                {priceDetails.dineInTakeawayFee > 0 && (
                                    <div className="flex justify-between text-xs font-body font-bold text-brand-charcoal/60">
                                        <span>{t('custom_bowl_takeaway')}</span>
                                        <span>+{priceDetails.dineInTakeawayFee.toFixed(2)}€</span>
                                    </div>
                                )}
                                {priceDetails.premiumAddons > 0 && (
                                    <div className="flex justify-between text-xs font-body font-bold text-brand-charcoal/60">
                                        <span>Itens Premium</span>
                                        <span>+{priceDetails.premiumAddons.toFixed(2)}€</span>
                                    </div>
                                )}
                                {priceDetails.extraAddons > 0 && (
                                    <div className="flex justify-between text-xs font-body font-bold text-brand-charcoal/60">
                                        <span>Ingredientes Extras</span>
                                        <span>+{priceDetails.extraAddons.toFixed(2)}€</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-base font-display font-black text-brand-charcoal pt-2 border-t border-dashed border-brand-charcoal/10">
                                    <span>Total</span>
                                    <span>{priceDetails.total.toFixed(2)}€</span>
                                </div>
                            </div>

                            <button
                                id="btn-cb-complete-order"
                                onClick={finishCustomBowl}
                                className="w-full bg-brand-sorbet text-brand-charcoal p-4 rounded-button border-2 border-brand-charcoal font-display font-black text-lg shadow-[4px_4px_0px_0px_#080D09] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#080D09] active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
                            >
                                <IconCheck size={20} />
                                {t('custom_bowl_complete_order')}
                            </button>
                        </div>
                    </div>
                );
            case 11:
                return (
                    <div className="flex flex-col items-center justify-center h-full min-h-[400px] p-8 text-center space-y-8 animate-slide-up" id="cb-step-11">
                        <div className="w-24 h-24 bg-brand-butter border-4 border-brand-charcoal rounded-full flex items-center justify-center text-5xl shadow-[4px_4px_0px_0px_#080D09] animate-bounce">
                            🎉
                        </div>
                        <div className="max-w-md">
                            <h2 className="font-display font-black text-3xl text-brand-charcoal mb-4">
                                {t('custom_bowl_order_complete')}
                            </h2>
                            <p className="font-body font-bold text-brand-burgundy text-lg bg-white border-2 border-brand-charcoal rounded-button p-4 shadow-[4px_4px_0px_0px_#080D09]">
                                {resultMessage[language] || "Thank you! Have a delicious meal!"}
                            </p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm">
                            <button
                                id="btn-cb-restart"
                                onClick={startCustomBowl}
                                className="flex-1 bg-brand-sorbet text-brand-charcoal p-4 rounded-button border-2 border-brand-charcoal font-display font-bold text-base shadow-[4px_4px_0px_0px_#080D09] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#080D09] active:scale-95 transition-all cursor-pointer"
                            >
                                {t('custom_bowl_start_another')}
                            </button>
                            <button
                                id="btn-cb-home-success"
                                onClick={resetToHome}
                                className="flex-1 bg-white text-brand-charcoal p-4 rounded-button border-2 border-brand-charcoal font-display font-bold text-base shadow-[4px_4px_0px_0px_#080D09] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#080D09] active:scale-95 transition-all cursor-pointer"
                            >
                                {t('cb_result_btn')}
                            </button>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    // Calculate interactive progress percent and dynamic active items indicator
    const currentStepIndex = CUSTOM_STEPS.findIndex(s => s.phase === customPhase);
    const hasProgress = currentStepIndex >= 0;
    const progressPercent = hasProgress ? ((currentStepIndex + 1) / CUSTOM_STEPS.length) * 100 : 0;

    const currentStepLimit = customPhase === 4 ? 2 : customPhase === 5 ? (size === "Large" ? 5 : 4) : customPhase === 6 ? (size === "Large" ? 3 : 2) : customPhase === 7 ? 1 : customPhase === 8 ? 2 : 0;

    return (
        <div className="safe-bottom w-full h-full max-w-6xl flex flex-col overflow-hidden relative px-3 py-3 md:px-4 md:py-4" id="custom-bowl-container">
            {showPopup && (
                <PopupModal
                    message={showPopup.msg}
                    onConfirm={showPopup.callback}
                    t={t}
                />
            )}

            {/* Exit confirmation modal */}
            {showExitConfirm && (
                <div className="fixed inset-0 bg-brand-charcoal/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div ref={exitModalRef} className="bg-white rounded-button border-4 border-brand-charcoal p-6 max-w-sm w-full shadow-[8px_8px_0px_0px_#080D09] text-center space-y-6">
                        <div className="text-4xl">⚠️</div>
                        <div className="space-y-2">
                            <h3 className="font-display font-black text-xl text-brand-charcoal">
                                {t('custom_bowl_exit_confirm_title')}
                            </h3>
                            <p className="font-body font-bold text-brand-burgundy/80 text-sm">
                                {t('custom_bowl_exit_confirm_description')}
                            </p>
                        </div>
                        <div className="flex flex-col gap-3">
                            <button
                                id="btn-cb-exit-cancel"
                                onClick={() => setShowExitConfirm(false)}
                                className="w-full bg-brand-charcoal text-white p-3 rounded-button font-display font-bold text-sm shadow-[4px_4px_0px_0px_#000] active:scale-95 transition-all cursor-pointer"
                            >
                                {t('custom_bowl_continue_order')}
                            </button>
                            <button
                                id="btn-cb-exit-confirm"
                                onClick={() => {
                                    setShowExitConfirm(false);
                                    resetToHome();
                                }}
                                className="w-full bg-white text-brand-charcoal border-2 border-brand-charcoal p-3 rounded-button font-display font-bold text-sm shadow-[4px_4px_0px_0px_#080D09] hover:bg-brand-linen active:scale-95 transition-all cursor-pointer"
                            >
                                {t('custom_bowl_leave_order')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Layout Wrapper */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Modern Compact Header */}
                <header className="bg-white border-2 border-brand-charcoal rounded-button p-3 md:p-4 mb-3 md:mb-4 flex items-center justify-between gap-2 shadow-[4px_4px_0px_0px_#080D09] shrink-0">
                    <div className="flex items-center gap-2 md:gap-3 min-w-0">
                        <div className="w-10 h-10 bg-brand-butter border-2 border-brand-charcoal rounded-button flex items-center justify-center text-xl shadow-[2px_2px_0px_0px_#080D09]">
                            <IconBowl size={20} className="text-brand-charcoal" />
                        </div>
                        <div className="min-w-0">
                            <h1 className="font-display font-black text-base md:text-lg text-brand-charcoal leading-none">
                                {t('custom_bowl_title')}
                            </h1>
                            <p className="hidden min-[390px]:block text-[11px] md:text-xs font-body font-bold text-brand-burgundy/80 mt-1 leading-tight">
                                {t('custom_bowl_objective')}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleExitClick}
                        className="w-10 h-10 border-2 border-brand-charcoal rounded-button flex items-center justify-center bg-white hover:bg-brand-linen transition-colors shadow-[2px_2px_0px_0px_#080D09] cursor-pointer"
                    >
                        <IconX size={18} className="text-brand-charcoal" />
                    </button>
                </header>

                {/* Progress Indicator Bar */}
                {hasProgress && (
                    <div className="bg-white border-2 border-brand-charcoal rounded-button p-3 md:p-4 mb-3 md:mb-4 shadow-[4px_4px_0px_0px_#080D09] space-y-2 md:space-y-3 shrink-0">
                        <div className="flex justify-between items-center text-xs font-display font-black text-brand-charcoal">
                            <span className="uppercase tracking-wider">{getPhaseName(customPhase)}</span>
                            <span>{t('custom_bowl_step_of', { current: currentStepIndex + 1, total: CUSTOM_STEPS.length })}</span>
                        </div>
                        <div className="w-full bg-brand-linen border-2 border-brand-charcoal h-4 rounded-full overflow-hidden p-0.5 shadow-inner">
                            <div
                                className="bg-brand-butter border-r-2 border-brand-charcoal h-full rounded-full transition-all duration-300"
                                style={{ width: `${progressPercent}%` }}
                            />
                        </div>
                    </div>
                )}

                {/* Two Column Layout for ordering steps */}
                {customPhase >= 2 && customPhase <= 10 ? (
                    <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 md:gap-4 overflow-y-auto lg:overflow-hidden min-h-0 custom-scroll">
                        {/* Left Column: Customer Request and Running Order Summary */}
                        <div className="lg:col-span-4 flex flex-col gap-4 overflow-y-auto custom-scroll pr-1 pb-4">
                            {/* Customer Request Speech bubble */}
                            <div className="bg-white border-2 border-brand-charcoal rounded-button p-4 shadow-[4px_4px_0px_0px_#080D09] space-y-3">
                                <h3 className="font-display font-black text-xs text-brand-charcoal/50 uppercase tracking-wider">
                                    {t('custom_bowl_customer_request')}
                                </h3>
                                <div className="flex items-start gap-3">
                                    <span className="text-3xl shrink-0">{paPersona.emoji}</span>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-display font-black text-sm text-brand-charcoal leading-tight">
                                            {paPersona.name}
                                        </h4>
                                        <div className="mt-2 text-sm font-body font-bold text-brand-charcoal/90 leading-relaxed bg-brand-linen border border-brand-charcoal/10 rounded-button p-3">
                                            {customPhase === 2 && t('cb_here_togo')}
                                            {customPhase === 3 && t('cb_size_q')}
                                            {customPhase === 4 && t('cb_base_q')}
                                            {customPhase === 5 && t('cb_greens_q', { limit: size === "Large" ? 5 : 4 })}
                                            {customPhase === 6 && t('cb_protein_q', { limit: size === "Large" ? 3 : 2 })}
                                            {customPhase === 7 && t('cb_sauce_q')}
                                            {customPhase === 8 && t('cb_crispy_q')}
                                            {customPhase === 9 && t('cb_sesame_q')}
                                            {customPhase === 10 && t('custom_bowl_review_order')}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Running Order Summary Card */}
                            <div className="hidden lg:flex bg-white border-2 border-brand-charcoal rounded-button p-4 shadow-[4px_4px_0px_0px_#080D09] flex-1 flex-col">
                                <h3 className="font-display font-black text-xs text-brand-charcoal/50 uppercase tracking-wider mb-3">
                                    {t('custom_bowl_order_summary')}
                                </h3>
                                
                                <div className="flex-1 overflow-y-auto space-y-3 text-xs font-body font-bold text-brand-charcoal/90 pr-1">
                                    <div className="flex justify-between border-b border-brand-charcoal/5 pb-2">
                                        <span className="opacity-60">{t('phase_size')}</span>
                                        <span>{allSelections.size ? String(allSelections.size).toUpperCase() : "-"}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-brand-charcoal/5 pb-2">
                                        <span className="opacity-60">{t('phase_dining')}</span>
                                        <span>{allSelections.dining ? String(allSelections.dining) : "-"}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-brand-charcoal/5 pb-2">
                                        <span className="opacity-60">{t('phase_base')}</span>
                                        <span className="text-right truncate max-w-[150px]">
                                            {allSelections.base ? (Array.isArray(allSelections.base) ? allSelections.base.join(", ") : String(allSelections.base)) : "-"}
                                        </span>
                                    </div>
                                    <div className="flex justify-between border-b border-brand-charcoal/5 pb-2">
                                        <span className="opacity-60">{t('phase_greens')}</span>
                                        <span className="text-right truncate max-w-[150px]">
                                            {allSelections.green ? (Array.isArray(allSelections.green) ? allSelections.green.join(", ") : String(allSelections.green)) : "-"}
                                        </span>
                                    </div>
                                    <div className="flex justify-between border-b border-brand-charcoal/5 pb-2">
                                        <span className="opacity-60">{t('phase_protein')}</span>
                                        <span className="text-right truncate max-w-[150px]">
                                            {allSelections.protein ? (Array.isArray(allSelections.protein) ? allSelections.protein.join(", ") : String(allSelections.protein)) : "-"}
                                        </span>
                                    </div>
                                    <div className="flex justify-between border-b border-brand-charcoal/5 pb-2">
                                        <span className="opacity-60">{t('phase_sauce_final')}</span>
                                        <span className="text-right truncate max-w-[150px]">
                                            {allSelections.sauce ? (Array.isArray(allSelections.sauce) ? allSelections.sauce.join(", ") : String(allSelections.sauce)) : "-"}
                                        </span>
                                    </div>
                                    <div className="flex justify-between border-b border-brand-charcoal/5 pb-2">
                                        <span className="opacity-60">{t('phase_crispy')}</span>
                                        <span className="text-right truncate max-w-[150px]">
                                            {allSelections.crispy ? (Array.isArray(allSelections.crispy) ? allSelections.crispy.join(", ") : String(allSelections.crispy)) : "-"}
                                        </span>
                                    </div>
                                    <div className="flex justify-between pb-2">
                                        <span className="opacity-60">{t('phase_sesame')}</span>
                                        <span>{allSelections.sesame ? (allSelections.sesame === "Yes" ? t('cb_btn_yes') : t('cb_btn_no')) : "-"}</span>
                                    </div>
                                </div>

                                <div className="border-t-2 border-brand-charcoal pt-3 mt-3 flex justify-between items-center">
                                    <span className="font-display font-black text-xs text-brand-charcoal/60 uppercase">
                                        {t('custom_bowl_current_total')}
                                    </span>
                                    <span className="font-display font-black text-lg text-brand-charcoal">
                                        {priceDetails.total.toFixed(2)}€
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Choices Grid */}
                        <div className="lg:col-span-8 bg-white border-2 border-brand-charcoal rounded-button p-4 md:p-6 shadow-[4px_4px_0px_0px_#080D09] flex flex-col overflow-visible lg:overflow-hidden min-h-fit lg:min-h-0">
                            {/* Option Header / Item tracker */}
                            {currentStepLimit > 0 && (
                                <div className="flex justify-between items-center mb-4 shrink-0 border-b border-brand-charcoal/10 pb-2">
                                    <span className="font-display font-black text-xs uppercase text-brand-charcoal/60">
                                        {getPhaseName(customPhase)}
                                    </span>
                                    <span className="font-mono text-xs font-bold text-brand-burgundy bg-brand-sorbet px-2.5 py-1 border-2 border-brand-charcoal rounded-full">
                                        {currentSelections.length} / {currentStepLimit}
                                    </span>
                                </div>
                            )}

                            {/* Options Scroll Container */}
                            <div className="flex-1 overflow-y-auto custom-scroll pr-1">
                                {renderCustomBowlContent()}
                            </div>

                            {/* Right Column Bottom Actions */}
                            {customPhase >= 4 && customPhase < 9 && (
                                <div className="flex items-center justify-between border-t border-brand-charcoal/10 pt-4 mt-4 shrink-0">
                                    <button
                                        id="btn-cb-back"
                                        onClick={handleBackClick}
                                        className="flex items-center gap-2 font-display font-bold text-sm text-brand-charcoal px-4 py-2 border-2 border-brand-charcoal rounded-button bg-white hover:bg-brand-linen active:scale-95 transition-all cursor-pointer"
                                    >
                                        <IconArrowLeft size={16} />
                                        {t('btn_undo')}
                                    </button>
                                    
                                    <button
                                        id="btn-cb-next"
                                        onClick={() => {
                                            if (checkStepComplete()) handleCustomNext();
                                        }}
                                        disabled={!checkStepComplete()}
                                        className={`flex items-center gap-2 font-display font-black text-sm px-5 py-2.5 rounded-button border-2 border-brand-charcoal transition-all shadow-[2px_2px_0px_0px_#080D09] cursor-pointer ${
                                            checkStepComplete()
                                                ? "bg-brand-butter text-brand-charcoal hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#080D09]"
                                                : "bg-gray-100 text-gray-400 border-gray-300 shadow-none cursor-not-allowed"
                                        }`}
                                    >
                                        {t('btn_continue')}
                                        <IconArrowRight size={16} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    /* Simple intro/completion screens take full container */
                    <div className="flex-1 bg-white border-2 border-brand-charcoal rounded-button p-4 md:p-8 shadow-[4px_4px_0px_0px_#080D09] flex flex-col justify-start md:justify-center overflow-y-auto custom-scroll">
                        {renderCustomBowlContent()}
                    </div>
                )}
            </div>
        </div>
    );
}
