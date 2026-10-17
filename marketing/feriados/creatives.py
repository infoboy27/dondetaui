"""Renderer for the commercial-occasion posts (feed 1080x1350, story 1080x1920).
Same look as marketing/black-friday-2026-11. Needs Pillow; fonts from apps/mobile/node_modules."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = Path(__file__).resolve().parents[2]
FONTS = ROOT / "apps/mobile/node_modules/@expo-google-fonts"
OUT = Path(__file__).resolve().parent / "out"
NAVY, GREEN, ORANGE, YELLOW, MINT = (15, 29, 45), (0, 184, 148), (255, 159, 28), (255, 209, 102), (230, 247, 243)
MUTED = (186, 198, 210)

def poppins(size, w="700Bold"): return ImageFont.truetype(str(FONTS / f"poppins/{w}/Poppins_{w}.ttf"), size)
def dm(size, w="400Regular"): return ImageFont.truetype(str(FONTS / f"dm-sans/{w}/DMSans_{w}.ttf"), size)

# Dark-background logo cropped from the brand sheet.
sheet = Image.open(ROOT / "marketing/brand/dondeta-logo-sheet.png").convert("RGB")
LOGO = sheet.crop((1000, 520, 1350, 676))
# The tile's navy differs slightly from the post background: turn it into transparency.
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
    d.rounded_rectangle((m, y, m + tw + 64, y + 64), radius=32, fill=ORANGE if v["orange"] else GREEN)
    d.text((m + 32, y + 32), v["pill"], font=f, fill=NAVY, anchor="lm")
    y += 64 + (50 if story else 34)

    size = 108 if story else 98
    hf = poppins(size, "800ExtraBold")
    for text, color in v["lines"]:
        color = GREEN if color == "green" else (255, 255, 255)
        while d.textlength(text, font=hf) > w - 2 * m: size -= 4; hf = poppins(size, "800ExtraBold")
    for text, color in v["lines"]:
        color = GREEN if color == "green" else (255, 255, 255)
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
    if v["card"]:
        big, mid, small = v["card"]
        ch = 230
        d.rounded_rectangle((m, y, w - m, y + ch), radius=34, fill=(17, 48, 56), outline=GREEN, width=4)
        d.text((m + 48, y + ch / 2), big, font=poppins(112, "800ExtraBold"), fill=YELLOW, anchor="lm")
        bx = m + 48 + d.textlength(big, font=poppins(112, "800ExtraBold")) + 36
        d.text((bx, y + ch / 2 - 22), mid, font=poppins(52, "700Bold"), fill=(255, 255, 255), anchor="lm")
        d.text((bx, y + ch / 2 + 34), small, font=dm(34), fill=MUTED, anchor="lm")
        y += ch

    by = h - (230 if story else 118)
    cf = poppins(40, "700Bold")
    d.rounded_rectangle((m, by, w - m, by + 96), radius=48, fill=GREEN)
    d.text((w / 2, by + 48), v["url"], font=cf, fill=NAVY, anchor="mm")
    return img, y



def render_pair(v, folder):
    """Writes <key>-feed.jpg and <key>-story.jpg for one moment into folder."""
    folder.mkdir(parents=True, exist_ok=True)
    render(1080, 1350, v)[0].save(folder / f"{v['key']}-feed.jpg", quality=92)
    _, end = render(1080, 1920, v)
    shift = max(0, (1920 - 230 - 150 - 156 - 90 - (end - 150 - 156 - 90)) // 2 - 40)
    render(1080, 1920, v, shift)[0].save(folder / f"{v['key']}-story.jpg", quality=92)
