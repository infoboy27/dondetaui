"""Paid Reel (1080x1920, ~20 s): "¿Esa oferta de Black Friday es real?" ->
a real price that went up -> how DóndeTa checks -> sign up for the real deals.

Run: python3 make_reel_ad.py  -> bf-ad-reel.mp4
- Voiceover: ElevenLabs (voice "Mario", Dominican), key read from
  ~/.config/elevenlabs/api_key. Clips are cached in source/voice/ (gitignored),
  so re-runs cost nothing unless a line changes.
- The example product comes from the live price check (biggest "raised"
  item, no Eneba). The store is not named in the ad on purpose.
- No music: add a track from Meta's sound library when creating the ad."""
import hashlib, io, json, subprocess, urllib.request
from pathlib import Path
from PIL import Image, ImageDraw
from make_creatives import GREEN, MUTED, NAVY, ORANGE, YELLOW, LOGO, OUT, background, dm, poppins, wrap

VOICE_ID = "qGPLsX3HiC7FqSnZTSCe"  # Mario - Upbeat & Friendly Dominican
MODEL = "eleven_multilingual_v2"
VOICE_DIR = OUT / "source/voice"
WORK = OUT / "source/reel"
W, H, FPS = 1080, 1920, 30
RED = (255, 107, 107)
WHITE = (255, 255, 255)
# Instagram covers the top ~220 px and the bottom ~380 px of a Reel: keep text between.
TOP, BOTTOM = 240, H - 400

SPOKEN_NUMBERS = {  # ElevenLabs reads "RD$2,195" poorly: write prices out.
    2195: "dos mil ciento noventa y cinco", 4495: "cuatro mil cuatrocientos noventa y cinco",
}

def rd(n): return f"RD${round(n):,}"

def example_product():
    req = urllib.request.Request("https://dondeta.com.do/api/price-check", headers={"User-Agent": "dondeta-marketing"})
    data = json.load(urllib.request.urlopen(req, timeout=30))
    items = [i for i in data["raised"] if i["store"] != "Eneba" and i.get("image")]
    return max(items, key=lambda i: i["pctVsReference"])

def tts(text):
    VOICE_DIR.mkdir(parents=True, exist_ok=True)
    path = VOICE_DIR / (hashlib.sha1(f"{VOICE_ID}|{MODEL}|{text}".encode()).hexdigest()[:16] + ".mp3")
    if path.exists(): return path
    key = (Path.home() / ".config/elevenlabs/api_key").read_text().strip()
    body = json.dumps({"text": text, "model_id": MODEL,
                       "voice_settings": {"stability": 0.45, "similarity_boost": 0.8, "style": 0.35}}).encode()
    req = urllib.request.Request(f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE_ID}?output_format=mp3_44100_128",
                                 data=body, headers={"xi-api-key": key, "Content-Type": "application/json"})
    path.write_bytes(urllib.request.urlopen(req, timeout=60).read())
    return path

def duration(path):
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(path)],
                         capture_output=True, text=True, check=True)
    return float(out.stdout)

