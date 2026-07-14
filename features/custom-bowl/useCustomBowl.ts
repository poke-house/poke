import { useState } from 'react';
import { PaPersona, BilingualMessage } from '../../types';
import { PA_NAMES, PA_EMOJIS, FINAL_CUSTOM_PHRASES } from '../../constants';
import { playSound } from '../../utils/sound';

export interface UseCustomBowlResult {
    customPhase: number;
    paPersona: PaPersona;
    currentSelections: string[];
    allSelections: Record<string, string | string[]>;
    resultMessage: BilingualMessage;
    showPopup: { msg: string; callback: () => void } | null;
    setShowPopup: (popup: { msg: string; callback: () => void } | null) => void;
    startCustomBowl: () => void;
    handleCustomSize: (size: string) => void;
    handleCustomDining: (choice: string) => void;
    handleCustomSesame: (choice: string) => void;
    handleCustomNext: () => void;
    handleCustomBack: (onExit: () => void) => void;
    finishCustomBowl: () => void;
    handleCustomSelection: (item: string, type: string, t: (key: any, params?: any) => string) => void;
    checkStepComplete: () => boolean;
}

export function useCustomBowl(): UseCustomBowlResult {
    const [customPhase, setCustomPhase] = useState<number>(0);
    const [paPersona, setPaPersona] = useState<PaPersona>({ name: "", emoji: "" });
    const [currentSelections, setCurrentSelections] = useState<string[]>([]);
    const [allSelections, setAllSelections] = useState<Record<string, string | string[]>>({});
    const [resultMessage, setResultMessage] = useState<BilingualMessage>({ pt: "", en: "" });
    const [showPopup, setShowPopup] = useState<{ msg: string; callback: () => void } | null>(null);

    const startCustomBowl = () => {
        const isFemale = Math.random() > 0.5;
        setPaPersona({
            name: (isFemale ? PA_NAMES.FEMALE : PA_NAMES.MALE)[Math.floor(Math.random() * 6)],
            emoji: (isFemale ? PA_EMOJIS.FEMALE : PA_EMOJIS.MALE)[Math.floor(Math.random() * 4)]
        });
        setCustomPhase(1);
        setAllSelections({});
        setCurrentSelections([]);
    };

    const getPhaseKey = (phase: number): string | null => {
        if (phase === 4) return "base";
        if (phase === 5) return "green";
        if (phase === 6) return "protein";
        if (phase === 7) return "sauce";
        if (phase === 8) return "crispy";
        return null;
    };

    const handleCustomDining = (choice: string) => {
        setAllSelections(prev => ({ ...prev, dining: choice }));
        setCustomPhase(3);
        setCurrentSelections([]);
    };

    const handleCustomSize = (size: string) => {
        setAllSelections(prev => ({ ...prev, size: size }));
        setCustomPhase(4);
        setCurrentSelections([]);
    };

    const handleCustomNext = () => {
        const key = getPhaseKey(customPhase);
        if (key) {
            setAllSelections(prev => ({ ...prev, [key]: [...currentSelections] }));
        }
        setCustomPhase(prev => (prev < 4 ? prev + 1 : prev === 8 ? 9 : prev + 1));
        setCurrentSelections([]);
    };

    const handleCustomSesame = (choice: string) => {
        setAllSelections(prev => ({ ...prev, sesame: choice }));
        setCustomPhase(10); // Phase 10 is the Order Review screen
        setCurrentSelections([]);
    };

    const handleCustomBack = (onExit: () => void) => {
        if (currentSelections.length > 0) {
            setCurrentSelections(prev => prev.slice(0, -1));
            return;
        }
        if (customPhase === 1) {
            onExit();
        } else {
            const prevPhase = customPhase === 10 ? 9 : customPhase - 1;
            setCustomPhase(prevPhase);
            const prevKey = getPhaseKey(prevPhase);
            if (prevKey) {
                const restored = allSelections[prevKey];
                setCurrentSelections(Array.isArray(restored) ? restored : []);
            } else {
                setCurrentSelections([]);
            }
        }
    };

    const finishCustomBowl = () => {
        setResultMessage(FINAL_CUSTOM_PHRASES[Math.floor(Math.random() * FINAL_CUSTOM_PHRASES.length)]);
        setCustomPhase(11); // Phase 11 is now the final Completion screen
    };

    const addCustomItem = (item: string, type: string) => {
        const limit = type === 'base' ? 2 : type === 'crispy' ? 2 : 99;
        if (currentSelections.length < limit) {
            setCurrentSelections(prev => [...prev, item]);
            playSound("happy");
        }
    };

    const handleCustomSelection = (item: string, type: string, t: (key: any, params?: any) => string) => {
        const popupTrigger = (msg: string) => {
            setShowPopup({
                msg,
                callback: () => {
                    setShowPopup(null);
                    addCustomItem(item, type);
                }
            });
        };

        const size = (allSelections['size'] as string) || "Regular";

        if (type === 'base' && item === "Espinafres") {
            return popupTrigger(t('popup_base_oil'));
        }
        if (type === 'base' && item === "Mix Salad") {
            return popupTrigger(t('popup_base_vinaigrette'));
        }
        if (type === 'green') {
            const limit = size === "Large" ? 5 : 4;
            const currentCount = currentSelections.length;
            const isAbacate = item === "Abacate" || item === "Guacamole";
            const isOtherPremium = ["Philadelphia", "Wakame", "Manga"].includes(item);
            if (currentCount >= limit) {
                return popupTrigger(t(isAbacate ? 'popup_extra_premium' : isOtherPremium ? 'popup_extra_premium' : 'popup_extra', { val: isAbacate ? '1.00' : '0.80' }));
            }
            if (isAbacate) {
                return popupTrigger(t('popup_premium', { val: '1.00' }));
            }
            if (isOtherPremium) {
                return popupTrigger(t('popup_premium', { val: '0.30' }));
            }
        }
        if (type === 'sauce') {
            if (currentSelections.length >= 1) {
                return popupTrigger(t('popup_generic_extra', { val: item === "Creme de Abacate" ? '0.60' : '0.30' }));
            } else if (item === "Creme de Abacate") {
                return popupTrigger(t('popup_sauce_avocado'));
            }
        }
        if (type === 'protein') {
            const limit = size === "Large" ? 3 : 2;
            const isExpensive = item === "Salmão Braseado" || item === "Miso Glazed Salmon";
            if (currentSelections.length >= limit) {
                return popupTrigger(t('popup_generic_extra', { val: isExpensive ? '2.00' : '1.50' }));
            } else if (isExpensive) {
                return popupTrigger(t('popup_protein_expensive'));
            }
        }

        addCustomItem(item, type);
    };

    const checkStepComplete = () => {
        const size = (allSelections['size'] as string) || "Regular";
        const stepLimit = customPhase === 4 ? 2 : customPhase === 5 ? (size === "Large" ? 5 : 4) : customPhase === 6 ? (size === "Large" ? 3 : 2) : customPhase === 7 ? 1 : customPhase === 8 ? 2 : 0;
        return stepLimit === 0 || currentSelections.length >= stepLimit;
    };

    return {
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
    };
}

