"""Country-launch and new-store Instagram creatives (feed 1080x1350, story 1080x1920): Colombia, México,
and a "muy pronto" for Estados Unidos. Same look as the Black Friday set.
Run: python3 make_creatives.py   (needs Pillow; fonts from apps/mobile/node_modules; flags drawn as shapes)"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = Path(__file__).resolve().parents[2]
FONTS = ROOT / "apps/mobile/node_modules/@expo-google-fonts"
OUT = Path(__file__).resolve().parent
NAVY, GREEN, ORANGE, YELLOW = (15, 29, 45), (0, 184, 148), (255, 159, 28), (255, 209, 102)
MUTED = (186, 198, 210)

def poppins(size, w="700Bold"): return ImageFont.truetype(str(FONTS / f"poppins/{w}/Poppins_{w}.ttf"), size)
def dm(size, w="400Regular"): return ImageFont.truetype(str(FONTS / f"dm-sans/{w}/DMSans_{w}.ttf"), size)

sheet = Image.open(ROOT / "marketing/brand/dondeta-logo-sheet.png").convert("RGB")
LOGO = sheet.crop((1000, 520, 1350, 676))
_bg = LOGO.getpixel((2, 2))
_alpha = Image.new("L", LOGO.size)
_alpha.putdata([min(255, max(abs(r - _bg[0]), abs(g - _bg[1]), abs(b - _bg[2])) * 8) for r, g, b in LOGO.getdata()])
LOGO.putalpha(_alpha)

def flag(code, width):
    """Flag drawn as shapes (macOS' emoji font doesn't compose regional-indicator pairs in Pillow)."""
    S = 4  # supersample for smooth edges
    w, h = width * S, int(width * 2 / 3) * S
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    if code == "CO":
        d.rectangle((0, 0, w, h // 2), fill=(252, 209, 22))
        d.rectangle((0, h // 2, w, h * 3 // 4), fill=(0, 56, 147))
        d.rectangle((0, h * 3 // 4, w, h), fill=(206, 17, 38))
    elif code == "MX":
        d.rectangle((0, 0, w // 3, h), fill=(0, 104, 71))
        d.rectangle((w // 3, 0, w * 2 // 3, h), fill=(255, 255, 255))
        d.rectangle((w * 2 // 3, 0, w, h), fill=(206, 17, 43))
        r = h // 7
        d.ellipse((w // 2 - r, h // 2 - r, w // 2 + r, h // 2 + r), fill=(150, 110, 50))
        d.ellipse((w // 2 - r // 2, h // 2 - r // 2, w // 2 + r // 2, h // 2 + r // 2), fill=(0, 104, 71))
    elif code == "DO":
        d.rectangle((0, 0, w // 2, h // 2), fill=(0, 45, 98))
        d.rectangle((w // 2, 0, w, h // 2), fill=(206, 17, 38))
        d.rectangle((0, h // 2, w // 2, h), fill=(206, 17, 38))
        d.rectangle((w // 2, h // 2, w, h), fill=(0, 45, 98))
        d.rectangle((w // 2 - w // 16, 0, w // 2 + w // 16, h), fill=(255, 255, 255))
        d.rectangle((0, h // 2 - h // 10, w, h // 2 + h // 10), fill=(255, 255, 255))
    elif code == "US":
        sh = h / 13
        for i in range(13):
            d.rectangle((0, i * sh, w, (i + 1) * sh), fill=(178, 34, 52) if i % 2 == 0 else (255, 255, 255))
        cw, ch = int(w * 0.42), int(sh * 7)
        d.rectangle((0, 0, cw, ch), fill=(60, 59, 110))
        for row in range(5):
            for col in range(6):
                x, y = (col + 0.8) * cw / 6.6, (row + 0.9) * ch / 5.6
                d.ellipse((x - 5, y - 5, x + 5, y + 5), fill=(255, 255, 255))
    mask = Image.new("L", (w, h), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, w, h), radius=14 * S, fill=255)
    img.putalpha(mask)
    return img.resize((width, h // S), Image.LANCZOS)

VARIANTS = {
    "colombia": dict(
        pill="NUEVO EN DÓNDETA", pill_color=GREEN, lines=[("DóndeTa ya está", (255, 255, 255)), ("en Colombia", GREEN)],
        sub="Compara precios de electrodomésticos y tecnología en un solo lugar.",
        points=["Alkosto, Éxito, Falabella y Ktronix", "Precio e historial de cada producto", "Más de 3,900 productos comparados"],
        card=("CO", "Colombia", "Versión web disponible"), button="co.dondeta.com.do",
        note="App para iOS y Android en camino"),
    "mexico": dict(
        pill="NUEVO EN DÓNDETA", pill_color=GREEN, lines=[("DóndeTa ya está", (255, 255, 255)), ("en México", GREEN)],
        sub="Compara precios de electrodomésticos y tecnología en un solo lugar.",
        points=["Elektra, Chedraui y Sears", "Precio e historial de cada producto", "Más de 1,600 productos comparados"],
        card=("MX", "México", "Versión web disponible"), button="mx.dondeta.com.do",
        note="App para iOS y Android en camino"),
    "tienda-cecomsa": dict(
        pill="NUEVA TIENDA", pill_color=GREEN, lines=[("Cecomsa", GREEN), ("ya está en DóndeTa", (255, 255, 255))],
        sub="Ahora comparamos sus precios con los de las demás tiendas dominicanas.",
        points=["Aires, estufas, extractores, neveras y TV", "Más de 40 productos con precio e historial", "Compáralos con Sirena, Jumbo y más"],
        card=("DO", "Cecomsa", "Ya disponible en DóndeTa"), button="dondeta.com.do", note="Precios publicados por la tienda"),
    "tienda-electrodom": dict(
        pill="NUEVA TIENDA", pill_color=GREEN, lines=[("Electrodom", GREEN), ("ya está en DóndeTa", (255, 255, 255))],
        sub="Ahora comparamos sus precios con los de las demás tiendas dominicanas.",
        points=["Estufas, extractores, neveras, hornos y TV", "Más de 170 productos con precio e historial", "Compáralos con Sirena, Plaza Lama y más"],
        card=("DO", "Electrodom", "Ya disponible en DóndeTa"), button="dondeta.com.do", note="Precios publicados por la tienda"),
    "estados-unidos": dict(
        pill="MUY PRONTO", pill_color=ORANGE, lines=[("DóndeTa va", (255, 255, 255)), ("a Estados Unidos", GREEN)],
        sub="Estamos preparando la comparación de precios en tiendas de EE. UU.",
        points=None, card=("US", "Estados Unidos", "Próximamente"), button="dondeta.com.do",
        note="Ya en RD, Colombia y México"),
}

def background(w, h):
    img = Image.new("RGB", (w, h), NAVY)
    glow = Image.new("RGB", (w, h), NAVY)
    d = ImageDraw.Draw(glow)
    d.ellipse((w * 0.35, -h * 0.25, w * 1.3, h * 0.3), fill=(10, 80, 72))
    d.ellipse((-w * 0.4, h * 0.85, w * 0.45, h * 1.3), fill=(70, 50, 15))
    glow = glow.filter(ImageFilter.GaussianBlur(160))
    img = Image.blend(img, glow, 0.9)
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

def render(w, h, v, shift=0):
    img = background(w, h)
    d = ImageDraw.Draw(img)
    m = 76
    story = h > 1500
    y = 150 if story else 78
    img.paste(LOGO, (m - 10, y), LOGO)
    y += LOGO.height + (90 if story else 36) + shift

    f = poppins(32, "700Bold")
    tw = d.textlength(v["pill"], font=f)
    d.rounded_rectangle((m, y, m + tw + 64, y + 64), radius=32, fill=v["pill_color"])
    d.text((m + 32, y + 32), v["pill"], font=f, fill=NAVY, anchor="lm")
    y += 64 + (50 if story else 34)

    size = 108 if story else 98
    hf = poppins(size, "800ExtraBold")
    for text, color in v["lines"]:
        while d.textlength(text, font=hf) > w - 2 * m: size -= 4; hf = poppins(size, "800ExtraBold")
    for text, color in v["lines"]:
        d.text((m, y), text, font=hf, fill=color)
        y += int(size * 1.08)
    y += 26

    sf = dm(40 if story else 36)
    for line in wrap(d, v["sub"], sf, w - 2 * m):
        d.text((m, y), line, font=sf, fill=MUTED); y += 54
    y += 30

    if v["points"]:
        pf = dm(34, "700Bold")
        for p in v["points"]:
            lines = wrap(d, p, pf, w - 2 * m - 80)
            d.ellipse((m, y + 4, m + 44, y + 48), fill=GREEN)
            d.line((m + 12, y + 27, m + 20, y + 35, m + 33, y + 18), fill=NAVY, width=6, joint="curve")
            for line in lines:
                d.text((m + 70, y + 4), line, font=pf, fill=(255, 255, 255)); y += 46
            y += 30

    code, name, small = v["card"]
    ch = 170 if v["points"] else 190
    d.rounded_rectangle((m, y, w - m, y + ch), radius=34, fill=(17, 48, 56), outline=GREEN, width=4)
    fl = flag(code, 170)
    img.paste(fl, (m + 40, y + (ch - fl.height) // 2), fl)
    tx = m + 40 + 170 + 40
    d.text((tx, y + ch / 2 - 22), name, font=poppins(52, "700Bold"), fill=(255, 255, 255), anchor="lm")
    d.text((tx, y + ch / 2 + 36), small, font=dm(34), fill=MUTED, anchor="lm")
    y += ch

    by = h - (230 if story else 118)
    d.text((w / 2, by - 36), v["note"], font=dm(30), fill=MUTED, anchor="mm")
    d.rounded_rectangle((m, by, w - m, by + 96), radius=48, fill=GREEN)
    d.text((w / 2, by + 48), v["button"], font=poppins(40, "700Bold"), fill=NAVY, anchor="mm")
    return img, y

for key, v in VARIANTS.items():
    render(1080, 1350, v)[0].save(OUT / f"pais-{key}-feed.jpg", quality=92)
    _, end = render(1080, 1920, v)
    shift = max(0, (1920 - 230 - 150 - 156 - 90 - (end - 150 - 156 - 90)) // 2 - 40)
    render(1080, 1920, v, shift)[0].save(OUT / f"pais-{key}-story.jpg", quality=92)
print("ok")
