
import { IngredientDB, Recipe, Theme, Phase, BilingualMessage, QuizQuestion } from './types';

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

export const RUSH_MESSAGES = [
    { threshold: 2, msg: { pt: "Foi tranquilo hoje 🤙", en: "Easy day today 🤙" } },
    { threshold: 5, msg: { pt: "O delivery deu uma pegada hoje ein! 🛵", en: "Delivery was intense today! 🛵" } },
    { threshold: 10, msg: { pt: "Gente, tem promoção ativa? 🤔", en: "Guys, is there an active promo? 🤔" } },
    { threshold: 15, msg: { pt: "2x1 de Chicken 😮", en: "2 for 1 Chicken 😮" } },
    { threshold: 20, msg: { pt: "🆘 Benedita liberou uma promoção!!", en: "🆘 Benedita released a promo!!" } },
    { threshold: 25, msg: { pt: "🔥modo On Fire ON🔥", en: "🔥On Fire Mode ON🔥" } }
];

export const CHANGELOG = [
    { version: "5.30", date: "Hoje", changes: ["SOP Update: Sushi Rice agora é medido em gramas (180g Regular / 270g Large).", "Removido termo 'Arroz de sushi' genérico para evitar confusão.", "Melhoria na lógica de alternativas: opções de peso similares aparecem nos testes."] },
    { version: "5.25", date: "Anterior", changes: ["Correção visual do modo University no Mobile.", "Cards 3D agora são responsivos e cabem lado a lado no celular."] },
    { version: "5.20", date: "Anterior", changes: ["Novo modo: 🎓 University.", "Aprenda as receitas passo a passo.", "Visualização em pilha de ingredientes."] }
];

