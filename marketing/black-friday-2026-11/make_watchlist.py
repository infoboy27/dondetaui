"""'Ojo con estos': products that went UP before Black Friday, from the live
price check (dondeta.com.do/api/price-check, section "raised").
Run it the day before posting (Nov 20) (data changes every cycle):
  python3 make_watchlist.py            -> bf-4-ojo-feed.jpg, bf-4-ojo-story.jpg, caption-4-ojo.txt
then `python3 schedule_sql.py --only 4-ojo | psql ...` queues it (Sat Nov 21, 11:00 RD)."""
import json, urllib.request
from pathlib import Path
from PIL import ImageDraw
from make_creatives import GREEN, MUTED, NAVY, ORANGE, OUT, YELLOW, LOGO, background, dm, poppins, wrap

API = "https://dondeta.com.do/api/price-check"
RED = (255, 107, 107)
TOP = 5

def rd(n): return f"RD${round(n):,}"

def fetch():
    req = urllib.request.Request(API, headers={"User-Agent": "dondeta-marketing"})
    data = json.load(urllib.request.urlopen(req, timeout=30))
    items = [i for i in data["raised"] if i["store"] != "Eneba" and i["pctVsReference"] >= 10]
    # Biggest increases first, one product per store-name pair, skip near-duplicates.
    items.sort(key=lambda i: -i["pctVsReference"])
    seen, out = set(), []
    for i in items:
        key = i["productName"].lower()[:28]
        if key in seen: continue
        seen.add(key); out.append(i)
        if len(out) == TOP: break
    return out

def render(w, h, items):
    img = background(w, h); d = ImageDraw.Draw(img); m = 70; story = h > 1500
    y = 140 if story else 70
    img.paste(LOGO, (m - 10, y), LOGO); y += LOGO.height + (60 if story else 28)
    f = poppins(30)
    pill = "ANTES DEL BLACK FRIDAY"
    tw = d.textlength(pill, font=f)
    d.rounded_rectangle((m, y, m + tw + 60, y + 60), radius=30, fill=ORANGE)
    d.text((m + 30, y + 30), pill, font=f, fill=NAVY, anchor="lm"); y += 84
    hf = poppins(84 if story else 76, "800ExtraBold")
    d.text((m, y), "Ojo: estos", font=hf, fill=(255, 255, 255))
    y += int(hf.size * 1.05)
    d.text((m, y), "subieron de precio", font=hf, fill=RED); y += int(hf.size * 1.2)
    sf = dm(32 if story else 30)
    for line in wrap(d, "Si el viernes “bajan” hasta el precio de antes, no es oferta.", sf, w - 2 * m):
        d.text((m, y), line, font=sf, fill=MUTED); y += 44
    y += 22
    rh = 150 if story else 132
    nf, pf, bf = dm(30, "700Bold"), dm(26), poppins(34, "800ExtraBold")
    for i in items:
        d.rounded_rectangle((m, y, w - m, y + rh - 16), radius=24, fill=(20, 40, 58))
        badge = f"+{round(i['pctVsReference'])}%"
        bw = d.textlength(badge, font=bf) + 36
        d.rounded_rectangle((w - m - 24 - bw, y + 24, w - m - 24, y + 80), radius=28, fill=RED)
        d.text((w - m - 24 - bw / 2, y + 52), badge, font=bf, fill=NAVY, anchor="mm")
        name = wrap(d, i["productName"], nf, w - 2 * m - bw - 80)[0]
        if name != i["productName"]: name = name.rstrip(",.- ") + "…"
        d.text((m + 28, y + 22), name, font=nf, fill=(255, 255, 255))
        d.text((m + 28, y + 66), f"{i['store']}: {rd(i['reference'])} → {rd(i['current'])}", font=pf, fill=YELLOW)
        y += rh
    by = h - (230 if story else 110)
    cf = poppins(38)
    d.rounded_rectangle((m, by, w - m, by + 92), radius=46, fill=GREEN)
    d.text((w / 2, by + 46), "dondeta.com.do/black-friday", font=cf, fill=NAVY, anchor="mm")
    return img

def caption(items):
    lines = "\n".join(f"🔺 {i['productName']} ({i['store']}): {rd(i['reference'])} → {rd(i['current'])}" for i in items)
    return f"""👀 Ojo con estos antes del Black Friday

Subieron de precio en las últimas semanas. Si el viernes los “rebajan” hasta lo que costaban antes, no es una oferta:

{lines}

Antes de comprar, revisa el historial en DóndeTa 👉 dondeta.com.do/black-friday (link en la bio)

¿Quieres que te avisemos solo de las ofertas reales? Crea tu cuenta gratis en DóndeTa.

Precios publicados en las tiendas en línea al momento de este post; pueden cambiar.

#DóndeTa #BlackFriday #BlackFridayRD #OfertasRD #RepúblicaDominicana #ComparaPrecios"""

if __name__ == "__main__":
    items = fetch()
    if len(items) < 3:
        raise SystemExit(f"only {len(items)} raised products today: not enough for the post")
    render(1080, 1350, items).save(OUT / "bf-4-ojo-feed.jpg", quality=92)
    render(1080, 1920, items).save(OUT / "bf-4-ojo-story.jpg", quality=92)
    (OUT / "caption-4-ojo.txt").write_text(caption(items) + "\n")
    print("\n".join(f"{i['pctVsReference']}% {i['productName']} ({i['store']})" for i in items))
