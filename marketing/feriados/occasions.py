"""Commercial occasions for the Instagram calendar (no religious holidays).
Dates are computed per year; every moment becomes a feed post (11:00) and a
story (18:00), Dominican time. Copy only promises what DóndeTa does: compare
prices across the five stores, show the 30-day history, and (with an account)
alert when a saved product drops."""
from datetime import date, timedelta

STORES = "Plaza Lama, Sirena, Corripio, Jumbo y PriceSmart"
HASHTAGS = "#DóndeTa #RepúblicaDominicana #ComparaPrecios #AhorraDinero"
WHITE = "white"; GREEN = "green"
SITE = "dondeta.com.do"


def last_sunday(year, month):
    d = date(year, month + 1, 1) - timedelta(days=1) if month < 12 else date(year, 12, 31)
    return d - timedelta(days=(d.weekday() + 1) % 7)


def black_friday(year):  # day after the 4th Thursday of November
    first = date(year, 11, 1)
    thursday = first + timedelta(days=(3 - first.weekday()) % 7 + 21)
    return thursday + timedelta(days=1)


def moment(key, day, pill, lines, sub, caption, *, orange=False, points=None, card=None, url=None):
    return dict(key=key, date=day, pill=pill, lines=lines, sub=sub, points=points, card=card, orange=orange,
                caption=caption.strip(), url=url or SITE)


def gift_caption(emoji, headline, body, tags):
    return f"{emoji} {headline}\n\n{body}\n\n👉 {SITE} (link en la bio)\n\nGuarda este post y compártelo 📌\n\n{HASHTAGS} {tags}"


