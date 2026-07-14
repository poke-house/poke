import React from 'react';
import { Recipe } from '../../../types';
import { TranslationKey } from '../../../translations';
import { IconArrowLeft } from '../../../components/Icons';

interface UniversityRecipeSelectorProps {
    menuCategory: string | null;
    setMenuCategory: (category: string | null) => void;
    selectedRecipe: Recipe | null;
    startUniversityLevel: (recipe: Recipe) => void;
    resetToHome: () => void;
    t: (key: TranslationKey, params?: Record<string, string | number>) => string;
    recipes: Recipe[];
}

export function UniversityRecipeSelector({
    menuCategory,
    setMenuCategory,
    selectedRecipe,
    startUniversityLevel,
    resetToHome,
    t,
    recipes
}: UniversityRecipeSelectorProps) {
    const getRecipeHoverClass = () => {
        if (menuCategory === "HOUSE") return "hover:bg-pastel-blue-100";
        if (menuCategory === "GREEN") return "hover:bg-pastel-pink-100";
        if (menuCategory === "SMOOTHIE") return "hover:bg-pastel-yellow-100";
        return "hover:bg-gray-100";
    };

    const getBackBtnClass = () => {
        if (menuCategory === "HOUSE") return "text-pastel-blue-text hover:bg-pastel-blue-100";
        if (menuCategory === "GREEN") return "text-pastel-pink-text hover:bg-pastel-pink-100";
        if (menuCategory === "SMOOTHIE") return "text-pastel-yellow-text hover:bg-pastel-yellow-100";
        return "text-gray-500 hover:text-brand-blue";
    };

    return (
        <div className="flex-1 flex flex-col gap-2 animate-fade-in overflow-y-auto custom-scroll">
            <button 
                onClick={() => { 
                    if (menuCategory === null) {
                        resetToHome(); 
                    } else {
                        setMenuCategory(null); 
                    }
                }} 
                className={`mb-2 font-medium flex items-center gap-2 px-3 py-2 rounded-win ${getBackBtnClass()}`}
            >
                <IconArrowLeft size={18}/> {t('btn_back')}
            </button>
            <h3 className="font-bold text-gray-500 text-xs uppercase tracking-wider mb-2 px-1">
                {menuCategory || "MENU"}
            </h3>
            
            {!menuCategory ? (
                <div className="flex flex-col gap-3">
                    <p className="text-gray-600 text-sm mb-2">{t('uni_select_category')}</p>
                    <button 
                        onClick={() => setMenuCategory("HOUSE")} 
                        className="bg-pastel-blue-50 text-pastel-blue-text p-4 rounded-win shadow-sm hover:bg-pastel-blue-100 transition-all font-semibold text-left"
                    >
                        🐟 {t('menu_house')}
                    </button>
                    <button 
                        onClick={() => setMenuCategory("GREEN")} 
                        className="bg-pastel-pink-50 text-pastel-pink-text p-4 rounded-win shadow-sm hover:bg-pastel-pink-100 transition-all font-semibold text-left"
                    >
                        🥗 {t('menu_green')}
                    </button>
                    <button 
                        onClick={() => setMenuCategory("SMOOTHIE")} 
                        className="bg-pastel-yellow-50 text-pastel-yellow-text p-4 rounded-win shadow-sm hover:bg-pastel-yellow-100 transition-all font-semibold text-left"
                    >
                        🥤 {t('menu_smoothie')}
                    </button>
                </div>
            ) : (
                recipes
                    .filter(r => r.category === menuCategory)
                    .map(recipe => ( 
                        <button 
                            key={recipe.id} 
                            onClick={() => startUniversityLevel(recipe)} 
                            className={`p-4 rounded-win text-left font-medium text-sm transition-all ${
                                selectedRecipe?.id === recipe.id 
                                    ? "bg-white/80 shadow-md scale-[1.02] font-bold" 
                                    : `bg-transparent ${getRecipeHoverClass()}`
                            }`}
                        >
                            {recipe.name}
                        </button> 
                    ))
            )}
        </div>
    );
}
