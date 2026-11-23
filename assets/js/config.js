/* =====================================================================
   EARTHSPIRED — STORE SETTINGS
   ---------------------------------------------------------------------
   Edit this file to change site-wide details (tagline, discount codes,
   checkout wording, general FAQs).

   PLACEHOLDER RULE: any text written as  [TBC: something]  is shown on
   the website with a dashed highlight so it is easy to spot. There are
   currently no placeholders on the site.
   ===================================================================== */

window.ES = window.ES || {};

ES.STORE = {
  name: "Earthspired",
  tagline: "From Source to Everyday",
  currency: "INR",
  currencySymbol: "₹",

  /* Highlight any [TBC: …] placeholders added in future. */
  highlightPlaceholders: true,

  /* Optional note shown under cart / checkout totals (e.g. GST wording).
     Leave as "" to hide. */
  taxNote: "",

  /* ---------------- Discount codes ----------------
     No codes are active yet. Add codes in this format:
       "WELCOME10": { type: "percent", value: 10, label: "10% off", minSubtotal: 0 },
       "FLAT100":   { type: "flat",    value: 100, label: "₹100 off", minSubtotal: 999 },
     Codes are matched case-insensitively. */
  discountCodes: {
  },

  /* ---------------- Payment ----------------
     No payment gateway is connected. Checkout records an order request
     only — it does NOT take or simulate payment. */
  payment: {
    connected: false,
    notice: "Submitting this form places an order request. We'll confirm availability and arrange payment with you once your request has been reviewed.",
    nextSteps: "We'll review your order request, confirm availability and get in touch using the details you provided to arrange payment.",
  },
};

/* General FAQs (shown on the FAQ page). */
ES.GENERAL_FAQS = [
  { q: "How do I place an order?", a: "Add the products you love to your cart, head to checkout and submit your order request. We'll review it, confirm availability and arrange payment with you." },
  { q: "Can I return a product?", a: "Unused ESSENCE pieces can be returned in their original condition. For hygiene and safety reasons, opened INDULGE and SAGE products can't be returned. See our Returns & Refunds Policy for details." },
  { q: "Do you offer discount codes?", a: "From time to time, yes. If you have a code, enter it in your cart or at checkout and the saving will be applied to your order total." },
  { q: "Are the product photographs accurate?", a: "We photograph every product as faithfully as we can. Natural ingredients, glazes and textiles can vary slightly from piece to piece — part of what makes them what they are." },
];
