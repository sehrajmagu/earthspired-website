/* =====================================================================
   EARTHSPIRED — PRODUCT CATALOGUE
   ---------------------------------------------------------------------
   This is the single source of truth for every brand and product on the
   website. Brand pages, product pages, search, cart and checkout all
   read from here — no page needs editing to add/edit/remove a product.

   TO ADD A PRODUCT:   copy one product block, give it a new unique `id`,
                       set `brand` to "indulge", "essence" or "sage",
                       and put its image(s) in assets/img/products/.
   TO REMOVE A PRODUCT: delete its block.
   PRICES:             whole rupees (e.g. 499 = ₹499).

   Optional fields can be removed or set to null and they are simply
   hidden on the site (e.g. materials, usage, stock).

   Product fields
   ---------------------------------------------------------------------
   id                URL-safe unique id (used in product.html?id=…)
   name              product name
   brand             "indulge" | "essence" | "sage"
   category          product category within the brand
   shortDescription  1–2 lines for product cards
   description       full description (product page)
   images            list of image paths (first = main image)
   variantLabel      heading for the variant picker, e.g. "Size", "Pack"
   variants          [{ id, label, price, unitPrice }]
   specifications    [{ label, value }]
   materialsLabel    "Ingredients" or "Materials"
   materials         ingredients / materials text (or null to hide)
   features          list of key features
   usage             usage instructions (or null to hide)
   stock             { status, quantity }
                       status: "in_stock" | "low_stock" | "out_of_stock",
                               or null to hide the stock line
                       quantity: number to cap cart quantity, or null
   faqs              [{ q, a }]
   featured          true = shown in "Featured products" on the homepage
   tags              extra search keywords
   ===================================================================== */

window.ES = window.ES || {};

/* ------------------------------ BRANDS ------------------------------ */
ES.BRANDS = {
  indulge: {
    id: "indulge",
    name: "INDULGE",
    category: "Food",
    page: "indulge.html",
    logo: "assets/img/logos/indulge.png",
    logoFull: "assets/img/logos/indulge-full.png",
    intro: "Pleasure, rooted in real grains.",
    overview: "INDULGE is food that rewards you. Ancient grains like millet and amaranth, baked rather than fried, become the cookies, chips and small bites you reach for between moments — golden, crisp and full of honest flavour. The kind of indulgence that leaves you feeling better for it.",
    story: "Food that rewards you — real grains, baked with care and made for savouring.",
    faqs: [
      { q: "What makes INDULGE different?", a: "Every INDULGE product is made with real grains such as millet and amaranth, and most are baked rather than fried — so the pleasure comes from flavour and texture, not shortcuts." },
      { q: "How should I store INDULGE products?", a: "Keep them sealed in a cool, dry place away from direct sunlight, and enjoy them while they're at their crispest. Storage guidance is also printed on each pack." },
      { q: "Do INDULGE products contain allergens?", a: "Allergen information is printed on every pack. Please check it before enjoying, especially if you have a food allergy or intolerance." },
    ],
  },
  essence: {
    id: "essence",
    name: "ESSENCE",
    category: "Lifestyle",
    page: "essence.html",
    logo: "assets/img/logos/essence.png",
    logoFull: "assets/img/logos/essence-full.png",
    intro: "Quiet objects for considered living.",
    overview: "ESSENCE is about the things that shape a day without asking for attention — a tote that carries the working week, pouches that keep small things in their place, plates and bowls in earthen glazes, a runner that sets the table for an ordinary evening. Made to be used, and kept.",
    story: "Considered pieces for the everyday rituals of the table, the workday and the home.",
    faqs: [
      { q: "What inspires the ESSENCE collection?", a: "Everyday rituals — laying the table, packing a bag for the day, keeping small things in their place. ESSENCE pieces are designed to make those moments feel a little more considered." },
      { q: "How should I care for ESSENCE products?", a: "Each piece comes with its own care guidance. Follow the label to keep it looking its best for years to come." },
      { q: "Do ESSENCE pieces make good gifts?", a: "They're chosen with gifting in mind. The vanity pouch set and the crockery sets, in particular, make thoughtful presents for a new home or a dear friend." },
    ],
  },
  sage: {
    id: "sage",
    name: "SAGE",
    category: "Wellness",
    page: "sage.html",
    logo: "assets/img/logos/sage.png",
    logoFull: "assets/img/logos/sage-full.png",
    intro: "Grounded in botanicals, made for mindful living.",
    overview: "SAGE draws on botanicals long valued in Indian tradition — ashwagandha, shilajit, aloe, amla, spirulina, turmeric and ginger — and offers them in simple, honest forms. No noise and no excess: just steady daily rituals that make room for balance.",
    story: "Time-honoured botanicals in simple forms, for balance and mindful living.",
    faqs: [
      { q: "How do I choose a SAGE product?", a: "Start with the ritual that suits your day — a morning shot or juice, a daily capsule, or a superfood stirred into a smoothie. Each product page explains what's inside and what it's made for." },
      { q: "Can I take more than one SAGE product together?", a: "If you are pregnant, nursing, taking medication or managing a health condition, please speak to your doctor before starting any new supplement or combining products." },
      { q: "Are SAGE products medicines?", a: "No. SAGE products are wellness supplements and foods. They are not intended to diagnose, treat, cure or prevent any disease." },
    ],
  },
};

