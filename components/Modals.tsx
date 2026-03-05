import React, { useState } from 'react';
import { IconList, IconX, IconClock, IconTrophy } from './Icons';
import { CHANGELOG } from '../constants';
import { RushScore } from '../types';

export const PopupModal = ({ message, onConfirm }: { message: string; onConfirm: () => void }) => (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 backdrop-blur-sm animate-fade-in">
        <div className="bg-white p-8 rounded-win shadow-fluent-hover border border-gray-200 max-w-sm w-full mx-4 text-center transform scale-100 animate-slide-up">
            <p className="text-lg font-medium text-brand-dark mb-8">{message}</p>
            <button onClick={onConfirm} className="bg-brand-blue text-white px-6 py-2 rounded-win font-semibold hover:bg-blue-600 transition-colors shadow-sm">Entendido</button>
        </div>
    </div>
);

export const RushEntryModal = ({ 
    onStart,
    onClose
}: { 
    onStart: (name: string, store: string) => void;
    onClose: () => void;
}) => {
    const [name, setName] = useState("");
    const [store, setStore] = useState("");

    const handleStart = () => {
        if (name.trim() && store.trim()) {
            onStart(name, store);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-md animate-fade-in p-4">
            <div className="bg-white rounded-win shadow-2xl border-t-8 border-rush-500 max-w-sm w-full animate-slide-up overflow-hidden relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-rush-500 transition-colors">
                    <IconX size={20} />
                </button>
                <div className="p-8">
                    <h2 className="text-2xl font-black text-rush-900 mb-2 text-center uppercase tracking-tighter">Identificação</h2>
                    <p className="text-rush-300 text-center mb-8 font-bold uppercase text-xs tracking-widest">Quem está no comando?</p>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-rush-900 uppercase mb-1">Seu Nome</label>
                            <input 
                                type="text" 
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Ex: Marcelo"
                                className="w-full p-3 bg-rush-100/30 border-2 border-rush-100 rounded-win focus:border-rush-500 outline-none transition-all font-bold text-rush-900"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-rush-900 uppercase mb-1">Sua Loja</label>
                            <input 
                                type="text" 
                                value={store}
                                onChange={(e) => setStore(e.target.value)}
                                placeholder="Ex: Colombo"
                                className="w-full p-3 bg-rush-100/30 border-2 border-rush-100 rounded-win focus:border-rush-500 outline-none transition-all font-bold text-rush-900"
                            />
                        </div>
                        <button 
                            onClick={handleStart}
                            disabled={!name.trim() || !store.trim()}
                            className="w-full bg-rush-500 text-white py-4 rounded-win font-black uppercase tracking-widest hover:bg-rush-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg active:scale-95"
                        >
                            Iniciar Treino
                        </button>
                        <button 
                            onClick={onClose}
                            className="w-full bg-gray-100 text-gray-500 py-3 rounded-win font-bold uppercase text-xs tracking-widest hover:bg-gray-200 transition-all"
                        >
                            Sair
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const ChangelogModal = ({ onClose }: { onClose: () => void }) => (
    <div className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
        <div className="bg-white rounded-win p-6 max-w-md w-full max-h-[80vh] overflow-y-auto shadow-fluent-hover relative animate-slide-up">
            <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-xl text-brand-dark flex items-center gap-2"><IconList /> Histórico</h3>
                <button onClick={onClose} className="text-gray-400 hover:text-brand-dark transition-colors"><IconX /></button>
            </div>
            <div className="space-y-6">{CHANGELOG.slice(0, 5).map((item, index) => (<div key={index} className="border-l-2 border-brand-blue pl-4"><div className="flex justify-between items-baseline mb-1"><span className="font-semibold text-brand-dark">v{item.version}</span><span className="text-xs text-gray-500 uppercase">{item.date}</span></div><ul className="list-disc list-inside text-sm text-gray-600 space-y-1">{item.changes.map((change, i) => (<li key={i}>{change}</li>))}</ul></div>))}</div>
            <div className="mt-8 pt-4 border-t border-gray-100 text-center">
                 <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Dev Marcelo Requião</h4>
            </div>
        </div>
    </div>
);