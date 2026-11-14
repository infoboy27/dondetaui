"""Paid Instagram promo (feed 1080x1350, story 1080x1920): sign up and get the
REAL Black Friday deals by email. Run: python3 make_signup_ad.py
The button points to /black-friday, whose sign-up box creates the account and
the subscription (link the ad itself to the sign-up deep link in the caption)."""
from make_creatives import GREEN, YELLOW, save_both

AD = dict(
    pill="BLACK FRIDAY · 27 NOV", pill_color=YELLOW,
    lines=[("Te avisamos", (255, 255, 255)), ("solo de las", (255, 255, 255)), ("ofertas reales.", GREEN)],
    sub="Comparamos cada precio con sus últimos 30 días. Si subió antes de “bajar”, no te llega.",
    points=["Crea tu cuenta gratis en DóndeTa", "Recibe por correo las ofertas que de verdad bajaron", "Plaza Lama, Sirena, Jumbo, Corripio y PriceSmart"],
    card=None, cta="Regístrate gratis en dondeta.com.do",
)

if __name__ == "__main__":
    save_both("registro", AD, prefix="bf-ad")
    print("ok")