export const QUIZ_QUESTIONS: QuizQuestion[] = [
    { id: 1, question: "Qual é a proteína principal da Cozy Chicken?", options: ["Frango Vietnamita", "Frango Teriyaki", "Frango Grelhado", "Tofu"] },
    { id: 2, question: "Quais são os dois novos Appetizers introduzidos no MR9?", options: ["Hummus & Croutons e Egg & Spinach", "Edamame e Seaweed", "Tosta de Abacate e Salmão", "Batata Doce e Molho"] },
    { id: 3, question: "O \"Egg & Spinach\" contém quantos ovos?", options: ["2", "1", "3", "4"] },
    { id: 4, question: "Onde foi fundada a Poke House?", options: ["Milão", "Los Angeles", "Lisboa", "Londres"] },
    { id: 5, question: "O que significa \"Poke\" em havaiano?", options: ["Cortado em cubos", "Peixe fresco", "Arroz cozido", "Prato de peixe"] },
    { id: 6, question: "O Sésamo conta como um dos 2 Toppings incluídos?", options: ["Não", "Sim"] },
    { id: 7, question: "Quantos Mochis vêm na promoção de 3.50?", options: ["2 Mochis", "1 Mochi", "3 Mochis", "4 Mochis"] },
    { id: 8, question: "O que significa FOH?", options: ["Front of House", "Full of House", "Fresh of House", "Fast of House"] },
    { id: 9, question: "O que significa BOH?", options: ["Back of House", "Best of House", "Base of House", "Big of House"] },
    { id: 10, question: "O que é um \"Tiger\"?", options: ["Recipiente de arroz", "Um tipo de molho", "Uma faca", "Uma bowl"] },
    { id: 11, question: "Qual a validade das Proteínas Juicy?", options: ["2 horas", "4 horas", "24 horas", "30 minutos"] },
    { id: 12, question: "Qual o peso de um scoop de Salmão?", options: ["45g - Scoop 1/36", "30g - Scoop 1/50", "60g - Scoop 1/20", "90g - Scoop 1/8"] },
    { id: 13, question: "O que é a Poke House Squad?", options: ["Programa de Fidelidade", "Nome da equipa", "Prato especial", "App de descontos"] },
    { id: 14, question: "O que o cliente ganha a cada 10 pokes comprados na Squad?", options: ["Um poke grátis", "Uma bebida", "Um topping", "Um desconto de 50%"] },
    { id: 15, question: "O que significa HACCP?", options: ["Análise de Perigos e Pontos Críticos de Controle", "Higiene Alimentar e Controlo de Cozinha", "Manual de Segurança Alimentar", "Regras de Limpeza Profissional"] },
    { id: 16, question: "Qual a temperatura correta dos frigoríficos?", options: ["0 a 4 graus", "-18 graus", "10 graus", "20 graus"] },
    { id: 17, question: "É permitido usar anéis ou pulseiras na linha?", options: ["Não", "Sim"] },
    { id: 18, question: "Quais as principais plataformas de delivery?", options: ["Glovo, Uber Eats, Bolt", "Deliveroo, Just Eat", "Glovo, Zomato", "Uber Eats, Foodpanda"] },
    { id: 19, question: "O que deve ser escrito, prioritariamente, na tampa da bowl de delivery?", options: ["Nome do cliente e um coração", "Nome do estafeta", "Número do pedido", "Nome da bowl"] },
    { id: 20, question: "Qual a cor da T-shirt do Poke Artist?", options: ["Azul com logótipo", "Branca com logótipo", "Preta com logótipo", "Rosa com logótipo"] },
    { id: 21, question: "Qual a cor da T-shirt do Store Manager?", options: ["Branca com logótipo", "Azul com logótipo", "Preta com logótipo", "Cinzenta com logótipo"] },
    { id: 22, question: "O que significa \"Be Honest, Stay Humble\"?", options: ["Ser honesto, manter-se humilde", "Ser rápido, ser limpo", "Trabalhar muito, sorrir", "Ser pontual, respeitar"] },
    { id: 23, question: "Quais são as duas novas House Bowls de Inverno?", options: ["Velvet Garden e Cozy Chicken", "Winter Salmon e Spicy Chicken", "Garden Mix e Hot Tuna", "Sweet Potato e Crispy Chicken"] },
    { id: 24, question: "Qual é a porção padrão da Winter Salad?", options: ["1 pinça de salada / 35g", "2 pinças de salada", "1 scoop 1/20", "1 mão cheia"] },
    { id: 25, question: "Qual é o scoop utilizado para o Hummus na categoria Green?", options: ["Scoop 1/36 Rasa", "Scoop 1/20 Cheia", "Scoop 1/50 Rasa", "Scoop 1/36 Cheia"] },
    { id: 26, question: "Qual é a gramagem de uma porção de Pickle Cebola?", options: ["20g / 1 pinça", "10g / 1 colher", "30g / 1 scoop", "40g / 2 pinças"] },
    { id: 27, question: "Qual scoop se usa para a Cenoura, Sésamo e Soja (Warm)?", options: ["Scoop 1/20 Rasa", "Scoop 1/36 Cheia", "Pinça", "Scoop 1/8"] },
    { id: 28, question: "Qual a validade da Cenoura, Sésamo e Soja no balcão (warm)?", options: ["4 horas", "2 horas", "8 horas", "24 horas"] },
    { id: 29, question: "Qual scoop se usa para o Frango Vietnamita?", options: ["Scoop 1/20 Rasa / 45g", "Scoop 1/36 / 30g", "Pinça / 40g", "Scoop 1/8 / 90g"] },
    { id: 30, question: "Qual é a porção de Frango Congelado (Warm)?", options: ["1 pinça de frango / 45g", "1 scoop 1/20 / 50g", "2 pinças de frango", "1 colher de servir"] },
    { id: 31, question: "Quantos pedaços compõem uma porção de Camarão Panado?", options: ["4 pedaços / 33g", "2 pedaços / 15g", "6 pedaços / 50g", "8 pedaços / 66g"] },
    { id: 32, question: "Qual a porção padrão do Molho?", options: ["15/20 zig zag", "3 voltas", "5 gotas", "2 colheres"] },
    { id: 33, question: "Qual a Proteína usada nos Smoothies?", options: ["Proteína de Baunilha", "Proteína de Chocolate", "Proteína de Morango", "Whey Neutra"] },
    { id: 34, question: "Qual o scoop para a Cebola Crocante?", options: ["Scoop 1/50 Rasa", "Scoop 1/36 Cheia", "Colher de sopa", "Mão"] },
    { id: 35, question: "Qual a quantidade de Amêndoa por porção?", options: ["1 Scoop 1/50 Rasa", "1 Scoop 1/36 Rasa", "1 colher de chá", "2 pinçadas"] },
    { id: 36, question: "É permitido armazenar caixas de papelão no frigorífico?", options: ["Não", "Sim"] },
    { id: 37, question: "Na bowl \"Cozy Chicken\", quantas pinças de espinafre se usam?", options: ["2 pinças", "1 pinça", "3 pinças", "4 pinças"] },
    { id: 38, question: "Quanto vai de arroz de sushi na bowl regular?", options: ["180g", "150g", "200g", "250g"] },
    { id: 39, question: "Quanto vai de arroz de sushi na bowl large?", options: ["270g", "300g", "350g", "400g"] },
    { id: 40, question: "Na \"Exotic Salmon\", qual molho vai na base?", options: ["Azeite de Limão", "Molho de Soja", "Vinagrete", "Azeite virgem"] },
    { id: 41, question: "Qual molho usamos na base Espinafres?", options: ["Azeite", "Vinagrete", "Molho Ponzu", "Molho Teriyaki"] },
    { id: 42, question: "Qual molho usamos na base Mistura de Alfaces?", options: ["Vinagrete", "Azeite de Limão", "Molho Caesar", "Molho de Soja"] },
    { id: 43, question: "O camarão panado contém glúten?", options: ["Sim", "Não"] },
    { id: 44, question: "O que significa \"Waste\"?", options: ["Desperdício/Lixo", "Limpeza", "Armazenamento", "Produção"] },
    { id: 45, question: "O que se coloca no fundo da \"Sweet Potatoes\" appetizer?", options: ["15 zig zag de Sriracha Mayo", "3 voltas de Molho Teriyaki", "Uma cama de alface", "1 scoop de Hummus"] },
    { id: 46, question: "Em que ano foi fundada a Poke House?", options: ["2018", "2015", "2016", "2020"] },
    { id: 47, question: "Quem são os dois fundadores?", options: ["Matteo Pichi e Vittoria Zanetti", "Marco Rossi e Giulia Bianchi", "João Silva e Maria Costa", "Luca Verdi e Anna Neri"] },
    { id: 48, question: "Quantas proteínas estão incluídas numa Bowl Regular?", options: ["2 proteínas", "1 proteína", "3 proteínas", "4 proteínas"] },
    { id: 49, question: "Quantas proteínas estão incluídas numa Bowl Large?", options: ["3 proteínas", "2 proteínas", "4 proteínas", "5 proteínas"] },
    { id: 50, question: "Quantos Greens estão incluídos numa Bowl Regular?", options: ["4 greens", "2 greens", "3 greens", "5 greens"] },
    { id: 51, question: "Quantos Greens estão incluídos numa Bowl Large?", options: ["5 greens", "3 greens", "4 greens", "6 greens"] },
    { id: 52, question: "Quantos Toppings (Crispy) estão incluídos em qualquer tamanho?", options: ["2 toppings", "1 topping", "3 toppings", "4 toppings"] },
    { id: 53, question: "Qual molho vai na HB Vegetarian?", options: ["Hortelã e Manjericão", "Molho Teriyaki", "Molho Ponzu", "Spicy Mayo"] },
    { id: 54, question: "Quais molhos vão na HB Crispy Shrimp?", options: ["Teriyaki e Sriracha Mayo", "Ponzu e Spicy Mayo", "Molho Especial e Creme de Abacate", "Azeite de Limão e Soja"] },
    { id: 55, question: "Quantas folhas de alga nori correspondem a UMA porção?", options: ["5", "3", "1", "4"] },
    { id: 56, question: "Qual o tempo de descongelação dos Brócolos no frigorífico?", options: ["12 horas", "24 horas", "6 horas", "48 horas"] },
    { id: 57, question: "Qual a melhor loja de Poke do mundo?", options: ["Poke House", "Outra", "Nenhuma", "Todas"] },
    { id: 58, question: "Qual o peso de corte ideal para um pedaço de Brócolo?", options: ["10 g", "5 g", "20 g", "15 g"] },
    { id: 60, question: "Qual o molho final da \"Exotic Salmon\"?", options: ["Sriracha Mayo", "Teriyaki", "Ponzu", "Molho Especial"] },
    { id: 61, question: "Que queijo é usado na \"Velvet Garden\"?", options: ["Feta Crumble", "Grana Padano", "Philadelphia", "Mozzarella"] },
    { id: 62, question: "Qual a base da \"Cozy Chicken\"?", options: ["Arroz Basmati", "Arroz de Sushi", "Winter Salad", "Quinoa"] },
    { id: 63, question: "Quantos scoops de Hummus leva o Appetizer \"Hummus & Croutons\"?", options: ["4 scoops", "2 scoops", "3 scoops", "5 scoops"] },
    { id: 64, question: "Na \"Avocado House Toast\", o que se usa para espalhar o abacate?", options: ["Um garfo", "Uma faca", "Uma colher", "Uma espátula"] },
    { id: 65, question: "Quantas bananas leva o Smoothie \"Into The Sun\"?", options: ["1 banana", "Metade de uma banana", "2 bananas", "Nenhuma"] },
    { id: 66, question: "Qual a quantidade de gelo para os Smoothies?", options: ["1/3 do copo", "Copo cheio", "2 cubos", "Metade do copo"] },
    { id: 67, question: "Quantas pinças de frango leva a bowl \"The Caesar\"?", options: ["3 pinças", "2 pinças", "1 pinça", "4 pinças"] },
    { id: 68, question: "Que ingrediente é adicionado ao Smoothie \"Into The Sun\" além das frutas?", options: ["Leite de Coco", "Iogurte", "Mel", "Hortelã"] },
    { id: 69, question: "Quantos filetes de salmão leva a \"Exotic Salmon\"?", options: ["3 filetes", "2 filetes", "1 filete", "4 filetes"] },
    { id: 70, question: "Qual o líquido base do Smoothie \"So Green\"?", options: ["Sumo de Maçã", "Leite", "Água de Coco", "Sumo de Laranja"] },
    { id: 71, question: "Qual o líquido base do Smoothie \"Sweet Pink\"?", options: ["Leite", "Leite de Coco", "Sumo de Maçã", "Água"] },
    { id: 72, question: "Qual aplicativo usamos para imprimir labels?", options: ["iFlares", "Jolt", "Labely", "iFlares BackOffice"] }
];

