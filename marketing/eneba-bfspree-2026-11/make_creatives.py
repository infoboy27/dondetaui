"""Eneba Black Friday code BFSPREE (valid until Sunday 2026-11-29) plus the
DóndeTa code for the rest of the year. Feed 1080x1350 and story 1080x1920.
The Eneba creative (source/eneba-bfspree.png, from Eneba's affiliate email) is
gitignored like the other partner sources.
Run: python3 make_creatives.py   (needs Pillow; fonts from apps/mobile/node_modules)"""
import sys
from pathlib import Path
from PIL import Image, ImageDraw

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "black-friday-2026-11"))
from make_creatives import background, poppins, dm, wrap, LOGO, GREEN, YELLOW, MUTED  # noqa: E402

OUT = Path(__file__).resolve().parent
ENEBA = Image.open(OUT / "source/eneba-bfspree.png").convert("RGB")
WHITE, CORAL = (255, 255, 255), (232, 90, 79)


def code_box(d, x, y, w, h, color, label, code, note):
    d.rounded_rectangle((x, y, x + w, y + h), radius=22, outline=color, width=4, fill=(20, 36, 52))
    d.text((x + 30, y + 22), label, font=dm(28, "700Bold"), fill=MUTED)
    d.text((x + 30, y + 58), code, font=poppins(64), fill=color)
    d.text((x + 30, y + h - 52), note, font=dm(27), fill=WHITE)


def render(w, h, story):
    img = background(w, h)
    d = ImageDraw.Draw(img)
    m = 64
    top = 230 if story else 56
    img.paste(LOGO.resize((210, int(210 * LOGO.height / LOGO.width))), (m, top), LOGO.resize((210, int(210 * LOGO.height / LOGO.width))))
    d.text((m, top + 82), "Black Friday gamer en Eneba", font=poppins(48), fill=WHITE)
    y = top + 160
    art_w = w - 2 * m
    pic_w = art_w if story else 640  # the feed is too short for the full-width art
    art = ENEBA.resize((pic_w, int(ENEBA.height * pic_w / ENEBA.width)))
    mask = Image.new("L", art.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, *art.size), radius=28, fill=255)
    img.paste(art, ((w - pic_w) // 2, y), mask)
    y += art.height + (34 if story else 24)
    box_h = 196
    code_box(d, m, y, art_w, box_h, CORAL, "HASTA EL DOMINGO 29 · 1 USO POR PERSONA", "BFSPREE",
             "Hasta -12% en juegos, -10% suscripciones y DLCs")
    y += box_h + 22
    code_box(d, m, y, art_w, box_h, GREEN, "TODO EL AÑO", "DONDETA", "5% extra al pagar en Eneba")
    y += box_h + 30
    for line in wrap(d, "dondeta.com.do · sección Gaming", poppins(36, "600SemiBold"), art_w):
        d.text((m, y), line, font=poppins(36, "600SemiBold"), fill=YELLOW)
        y += 50
    d.text((m, h - (120 if story else 58)), "Publicidad · enlaces de afiliado · un código por compra",
           font=dm(24), fill=MUTED)
    return img, y


for name, (w, h, story) in {"feed": (1080, 1350, False), "story": (1080, 1920, True)}.items():
    img, bottom = render(w, h, story)
    assert bottom < h - (130 if story else 70), f"{name} overflows: {bottom}"
    img.save(OUT / f"eneba-bfspree-{name}.jpg", quality=92)
    print("wrote", name, "content bottom", bottom)
