# Supervise, Intervene, Improve — Project Website

Project page for the paper *Supervise, Intervene, Improve: Interface Design for Human Oversight of Multiple Autonomous Robot Manipulators* (under review, ACM HRI 2027).

**Website:** https://supervise-intervene-improve.github.io/supervise-intervene-improve-webpage/
**Code:** https://github.com/supervise-intervene-improve/Supervise-Intervene-Improve

The site is plain HTML, CSS, and JavaScript with no runtime dependencies, analytics, cookies, or external fonts.

## Local preview

Requires Python 3.10 or newer.

```sh
python scripts/build_site.py
python scripts/serve_site.py --directory dist --base-path /supervise-intervene-improve-webpage/ --port 8001
```

Then open http://localhost:8001/supervise-intervene-improve-webpage/.

`build_site.py` checks every video against `assets/videos/manifest.json` (size and SHA-256) and copies only the files listed in `scripts/site-assets.json` into `dist/`.

## Deployment

Pushing to `main` runs `.github/workflows/deploy-pages.yml`, which builds `dist/` and publishes it with GitHub Pages (source: GitHub Actions).

## Layout

| Path | Contents |
|---|---|
| `index.html` | Page content |
| `assets/css/`, `assets/js/` | Styles, figure viewer, and video demonstrations |
| `assets/images/` | Figures and video posters |
| `assets/videos/demonstrations/` | Demonstration videos (H.264 MP4) |
| `assets/supplementary/` | Supplementary material (PDF) |
| `scripts/` | Build and local preview scripts |

When adding or replacing an asset, update `scripts/site-assets.json`; for videos, also update `assets/videos/manifest.json`.
