"""Generates build/icon-source.png, build/icon.png, and build/icon.icns.

Renders the app icon directly with Pillow (no browser/Electron dependency).
Run with: python3 scripts/generate-icon.py
"""

import os
import shutil
import subprocess

import numpy as np
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BUILD_DIR = os.path.join(ROOT, 'build')

SIZE = 1024
RADIUS = 224

# Matches the app's --accent / warm terracotta-and-cream theme (style.css).
GRADIENT_START = '#d97a4f'  # light rust, top-left highlight
GRADIENT_END = '#8a341b'    # dark rust, bottom-right shadow
CREAM = '#f8eee5'           # matches --surface


def hex_to_rgb(h):
    h = h.lstrip('#')
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def render_master():
    c1 = hex_to_rgb(GRADIENT_START)
    c2 = hex_to_rgb(GRADIENT_END)
    cream = hex_to_rgb(CREAM)

    angle = np.radians(160)
    dx, dy = np.cos(angle), np.sin(angle)

    ys, xs = np.mgrid[0:SIZE, 0:SIZE]
    proj = xs * dx + ys * dy
    proj = (proj - proj.min()) / (proj.max() - proj.min())

    grad = np.zeros((SIZE, SIZE, 3), dtype=np.uint8)
    for i in range(3):
        grad[..., i] = (c1[i] + (c2[i] - c1[i]) * proj).astype(np.uint8)

    grad_img = Image.fromarray(grad, 'RGB').convert('RGBA')

    mask = Image.new('L', (SIZE, SIZE), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, SIZE - 1, SIZE - 1], radius=RADIUS, fill=255)

    base = Image.new('RGBA', (SIZE, SIZE), (0, 0, 0, 0))
    base.paste(grad_img, (0, 0), mask)

    draw = ImageDraw.Draw(base)
    bar_height = 92
    gap = 70
    widths = [0.60, 0.60 * 0.74, 0.60 * 0.52]
    start_x = SIZE * 0.20
    total_height = bar_height * 3 + gap * 2
    start_y = (SIZE - total_height) / 2

    for i, wfrac in enumerate(widths):
        y0 = start_y + i * (bar_height + gap)
        y1 = y0 + bar_height
        x0 = start_x
        x1 = start_x + SIZE * wfrac
        draw.rounded_rectangle([x0, y0, x1, y1], radius=bar_height / 2, fill=cream + (255,))

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
