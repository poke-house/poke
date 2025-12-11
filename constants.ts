import { IngredientDB, Recipe, Theme, Phase, BilingualMessage } from './types';

export const SUCCESS_MESSAGES: BilingualMessage[] = [
    { pt: "Ficou perfeita! 🤩", en: "It turned out perfect! 🤩" },
    { pt: "Estudou direitinho! ✅", en: "You studied well! ✅" },
    { pt: "Igualzinha ao SOP! 📚", en: "Just like the SOP! 📚" },
    { pt: "Que mente de titânio! 🧠", en: "What a titanium mind! 🧠" }
];

export const FAIL_MESSAGES: BilingualMessage[] = [
    { pt: "Algo não tá legal. 🤨", en: "Something is not right. 🤨" },
    { pt: "O cliente vai reclamar. 🤦🏻‍♂️", en: "The customer will complain. 🤦🏻‍♂️" },
    { pt: "Precisamos revisar o SOP. 📚", en: "We need to review the SOP. 📚" }
];

export const PA_NAMES = { MALE: ["Pedro", "Paulo", "Francisco", "Heitor", "Marcelo", "José"], FEMALE: ["Inês", "Eliz", "Melissa", "Mariana", "Vilma", "Bruna"] };
export const PA_EMOJIS = { MALE: ["👨", "🧔🏻", "👨🏿", "👨🏿‍🦰"], FEMALE: ["👩🏻", "👩🏻‍🦰", "👩🏿", "👩"] };

export const FINAL_CUSTOM_PHRASES: BilingualMessage[] = [
    { pt: "Uau! Ficou linda sua bowl!", en: "Wow! Your bowl looks beautiful!" },
    { pt: "Bom apetite!", en: "Enjoy your meal!" },
    { pt: "Prontinho! Experimente um dos nosso sumos.", en: "All done! Try one of our smoothies." },
    { pt: "Seu rosto é famíliar, já é nosso cliente né?", en: "Your face is familiar, you're a regular right?" },
    { pt: "Muito obrigado, volte mais vezes!", en: "Thank you very much, come back soon!" }
];

export const CHANGELOG = [
    { version: "4.28", date: "Atual", changes: ["Adicionado suporte a Inglês (EN).", "Botão de troca de idioma no canto inferior direito."] },
    { version: "4.27", date: "Anterior", changes: ["Textos de instrução personalizados para 'Tamanho' e 'Base' no modo House Bowl."] },
    { version: "4.26", date: "Anterior", changes: ["Histórico de versões limitado às 5 mais recentes."] },
    { version: "4.25", date: "Anterior", changes: ["Cor do título 'Molho' no modo Crie sua Bowl atualizada para laranja.", "Mensagem final do Crie sua Bowl simplificada (sem emoji, texto fixo)."] },
    { version: "4.24", date: "Anterior", changes: ["Removido o molho 'Soja e Sésamo' da lista de ingredientes."] },
    { version: "4.23", date: "Anterior", changes: ["Correção da animação da salada na Home Desktop.", "Textos e cores do 'Crie sua Bowl' atualizados.", "Estilo dos botões de oferta de Sésamo atualizado.", "Receita do Cozy Chicken corrigida."] },
    { version: "4.22", date: "Anterior", changes: ["Receita do Cozy Chicken atualizada.", "Animações na Sidebar e Home.", "Ajuste de preços e textos no 'Crie sua Bowl'."] },
    { version: "4.21", date: "Anterior", changes: ["Estilização minimalista dos botões de navegação no 'Crie sua Bowl'."] },
    { version: "4.20", date: "Anterior", changes: ["Categorização dos Greens no 'Crie sua Bowl'.", "Lógica de preços para itens Premium e Extras."] },
    { version: "4.19", date: "Anterior", changes: ["Botões de tamanho no 'Crie sua Bowl' atualizados para fundo branco."] },
    { version: "4.18", date: "Anterior", changes: ["Botão 'Voltar' adicionado às fases de escolha de lugar e tamanho no 'Crie sua Bowl'."] },
    { version: "4.17", date: "Anterior", changes: ["Cores da tela de Sucesso atualizadas."] },
    { version: "4.16", date: "Anterior", changes: ["Correção do botão 'Voltar' da sidebar."] },
    { version: "4.15", date: "Anterior", changes: ["Contador de porções com cores temáticas no 'Crie sua Bowl'."] },
    { version: "4.14", date: "Anterior", changes: ["Contador de porções adicionado ao modo 'Crie sua Bowl'."] },
    { version: "4.13", date: "Anterior", changes: ["Fundo 'Peach' sem caixas brancas na Home.", "Cor da fonte da Home alterada para Azul Escuro.", "Logo centralizado."] },
    { version: "4.12", date: "Anterior", changes: ["Títulos do 'Crie sua Bowl' em azul pastel.", "Botão 'Voltar ao Início' centralizado.", "Correção de opções duplicadas."] },
    { version: "4.11", date: "Anterior", changes: ["Layout Mobile reorganizado.", "Botão de versão abaixado."] }
];

