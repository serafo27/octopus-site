"""Crops for the site: each section shows the part of the window it talks about.

Reads screens/out/<scene>.png (from shoot.sh) and writes docs/assets/screens/<name>.webp: the crops
below, and every scene whole (opened by a click on a crop). Boxes are fractions of the window:
(left, top, right, bottom). Run from octopus-site: python3 screens/crop.py
"""

from pathlib import Path

from PIL import Image

OUT = Path("screens/out")
SITE = Path("docs/assets/screens")

CROPS = {
    # name: (scene, box)
    "hero-board": ("board", (0.034, 0.03, 1.0, 0.58)),
    "tasks-crop": ("board", (0.034, 0.075, 0.53, 0.62)),
    "task-crop": ("task", (0.40, 0.03, 1.0, 0.78)),
    "sessions-crop": ("sessions", (0.034, 0.03, 0.78, 0.52)),
    "docs-crop": ("docs", (0.034, 0.03, 0.72, 0.72)),
    "git-crop": ("git", (0.034, 0.03, 0.78, 0.62)),
    "notebook-crop": ("notebook", (0.034, 0.03, 0.86, 0.80)),
    "database-crop": ("database", (0.215, 0.13, 0.83, 0.62)),
    "priorities-crop": ("priorities", (0.034, 0.03, 0.70, 0.80)),
    "extensions-crop": ("extensions", (0.034, 0.03, 0.95, 0.56)),
}

FULL_WIDTH = 2400
CROP_MAX = 1800


def main() -> None:
    SITE.mkdir(parents=True, exist_ok=True)
    scenes = {p.stem: Image.open(p).convert("RGB") for p in sorted(OUT.glob("*.png"))}
    for name, im in scenes.items():
        w, h = im.size
        im.resize((FULL_WIDTH, round(h * FULL_WIDTH / w)), Image.LANCZOS).save(SITE / f"{name}.webp", quality=88, method=6)
    for name, (scene, (l, t, r, b)) in CROPS.items():
        if scene not in scenes:
            continue
        im = scenes[scene]
        w, h = im.size
        crop = im.crop((round(l * w), round(t * h), round(r * w), round(b * h)))
        if crop.width > CROP_MAX:
            crop = crop.resize((CROP_MAX, round(crop.height * CROP_MAX / crop.width)), Image.LANCZOS)
        crop.save(SITE / f"{name}.webp", quality=88, method=6)
        print(f"{name}.webp {crop.width}x{crop.height}")


if __name__ == "__main__":
    main()
