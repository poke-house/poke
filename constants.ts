import { IngredientDB, Recipe, Theme, Phase } from './types';

export const SUCCESS_MESSAGES = ["Ficou perfeita! 🤩", "Estudou direitinho! ✅", "Igualzinha ao SOP! 📚", "Que mente de titânio! 🧠"];
export const FAIL_MESSAGES = ["Algo não tá legal. 🤨", "O cliente vai reclamar. 🤦🏻‍♂️", "Precisamos revisar o SOP. 📚"];
export const PA_NAMES = { MALE: ["Pedro", "Paulo", "Francisco", "Heitor", "Marcelo", "José"], FEMALE: ["Inês", "Eliz", "Melissa", "Mariana", "Vilma", "Bruna"] };
export const PA_EMOJIS = { MALE: ["👨", "🧔🏻", "👨🏿", "👨🏿‍🦰"], FEMALE: ["👩🏻", "👩🏻‍🦰", "👩🏿", "👩"] };
export const FINAL_CUSTOM_PHRASES = ["Uau! Ficou linda sua bowl!", "Bom apetite!", "Prontinho! Experimente um dos nosso sumos.", "Seu rosto é famíliar, já é nosso cliente né?", "Muito obrigado, volte mais vezes!"];

export const CHANGELOG = [
    { version: "4.13", date: "Atual", changes: ["Atualização de UX.", "Logo Resize na barra lateral.", "Novos emojis nas receitas."] },
    { version: "4.12", date: "Anterior", changes: ["Títulos do 'Crie sua Bowl' em azul pastel.", "Botão 'Voltar ao Início' centralizado.", "Correção de opções duplicadas."] },
    { version: "4.11", date: "Anterior", changes: ["Layout Mobile reorganizado.", "Botão de versão abaixado."] }
];

export const INGREDIENTS_DB: IngredientDB = {
    sizes: ["Regular", "Large"],
    bases: ["Arroz de sushi", "Arroz preto", "Quinoa", "Arroz basmati", "Coconut Basmati", "Espinafres", "Winter Salad"],
    sauces_base: ["Azeite", "Azeite de Limão", "Vinagrete", "Ponzu", "Sriracha Mayo", "Não leva"],
    greens: ["Batata Doce com Alecrim", "Brócolis", "Pickle Cebola", "Beterraba", "Cenoura c/ Soja", "Milho", "Abacaxi", "Edamame", "Tomate Cherry", "Couve roxa", "Courgette", "Cenoura", "Grana Padano", "Pepino", "Feta", "Jalapeños", "Azeitonas", "Abacate", "Philadelphia", "Wakame", "Manga", "Hummus"],
    proteins: ["Salmão Braseado", "Filé de Salmão", "Frango Vietnamita", "Camarão Panado", "Frango", "Frango Teriyaki", "Camarão", "Juicy Salmon", "Juicy Tuna", "Salmão", "Atum", "Tofu Grelhado", "Ovo", "Não leva", "Wakame"],
    sauces_final: ["Creamy Caesar", "Creme de Abacate", "Spicy Peanuts", "Mel", "Chipotle", "Sésamo Shoyu", "Sriracha Mayo", "Wasabi Mayo", "Azeite", "Azeite de Limão", "Manjericão e Hortelã", "Vinagrete", "Soja", "Teriyaki", "Ponzu", "Especial", "Soja e Sésamo"],
    crispies: ["Cebola frita", "Ervilhas Wasabi", "Algas Nori", "Amêndoa", "Batata Doce", "Lima", "Bacon", "Croutons", "Batata Doce Crocante", "Não leva", "Cebola Crocante"],
    sesame: ["Sim", "Não"],
    smoothie_liquid: ["Leite de Coco", "Leite", "Suco de Maçã"],
    smoothie_amount: ["150ml", "250ml", "200ml"],
    smoothie_ingredients: ["Morango", "Banana 90g", "Manga 40g", "Ananás 30g", "Pepino 20g", "Abacate 45g", "Espinafre 30g", "Sumo de Lima 25g", "Gengibre 5g"],
    smoothie_ice: ["Gelo 60g", "Gelo 40g", "Gelo 90g"],
    smoothie_mode: ["Modo A", "Modo B", "Modo C", "Modo D", "Modo E", "Modo F"]
};

