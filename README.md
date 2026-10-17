# Naishadh Vytla · Portfolio

A personal portfolio built as an original, multiverse-comic-inspired site: halftone print, misregistered colour plates, diagonal panel cuts and hand-timed motion. Plain HTML, CSS and JavaScript with no build step and no dependencies beyond Google Fonts.

All artwork (skylines, portal, web geometry, research schematics, project covers) is drawn procedurally in `js/main.js` from a seeded random generator, so it looks the same on every visit and needs no image files.

## Structure

```
index.html        Content and markup for every chapter
css/style.css     Design tokens, layout, components, motion keyframes
js/main.js        Art generators, reveal system, constellation, modal, filters, form
assets/           favicon.svg (add portrait.jpg and the CV here, see below)
```

| Chapter | Section id | Treatment |
| --- | --- | --- |
| Cover | `#cover` | Comic-cover hero: name assembles letter by letter, portal and parallax city |
| 1 · Origin story | `#about` | Paper comic page of six panels |
| 2 · Research verse | `#research` | Editorial spread with schematic figures for each manuscript |
| 3 · The multiverse | `#projects` | One accent colour per project, filters, expandable project files |
| 4 · Power system | `#skills` | Interactive skill constellation with a detail card |
| 5 · The timeline | `#timeline` | Diagonal comic strip threaded by a scroll-drawn strand |
| 6 · Collectibles | `#achievements` | Trading cards with stamps and foil |
| 7 · Final panel | `#contact` | Portal, copyable email, message composer |

## Run it locally

Any static server works:

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

## Deploy on GitHub Pages

Settings → Pages → Source: *Deploy from a branch* → pick the branch and `/ (root)`. The site has no build step.

## Things to add

- **Portrait:** save a photo as `assets/portrait.jpg`. It replaces the halftone "NV" placeholder in panel 2 automatically.
- **CV download:** save the PDF as `assets/Naishadh_Vytla_CV.pdf`. The "Download CV" button on the cover only appears once that file exists.
- **Paper status:** the research chapter lists BTFuseViT (BMC Medical Imaging), HGRL-ATN (Scientific Reports) and the lung histopathology study (Discover Applied Sciences) as under peer review, and the calibration study as being prepared for IEEE Access. Update the `stamp` and `paper-meta` lines in `index.html` as decisions come in.
- **Phone number:** left off on purpose, since the site is public. Add it next to the email in `#contact` if you want it there.

## Motion system

The motion follows the motion-design skill's framework: one personality, one signature curve, a small duration palette and a single entrance pattern.

| Constant | Value |
| --- | --- |
| Personality | Energetic for 90% of the site; the research chapter borrows Premium (slower, no overshoot) |
| Signature easing | `cubic-bezier(.16, 1, .3, 1)` (expo-out) for entrances; expo-in for exits |
| Durations | 100ms hover/press, 180ms standard, 300ms slow, 620ms page reveals |
| Entrance | Elements wait slightly out of register and snap into place while their red and cyan plates converge |
| "On twos" | Type, stamps, SFX bursts and the glitch are keyframed pose to pose with `steps(1, end)`, one pose per 83ms, like hand-drawn animation. Panels and parallax stay smooth |

Rules the code keeps:

- Content is never hidden waiting for a scroll observer. Below-the-fold elements are offset, never transparent, so the page reads fully at rest.
- Staggers stay under 500ms; no more than a third of a group moves at once.
- Parallax only moves background layers, only with a mouse, and stays under 100px.
- Ambient loops (particles, portal rings, glitch bursts) pause when the cover is off screen or the tab is hidden.
- `prefers-reduced-motion` is respected, and the **FX** switch in the nav turns all animation off or on for each visitor. In calm mode every animation lands on its final frame immediately.