export const INGREDIENTS_DB: IngredientDB = {
    sizes: ["Regular", "Large"],
    bases: ["180g Arroz de sushi", "270g Arroz de sushi", "150g Arroz de sushi", "200g Arroz de sushi", "250g Arroz de sushi", "300g Arroz de sushi", "Arroz preto", "Quinoa", "Arroz basmati", "Coconut Basmati", "Espinafres", "Winter Salad"],
    sauces_base: ["Azeite", "Azeite de Limão", "Vinagrete", "Ponzu", "Sriracha Mayo", "Não leva"],
    greens: ["Batata Doce com Alecrim", "Brócolis", "Pickle Cebola", "Beterraba", "Cenoura c/ Soja", "Milho", "Abacaxi", "Edamame", "Tomate Cherry", "Couve roxa", "Courgette", "Cenoura", "Grana Padano", "Pepino", "Feta", "Jalapeños", "Azeitonas", "Abacate", "Philadelphia", "Wakame", "Manga", "Hummus"],
    proteins: ["Salmão Braseado", "Filé de Salmão", "Frango Vietnamita", "Camarão Panado", "Frango", "Frango Teriyaki", "Camarão", "Juicy Salmon", "Juicy Tuna", "Salmão", "Atum", "Tofu Grelhado", "Ovo", "Não leva", "Wakame"],
    sauces_final: ["Creamy Caesar", "Creme de Abacate", "Spicy Peanuts", "Mel", "Chipotle", "Sésamo Shoyu", "Sriracha Mayo", "Wasabi Mayo", "Azeite", "Azeite de Limão", "Manjericão e Hortelã", "Vinagrete", "Soja", "Teriyaki", "Ponzu", "Especial"],
    crispies: ["Ervilhas Wasabi", "Algas Nori", "Amêndoa", "Lima", "Bacon", "Croutons", "Batata Doce Crocante", "Não leva", "Cebola Crocante"],
    sesame: ["Sim", "Não"],
    smoothie_liquid: ["Leite de Coco", "Leite", "Suco de Maçã"],
    smoothie_amount: ["150ml", "250ml", "200ml"],
    smoothie_ingredients: ["Morango", "Banana 90g", "Manga 40g", "Ananás 30g", "Pepino 20g", "Abacate 45g", "Espinafre 30g", "Sumo de Lima 25g", "Gengibre 5g"],
    smoothie_ice: ["Gelo 60g", "Gelo 40g", "Gelo 90g"],
    smoothie_mode: ["Modo A", "Modo B", "Modo C", "Modo D", "Modo E", "Modo F"]
};