/* Order in which brands appear across the site. */
ES.BRAND_ORDER = ["indulge", "essence", "sage"];

/* Default FAQs and notes shared by products in each brand. */
const FAQS = {
  indulge: () => [
    { q: "Is this suitable if I have a food allergy?", a: "Please check the ingredient and allergen information printed on the pack before enjoying." },
    { q: "How do I keep it fresh once opened?", a: "Reseal the pack or move it to an airtight container, store it somewhere cool and dry, and enjoy it while it's at its best." },
  ],
  essence: () => [
    { q: "Will my piece look exactly like the photograph?", a: "Natural materials and finishes vary slightly from piece to piece, so yours may differ a little in colour or texture — part of its character." },
    { q: "Does it make a good gift?", a: "Yes — it's a considered choice for anyone who appreciates beautiful, useful everyday things." },
  ],
  sage: () => [
    { q: "Should I check with a doctor before using this?", a: "If you are pregnant, nursing, taking medication or have a medical condition, consult your doctor before use." },
    { q: "How should I take it?", a: "Follow the directions printed on the pack and do not exceed the recommended amount." },
  ],
};
const PACK_INGREDIENTS = "Full ingredient and allergen information is printed on the pack.";
const SAGE_USAGE = "Follow the directions printed on the pack and do not exceed the recommended amount. If you are pregnant, nursing, taking medication or have a medical condition, consult your doctor before use.";
const ESSENCE_CARE = "Follow the care instructions on the label to keep your piece looking its best.";