export const RECIPES: Recipe[] = [
    { id: 1, category: "HOUSE", name: "Sunny Salmon 🌞", variants: { "Regular": { base: ["Arroz de sushi", "Arroz de sushi"], sauce_base: ["Não leva"], greens: ["Abacate", "Couve roxa", "Edamame"], protein: ["Juicy Salmon", "Juicy Salmon"], sauce_final: ["Especial", "Creme de Abacate"], crispy: ["Não leva"], sesame: ["Sim"] }, "Large": { base: ["Arroz de sushi", "Arroz de sushi", "Arroz de sushi"], sauce_base: ["Não leva"], greens: ["Abacate", "Couve roxa", "Couve roxa", "Edamame", "Edamame"], protein: ["Juicy Salmon", "Juicy Salmon", "Juicy Salmon"], sauce_final: ["Especial", "Creme de Abacate"], crispy: ["Não leva"], sesame: ["Sim"] } } },
    { id: 2, category: "HOUSE", name: "Spicy Tuna 🐟", variants: { "Regular": { base: ["Arroz de sushi", "Arroz de sushi"], sauce_base: ["Não leva"], greens: ["Couve roxa", "Pepino", "Cenoura"], protein: ["Atum", "Atum", "Wakame"], sauce_final: ["Ponzu", "Spicy Peanuts"], crispy: ["Cebola frita"], sesame: ["Sim"] }, "Large": { base: ["Arroz de sushi", "Arroz de sushi", "Arroz de sushi"], sauce_base: ["Não leva"], greens: ["Couve roxa", "Couve roxa", "Pepino", "Pepino", "Cenoura"], protein: ["Atum", "Atum", "Atum", "Wakame"], sauce_final: ["Ponzu", "Spicy Peanuts"], crispy: ["Cebola frita"], sesame: ["Sim"] } } },
    { id: 3, category: "HOUSE", name: "Vegetarian 🌿", variants: { "Regular": { base: ["Arroz basmati", "Arroz basmati"], sauce_base: ["Não leva"], greens: ["Abacate", "Hummus", "Hummus", "Tomate Cherry", "Pepino", "Azeitonas"], protein: ["Não leva"], sauce_final: ["Manjericão e Hortelã"], crispy: ["Amêndoa"], sesame: ["Não"] }, "Large": { base: ["Arroz basmati", "Arroz basmati", "Arroz basmati"], sauce_base: ["Não leva"], greens: ["Abacate", "Hummus", "Hummus", "Hummus", "Tomate Cherry", "Pepino", "Azeitonas", "Azeitonas"], protein: ["Não leva"], sauce_final: ["Manjericão e Hortelã"], crispy: ["Amêndoa"], sesame: ["Não"] } } },
    { id: 4, category: "HOUSE", name: "Chicken 🐔", variants: { "Regular": { base: ["Arroz de sushi", "Arroz de sushi"], sauce_base: ["Não leva"], greens: ["Couve roxa", "Tomate Cherry", "Courgette"], protein: ["Frango Teriyaki", "Frango Teriyaki"], sauce_final: ["Teriyaki", "Sriracha Mayo"], crispy: ["Amêndoa"], sesame: ["Sim"] }, "Large": { base: ["Arroz de sushi", "Arroz de sushi", "Arroz de sushi"], sauce_base: ["Não leva"], greens: ["Couve roxa", "Couve roxa", "Tomate Cherry", "Courgette", "Courgette"], protein: ["Frango Teriyaki", "Frango Teriyaki", "Frango Teriyaki"], sauce_final: ["Teriyaki", "Sriracha Mayo"], crispy: ["Amêndoa"], sesame: ["Sim"] } } },
    { id: 5, category: "HOUSE", name: "Fire Salmon 🔥", variants: { "Regular": { base: ["Arroz de sushi", "Arroz de sushi"], sauce_base: ["Sriracha Mayo"], greens: ["Jalapeños", "Tomate Cherry", "Pepino"], protein: ["Salmão", "Salmão"], sauce_final: ["Sriracha Mayo"], crispy: ["Cebola frita"], sesame: ["Sim"] }, "Large": { base: ["Arroz de sushi", "Arroz de sushi", "Arroz de sushi"], sauce_base: ["Sriracha Mayo"], greens: ["Jalapeños", "Tomate Cherry", "Pepino", "Pepino"], protein: ["Salmão", "Salmão", "Salmão"], sauce_final: ["Sriracha Mayo"], crispy: ["Cebola frita"], sesame: ["Sim"] } } },
    { id: 6, category: "HOUSE", name: "Mixed Seas 🌊", variants: { "Regular": { base: ["Arroz de sushi", "Arroz de sushi"], sauce_base: ["Não leva"], greens: ["Manga", "Wakame", "Cenoura", "Pickle Cebola"], protein: ["Atum", "Salmão"], sauce_final: ["Ponzu"], crispy: ["Ervilhas Wasabi"], sesame: ["Sim"] }, "Large": { base: ["Arroz de sushi", "Arroz de sushi", "Arroz de sushi"], sauce_base: ["Não leva"], greens: ["Manga", "Wakame", "Cenoura", "Cenoura", "Pickle Cebola"], protein: ["Atum", "Salmão", "Salmão"], sauce_final: ["Ponzu"], crispy: ["Ervilhas Wasabi"], sesame: ["Sim"] } } },
    { id: 7, category: "HOUSE", name: "Crispy Shrimp 🦐", variants: { "Regular": { base: ["Arroz de sushi", "Arroz de sushi"], sauce_base: ["Não leva"], greens: ["Abacate", "Philadelphia", "Manga", "Pepino"], protein: Array(8).fill("Camarão Panado"), sauce_final: ["Teriyaki", "Sriracha Mayo"], crispy: ["Algas Nori"], sesame: ["Sim"] }, "Large": { base: ["Arroz de sushi", "Arroz de sushi", "Arroz de sushi"], sauce_base: ["Não leva"], greens: ["Abacate", "Philadelphia", "Manga", "Pepino", "Pepino"], protein: Array(12).fill("Camarão Panado"), sauce_final: ["Teriyaki", "Sriracha Mayo"], crispy: ["Algas Nori"], sesame: ["Sim"] } } },
    { id: 8, category: "HOUSE", name: "Salmon Sushi 🍣", variants: { "Regular": { base: ["Arroz de sushi", "Arroz de sushi"], sauce_base: ["Não leva"], greens: ["Abacate", "Philadelphia", "Edamame"], protein: ["Salmão Braseado", "Salmão Braseado"], sauce_final: ["Teriyaki"], crispy: ["Cebola Crocante"], sesame: ["Sim"] }, "Large": { base: ["Arroz de sushi", "Arroz de sushi", "Arroz de sushi"], sauce_base: ["Não leva"], greens: ["Abacate", "Philadelphia", "Edamame", "Edamame"], protein: ["Salmão Braseado", "Salmão Braseado", "Salmão Braseado"], sauce_final: ["Teriyaki"], crispy: ["Cebola Crocante"], sesame: ["Sim"] } } },
    { id: 9, category: "GREEN", name: "The Caesar 🥗", variants: { "Regular": { base: ["Winter Salad", "Winter Salad", "Winter Salad"], sauce_base: ["Vinagrete"], greens: ["Tomate Cherry", "Tomate Cherry", "Grana Padano"], protein: ["Frango", "Frango", "Frango"], sauce_final: ["Creamy Caesar"], crispy: ["Bacon", "Croutons", "Lima"], sesame: ["Não"] } } },
    { id: 10, category: "GREEN", name: "Exotic Salmon 🥗", variants: { "Regular": { base: ["Coconut Basmati", "Espinafres", "Espinafres", "Espinafres"], sauce_base: ["Azeite de Limão"], greens: ["Batata Doce com Alecrim", "Batata Doce com Alecrim", "Brócolis", "Abacate"], protein: ["Filé de Salmão", "Filé de Salmão", "Filé de Salmão"], sauce_final: ["Sriracha Mayo"], crispy: ["Não leva"], sesame: ["Não"] } } },
    { id: 11, category: "GREEN", name: "Velvet Garden 🥗", variants: { "Regular": { base: ["Winter Salad", "Winter Salad", "Winter Salad"], sauce_base: ["Vinagrete"], greens: ["Cenoura c/ Soja", "Beterraba", "Azeitonas", "Pickle Cebola", "Feta", "Feta", "Feta"], protein: ["Não leva"], sauce_final: ["Manjericão e Hortelã"], crispy: ["Não leva"], sesame: ["Não"] } } },
    { id: 12, category: "GREEN", name: "Cozy Chicken 🥗", variants: { "Regular": { base: ["Coconut Basmati", "Espinafres", "Espinafres"], sauce_base: ["Azeite de Limão"], greens: ["Brócolis", "Batata Doce com Alecrim", "Couve roxa", "Courgette"], protein: ["Frango Vietnamita", "Frango Vietnamita", "Frango Vietnamita"], sauce_final: ["Soja"], crispy: ["Não leva"], sesame: ["Não"] } } },
    { id: 13, category: "SMOOTHIE", name: "Into the Sun", smoothie_liquid: ["Leite de Coco"], smoothie_amount: ["150ml"], smoothie_ingredients: ["Manga 40g", "Manga 40g", "Ananás 30g", "Ananás 30g", "Banana 90g"], smoothie_ice: ["Gelo 60g"], smoothie_mode: ["Modo E", "Modo E"] },
    { id: 14, category: "SMOOTHIE", name: "Sweet Pink", smoothie_liquid: ["Leite"], smoothie_amount: ["150ml"], smoothie_ingredients: ["Morango", "Morango", "Morango", "Morango", "Banana 90g"], smoothie_ice: ["Gelo 60g"], smoothie_mode: ["Modo E", "Modo E"] },
    { id: 15, category: "SMOOTHIE", name: "So Green", smoothie_liquid: ["Suco de Maçã"], smoothie_amount: ["250ml"], smoothie_ingredients: ["Pepino 20g", "Abacate 45g", "Espinafre 30g", "Sumo de Lima 25g", "Gengibre 5g"], smoothie_ice: ["Gelo 60g"], smoothie_mode: ["Modo E", "Modo E"] }
];

