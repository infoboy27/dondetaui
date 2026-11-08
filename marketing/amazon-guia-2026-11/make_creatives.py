"""Post for the "Comprar en Amazon desde RD" guide (feed 1080x1350, story 1080x1920).
Same look as ../tarjetas-2026-11. Run: python3 make_creatives.py
(needs Pillow; fonts from apps/mobile/node_modules). Figures are the guide's
illustrative example; no Amazon logo or trademark artwork (text mention only)."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = Path(__file__).resolve().parents[2]
FONTS = ROOT / "apps/mobile/node_modules/@expo-google-fonts"
OUT = Path(__file__).resolve().parent
NAVY, GREEN, ORANGE, MINT = (15, 29, 45), (0, 184, 148), (255, 159, 28), (230, 247, 243)
MUTED, PEACH, GREY = (186, 198, 210), (255, 243, 224), (154, 170, 187)

def poppins(size, w="700Bold"): return ImageFont.truetype(str(FONTS / f"poppins/{w}/Poppins_{w}.ttf"), size)
def dm(size, w="400Regular"): return ImageFont.truetype(str(FONTS / f"dm-sans/{w}/DMSans_{w}.ttf"), size)

sheet = Image.open(ROOT / "marketing/brand/dondeta-logo-sheet.png").convert("RGB")
LOGO = sheet.crop((1000, 520, 1350, 676))
_bg = LOGO.getpixel((2, 2))
_alpha = Image.new("L", LOGO.size)
_alpha.putdata([min(255, max(abs(r - _bg[0]), abs(g - _bg[1]), abs(b - _bg[2])) * 8) for r, g, b in LOGO.getdata()])
LOGO.putalpha(_alpha)

def background(w, h):
    img = Image.new("RGB", (w, h), NAVY)
    glow = Image.new("RGB", (w, h), NAVY)
    d = ImageDraw.Draw(glow)
    d.ellipse((w * 0.35, -h * 0.25, w * 1.3, h * 0.3), fill=(10, 80, 72))
    d.ellipse((-w * 0.4, h * 0.85, w * 0.45, h * 1.3), fill=(70, 50, 15))
    img = Image.blend(img, glow.filter(ImageFilter.GaussianBlur(160)), 0.9)
    g = ImageDraw.Draw(img)
    for x in range(0, w, 54): g.line((x, 0, x, h), fill=(21, 37, 54), width=1)
    for y in range(0, h, 54): g.line((0, y, w, y), fill=(21, 37, 54), width=1)
    return img

def wrap(draw, text, font, width):
    words, lines, cur = text.split(), [], ""
    for word in words:
        trial = f"{cur} {word}".strip()
        if draw.textlength(trial, font=font) <= width: cur = trial
        else: lines.append(cur); cur = word
    return lines + [cur]


ROWS = [("Precio en Amazon", "US$80"), ("Courier (9 lb + cargos)", "US$32"), ("Impuestos (menos de US$200)", "US$0")]

def mock_math(d, m, y, w):
    """The guide's worked example: Amazon + courier vs. the local store."""
    h = 470
    d.rounded_rectangle((m, y, w - m, y + h), radius=34, fill=(255, 255, 255))
    d.text((m + 40, y + 34), "Licuadora · ejemplo", font=dm(30, "500Medium"), fill=GREY)
    ry = y + 92
    for label, value in ROWS:
        d.text((m + 40, ry), label, font=dm(34), fill=NAVY)
        d.text((w - m - 40, ry), value, font=poppins(36, "600SemiBold"), fill=NAVY, anchor="ra")
        ry += 56
    d.line((m + 40, ry + 6, w - m - 40, ry + 6), fill=(232, 237, 242), width=2)
    ry += 24
    d.text((m + 40, ry), "Total traído", font=dm(34, "700Bold"), fill=NAVY)
    d.text((w - m - 40, ry), "≈ RD$6,720", font=poppins(40, "800ExtraBold"), fill=NAVY, anchor="ra")
    d.rounded_rectangle((m + 24, y + h - 104, w - m - 24, y + h - 24), radius=24, fill=PEACH)
    d.text((m + 56, y + h - 64), "En tienda de aquí: RD$7,200", font=dm(32, "700Bold"), fill=NAVY, anchor="lm")
    d.text((w - m - 56, y + h - 64), "−RD$480", font=poppins(40, "800ExtraBold"), fill=ORANGE, anchor="rm")
    return y + h

def render(w, h, shift=0):
    img = background(w, h)
    d = ImageDraw.Draw(img)
    m = 76
    story = h > 1500
    y = 150 if story else 78
    img.paste(LOGO, (m - 10, y), LOGO)
    y += LOGO.height + (90 if story else 36) + shift

    pill = "GUÍA DE COMPRA"
    f = poppins(32, "700Bold")
    d.rounded_rectangle((m, y, m + d.textlength(pill, font=f) + 64, y + 64), radius=32, fill=ORANGE)
    d.text((m + 32, y + 32), pill, font=f, fill=NAVY, anchor="lm")
    y += 64 + (50 if story else 34)

    size = 92 if story else 84
    hf = poppins(size, "800ExtraBold")
    for text, color in [("¿Amazon o", (255, 255, 255)), ("tienda de aquí?", ORANGE)]:
        d.text((m, y), text, font=hf, fill=color)
        y += int(size * 1.08)
    y += 22

    sf = dm(40 if story else 36)
    for line in wrap(d, "Precio + courier + impuestos: haz la cuenta." if not story else "Precio + courier + impuestos: haz la cuenta completa antes de comprar.", sf, w - 2 * m):
        d.text((m, y), line, font=sf, fill=MUTED); y += 52
    y += 40 if story else 30

    y = mock_math(d, m, y, w) + (40 if story else 26)
    nf = dm(26)
    d.text((m, y), "Cifras de ejemplo. Usa las tarifas de tu courier y la tasa de tu tarjeta.", font=nf, fill=GREY)
    end = y + 30

    by = h - (230 if story else 118)
    cf = poppins(40, "700Bold")
    d.rounded_rectangle((m, by, w - m, by + 96), radius=48, fill=GREEN)
    d.text((w / 2, by + 48), "Guía en dondeta.com.do", font=cf, fill=NAVY, anchor="mm")
    return img, end

render(1080, 1350)[0].save(OUT / "amazon-guia-feed.jpg", quality=92)
_, end = render(1080, 1920)
top = 150 + LOGO.height + 90
shift = max(0, ((1920 - 230 - top) - (end - top)) // 2 - 40)
render(1080, 1920, shift)[0].save(OUT / "amazon-guia-story.jpg", quality=92)
print("ok")