export const RECIPES: Recipe[] = [
    { id: 1, category: "HOUSE", name: "Sunny Salmon 🌞", variants: { "Regular": { base: ["180g Arroz de sushi"], sauce_base: ["Não leva"], greens: ["Abacate", "Couve roxa", "Edamame"], protein: ["Juicy Salmon", "Juicy Salmon"], sauce_final: ["Especial", "Creme de Abacate"], crispy: ["Não leva"], sesame: ["Sim"] }, "Large": { base: ["270g Arroz de sushi"], sauce_base: ["Não leva"], greens: ["Abacate", "Couve roxa", "Couve roxa", "Edamame", "Edamame"], protein: ["Juicy Salmon", "Juicy Salmon", "Juicy Salmon"], sauce_final: ["Especial", "Creme de Abacate"], crispy: ["Não leva"], sesame: ["Sim"] } } },
    { id: 2, category: "HOUSE", name: "Spicy Tuna 🐟", variants: { "Regular": { base: ["180g Arroz de sushi"], sauce_base: ["Não leva"], greens: ["Couve roxa", "Pepino", "Cenoura"], protein: ["Atum", "Atum", "Wakame"], sauce_final: ["Ponzu", "Spicy Peanuts"], crispy: ["Cebola Crocante"], sesame: ["Sim"] }, "Large": { base: ["270g Arroz de sushi"], sauce_base: ["Não leva"], greens: ["Couve roxa", "Couve roxa", "Pepino", "Pepino", "Cenoura"], protein: ["Atum", "Atum", "Atum", "Wakame"], sauce_final: ["Ponzu", "Spicy Peanuts"], crispy: ["Cebola Crocante"], sesame: ["Sim"] } } },
    { id: 3, category: "HOUSE", name: "Vegetarian 🌿", variants: { "Regular": { base: ["Arroz basmati", "Arroz basmati"], sauce_base: ["Não leva"], greens: ["Abacate", "Hummus", "Hummus", "Tomate Cherry", "Pepino", "Azeitonas"], protein: ["Não leva"], sauce_final: ["Manjericão e Hortelã"], crispy: ["Amêndoa"], sesame: ["Não"] }, "Large": { base: ["Arroz basmati", "Arroz basmati", "Arroz basmati"], sauce_base: ["Não leva"], greens: ["Abacate", "Hummus", "Hummus", "Hummus", "Tomate Cherry", "Pepino", "Azeitonas", "Azeitonas"], protein: ["Não leva"], sauce_final: ["Manjericão e Hortelã"], crispy: ["Amêndoa"], sesame: ["Não"] } } },
    { id: 4, category: "HOUSE", name: "Chicken 🐔", variants: { "Regular": { base: ["180g Arroz de sushi"], sauce_base: ["Não leva"], greens: ["Couve roxa", "Tomate Cherry", "Courgette"], protein: ["Frango Teriyaki", "Frango Teriyaki"], sauce_final: ["Teriyaki", "Sriracha Mayo"], crispy: ["Amêndoa"], sesame: ["Sim"] }, "Large": { base: ["270g Arroz de sushi"], sauce_base: ["Não leva"], greens: ["Couve roxa", "Couve roxa", "Tomate Cherry", "Courgette", "Courgette"], protein: ["Frango Teriyaki", "Frango Teriyaki", "Frango Teriyaki"], sauce_final: ["Teriyaki", "Sriracha Mayo"], crispy: ["Amêndoa"], sesame: ["Sim"] } } },
    { id: 5, category: "HOUSE", name: "Fire Salmon 🔥", variants: { "Regular": { base: ["180g Arroz de sushi"], sauce_base: ["Sriracha Mayo"], greens: ["Jalapeños", "Tomate Cherry", "Pepino"], protein: ["Salmão", "Salmão"], sauce_final: ["Sriracha Mayo"], crispy: ["Cebola Crocante"], sesame: ["Sim"] }, "Large": { base: ["270g Arroz de sushi"], sauce_base: ["Sriracha Mayo"], greens: ["Jalapeños", "Tomate Cherry", "Pepino", "Pepino"], protein: ["Salmão", "Salmão", "Salmão"], sauce_final: ["Sriracha Mayo"], crispy: ["Cebola Crocante"], sesame: ["Sim"] } } },
    { id: 6, category: "HOUSE", name: "Mixed Seas 🌊", variants: { "Regular": { base: ["180g Arroz de sushi"], sauce_base: ["Não leva"], greens: ["Manga", "Wakame", "Cenoura", "Pickle Cebola"], protein: ["Atum", "Salmão"], sauce_final: ["Ponzu"], crispy: ["Ervilhas Wasabi"], sesame: ["Sim"] }, "Large": { base: ["270g Arroz de sushi"], sauce_base: ["Não leva"], greens: ["Manga", "Wakame", "Cenoura", "Cenoura", "Pickle Cebola"], protein: ["Atum", "Salmão", "Salmão"], sauce_final: ["Ponzu"], crispy: ["Ervilhas Wasabi"], sesame: ["Sim"] } } },
    { id: 7, category: "HOUSE", name: "Crispy Shrimp 🦐", variants: { "Regular": { base: ["180g Arroz de sushi"], sauce_base: ["Não leva"], greens: ["Abacate", "Philadelphia", "Manga", "Pepino"], protein: Array(8).fill("Camarão Panado"), sauce_final: ["Teriyaki", "Sriracha Mayo"], crispy: ["Algas Nori"], sesame: ["Sim"] }, "Large": { base: ["270g Arroz de sushi"], sauce_base: ["Não leva"], greens: ["Abacate", "Philadelphia", "Manga", "Pepino", "Pepino"], protein: Array(12).fill("Camarão Panado"), sauce_final: ["Teriyaki", "Sriracha Mayo"], crispy: ["Algas Nori"], sesame: ["Sim"] } } },
    { id: 8, category: "HOUSE", name: "Salmon Sushi 🍣", variants: { "Regular": { base: ["180g Arroz de sushi"], sauce_base: ["Não leva"], greens: ["Abacate", "Philadelphia", "Edamame"], protein: ["Salmão Braseado", "Salmão Braseado"], sauce_final: ["Teriyaki"], crispy: ["Cebola Crocante"], sesame: ["Sim"] }, "Large": { base: ["270g Arroz de sushi"], sauce_base: ["Não leva"], greens: ["Abacate", "Philadelphia", "Edamame", "Edamame"], protein: ["Salmão Braseado", "Salmão Braseado", "Salmão Braseado"], sauce_final: ["Teriyaki"], crispy: ["Cebola Crocante"], sesame: ["Sim"] } } },
    { id: 9, category: "GREEN", name: "The Caesar 🥗", variants: { "Regular": { base: ["Winter Salad", "Winter Salad", "Winter Salad"], sauce_base: ["Vinagrete"], greens: ["Tomate Cherry", "Tomate Cherry", "Grana Padano"], protein: ["Frango", "Frango", "Frango"], sauce_final: ["Creamy Caesar"], crispy: ["Bacon", "Croutons", "Lima"], sesame: ["Não"] } } },
    { id: 10, category: "GREEN", name: "Exotic Salmon 🥗", variants: { "Regular": { base: ["Coconut Basmati", "Espinafres", "Espinafres", "Espinafres"], sauce_base: ["Azeite de Limão"], greens: ["Batata Doce com Alecrim", "Batata Doce com Alecrim", "Brócolis", "Abacate"], protein: ["Filé de Salmão", "Filé de Salmão", "Filé de Salmão"], sauce_final: ["Sriracha Mayo"], crispy: ["Não leva"], sesame: ["Não"] } } },
    { id: 11, category: "GREEN", name: "Velvet Garden 🥗", variants: { "Regular": { base: ["Winter Salad", "Winter Salad", "Winter Salad"], sauce_base: ["Vinagrete"], greens: ["Cenoura c/ Soja", "Beterraba", "Azeitonas", "Pickle Cebola", "Feta", "Feta", "Feta"], protein: ["Não leva"], sauce_final: ["Manjericão e Hortelã"], crispy: ["Não leva"], sesame: ["Não"] } } },
    { id: 12, category: "GREEN", name: "Cozy Chicken 🥗", variants: { "Regular": { base: ["Coconut Basmati", "Espinafres", "Espinafres"], sauce_base: ["Azeite de Limão"], greens: ["Brócolis", "Batata Doce com Alecrim", "Couve roxa", "Courgette"], protein: ["Frango Vietnamita", "Frango Vietnamita", "Frango Vietnamita"], sauce_final: ["Soja"], crispy: ["Não leva"], sesame: ["Não"] } } },
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
    },
    QUIZ: {
        bg: "bg-emerald-50/95",
        border: "border-emerald-200",
        text: "text-emerald-900",
        btn_default: "bg-emerald-50 text-emerald-900 border border-emerald-100 hover:bg-emerald-100 shadow-sm",
        btn_active: "bg-emerald-500 text-white shadow-md",
        binary: ["bg-emerald-100 text-emerald-900", "bg-emerald-200 text-emerald-900"]
    }
};