export const PHASES_BOWL: Phase[] = [{ key: "size", title: "Tamanho" }, { key: "base", title: "Base" }, { key: "sauce_base", title: "Molho da base" }, { key: "greens", title: "Greens" }, { key: "protein", title: "Proteína" }, { key: "sauce_final", title: "Molho final" }, { key: "crispy", title: "Crispy" }, { key: "sesame", title: "Sésamo" }];
export const PHASES_SMOOTHIE: Phase[] = [{ key: "smoothie_liquid", title: "Líquido" }, { key: "smoothie_amount", title: "Quantidade" }, { key: "smoothie_ingredients", title: "Ingredientes" }, { key: "smoothie_ice", title: "Gelo" }, { key: "smoothie_mode", title: "Blender" }];

export const THEMES: { [key: string]: Theme } = {
    HOUSE: {
        bg: "bg-pastel-blue-50/95", 
        border: "border-pastel-blue-300",
        text: "text-pastel-blue-text",
        btn_default: "bg-white border-2 border-pastel-blue-200 text-gray-700 hover:border-pastel-blue-300",
        btn_active: "bg-pastel-blue-100 border-2 border-pastel-blue-500 text-pastel-blue-text",
        binary: ["bg-pastel-pink-100 border-pastel-pink-300 text-pastel-pink-text", "bg-pastel-blue-100 border-pastel-blue-300 text-pastel-blue-text"]
    },
    GREEN: {
        bg: "bg-pastel-pink-50/95", 
        border: "border-pastel-pink-300",
        text: "text-pastel-pink-text",
        btn_default: "bg-white border-2 border-pastel-pink-200 text-gray-700 hover:border-pastel-pink-300",
        btn_active: "bg-pastel-pink-100 border-2 border-pastel-pink-500 text-pastel-pink-text",
        binary: ["bg-pastel-yellow-100 border-pastel-yellow-300 text-pastel-yellow-text", "bg-pastel-blue-100 border-pastel-blue-300 text-pastel-blue-text"]
    },
    SMOOTHIE: {
        bg: "bg-pastel-yellow-50/95",
        border: "border-pastel-yellow-300",
        text: "text-pastel-yellow-text",
        btn_default: "bg-white border-2 border-pastel-yellow-200 text-gray-700 hover:border-pastel-yellow-300",
        btn_active: "bg-pastel-yellow-100 border-2 border-pastel-yellow-500 text-pastel-yellow-text",
        binary: ["bg-pastel-pink-100 border-pastel-pink-300 text-pastel-pink-text", "bg-pastel-blue-100 border-pastel-blue-300 text-pastel-blue-text"]
    }
};