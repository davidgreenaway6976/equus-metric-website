# Equus Metric -- Marketing Site

Static marketing site for [Equus Metric](https://www.equusmetric.com), the
equine measurement/nutrition/conditioning app. Plain HTML/CSS, no build step,
using the same design tokens as the app itself (see the main
[equus-metric-app](https://github.com/davidgreenaway6976/equus-metric-app)
repo's `src/theme/tokens.ts`).

- `index.html` -- the marketing page
- `privacy.html` / `terms.html` -- mirror the in-app legal pages word for word
- `horse-weight-calculator.html` / `calculator.js` -- the free weight calculator
  (same maths as `src/lib/measurement.ts` in the app; runs in the browser, stores nothing)
- `how-to-measure-horse-weight-at-home.html` / `is-my-horse-overweight.html` --
  guide articles that link to the calculator (body condition wording matches the app)
- `signup.js` / `launch-list-notice.html` / `thanks.html` -- the launch-list signup. A Netlify
  form (`name="launch-list"`, honeypot, consent box) on the home page, calculator and guides.
  The privacy notice lives on its own page so `privacy.html` (the App Store privacy policy URL)
  stays unchanged until the app is approved.
- `sitemap.xml` / `robots.txt` -- for search engines
- `styles.css` -- shared design tokens and layout
- `assets/icon.png` -- the app icon

Deployed via Netlify, connected to `www.equusmetric.com`.
