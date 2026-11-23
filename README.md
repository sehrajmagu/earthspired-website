# Earthspired website

Static website for Earthspired and its three sub-brands: INDULGE (food), ESSENCE (lifestyle) and SAGE (wellness).

## Run it
From this folder, run `python3 -m http.server 8000` and open http://localhost:8000.
(Opening `index.html` directly also works in most browsers.)

## Where to edit
| What | File |
|---|---|
| Products (add / edit / remove, prices, variants, stock, FAQs) | `assets/js/catalogue.js` |
| Brand intros, overviews and brand FAQs | `assets/js/catalogue.js` → `ES.BRANDS` |
| Discount codes, checkout wording, optional tax note, general FAQs | `assets/js/config.js` |
| Our Story, FAQ intro, policy pages | generated from one template — edit the `.html` files directly |
| Product images | `assets/img/products/` |
| Logos | `assets/img/logos/` |
| Rural India photographs | `assets/img/origins/` (credited on `credits.html`) |

Product pages are generated from the catalogue at `product.html?id=<product-id>`. No page needs editing to add a product.

## Motion
Scroll reveals, scroll-linked card scaling, page fade transitions, the marquee, the slow photo zoom, the hand-drawn underline/circle and the word-by-word statement are all in `initMotion()` at the end of `assets/js/app.js`, with styles under "motion" in `style.css`. To add a drawn mark to any word, wrap it in `<span data-mark="underline">…</span>` or `data-mark="circle"`. All motion switches off for visitors who have "reduce motion" turned on.

## Placeholders
The site currently has no placeholders. If you add text written as `[TBC: …]`, it shows with a dashed yellow highlight until replaced.

## Before launch
- **Payment:** no payment gateway is connected. Checkout records an order request only. It does not take or simulate payment.
- **Orders:** submitted orders are saved only in the customer's browser. They are not sent anywhere yet. Connect an order backend or email service in `app.js` (search for `TODO before launch`).
- **Customer contact:** there is no contact page, email or phone number on the site, so customers can't reach you except through an order request.
- **Policies:** the Returns, Privacy and Terms pages contain standard draft wording written for the site. Review them before launch.
- **Photo credits:** the rural India photographs are licensed CC BY / CC BY-SA and must stay credited. Keep the "Photo credits" link in the footer.
- **Discount codes:** none are active. Add codes in `config.js` → `discountCodes`.