def moments(year):
    out = []
    bf = black_friday(year)
    mon = bf + timedelta(days=3)
    out += [
        moment("bf-1", bf - timedelta(days=14), "FALTAN 14 DÍAS", [("Black Friday:", WHITE), ("¿oferta real", GREEN), ("o truco?", GREEN)],
               "Comparamos cada precio con su historial de 30 días para decirte qué descuentos son reales.",
               f"🏷️ Black Friday: ¿oferta real o truco?\n\nFaltan 14 días. Comparamos cada precio con su historial de los últimos 30 días y te decimos qué descuentos son reales 👀\n\n👉 {SITE}/black-friday (link en la bio)\n\n{HASHTAGS} #BlackFriday #BlackFridayRD #OfertasRD",
               card=(str(bf.day), "NOV", "Black Friday"), url=f"{SITE}/black-friday"),
        moment("bf-2", bf - timedelta(days=3), "FALTAN 3 DÍAS", [("Antes de comprar,", WHITE), ("mira DóndeTa.", GREEN)],
               "El Black Friday se acerca. Prepárate para no pagar de más.",
               f"Antes de comprar, mira DóndeTa 🔎\n\n✅ El precio de hoy contra los últimos 30 días\n✅ {STORES} en un solo lugar\n✅ Si el precio subió antes de \"bajar\", te lo decimos\n\n👉 {SITE}/black-friday (link en la bio)\n\n{HASHTAGS} #BlackFriday #BlackFridayRD #OfertasRD",
               orange=True, points=["Precio de hoy vs. los últimos 30 días", STORES, "Si el precio subió antes de “bajar”, te lo decimos"], url=f"{SITE}/black-friday"),
        moment("bf-3", bf, "HOY ES BLACK FRIDAY", [("¿Esa oferta", WHITE), ("es real?", GREEN)],
               "Revísala en DóndeTa antes de pagar. Comparamos con el historial de precios.",
               f"Hoy es Black Friday 🛍️ ¿Esa oferta es real?\n\nRevísala en DóndeTa antes de pagar: comparamos el precio con su historial y entre las tiendas dominicanas.\n\n👉 {SITE}/black-friday (link en la bio)\n\n{HASHTAGS} #BlackFriday #BlackFridayRD #OfertasRD",
               orange=True, card=("HOY", f"{bf.day} NOV", "Black Friday"), url=f"{SITE}/black-friday"),
        moment("cyber-monday", mon, "CYBER MONDAY", [("Último día:", WHITE), ("¿la oferta es real?", GREEN)],
               "Antes de pagar, compara el precio con su historial y entre tiendas.",
               f"Cyber Monday 💻 Último día de ofertas\n\nAntes de pagar, compara el precio con su historial de 30 días y entre las tiendas dominicanas.\n\n👉 {SITE}/black-friday (link en la bio)\n\n{HASHTAGS} #CyberMonday #BlackFridayRD #OfertasRD",
               orange=True, card=("HOY", f"{mon.day} NOV", "Cyber Monday"), url=f"{SITE}/black-friday"),
        moment("navidad-1", date(year, 12, 1), "DICIEMBRE", [("Compras navideñas,", WHITE), ("sin pagar de más.", GREEN)],
               "Compara el mismo producto en las tiendas antes de comprar los regalos.",
               gift_caption("🎄", "Compras navideñas, sin pagar de más", f"Compara el mismo producto en {STORES} y mira su historial de precios antes de comprar los regalos.", "#Navidad #RegalosRD"),
               points=["El mismo producto en 5 tiendas", "Historial de precios de 30 días", "Guarda tus regalos y te avisamos si bajan"]),
        moment("navidad-2", date(year, 12, 18), "FALTAN 7 DÍAS", [("Navidad en una semana:", WHITE), ("compara y compra.", GREEN)],
               "Última semana para los regalos. Revisa el mejor precio antes de pagar.",
               gift_caption("🎁", "Navidad en una semana", f"Última semana para los regalos. Revisa el mejor precio en {STORES} antes de pagar.", "#Navidad #RegalosRD"),
               orange=True, card=("25", "DIC", "Navidad")),
        moment("fin-de-ano", date(year, 12, 28), "FIN DE AÑO", [("Cierra el año", WHITE), ("ahorrando.", GREEN)],
               "Para la cena, la casa y lo que falte: compara antes de comprar.",
               gift_caption("🥂", "Cierra el año ahorrando", f"Para la cena, la casa y lo que falte: compara precios en {STORES}.", "#FinDeAño #AñoNuevo"),
               orange=True),
    ]
    # Fixed-date and Sunday-based occasions.
    val = date(year, 2, 14)
    out += [
        moment("san-valentin-1", val - timedelta(days=7), "FALTAN 7 DÍAS", [("¿Qué le regalas", WHITE), ("este 14 de febrero?", GREEN)],
               "Compara precios antes de comprar su regalo.",
               gift_caption("💚", "¿Qué le regalas este 14 de febrero?", f"Compara precios en {STORES} antes de comprar su regalo.", "#SanValentín #DíaDelAmor"),
               card=("14", "FEB", "Día del Amor y la Amistad")),
        moment("san-valentin-2", val - timedelta(days=1), "MAÑANA", [("Mañana es 14.", WHITE), ("¿Ya tienes el regalo?", GREEN)],
               "Compara el precio y compra al mejor.",
               gift_caption("💝", "Mañana es 14 de febrero", f"Compara el precio en {STORES} y compra al mejor.", "#SanValentín #DíaDelAmor"),
               orange=True, card=("14", "FEB", "Día del Amor y la Amistad")),
    ]
    madres = last_sunday(year, 5)  # Dominican Mother's Day: last Sunday of May
    out += [
        moment("madres-1", madres - timedelta(days=7), "FALTAN 7 DÍAS", [("Mamá se merece", WHITE), ("el mejor precio.", GREEN)],
               "Día de las Madres: compara antes de comprar su regalo.",
               gift_caption("💐", "Mamá se merece el mejor precio", f"Día de las Madres: compara en {STORES} antes de comprar su regalo.", "#DíaDeLasMadres #FelizDíaMamá"),
               card=(str(madres.day), "MAYO", "Día de las Madres")),
        moment("madres-2", madres - timedelta(days=1), "MAÑANA", [("Mañana es el Día", WHITE), ("de las Madres.", GREEN)],
               "Última oportunidad de comparar y comprar al mejor precio.",
               gift_caption("🌹", "Mañana es el Día de las Madres", f"Última oportunidad de comparar en {STORES} y comprar al mejor precio.", "#DíaDeLasMadres #FelizDíaMamá"),
               orange=True, card=(str(madres.day), "MAYO", "Día de las Madres")),
    ]
    padres = last_sunday(year, 7)  # Dominican Father's Day: last Sunday of July
    out += [
        moment("padres-1", padres - timedelta(days=7), "FALTAN 7 DÍAS", [("Papá se merece", WHITE), ("el mejor precio.", GREEN)],
               "Día de los Padres: compara antes de comprar su regalo.",
               gift_caption("👔", "Papá se merece el mejor precio", f"Día de los Padres: compara en {STORES} antes de comprar su regalo.", "#DíaDeLosPadres #FelizDíaPapá"),
               card=(str(padres.day), "JUL", "Día de los Padres")),
        moment("padres-2", padres - timedelta(days=1), "MAÑANA", [("Mañana es el Día", WHITE), ("de los Padres.", GREEN)],
               "Última oportunidad de comparar y comprar al mejor precio.",
               gift_caption("🎁", "Mañana es el Día de los Padres", f"Última oportunidad de comparar en {STORES} y comprar al mejor precio.", "#DíaDeLosPadres #FelizDíaPapá"),
               orange=True, card=(str(padres.day), "JUL", "Día de los Padres")),
    ]
    out += [
        moment("clases-1", date(year, 8, 10), "REGRESO A CLASES", [("Regreso a clases:", WHITE), ("compara primero.", GREEN)],
               "Uniformes aparte, lo demás sí se compara: mira el precio en cada tienda.",
               gift_caption("🎒", "Regreso a clases: compara primero", f"Mira el mismo producto en {STORES} y su historial de precios antes de comprar.", "#RegresoAClases #BackToSchool"),
               points=["El mismo producto en 5 tiendas", "Historial de precios de 30 días", "Guarda y te avisamos si baja"]),
        moment("clases-2", date(year, 8, 17), "ÚLTIMA SEMANA", [("Últimos días", WHITE), ("para comparar.", GREEN)],
               "Antes de que empiecen las clases, revisa el mejor precio.",
               gift_caption("📚", "Últimos días para comparar", f"Antes de que empiecen las clases, revisa el mejor precio en {STORES}.", "#RegresoAClases #BackToSchool"),
               orange=True),
    ]
    return sorted(out, key=lambda m: m["date"])


if __name__ == "__main__":  # self-check of the date rules: python3 occasions.py
    assert black_friday(2026) == date(2026, 11, 27) and black_friday(2027) == date(2027, 11, 26)
    assert last_sunday(2026, 5) == date(2026, 5, 31) and last_sunday(2027, 5) == date(2027, 5, 30)
    assert last_sunday(2027, 7) == date(2027, 7, 25)
    for year in (2026, 2027):
        ms = moments(year)
        assert len({m["key"] for m in ms}) == len(ms) and all(m["date"].year == year for m in ms)
    print("ok")
