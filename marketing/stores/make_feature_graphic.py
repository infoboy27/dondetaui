"""Google Play feature graphic (1024x500, no alpha). Run: python3 make_feature_graphic.py"""
from pathlib import Path
from PIL import Image, ImageDraw
import sys
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "black-friday-2026-11"))
from make_creatives import GREEN, MUTED, NAVY, YELLOW, LOGO, background, dm, poppins

ROOT = Path(__file__).resolve().parents[2]
W, H = 1024, 500
img = background(W, H)
d = ImageDraw.Draw(img)
icon = Image.open(ROOT / "apps/mobile/assets/icon.png").convert("RGBA").resize((300, 300))
plate = Image.new("RGBA", (330, 330), (0, 0, 0, 0))
ImageDraw.Draw(plate).rounded_rectangle((0, 0, 329, 329), radius=72, fill=(255, 255, 255, 255))
plate.alpha_composite(icon, (15, 15))
img.paste(plate, (W - 330 - 70, (H - 330) // 2), plate)
logo = LOGO.copy(); logo.thumbnail((300, 100))
img.paste(logo, (60, 60), logo)
y = 190
for text, color in [("Compara antes", (255, 255, 255)), ("de comprar.", GREEN)]:
    d.text((60, y), text, font=poppins(62, "800ExtraBold"), fill=color); y += 72
d.text((62, y + 14), "Precios de RD con su historial", font=dm(28, "700Bold"), fill=YELLOW)
img.convert("RGB").save(Path(__file__).with_name("feature-graphic-1024x500.png"))
print("ok")
