"""Generates build/icon-source.png, build/icon.png, and build/icon.icns.

Renders the app icon directly with Pillow (no browser/Electron dependency).
Run with: python3 scripts/generate-icon.py
"""

import os
import shutil
import subprocess

from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BUILD_DIR = os.path.join(ROOT, 'build')

SIZE = 1024
RADIUS = 224
BORDER_WIDTH = 34

# Matches the app's cream-and-terracotta theme (style.css): cream dominant,
# accent used sparingly for the badge/border, same as buttons in the app.
CREAM = '#f8eee5'       # --surface
ACCENT = '#bf5433'      # --accent


def hex_to_rgb(h):
    h = h.lstrip('#')
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def render_master():
    cream = hex_to_rgb(CREAM)
    accent = hex_to_rgb(ACCENT)

    base = Image.new('RGBA', (SIZE, SIZE), (0, 0, 0, 0))
    draw = ImageDraw.Draw(base)

    # Cream field with a slim accent-colored border ring.
    draw.rounded_rectangle([0, 0, SIZE - 1, SIZE - 1], radius=RADIUS, fill=accent + (255,))
    draw.rounded_rectangle(
        [BORDER_WIDTH, BORDER_WIDTH, SIZE - 1 - BORDER_WIDTH, SIZE - 1 - BORDER_WIDTH],
        radius=RADIUS - BORDER_WIDTH,
        fill=cream + (255,),
    )

    # Accent badge with a cream checkmark, centered — echoes the app's
    # solid-accent primary buttons and reads as "tracked / done".
    badge_d = int(SIZE * 0.50)
    bx0 = (SIZE - badge_d) // 2
    by0 = (SIZE - badge_d) // 2
    draw.ellipse([bx0, by0, bx0 + badge_d, by0 + badge_d], fill=accent + (255,))

    cx, cy = SIZE / 2, SIZE / 2
    pts = [
        (cx - badge_d * 0.20, cy + badge_d * 0.02),
        (cx - badge_d * 0.05, cy + badge_d * 0.17),
        (cx + badge_d * 0.24, cy - badge_d * 0.18),
    ]
    draw.line(pts, fill=cream + (255,), width=46, joint='curve')
    for p in pts:
        r = 23
        draw.ellipse([p[0] - r, p[1] - r, p[0] + r, p[1] + r], fill=cream + (255,))

    return base


def main():
    os.makedirs(BUILD_DIR, exist_ok=True)
    master = render_master()

    source_path = os.path.join(BUILD_DIR, 'icon-source.png')
    master.save(source_path)
    print('Wrote', source_path, master.size)

    icon_path = os.path.join(BUILD_DIR, 'icon.png')
    master.resize((512, 512), Image.LANCZOS).save(icon_path)
    print('Wrote', icon_path, (512, 512))

    iconutil = shutil.which('iconutil')
    if iconutil:
        iconset_dir = os.path.join(BUILD_DIR, 'icon.iconset')
        if os.path.exists(iconset_dir):
            shutil.rmtree(iconset_dir)
        os.makedirs(iconset_dir)

        sizes = [16, 32, 128, 256, 512]
        for s in sizes:
            master.resize((s, s), Image.LANCZOS).save(os.path.join(iconset_dir, f'icon_{s}x{s}.png'))
            master.resize((s * 2, s * 2), Image.LANCZOS).save(os.path.join(iconset_dir, f'icon_{s}x{s}@2x.png'))

        icns_path = os.path.join(BUILD_DIR, 'icon.icns')
        subprocess.run([iconutil, '-c', 'icns', iconset_dir, '-o', icns_path], check=True)
        shutil.rmtree(iconset_dir)
        print('Wrote', icns_path)
    else:
        print('iconutil not found, skipping icon.icns')


if __name__ == '__main__':
    main()
