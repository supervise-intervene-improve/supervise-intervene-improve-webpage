# Supervise, Intervene, Improve

Anonymous academic project website accompanying a manuscript submitted to ACM HRI 2027. Plain HTML, CSS, and JavaScript; no runtime dependencies, analytics, cookies, or external fonts.

## Build and preview

Requires Python 3.10 or newer. Deployment uses Python 3.12.

```sh
python scripts/build_site.py
python scripts/serve_site.py --directory dist --base-path /supervise-intervene-improve-webpage/ --port 8001
```

Open http://localhost:8001/supervise-intervene-improve-webpage/. The preview supports video byte-range requests and seeking. Stop it with Ctrl+C.

The build validates optimized video hashes and the 95 MiB per-file limit, then copies only the approved assets into `dist/`. That generated directory is replaced on each build and excluded from Git. Relative URLs support the repository subpath without a bundler or hard-coded asset prefix.

## Deployment

`.github/workflows/deploy-pages.yml` builds and deploys `dist/` through GitHub Actions on pushes to `main` or manual dispatch. In repository Settings > Pages, select **GitHub Actions** as the source. No `gh-pages` branch is used. `.nojekyll` is included in the artifact.

## Editing

- `index.html`: page content, figures, metadata, and the marked resource-URL block. Header resource links remain disabled; the footer links to the anonymous local paper. Enable resources only when real anonymous targets exist.
- `assets/css/`: page and demonstration styles.
- `assets/js/main.js`: resource states and figure enlargement.
- `assets/js/demonstrations.js`: the shared video interaction and complete card/environment mapping. VR-PointCloud and Kinesthetic Teaching reuse the same two recordings.
- `assets/videos/demonstrations/`: ten optimized H.264 MP4 files serving twelve card/environment combinations. Videos use metadata preloading, native controls, contained aspect ratios, and pause on switching or closing.
- `assets/images/`: figures, charts, favicon, and matching video posters.
- `assets/paper/paper.pdf`: anonymous manuscript.
- `assets/videos/manifest.json`: optimized video sizes and SHA-256 checksums.
- `scripts/site-assets.json`: explicit list of assets included in production. Update it when adding or removing an asset.

For new demonstrations, add optimized MP4s and matching posters, update the shared mapping and manifests, then test both task tabs under the repository subpath. Preserve original recordings outside the publication tree. Do not commit original media, private reports, local tooling, editor state, credentials, or generated previews.

Maintain anonymous authorship and inspect visible content and asset metadata before replacing the manuscript or media. Scientific claims and chart data must remain faithful to the manuscript.
