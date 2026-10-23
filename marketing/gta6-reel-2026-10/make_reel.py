"""GTA VI Reel from the Eneba ad (used with Eneba's permission): the original 16:9 video, unmodified,
centred on a blurred 9:16 canvas with DóndeTa's logo above and the call to action below.
Run: python3 make_reel.py <eneba-video.mp4>   (needs Pillow and ffmpeg)"""
import subprocess, sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[2]
OUT = Path(__file__).resolve().parent
SRC = Path(sys.argv[1]).expanduser()
FONTS = ROOT / "apps/mobile/node_modules/@expo-google-fonts"
NAVY, GREEN, ORANGE = (15, 29, 45), (0, 184, 148), (255, 159, 28)
MUTED = (186, 198, 210)
W, H = 1080, 1920
VIDEO_H = 608  # 1080 wide at 16:9

def poppins(size, w="700Bold"): return ImageFont.truetype(str(FONTS / f"poppins/{w}/Poppins_{w}.ttf"), size)
def dm(size, w="400Regular"): return ImageFont.truetype(str(FONTS / f"dm-sans/{w}/DMSans_{w}.ttf"), size)

sheet = Image.open(ROOT / "marketing/brand/dondeta-logo-sheet.png").convert("RGB")
logo = sheet.crop((1000, 520, 1350, 676))
bg = logo.getpixel((2, 2))
alpha = Image.new("L", logo.size)
alpha.putdata([min(255, max(abs(r - bg[0]), abs(g - bg[1]), abs(b - bg[2])) * 8) for r, g, b in logo.getdata()])
logo.putalpha(alpha)

top = (H - VIDEO_H) // 2
overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
d = ImageDraw.Draw(overlay)
for y in range(0, top):  # darken the bands so the text reads on the blurred video
    d.line((0, y, W, y), fill=(15, 29, 45, 150))
for y in range(top + VIDEO_H, H):
    d.line((0, y, W, y), fill=(15, 29, 45, 150))
overlay.paste(logo, (76, 250), logo)
f = poppins(32)
label = "GAMING · CON EL PERMISO DE ENEBA"
tw = d.textlength(label, font=f)
d.rounded_rectangle((76, 450, 76 + tw + 64, 514), radius=32, fill=ORANGE)
d.text((108, 482), label, font=f, fill=NAVY, anchor="lm")
base = top + VIDEO_H
d.text((W / 2, base + 120), "Juegos, recargas y suscripciones", font=poppins(46), fill=(255, 255, 255), anchor="mm")
d.text((W / 2, base + 190), "Usa el código DONDETA: 5% de descuento en Eneba", font=dm(34), fill=MUTED, anchor="mm")
d.rounded_rectangle((76, base + 260, W - 76, base + 356), radius=48, fill=GREEN)
d.text((W / 2, base + 308), "dondeta.com.do · Gaming", font=poppins(40), fill=NAVY, anchor="mm")
d.text((W / 2, H - 140), "Publicidad de Eneba", font=dm(28), fill=MUTED, anchor="mm")
overlay.save(OUT / "overlay.png")

subprocess.run([
    "ffmpeg", "-v", "error", "-y", "-i", str(SRC), "-i", str(OUT / "overlay.png"),
    "-filter_complex",
    f"[0:v]split[a][b];[a]scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},boxblur=40:5[bg];"
    f"[b]scale={W}:{VIDEO_H}[fg];[bg][fg]overlay=0:{top}[v];[v][1:v]overlay=0:0[out]",
    "-map", "[out]", "-map", "0:a", "-c:v", "libx264", "-preset", "medium", "-crf", "23", "-pix_fmt", "yuv420p",
    "-r", "30", "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", str(OUT / "gta6-reel.mp4"),
], check=True)

# Cover: a frame from the middle of the clip, same layout.
subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", "5", "-i", str(OUT / "gta6-reel.mp4"), "-frames:v", "1", "-q:v", "2", str(OUT / "gta6-reel-cover.jpg")], check=True)
print("ok")
