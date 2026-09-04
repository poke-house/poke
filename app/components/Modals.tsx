import React, { useState } from 'react';
import { IconList, IconX, IconClock, IconTrophy } from './Icons';
import { CHANGELOG } from '../constants';
import { RushScore } from '../types';
import { TranslationKey } from '../translations';

export const PopupModal = ({ message, onConfirm, t }: { message: string; onConfirm: () => void; t: (key: TranslationKey, params?: Record<string, string | number>) => string }) => (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-brand-charcoal/40 backdrop-blur-sm animate-fade-in p-4">
        <div className="bg-white p-8 rounded-modal shadow-elevated border-4 border-brand-charcoal max-w-sm w-full text-center transform scale-100 animate-slide-up">
            <p className="text-lg font-body font-bold text-brand-charcoal mb-8 leading-snug">{message}</p>
            <button 
                onClick={onConfirm} 
                className="bg-brand-mochi text-brand-charcoal px-6 py-3 rounded-button font-display font-bold border-2 border-brand-charcoal hover:bg-brand-mochi/90 transition-all shadow-sm active:translate-y-0.5"
            >
                {t('btn_understood')}
            </button>
        </div>
    </div>
);

export const RushEntryModal = ({ 
    onStart,
    onClose,
    t
}: { 
    onStart: (name: string, store: string) => void;
    onClose: () => void;
    t: (key: TranslationKey, params?: Record<string, string | number>) => string;
}) => {
    const [name, setName] = useState("");
    const [store, setStore] = useState("");

    const handleStart = () => {
        if (name.trim() && store.trim()) {
            onStart(name, store);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-brand-charcoal/50 backdrop-blur-sm animate-fade-in p-4">
            <div className="bg-white rounded-modal shadow-elevated border-4 border-brand-charcoal max-w-sm w-full animate-slide-up overflow-hidden relative">
                <button 
                    onClick={onClose} 
                    aria-label="Close"
                    className="absolute top-4 right-4 text-brand-charcoal/50 hover:text-brand-tomato transition-colors z-20 bg-white/80 p-1.5 rounded-full"
                >
                    <IconX size={20} />
                </button>
                
                <div className="bg-brand-tomato/10 border-b-4 border-brand-charcoal p-6 text-center pt-8">
                    <h2 className="text-xl md:text-2xl font-display font-black text-brand-charcoal mb-1 leading-tight">
                        {t('rush_entry_identification')}
                    </h2>
                    <p className="text-brand-tomato font-condensed font-bold text-xs tracking-wide uppercase">
                        {t('rush_entry_subtitle')}
                    </p>
                </div>

                <div className="p-6 md:p-8 space-y-4">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-condensed font-black text-brand-charcoal uppercase mb-1.5">
                                {t('rush_entry_your_name')}
                            </label>
                            <input 
                                type="text" 
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder={t('rush_entry_name_placeholder')}
                                className="w-full p-3 bg-brand-linen border-2 border-brand-charcoal rounded-button focus:ring-2 focus:ring-brand-mochi outline-none transition-all font-body font-semibold text-brand-charcoal text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-condensed font-black text-brand-charcoal uppercase mb-1.5">
                                {t('rush_entry_your_store')}
                            </label>
                            <input 
                                type="text" 
                                value={store}
                                onChange={(e) => setStore(e.target.value)}
                                placeholder={t('rush_entry_store_placeholder')}
                                className="w-full p-3 bg-brand-linen border-2 border-brand-charcoal rounded-button focus:ring-2 focus:ring-brand-mochi outline-none transition-all font-body font-semibold text-brand-charcoal text-sm"
                            />
                        </div>
                        
                        <div className="pt-2 space-y-2">
                            <button 
                                onClick={handleStart}
                                disabled={!name.trim() || !store.trim()}
                                className="w-full bg-brand-mochi hover:bg-brand-mochi/90 text-brand-charcoal py-4 rounded-button font-display font-black border-2 border-brand-charcoal shadow-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all active:translate-y-0.5 text-sm md:text-base"
                            >
                                {t('rush_entry_start_btn')}
                            </button>
                            <button 
                                onClick={onClose}
                                className="w-full bg-brand-linen hover:bg-brand-linen/80 text-brand-charcoal py-3 rounded-button font-body font-bold border-2 border-brand-charcoal transition-all text-xs uppercase"
                            >
                                {t('rush_entry_exit_btn')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const ChangelogModal = ({ onClose, t }: { onClose: () => void; t: (key: TranslationKey, params?: Record<string, string | number>) => string }) => (
    <div className="fixed inset-0 z-[100] bg-brand-charcoal/40 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
        <div className="bg-white rounded-modal p-6 max-w-md w-full max-h-[80vh] overflow-y-auto custom-scroll shadow-elevated border-4 border-brand-charcoal relative animate-slide-up">
            <div className="flex justify-between items-center mb-6 border-b-2 border-brand-charcoal pb-4">
                <h3 className="font-display font-black text-xl text-brand-charcoal flex items-center gap-2">
                    <IconList size={22} /> {t('changelog_history')}
                </h3>
                <button 
                    onClick={onClose} 
                    aria-label="Close"
                    className="text-brand-charcoal/50 hover:text-brand-charcoal transition-colors p-1"
                >
                    <IconX size={20} />
                </button>
            </div>
            
            <div className="space-y-6">
                {CHANGELOG.slice(0, 5).map((item, index) => (
                    <div key={index} className="border-l-4 border-brand-mochi pl-4 py-1">
                        <div className="flex justify-between items-baseline mb-2">
                            <span className="font-display font-bold text-brand-charcoal">v{item.version}</span>
                            <span className="text-xs font-condensed font-black text-brand-charcoal/50 uppercase">{item.date}</span>
                        </div>
                        <ul className="list-disc list-inside text-sm font-body text-brand-charcoal/80 space-y-1.5 pl-1">
                            {item.changes.map((change, i) => (
                                <li key={i} className="leading-relaxed">{change}</li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>
            
            <div className="mt-8 pt-4 border-t-2 border-brand-charcoal text-center">
                 <h4 className="text-xs font-condensed font-black text-brand-charcoal/50 uppercase tracking-widest">
                     Dev Marcelo Requião
                 </h4>
            </div>
        </div>
    </div>
);
