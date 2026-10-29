"""Launch post for card discounts (feed 1080x1350, story 1080x1920).
Same look as ../black-friday-2026-11. Run: python3 make_creatives.py
(needs Pillow; fonts from apps/mobile/node_modules). Prices are an example,
no real bank is named: the post announces the feature, not a promotion."""
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

def card_icon(d, x, y):
    d.rounded_rectangle((x, y, x + 64, y + 44), radius=8, fill=ORANGE)
    d.rectangle((x, y + 10, x + 64, y + 19), fill=NAVY)
    d.rounded_rectangle((x + 8, y + 27, x + 26, y + 36), radius=2, fill=PEACH)

def mock_offer(d, m, y, w):
    """A product page row: list price, then the price with a card."""
    h = 300
    d.rounded_rectangle((m, y, w - m, y + h), radius=34, fill=(255, 255, 255))
    d.text((m + 40, y + 40), "Lavadora 18 kg", font=dm(30, "500Medium"), fill=GREY)
    d.text((m + 40, y + 86), "Tienda A", font=poppins(40, "600SemiBold"), fill=NAVY)
    price = "RD$24,495"
    pf = poppins(46, "700Bold")
    d.text((w - m - 40 - d.textlength(price, font=pf), y + 80), price, font=pf, fill=NAVY)
    d.line((m + 40, y + 160, w - m - 40, y + 160), fill=(232, 237, 242), width=2)
    d.rounded_rectangle((m + 24, y + 182, w - m - 24, y + h - 24), radius=24, fill=PEACH)
    card_icon(d, m + 52, y + 214)
    d.text((m + 136, y + 236), "Con tu tarjeta −10%", font=dm(34, "700Bold"), fill=NAVY, anchor="lm")
    price = "RD$22,045"
    d.text((w - m - 52, y + 236), price, font=poppins(46, "800ExtraBold"), fill=ORANGE, anchor="rm")
    return y + h

def render(w, h, shift=0):
    img = background(w, h)
    d = ImageDraw.Draw(img)
    m = 76
    story = h > 1500
    y = 150 if story else 78
    img.paste(LOGO, (m - 10, y), LOGO)
    y += LOGO.height + (90 if story else 36) + shift

    pill = "NUEVO EN DÓNDETA"
    f = poppins(32, "700Bold")
    d.rounded_rectangle((m, y, m + d.textlength(pill, font=f) + 64, y + 64), radius=32, fill=ORANGE)
    d.text((m + 32, y + 32), pill, font=f, fill=NAVY, anchor="lm")
    y += 64 + (50 if story else 34)

    size = 100 if story else 90
    hf = poppins(size, "800ExtraBold")
    for text, color in [("El precio con", (255, 255, 255)), ("tu tarjeta", ORANGE)]:
        d.text((m, y), text, font=hf, fill=color)
        y += int(size * 1.08)
    y += 22

    sf = dm(40 if story else 36)
    for line in wrap(d, "Ahora ves cuánto pagas de verdad con los descuentos de tu banco en cada tienda.", sf, w - 2 * m):
        d.text((m, y), line, font=sf, fill=MUTED); y += 52
    y += 40 if story else 30

    y = mock_offer(d, m, y, w) + (40 if story else 26)
    nf = dm(26)
    d.text((m, y), "Precios de ejemplo. Sujeto a condiciones de cada banco.", font=nf, fill=GREY)
    end = y + 30

    by = h - (230 if story else 118)
    cf = poppins(40, "700Bold")
    d.rounded_rectangle((m, by, w - m, by + 96), radius=48, fill=GREEN)
    d.text((w / 2, by + 48), "dondeta.com.do", font=cf, fill=NAVY, anchor="mm")
    return img, end

render(1080, 1350)[0].save(OUT / "tarjetas-feed.jpg", quality=92)
_, end = render(1080, 1920)
top = 150 + LOGO.height + 90
shift = max(0, ((1920 - 230 - top) - (end - top)) // 2 - 40)
render(1080, 1920, shift)[0].save(OUT / "tarjetas-story.jpg", quality=92)
print("ok")