export const INGREDIENTS_DB: IngredientDB = {
    sizes: ["Regular", "Large"],
    bases: ["Arroz de sushi", "Arroz preto", "Quinoa", "Arroz basmati", "Coconut Basmati", "Espinafres", "Winter Salad"],
    sauces_base: ["Azeite", "Azeite de Limão", "Vinagrete", "Ponzu", "Sriracha Mayo", "Não leva"],
    greens: ["Batata Doce com Alecrim", "Brócolis", "Pickle Cebola", "Beterraba", "Cenoura c/ Soja", "Milho", "Abacaxi", "Edamame", "Tomate Cherry", "Couve roxa", "Courgette", "Cenoura", "Grana Padano", "Pepino", "Feta", "Jalapeños", "Azeitonas", "Abacate", "Philadelphia", "Wakame", "Manga", "Hummus"],
    proteins: ["Salmão Braseado", "Filé de Salmão", "Frango Vietnamita", "Camarão Panado", "Frango", "Frango Teriyaki", "Camarão", "Juicy Salmon", "Juicy Tuna", "Salmão", "Atum", "Tofu Grelhado", "Ovo", "Não leva", "Wakame"],
    sauces_final: ["Creamy Caesar", "Creme de Abacate", "Spicy Peanuts", "Mel", "Chipotle", "Sésamo Shoyu", "Sriracha Mayo", "Wasabi Mayo", "Azeite", "Azeite de Limão", "Manjericão e Hortelã", "Vinagrete", "Soja", "Teriyaki", "Ponzu", "Especial"],
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
    { id: 12, category: "GREEN", name: "Cozy Chicken 🥗", variants: { "Regular": { base: ["Arroz basmati", "Espinafres", "Espinafres"], sauce_base: ["Azeite de Limão"], greens: ["Brócolis", "Batata Doce com Alecrim", "Couve roxa", "Courgette"], protein: ["Frango Vietnamita", "Frango Vietnamita", "Frango Vietnamita"], sauce_final: ["Soja"], crispy: ["Não leva"], sesame: ["Não"] } } },
    { id: 13, category: "SMOOTHIE", name: "Into the Sun 💛", smoothie_liquid: ["Leite de Coco"], smoothie_amount: ["150ml"], smoothie_ingredients: ["Manga 40g", "Manga 40g", "Ananás 30g", "Ananás 30g", "Banana 90g"], smoothie_ice: ["Gelo 60g"], smoothie_mode: ["Modo E", "Modo E"] },
    { id: 14, category: "SMOOTHIE", name: "Sweet Pink 🩷", smoothie_liquid: ["Leite"], smoothie_amount: ["150ml"], smoothie_ingredients: ["Morango", "Morango", "Morango", "Morango", "Banana 90g"], smoothie_ice: ["Gelo 60g"], smoothie_mode: ["Modo E", "Modo E"] },
    { id: 15, category: "SMOOTHIE", name: "So Green 💚", smoothie_liquid: ["Suco de Maçã"], smoothie_amount: ["250ml"], smoothie_ingredients: ["Pepino 20g", "Abacate 45g", "Espinafre 30g", "Sumo de Lima 25g", "Gengibre 5g"], smoothie_ice: ["Gelo 60g"], smoothie_mode: ["Modo E", "Modo E"] }
];

export const PHASES_BOWL: Phase[] = [{ key: "size", title: "Tamanho" }, { key: "base", title: "Base" }, { key: "sauce_base", title: "Molho da base" }, { key: "greens", title: "Greens" }, { key: "protein", title: "Proteína" }, { key: "sauce_final", title: "Molho final" }, { key: "crispy", title: "Crispy" }, { key: "sesame", title: "Sésamo" }];
export const PHASES_SMOOTHIE: Phase[] = [{ key: "smoothie_liquid", title: "Líquido" }, { key: "smoothie_amount", title: "Quantidade" }, { key: "smoothie_ingredients", title: "Ingredientes" }, { key: "smoothie_ice", title: "Gelo" }, { key: "smoothie_mode", title: "Blender" }];

export const THEMES: { [key: string]: Theme } = {
    HOUSE: {
        bg: "bg-pastel-blue-50/95", 
        border: "border-transparent",
        text: "text-pastel-blue-text",
        btn_default: "bg-pastel-blue-100 text-pastel-blue-text hover:bg-pastel-blue-200 shadow-sm",
        btn_active: "bg-pastel-blue-300 text-pastel-blue-text shadow-inner",
        binary: ["bg-pastel-blue-100 text-pastel-blue-text shadow-sm", "bg-pastel-blue-300 text-pastel-blue-text shadow-sm"]
    },
    GREEN: {
        bg: "bg-pastel-pink-50/95", 
        border: "border-pastel-pink-300",
        text: "text-pastel-pink-text",
        btn_default: "bg-pastel-pink-100 text-pastel-pink-text hover:bg-pastel-pink-200 shadow-sm",
        btn_active: "bg-pastel-pink-300 text-pastel-pink-text shadow-inner",
        binary: ["bg-pastel-yellow-100 text-pastel-yellow-text", "bg-pastel-blue-100 text-pastel-blue-text"]
    },
    SMOOTHIE: {
        bg: "bg-pastel-yellow-50/95",
        border: "border-pastel-yellow-300",
        text: "text-pastel-yellow-text",
        btn_default: "bg-pastel-yellow-100 text-pastel-yellow-text hover:bg-pastel-yellow-200 shadow-sm",
        btn_active: "bg-pastel-yellow-300 text-pastel-yellow-text shadow-inner",
        binary: ["bg-pastel-pink-100 text-pastel-pink-text", "bg-pastel-blue-100 text-pastel-blue-text"]
    }
};