def canvas():
    img = background(W, H)
    img.paste(LOGO, ((W - LOGO.width) // 2, TOP - 20), LOGO)
    return img, ImageDraw.Draw(img)

def centered(d, y, text, font, fill, width=W - 160, gap=1.08):
    for line in wrap(d, text, font, width):
        d.text((W / 2, y), line, font=font, fill=fill, anchor="ma"); y += int(font.size * gap)
    return y

def subtitle(d, text):
    """Burned-in caption for muted viewers, just above Instagram's bottom UI."""
    f = dm(36, "700Bold")
    lines = wrap(d, text, f, W - 200)
    y = BOTTOM - 40 - len(lines) * 50
    pad = 22
    d.rounded_rectangle((70, y - pad, W - 70, y + len(lines) * 50 + pad - 6), radius=24, fill=(8, 16, 26))
    for line in lines:
        d.text((W / 2, y), line, font=f, fill=WHITE, anchor="ma"); y += 50

def scene_hook(line):
    img, d = canvas()
    f = poppins(108, "800ExtraBold")
    y = 640
    y = centered(d, y, "¿Esa oferta", f, WHITE)
    y = centered(d, y, "de Black Friday", f, WHITE)
    centered(d, y + 10, "es real?", poppins(150, "800ExtraBold"), GREEN)
    subtitle(d, line)
    return img

def scene_product(line, item, photo):
    img, d = canvas()
    centered(d, 470, "Mira esta plancha", poppins(76, "800ExtraBold"), WHITE)
    box = 520
    card = Image.new("RGB", (box, box), WHITE)
    photo.thumbnail((box - 60, box - 60))
    card.paste(photo, ((box - photo.width) // 2, (box - photo.height) // 2))
    mask = Image.new("L", (box, box), 0); ImageDraw.Draw(mask).rounded_rectangle((0, 0, box, box), radius=40, fill=255)
    img.paste(card, ((W - box) // 2, 600), mask)
    # +105% sticker on the photo's top-right corner.
    badge = f"+{round(item['pctVsReference'])}%"
    bf = poppins(60, "800ExtraBold"); bw = d.textlength(badge, font=bf) + 64
    bx, by = (W + box) / 2 - bw + 40, 600 - 34
    d.rounded_rectangle((bx, by, bx + bw, by + 88), radius=44, fill=RED)
    d.text((bx + bw / 2, by + 44), badge, font=bf, fill=NAVY, anchor="mm")
    # Before / today, stacked so long prices never collide.
    y = 600 + box + 46
    lf = dm(40, "700Bold")
    d.text((W / 2, y), f"Hace unas semanas: {rd(item['reference'])}", font=lf, fill=MUTED, anchor="ma")
    y += 70
    hf = poppins(96, "800ExtraBold")
    d.text((W / 2, y), f"Hoy: {rd(item['current'])}", font=hf, fill=RED, anchor="ma")
    subtitle(d, line)
    return img

def scene_how(line):
    img, d = canvas()
    y = centered(d, 470, "Comparamos cada precio con sus", poppins(62, "800ExtraBold"), WHITE)
    y = centered(d, y, "últimos 30 días", poppins(86, "800ExtraBold"), GREEN) + 40
    rows = [(GREEN, "Ofertas reales", "más baratas que en 30 días"),
            (ORANGE, "Rebajas infladas", "subieron antes de “bajar”"),
            (RED, "Subieron de precio", "ojo antes de comprar")]
    tf, sf = poppins(50, "700Bold"), dm(34)
    for color, title, sub in rows:
        d.rounded_rectangle((90, y, W - 90, y + 170), radius=30, fill=(20, 40, 58))
        d.rounded_rectangle((90, y, 112, y + 170), radius=11, fill=color)
        d.text((150, y + 34), title, font=tf, fill=WHITE)
        d.text((150, y + 102), sub, font=sf, fill=MUTED)
        y += 200
    centered(d, y + 20, "Plaza Lama · Sirena · Jumbo · Corripio · PriceSmart", dm(32, "700Bold"), YELLOW)
    subtitle(d, line)
    return img

def scene_cta(line):
    img, d = canvas()
    f = poppins(110, "800ExtraBold")
    y = centered(d, 560, "Te avisamos", f, WHITE)
    y = centered(d, y, "solo de las", f, WHITE)
    y = centered(d, y, "ofertas reales", f, GREEN) + 50
    y = centered(d, y, "Crea tu cuenta gratis y te llega por correo lo que de verdad bajó.", dm(42), MUTED, width=W - 220) + 40
    cf = poppins(52, "800ExtraBold")
    d.rounded_rectangle((120, y, W - 120, y + 120), radius=60, fill=GREEN)
    d.text((W / 2, y + 60), "Regístrate gratis", font=cf, fill=NAVY, anchor="mm")
    centered(d, y + 150, "dondeta.com.do", poppins(48, "700Bold"), WHITE)
    subtitle(d, line)
    return img

def clip(img, audio, index, tail=0.45):
    """One scene: a slow push-in on the still, with its voice line."""
    WORK.mkdir(parents=True, exist_ok=True)
    png = WORK / f"scene{index}.png"; img.save(png)
    secs = duration(audio) + tail
    frames = int(secs * FPS)
    out = WORK / f"scene{index}.mp4"
    vf = (f"scale={W * 2}:{H * 2},zoompan=z='1+0.035*on/{frames}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)'"
          f":d={frames}:s={W}x{H}:fps={FPS},format=yuv420p")
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-loop", "1", "-i", str(png), "-i", str(audio),
                    "-filter_complex", f"[0:v]{vf}[v];[1:a]apad,atrim=0:{secs:.3f},aresample=44100[a]",
                    "-map", "[v]", "-map", "[a]", "-t", f"{secs:.3f}", "-r", str(FPS),
                    "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-c:a", "aac", "-b:a", "160k", str(out)], check=True)
    return out

if __name__ == "__main__":
    item = example_product()
    ref, cur = round(item["reference"]), round(item["current"])
    if ref not in SPOKEN_NUMBERS or cur not in SPOKEN_NUMBERS or "plancha" not in item["productName"].lower():
        raise SystemExit(f"example changed ({item['productName']}: {ref} -> {cur}): update scene 2 text and SPOKEN_NUMBERS")
    photo = Image.open(io.BytesIO(urllib.request.urlopen(item["image"], timeout=30).read())).convert("RGB")

    lines = [
        ("¿Esa oferta de Black Friday… es real?", "¿Esa oferta de Black Friday es real?"),
        (f"Mira esta plancha: hace unas semanas costaba {SPOKEN_NUMBERS[ref]} pesos. Hoy cuesta más del doble. "
         "Si el viernes la rebajan… eso no es oferta.",
         f"Hace unas semanas costaba {rd(ref)}. Hoy, más del doble. Si el viernes la “rebajan”, no es oferta."),
        ("En DóndeTa comparamos cada precio con sus últimos treinta días, en las tiendas de aquí.",
         "En DóndeTa comparamos cada precio con sus últimos 30 días."),
        ("Crea tu cuenta gratis… y te avisamos solo de las ofertas reales.",
         "Crea tu cuenta gratis y te avisamos solo de las ofertas reales."),
    ]
    scenes = [scene_hook(lines[0][1]), scene_product(lines[1][1], item, photo), scene_how(lines[2][1]), scene_cta(lines[3][1])]
    clips = [clip(img, tts(spoken), n, tail=0.3 if n == 0 else 0.5 if n < 3 else 1.6)
             for n, (img, (spoken, _)) in enumerate(zip(scenes, lines))]
    listing = WORK / "concat.txt"
    listing.write_text("".join(f"file '{c}'\n" for c in clips))
    target = OUT / "bf-ad-reel.mp4"
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-f", "concat", "-safe", "0", "-i", str(listing),
                    "-c", "copy", "-movflags", "+faststart", str(target)], check=True)
    scenes[0].save(OUT / "bf-ad-reel-cover.jpg", quality=92)
    print(f"{target.name}: {duration(target):.1f}s")
