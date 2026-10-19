# Naishadh Vytla · Portfolio

A personal portfolio built as an original, multiverse-comic-inspired site: halftone print, misregistered colour plates, diagonal panel cuts and hand-timed motion. Plain HTML, CSS and JavaScript with no build step and no runtime dependencies beyond Google Fonts.

All artwork (skylines, portal, web geometry, research schematics, project covers) is drawn procedurally in `js/main.js` from a seeded random generator, so it looks the same on every visit and needs no image files. Figures are labelled as method schematics; they are not results.

## Structure

```
index.html                 Content and markup for every chapter
css/style.css              Design tokens, layout, components, motion keyframes
js/main.js                 Art generators, reveals, constellation tabs, project files, filters, form
404.html                   "Wrong universe" page that GitHub Pages serves for missing paths
assets/                    favicon.svg, favicon-48.png, apple-touch-icon.png, social-card.png
tools/social-card.html     Source for assets/social-card.png (render at 1200×630 and screenshot)
tests/smoke.mjs            CI-only Playwright smoke test (not needed to run the site)
.github/workflows/check.yml  HTML validation, link check and smoke test on every push
```

| Chapter | Section id | Treatment |
| --- | --- | --- |
| Cover | `#cover` | Comic-cover hero: name assembles letter by letter, portal and parallax city, proof stats that link to the papers |
| 1 · Origin story | `#about` | Paper comic page of six panels, coursework, current role |
| 2 · Research verse | `#research` | Editorial spread, "My part" lines, schematic figure per manuscript |
| 3 · The multiverse | `#projects` | One accent colour per project, filters, project files with pipeline strips and shareable `?project=` links |
| 4 · Power system | `#skills` | Constellation of ARIA tabs (a 2×3 grid on phones); "Used in" lines link to the work |
| 5 · The timeline | `#timeline` | Diagonal comic strip threaded by a scroll-drawn strand |
| 6 · Collectibles | `#achievements` | Trading cards on a paper ground; a swipe deck with a counter on phones |
| 7 · Final panel | `#contact` | Portal, copyable email, message composer |

## Run it locally

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

## Deploy on GitHub Pages

Settings → Pages → Source: *Deploy from a branch* → pick the branch and `/ (root)`. There is no build step. `.nojekyll` keeps Pages from processing the files.

### Site URL checklist

The site assumes it lives at `https://naishadhvytla.github.io/new/`. If you use another URL or a custom domain, change it in all of these places:

- `index.html`: `<link rel="canonical">`, `og:url`, `og:image`, `twitter:image`, and `url` in the JSON-LD block
- `404.html`: the favicon link and the "Back to the cover" link

After deploying, refresh the cached share preview with LinkedIn's Post Inspector.

### Releasing a change

Bump the `?v=` date on `css/style.css` and `js/main.js` in `index.html` so returning visitors get the new files.

## Content you can add

- **Resume:** not published yet. Once you have a version that matches the site (target roles, current role, manuscript statuses), save it as `assets/Naishadh_Vytla_Resume.pdf` and link it from the nav, hero links, menu footer, contact list and footer. Keep the PDF in step with the site's manuscript statuses and roles.
- **Portrait:** save a photo as `assets/portrait.jpg`, put `<img src="assets/portrait.jpg" alt="Portrait of Naishadh Vytla">` inside `.portrait` in Panel 2, and add the class `comic-page--photo` to `.comic-page` so the portrait gets its tall column back.
- **Paper status:** the stamps and `.paper-meta` lines in Chapter 2 show each manuscript's status. Update them as decisions come in, and update the "Status as of" month at the same time.
- **Calibo AI Academy:** the timeline and Panel 6 show the role and dates only. Add responsibilities to the `#timeline-now` frame when you want them listed.
- **Lung histopathology paper:** add a "My part" line (`.paper-role`) when you want to describe your contribution.
- **Direct message delivery (optional):** create a form endpoint (for example Formspree), confirm it delivers, and put its HTTPS URL in `data-endpoint` on `#signal-form`. Without it, the composer prepares the email and offers your mail app, Gmail, or copy and paste. It never claims a message was sent.
- **Phone number:** left off on purpose, since the site is public.

## Motion system

The motion follows the motion-design skill's framework: one personality, one signature curve, a small duration palette and a single entrance pattern.

| Constant | Value |
| --- | --- |
| Personality | Energetic for 90% of the site; the research chapter borrows Premium (slower, no overshoot) |
| Signature easing | `cubic-bezier(.16, 1, .3, 1)` (expo-out) for entrances; expo-in for exits |
| Durations | 100ms hover/press, 180ms standard, 300ms slow; reveals 620ms for chapter heads and 460ms for cards (500/380ms on phones) |
| Entrance | Elements wait slightly out of register and snap into place while their red and cyan plates converge; each batch staggers from its own first element |
| "On twos" | Type, stamps, SFX bursts, the web ink-in and the glitch are keyframed pose to pose with `steps(1, end)`, one pose per 83ms. Panels and parallax stay smooth |

Rules the code keeps:

- Content is never hidden waiting for a scroll observer. Below-the-fold elements are offset, never transparent, so the page reads fully at rest.
- Staggers stay under 500ms; no more than a third of a group moves at once. Exits are about two thirds of their entrance.
- Parallax only moves background layers, only with a mouse, and stays under 100px.
- Ambient loops pause off screen and when the tab is hidden. The cover glitch bursts at most three times per visit; "Replay the cover" in the footer resets it.
- Long chapter jumps from the nav use a diagonal page-turn cut (View Transitions) where the browser supports it.
- `prefers-reduced-motion` is respected and followed live. The **FX** switch turns animation off or on per visitor; a saved choice only applies under the OS setting it was made with. In calm mode every animation lands on its final frame immediately.

## Checks

CI runs on every push: `html-validate` (config in `.htmlvalidate.json`), `lychee` for internal links and anchors (external links are reported as warnings), and `tests/smoke.mjs`, which loads the page at 390 and 1440 px with FX on and off. It fails on console errors, failed requests, duplicate ids, unnamed buttons, broken anchors, sideways scrolling, the project-filter race, a broken `?project=` link, the message composer, and serious axe accessibility violations.
