/* ==========================================================================
   Casa Olivo · Datos de la carta
   Editá este archivo para cambiar platos, precios o categorías.

   Fotografías: agregá `image: "img/nombre.webp"` a cualquier plato y la
   carta la mostrará automáticamente (con lazy loading). Usá fotos reales
   del plato, idealmente 1200×900 px en WebP. Sin foto, se muestra la
   ilustración de línea de la categoría.

   layout de cada categoría (composición de la sección):
     grid     → dos columnas de platos
     feature  → el plato recomendado se destaca en grande
     numbered → lista editorial numerada
     cards    → tarjetas con imagen
     compact  → lista de precios compacta sobre fondo oscuro
   ========================================================================== */

const CATEGORIES = [
  { id: "entradas",    name: "Entradas",    layout: "grid",     unit: ["plato", "platos"] },
  { id: "principales", name: "Principales", layout: "feature",  unit: ["plato", "platos"] },
  { id: "pastas",      name: "Pastas",      layout: "numbered", unit: ["plato", "platos"] },
  { id: "postres",     name: "Postres",     layout: "cards",    unit: ["postre", "postres"] },
  { id: "bebidas",     name: "Bebidas",     layout: "compact",  unit: ["opción", "opciones"] },
];

const TAGS = {
  veg:   { label: "Vegetariano" },
  vegan: { label: "Vegano" },
  gf:    { label: "Sin TACC" },
  spicy: { label: "Picante" },
  chef:  { label: "Recomendado" },
};

const MENU = [
  // Entradas
  { id: 1, cat: "entradas", name: "Burrata con tomates asados", price: 9800,
    desc: "Burrata cremosa, tomates cherry confitados, pesto de albahaca y pan de masa madre.",
    tags: ["veg", "chef"], allergens: ["Lácteos", "Gluten", "Frutos secos"] },
  { id: 2, cat: "entradas", name: "Croquetas de jamón", price: 7900,
    desc: "Seis croquetas caseras de jamón serrano con alioli suave.",
    tags: [], allergens: ["Gluten", "Lácteos", "Huevo"] },
  { id: 3, cat: "entradas", name: "Hummus de garbanzos", price: 6500,
    desc: "Con aceite de oliva, pimentón ahumado, garbanzos crocantes y pan pita.",
    tags: ["vegan"], allergens: ["Sésamo", "Gluten"] },
  { id: 4, cat: "entradas", name: "Langostinos al ajillo", price: 11400,
    desc: "Salteados en aceite de oliva con ajo, guindilla y perejil fresco.",
    tags: ["gf", "spicy"], allergens: ["Crustáceos"] },

  // Principales
  { id: 5, cat: "principales", name: "Ojo de bife a la brasa", price: 21500,
    desc: "350 g madurado 21 días, chimichurri de la casa y papas rústicas.",
    tags: ["gf", "chef"], allergens: [] },
  { id: 6, cat: "principales", name: "Salmón con costra de hierbas", price: 18900,
    desc: "Sobre puré de coliflor, espárragos grillados y salsa de limón.",
    tags: ["gf"], allergens: ["Pescado", "Lácteos"] },
  { id: 7, cat: "principales", name: "Pollo de campo al limón", price: 14800,
    desc: "Medio pollo asado con romero, limón y vegetales de estación.",
    tags: ["gf"], allergens: [] },
  { id: 8, cat: "principales", name: "Berenjenas a la parmesana", price: 12600,
    desc: "Capas de berenjena, salsa de tomate casera, mozzarella y parmesano gratinado.",
    tags: ["veg"], allergens: ["Lácteos", "Gluten"] },
  { id: 9, cat: "principales", name: "Bowl de quinoa y vegetales", price: 11200,
    desc: "Quinoa, palta, garbanzos especiados, zanahoria asada y aderezo de tahini.",
    tags: ["vegan", "gf", "spicy"], allergens: ["Sésamo"] },

  // Pastas
  { id: 10, cat: "pastas", name: "Sorrentinos de calabaza", price: 12900,
    desc: "Rellenos de calabaza asada y queso, con manteca de salvia y nueces.",
    tags: ["veg", "chef"], allergens: ["Gluten", "Lácteos", "Huevo", "Frutos secos"] },
  { id: 11, cat: "pastas", name: "Tagliatelle al ragú", price: 13500,
    desc: "Pasta fresca con ragú de carne cocido a fuego lento durante 6 horas.",
    tags: [], allergens: ["Gluten", "Huevo", "Apio"] },
  { id: 12, cat: "pastas", name: "Penne arrabbiata", price: 10900,
    desc: "Salsa de tomate picante, ajo, aceite de oliva y perejil.",
    tags: ["vegan", "spicy"], allergens: ["Gluten"] },

  // Postres
  { id: 13, cat: "postres", name: "Tiramisú de la casa", price: 6800,
    desc: "Mascarpone, café espresso, vainillas y cacao amargo.",
    tags: ["veg", "chef"], allergens: ["Lácteos", "Huevo", "Gluten"] },
  { id: 14, cat: "postres", name: "Flan con dulce de leche", price: 5400,
    desc: "Flan casero con dulce de leche y crema batida.",
    tags: ["veg", "gf"], allergens: ["Lácteos", "Huevo"] },
  { id: 15, cat: "postres", name: "Sorbete de limón", price: 4900,
    desc: "Refrescante sorbete de limón con hojas de menta.",
    tags: ["vegan", "gf"], allergens: [] },

  // Bebidas
  { id: 16, cat: "bebidas", name: "Limonada de menta y jengibre", price: 3800,
    desc: "Jarra individual, sin alcohol.",
    tags: ["vegan", "gf"], allergens: [] },
  { id: 17, cat: "bebidas", name: "Copa de vino Malbec", price: 4500,
    desc: "Selección de bodega de Mendoza.",
    tags: ["vegan", "gf"], allergens: ["Sulfitos"] },
  { id: 18, cat: "bebidas", name: "Cerveza artesanal IPA", price: 4200,
    desc: "Pinta de 500 ml, cervecería local.",
    tags: ["vegan"], allergens: ["Gluten"] },
  { id: 19, cat: "bebidas", name: "Agua mineral", price: 2200,
    desc: "Con o sin gas, 500 ml.",
    tags: ["vegan", "gf"], allergens: [] },
];
