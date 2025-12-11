import React from 'react';
import { IconList, IconX } from './Icons';
import { CHANGELOG } from '../constants';

export const PopupModal = ({ message, onConfirm }: { message: string; onConfirm: () => void }) => (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 backdrop-blur-sm animate-fade-in">
        <div className="bg-white p-8 rounded-win shadow-fluent-hover border border-gray-200 max-w-sm w-full mx-4 text-center transform scale-100 animate-slide-up">
            <p className="text-lg font-medium text-brand-dark mb-8">{message}</p>
            <button onClick={onConfirm} className="bg-brand-blue text-white px-6 py-2 rounded-win font-semibold hover:bg-blue-600 transition-colors shadow-sm">Entendido</button>
        </div>
    </div>
);

export const ChangelogModal = ({ onClose }: { onClose: () => void }) => (
    <div className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
        <div className="bg-white rounded-win p-6 max-w-md w-full max-h-[80vh] overflow-y-auto shadow-fluent-hover relative animate-slide-up">
            <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-xl text-brand-dark flex items-center gap-2"><IconList /> Histórico</h3>
                <button onClick={onClose} className="text-gray-400 hover:text-brand-dark transition-colors"><IconX /></button>
            </div>
            <div className="space-y-6">{CHANGELOG.slice(0, 5).map((item, index) => (<div key={index} className="border-l-2 border-brand-blue pl-4"><div className="flex justify-between items-baseline mb-1"><span className="font-semibold text-brand-dark">v{item.version}</span><span className="text-xs text-gray-500 uppercase">{item.date}</span></div><ul className="list-disc list-inside text-sm text-gray-600 space-y-1">{item.changes.map((change, i) => (<li key={i}>{change}</li>))}</ul></div>))}</div>
        </div>
    </div>
);