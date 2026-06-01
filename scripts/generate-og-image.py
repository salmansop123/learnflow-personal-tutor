#!/usr/bin/env python3
"""Generate public/og-image.png (1200x630) for Open Graph."""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "og-image.png"

W, H = 1200, 630


def main() -> None:
    img = Image.new("RGB", (W, H), "#0f1729")
    draw = ImageDraw.Draw(img)

    for i in range(3):
        alpha = 40 - i * 10
        draw.ellipse(
            (200 + i * 80, -80 + i * 40, 900 - i * 60, 400 + i * 50),
            fill=(59, 130, 246, alpha) if img.mode == "RGBA" else (30, 58, 120),
        )

    # Gradient bands (approximate with rectangles)
    draw.rectangle((0, 0, W, H), fill=(15, 23, 41))
    draw.ellipse((80, -120, 520, 320), fill=(37, 99, 235))
    draw.ellipse((700, 200, 1180, 700), fill=(124, 58, 237))
    draw.ellipse((400, 80, 900, 500), fill=(6, 182, 212))

    # Darken overlay
    overlay = Image.new("RGBA", (W, H), (15, 23, 41, 180))
    img = img.convert("RGBA")
    img = Image.alpha_composite(img, overlay)
    draw = ImageDraw.Draw(img)

    try:
        title_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 72)
        sub_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 32)
    except OSError:
        title_font = ImageFont.load_default()
        sub_font = ImageFont.load_default()

    draw.rounded_rectangle((72, 72, 132, 132), radius=20, fill=(59, 130, 246))
    draw.line((88, 102, 116, 102), fill="white", width=5)
    draw.line((102, 88, 102, 116), fill="white", width=5)

    draw.text((152, 88), "LearnFlow", fill="white", font=title_font)
    draw.text(
        (72, 200),
        "AI-Powered Personal Tutor",
        fill=(203, 213, 225),
        font=sub_font,
    )
    draw.text(
        (72, 260),
        "Study smarter with AI tutoring, notes, quizzes & plans",
        fill=(148, 163, 184),
        font=sub_font,
    )

    draw.rounded_rectangle((72, 480, 340, 548), radius=16, fill=(59, 130, 246))
    draw.text((108, 498), "Get started free", fill="white", font=sub_font)

    img = img.convert("RGB")
    OUT.parent.mkdir(parents=True, exist_ok=True)
    img.save(OUT, "PNG", optimize=True)
    print(f"Wrote {OUT}")


if __name__ == "__main__":
    main()