/* ----------------------------- PRODUCTS ----------------------------- */
ES.PRODUCTS = [
  /* =========================== INDULGE (Food) =========================== */
  {
    id: "amaranth-puffed-snack",
    name: "Amaranth Puffed Snack",
    brand: "indulge",
    category: "Snacks",
    shortDescription: "High in fibre · Baked, not fried · Made with real grains.",
    description: "Light as air and gently golden, these puffs of amaranth bring an ancient grain to your snack bowl. Baked, never fried, with a delicate crunch that disappears as quickly as it arrives — the kind of snack you'll find yourself reaching for again.",
    images: ["assets/img/products/amaranth-puffed-snack.jpg"],
    variantLabel: "Size",
    variants: [{ id: "120g", label: "120 g", price: 149, unitPrice: "₹124.17 per 100 g" }],
    specifications: [
      { label: "Net weight", value: "120 g" },
      { label: "Preparation", value: "Baked, not fried" },
    ],
    materialsLabel: "Key ingredients",
    materials: "Puffed amaranth. " + PACK_INGREDIENTS,
    features: ["High in fibre", "Baked, not fried", "Made with real grains"],
    usage: null,
    stock: { status: null, quantity: null },
    faqs: FAQS.indulge(),
    featured: false,
    tags: ["amaranth", "snack", "puffed", "food"],
  },
  {
    id: "millet-cookies",
    name: "Millet Cookies",
    brand: "indulge",
    category: "Cookies",
    shortDescription: "High in fibre · Baked, not fried · Made with real grains.",
    description: "A golden, crumbly cookie made with millet — warm, wholesome and quietly irresistible. Baked rather than fried and packed in a keepsake tin, it's made for slow afternoons and a cup of something hot.",
    images: ["assets/img/products/millet-cookies.jpg"],
    variantLabel: "Size",
    variants: [{ id: "150g", label: "150 g", price: 300, unitPrice: "₹200 per 100 g" }],
    specifications: [
      { label: "Net weight", value: "150 g" },
      { label: "Pack", value: "Tin" },
      { label: "Preparation", value: "Baked, not fried" },
    ],
    materialsLabel: "Key ingredients",
    materials: "Millet. " + PACK_INGREDIENTS,
    features: ["High in fibre", "Baked, not fried", "Made with real grains"],
    usage: null,
    stock: { status: null, quantity: null },
    faqs: FAQS.indulge(),
    featured: true,
    tags: ["millet", "cookies", "biscuits", "food"],
  },
  {
    id: "multigrain-energy-bites",
    name: "Multigrain Energy Bites",
    brand: "indulge",
    category: "Snacks",
    shortDescription: "High in fibre · No refined sugar · Made with real grains.",
    description: "Dense, nutty little bites made with a blend of real grains and no refined sugar. Rich enough to feel like a treat, steady enough to carry you through the afternoon.",
    images: ["assets/img/products/multigrain-energy-bites.jpg"],
    variantLabel: "Size",
    variants: [{ id: "150g", label: "150 g", price: 199, unitPrice: "₹132.67 per 100 g" }],
    specifications: [
      { label: "Net weight", value: "150 g" },
      { label: "Sweetening", value: "No refined sugar" },
    ],
    materialsLabel: "Key ingredients",
    materials: "A blend of real grains. " + PACK_INGREDIENTS,
    features: ["High in fibre", "No refined sugar", "Made with real grains"],
    usage: null,
    stock: { status: null, quantity: null },
    faqs: FAQS.indulge(),
    featured: false,
    tags: ["energy", "bites", "multigrain", "snack", "food"],
  },
  {
    id: "millet-chips",
    name: "Millet Chips",
    brand: "indulge",
    category: "Snacks",
    shortDescription: "High in fibre · Baked, not fried · Made with real grains.",
    description: "Crisp, golden triangles made with millet and baked, not fried. Big on crunch and honest flavour — made for sharing, or not.",
    images: ["assets/img/products/millet-chips.jpg"],
    variantLabel: "Size",
    variants: [{ id: "200g", label: "200 g", price: 350, unitPrice: "₹175 per 100 g" }],
    specifications: [
      { label: "Net weight", value: "200 g" },
      { label: "Preparation", value: "Baked, not fried" },
    ],
    materialsLabel: "Key ingredients",
    materials: "Millet. " + PACK_INGREDIENTS,
    features: ["High in fibre", "Baked, not fried", "Made with real grains"],
    usage: null,
    stock: { status: null, quantity: null },
    faqs: FAQS.indulge(),
    featured: false,
    tags: ["millet", "chips", "snack", "food"],
  },

  /* ========================= ESSENCE (Lifestyle) ======================== */
  {
    id: "work-tote-bag",
    name: "Work Tote Bag",
    brand: "essence",
    category: "Bags",
    shortDescription: "A considered everyday tote, made for the working day.",
    description: "Built for the working day and everything it asks you to carry, this tote pairs clean lines and sturdy handles with an easy, understated presence. It moves from desk to market to weekend without missing a beat.",
    images: ["assets/img/products/work-tote-bag.jpg"],
    variantLabel: "Option",
    variants: [{ id: "standard", label: "Standard", price: 2099, unitPrice: null }],
    specifications: [
      { label: "Style", value: "Work tote" },
    ],
    materialsLabel: "Materials",
    materials: null,
    features: ["Made for the working day", "Clean, understated design"],
    usage: ESSENCE_CARE,
    stock: { status: null, quantity: null },
    faqs: FAQS.essence(),
    featured: true,
    tags: ["tote", "bag", "work", "lifestyle"],
  },
  {
    id: "vanity-pouch-set",
    name: "Vanity Pouch Set of Three",
    brand: "essence",
    category: "Pouches",
    shortDescription: "Three pouches in graduated sizes, for everything in its place.",
    description: "Three pouches in graduated sizes — one for everyday essentials, one for travel, one for the little things that always go missing. Soft, structured and quietly elegant, they bring order to a bag without asking for attention.",
    images: ["assets/img/products/vanity-pouch-set.jpg"],
    variantLabel: "Pack",
    variants: [{ id: "set-of-3", label: "Set of 3", price: 1199, unitPrice: "₹399.67 per pouch" }],
    specifications: [
      { label: "Pieces", value: "3 pouches" },
      { label: "Sizes", value: "Graduated — small, medium and large" },
    ],
    materialsLabel: "Materials",
    materials: null,
    features: ["Set of three pouches", "Three graduated sizes"],
    usage: ESSENCE_CARE,
    stock: { status: null, quantity: null },
    faqs: FAQS.essence(),
    featured: false,
    tags: ["vanity", "pouch", "makeup bag", "set", "lifestyle"],
  },
  {
    id: "crockery-plates-bowls",
    name: "Crockery: Plates & Bowls",
    brand: "essence",
    category: "Tableware",
    shortDescription: "Plates and bowls, available as sets of four or as a full set of eight.",
    description: "Plates and bowls in earthy, glazed tones that turn an everyday meal into a small occasion. Choose a set of four plates, a set of four bowls, or bring them together in the full set of eight for a table that feels complete.",
    images: ["assets/img/products/crockery-plates-bowls.jpg"],
    variantLabel: "Set",
    variants: [
      { id: "plates-4", label: "4 plates", price: 1799, unitPrice: "₹449.75 per plate" },
      { id: "bowls-4", label: "4 bowls", price: 1299, unitPrice: "₹324.75 per bowl" },
      { id: "full-8", label: "Full set of 8", price: 3098, unitPrice: "₹387.25 per piece" },
    ],
    specifications: [
      { label: "Sets available", value: "4 plates · 4 bowls · full set of 8 (4 plates + 4 bowls)" },
      { label: "Finish", value: "Glazed, in earthy tones" },
    ],
    materialsLabel: "Materials",
    materials: null,
    features: ["Available as 4 plates, 4 bowls or a full set of 8", "Earthy, glazed finishes"],
    usage: ESSENCE_CARE,
    stock: { status: null, quantity: null },
    faqs: FAQS.essence(),
    featured: false,
    tags: ["crockery", "plates", "bowls", "tableware", "dinnerware", "lifestyle"],
  },
  {
    id: "table-runner",
    name: "Table Runner",
    brand: "essence",
    category: "Table Linen",
    shortDescription: "A handloom or block-printed table runner, about 150 cm long.",
    description: "Laid down the centre of the table, this runner brings texture, warmth and a sense of occasion to the simplest meal. Choose handloom for its woven depth, or block-printed for pattern pressed by hand.",
    images: ["assets/img/products/table-runner.jpg"],
    variantLabel: "Style",
    variants: [
      { id: "handloom", label: "Handloom", price: 1199, unitPrice: null },
      { id: "block-printed", label: "Block-printed", price: 1199, unitPrice: null },
    ],
    specifications: [
      { label: "Length", value: "Approx. 150 cm" },
      { label: "Styles", value: "Handloom or block-printed" },
    ],
    materialsLabel: "Materials",
    materials: null,
    features: ["Handloom or block-printed", "Approx. 150 cm long"],
    usage: ESSENCE_CARE,
    stock: { status: null, quantity: null },
    faqs: FAQS.essence(),
    featured: false,
    tags: ["table runner", "table linen", "handloom", "block print", "lifestyle"],
  },

  /* ========================== SAGE (Wellness) ========================== */
  {
    id: "aloe-amla-juice",
    name: "Aloe Amla Juice",
    brand: "sage",
    category: "Juices",
    shortDescription: "Natural wellness · No added sugar.",
    description: "Aloe vera and amla — two botanicals long cherished in Indian homes — come together in a clean, refreshing juice with no added sugar. A simple way to begin the day with intention.",
    images: ["assets/img/products/aloe-amla-juice.jpg"],
    variantLabel: "Size",
    variants: [{ id: "1l", label: "1 L", price: 499, unitPrice: "₹49.90 per 100 ml" }],
    specifications: [
      { label: "Net volume", value: "1 L" },
      { label: "Sweetening", value: "No added sugar" },
    ],
    materialsLabel: "Key ingredients",
    materials: "Aloe vera and amla. " + PACK_INGREDIENTS,
    features: ["Natural wellness", "No added sugar"],
    usage: SAGE_USAGE,
    stock: { status: null, quantity: null },
    faqs: FAQS.sage(),
    featured: false,
    tags: ["aloe", "amla", "juice", "wellness"],
  },
  {
    id: "ashwagandha-capsules",
    name: "Ashwagandha Capsules",
    brand: "sage",
    category: "Capsules",
    shortDescription: "For stress · balance · vitality.",
    description: "Ashwagandha has been valued in Ayurveda for centuries as a root of balance. These capsules bring it into your day in its simplest form — a quiet daily ritual for stress, balance and vitality.",
    images: ["assets/img/products/ashwagandha-capsules.jpg"],
    variantLabel: "Pack",
    variants: [{ id: "60", label: "60 capsules", price: 499, unitPrice: "₹8.32 per capsule" }],
    specifications: [
      { label: "Net quantity", value: "60 capsules" },
      { label: "Form", value: "Capsules" },
    ],
    materialsLabel: "Key ingredients",
    materials: "Ashwagandha. " + PACK_INGREDIENTS,
    features: ["For stress", "For balance", "For vitality"],
    usage: SAGE_USAGE,
    stock: { status: null, quantity: null },
    faqs: FAQS.sage(),
    featured: true,
    tags: ["ashwagandha", "capsules", "wellness", "supplement"],
  },
  {
    id: "shilajit-gold-resin",
    name: "Shilajit Gold Resin",
    brand: "sage",
    category: "Resin",
    shortDescription: "For strength and stamina.",
    description: "A rich, dark resin from the mountains, blended with ashwagandha, musli, gokshura and swarnabhasma. Shilajit Gold Resin draws on traditional Ayurvedic formulation, made for strength and stamina.",
    images: ["assets/img/products/shilajit-gold-resin.jpg"],
    variantLabel: "Size",
    variants: [{ id: "20g", label: "20 g", price: 1199, unitPrice: "₹59.95 per g" }],
    specifications: [
      { label: "Net quantity", value: "20 g" },
      { label: "Form", value: "Resin" },
    ],
    materialsLabel: "Ingredients",
    materials: "Shilajit, Ashwagandha, Musli, Gokshura & Swarnabhasma",
    features: ["For strength and stamina"],
    usage: SAGE_USAGE,
    stock: { status: null, quantity: null },
    faqs: FAQS.sage(),
    featured: true,
    tags: ["shilajit", "resin", "wellness", "gold"],
  },
  {
    id: "spirulina-powder",
    name: "Spirulina Powder",
    brand: "sage",
    category: "Powders",
    shortDescription: "Nutrient-rich superfood · Plant based · Natural energy · Immune support.",
    description: "A deep-green, nutrient-rich superfood that is entirely plant based. Stir it into smoothies, juices or water for a little natural energy and immune support, every day.",
    images: ["assets/img/products/spirulina-powder.jpg"],
    variantLabel: "Size",
    variants: [{ id: "100g", label: "100 g", price: 399, unitPrice: "₹3.99 per g" }],
    specifications: [
      { label: "Net weight", value: "100 g" },
      { label: "Form", value: "Powder" },
    ],
    materialsLabel: "Key ingredients",
    materials: "Spirulina. " + PACK_INGREDIENTS,
    features: ["Nutrient-rich superfood", "Plant based", "Natural energy", "Immune support"],
    usage: SAGE_USAGE,
    stock: { status: null, quantity: null },
    faqs: FAQS.sage(),
    featured: false,
    tags: ["spirulina", "powder", "superfood", "wellness"],
  },
  {
    id: "lemon-turmeric-ginger-shot",
    name: "Lemon Turmeric Ginger Shot",
    brand: "sage",
    category: "Wellness Shots",
    shortDescription: "Immunity · Digestion · Energy. Cold pressed, no added sugar.",
    description: "A bright, bold shot of lemon, turmeric and ginger, cold pressed with no added sugar. Ten small bottles, ten mornings — a vivid little ritual for immunity, digestion and energy.",
    images: ["assets/img/products/lemon-turmeric-ginger-shot.jpg"],
    variantLabel: "Pack",
    variants: [{ id: "10x40", label: "10 × 40 ml", price: 499, unitPrice: "₹49.90 per shot · ₹124.75 per 100 ml" }],
    specifications: [
      { label: "Pack", value: "10 shots × 40 ml" },
      { label: "Process", value: "Cold pressed" },
      { label: "Sweetening", value: "No added sugar" },
    ],
    materialsLabel: "Key ingredients",
    materials: "Lemon, turmeric and ginger. " + PACK_INGREDIENTS,
    features: ["Immunity", "Digestion", "Energy", "Cold pressed", "No added sugar"],
    usage: SAGE_USAGE,
    stock: { status: null, quantity: null },
    faqs: FAQS.sage(),
    featured: false,
    tags: ["ginger", "lemon", "turmeric", "shot", "juice", "wellness"],
  },
];
