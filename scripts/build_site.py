"""Build the plain static site into dist without copying sources or local tooling."""
from pathlib import Path
import hashlib
import json
import shutil

ROOT = Path(__file__).resolve().parent.parent
DESTINATION = ROOT / 'dist'
MAX_VIDEO_BYTES = 95 * 1024 * 1024

def build():
    manifest = json.loads((ROOT / 'assets/videos/manifest.json').read_text(encoding='utf-8'))
    expected = {entry['output']: entry for entry in manifest['videos']}
    actual = {file.relative_to(ROOT).as_posix() for file in (ROOT / 'assets/videos').rglob('*.mp4')}
    if actual != set(expected):
        raise SystemExit('Video assets do not match the validated manifest.')
    for name, entry in expected.items():
        file = ROOT / name
        if file.stat().st_size >= MAX_VIDEO_BYTES:
            raise SystemExit(f'Video exceeds the 95 MiB limit: {name}')
        if hashlib.sha256(file.read_bytes()).hexdigest() != entry['sha256']:
            raise SystemExit(f'Video changed since validation: {name}')
    asset_names = json.loads((ROOT / 'scripts/site-assets.json').read_text(encoding='utf-8'))
    if not set(expected).issubset(asset_names):
        raise SystemExit('The production asset list omits a video.')
    for name in asset_names:
        file = ROOT / name
        if file.is_symlink() or not file.resolve().is_relative_to(ROOT / 'assets'):
            raise SystemExit('Asset symlinks are not supported by this build.')
        if file.is_file() and file.suffix.lower() not in {'.css', '.js', '.svg', '.webp', '.png', '.jpg', '.jpeg', '.pdf', '.mp4', '.json'}:
            raise SystemExit(f'Unexpected asset type: {file.name}')
    # Only this exact generated workspace directory may be replaced.
    if DESTINATION.resolve() != ROOT / 'dist' or DESTINATION.is_symlink():
        raise SystemExit('Unsafe build output path.')
    if DESTINATION.exists():
        shutil.rmtree(DESTINATION)
    DESTINATION.mkdir()
    for name in ['index.html', '.nojekyll']:
        shutil.copy2(ROOT / name, DESTINATION / name)
    for name in asset_names:
        target = DESTINATION / name
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(ROOT / name, target)
    total = sum(file.stat().st_size for file in DESTINATION.rglob('*') if file.is_file())
    print(f'Built dist/: {total:,} bytes; {len(expected)} validated optimized videos.')
    print('GitHub Actions publishes dist/ as the Pages artifact.')

if __name__ == '__main__':
    build()
