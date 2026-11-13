"""Version B of the paid Reel: same script, voice and data as make_reel_ad.py,
over real stock footage (Pixabay, Content License: free for ads, no credit
required) darkened so the text stays readable.

Run: python3 make_reel_ad_broll.py           -> bf-ad-reel-ahora.mp4 (CTA: /black-friday)
     python3 make_reel_ad_broll.py --signup  -> bf-ad-reel-broll.mp4 (CTA: sign up, needs PR #69 + email live)
Clips live in source/broll/<pixabay id>.mp4 (gitignored). They were picked
by hand once: Pixabay asks API users not to run automated mass queries, so
the automation picks from this reviewed library instead of searching."""
import subprocess
from PIL import Image, ImageDraw
import make_reel_ad as base
from make_reel_ad import FPS, H, OUT, TOP, W, LOGO, duration, example_product, tts

BROLL = OUT / "source/broll"
CLIPS = ["24114", "38084", "1735", "83865"]  # hook, product, how, call to action

def overlay_canvas():
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    img.paste(LOGO, ((W - LOGO.width) // 2, TOP - 20), LOGO)
    return img, ImageDraw.Draw(img)

base.canvas = overlay_canvas  # scene_* functions now draw on a transparent layer

def clip(overlay, audio, broll, index, tail):
    base.WORK.mkdir(parents=True, exist_ok=True)
    png = base.WORK / f"broll-scene{index}.png"; overlay.save(png)
    secs = duration(audio) + tail
    out = base.WORK / f"broll-scene{index}.mp4"
    graph = (
        # Fill 9:16 from 16:9 footage, slow push-in, then darken with the brand navy.
        f"[0:v]scale=-2:{int(H * 1.08)},crop={int(W * 1.08)}:{int(H * 1.08)},"
        f"zoompan=z='1+0.04*on/{int(secs * FPS)}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s={W}x{H}:fps={FPS},"
        f"drawbox=x=0:y=0:w=iw:h=ih:color=0x0F1D2D@0.62:t=fill[bg];"
        f"[bg][1:v]overlay=0:0,fade=t=in:st=0:d=0.25,fade=t=out:st={secs - 0.2:.3f}:d=0.2,format=yuv420p[v];"
        f"[2:a]apad,atrim=0:{secs:.3f},afade=t=in:st=0:d=0.05,aresample=44100[a]"
    )
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-stream_loop", "-1", "-i", str(broll), "-loop", "1", "-i", str(png),
                    "-i", str(audio), "-filter_complex", graph, "-map", "[v]", "-map", "[a]", "-t", f"{secs:.3f}",
                    "-r", str(FPS), "-c:v", "libx264", "-preset", "medium", "-crf", "19", "-c:a", "aac", "-b:a", "160k",
                    str(out)], check=True)
    return out

def scene_cta_check(line):
    """CTA while the sign-up isn't live: send people to /black-friday."""
    img, d = base.canvas()
    f = base.poppins(84, "800ExtraBold")
    y = base.centered(d, 520, "Antes de comprar,", f, base.WHITE)
    y = base.centered(d, y, "revisa si la oferta", f, base.WHITE)
    y = base.centered(d, y, "es real", f, base.GREEN) + 60
    base.centered(d, y - 30, "Gratis, en las tiendas de aquí", base.dm(38, "700Bold"), base.YELLOW)
    y += 50
    cf = base.poppins(50, "800ExtraBold")
    d.rounded_rectangle((100, y, W - 100, y + 120), radius=60, fill=base.GREEN)
    d.text((W / 2, y + 60), "dondeta.com.do/black-friday", font=cf, fill=base.NAVY, anchor="mm")
    base.subtitle(d, line)
    return img

CTA_CHECK = ("Antes de comprar, búscalo en DóndeTa… y mira si la oferta es real. Es gratis.",
             "Antes de comprar, búscalo en DóndeTa y mira si la oferta es real. Es gratis.")

if __name__ == "__main__":
    import io, sys, urllib.request
    mode = "signup" if "--signup" in sys.argv else "check"
    item = example_product()
    ref, cur = round(item["reference"]), round(item["current"])
    if ref not in base.SPOKEN_NUMBERS or cur not in base.SPOKEN_NUMBERS or "plancha" not in item["productName"].lower():
        raise SystemExit("example changed: update make_reel_ad.py first")
    photo = Image.open(io.BytesIO(urllib.request.urlopen(item["image"], timeout=30).read())).convert("RGB")
    lines = base.script_lines(ref, cur)
    if mode == "check": lines[3] = CTA_CHECK
    cta = base.scene_cta if mode == "signup" else scene_cta_check
    scenes = [base.scene_hook(lines[0][1]), base.scene_product(lines[1][1], item, photo),
              base.scene_how(lines[2][1]), cta(lines[3][1])]
    tails = [0.3, 0.5, 0.5, 1.6]
    clips = [clip(img, tts(spoken), BROLL / f"{CLIPS[n]}.mp4", n, tails[n])
             for n, (img, (spoken, _)) in enumerate(zip(scenes, lines))]
    listing = base.WORK / "broll-concat.txt"
    listing.write_text("".join(f"file '{c}'\n" for c in clips))
    target = OUT / ("bf-ad-reel-broll.mp4" if mode == "signup" else "bf-ad-reel-ahora.mp4")
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-f", "concat", "-safe", "0", "-i", str(listing),
                    "-c", "copy", "-movflags", "+faststart", str(target)], check=True)
    print(f"{target.name}: {duration(target):.1f}s")
