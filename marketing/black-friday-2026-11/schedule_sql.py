"""Prints the SQL that queues the Black Friday posts in instagram_scheduled.
Times are Dominican time (UTC-4, no DST): feed 11:00, story 18:00.
Usage: python3 schedule_sql.py [--only KEY] | <psql against the production database>
Re-running does not duplicate: a label already queued is skipped. Posts whose
images do not exist yet (4-ojo is generated from live data by
make_watchlist.py) are skipped with a note on stderr."""
import base64, sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
POSTS = [  # (file key, caption file, date)
    ("1-teaser", "caption-1-teaser.txt", "2026-11-13"),
    ("2-antes", "caption-2-antes.txt", "2026-11-24"),
    ("3-hoy", "caption-3-hoy.txt", "2026-11-27"),
    ("4-ojo", "caption-4-ojo.txt", "2026-11-21"),  # run make_watchlist.py on Nov 20
]
ONLY = sys.argv[sys.argv.index("--only") + 1] if "--only" in sys.argv else None
SLOTS = [("feed", "15:00:00+00"), ("story", "22:00:00+00")]  # 11:00 / 18:00 UTC-4

print("begin;")
for key, caption_file, date in POSTS:
    if ONLY and key != ONLY: continue
    if not all((HERE / f"bf-{key}-{t}.jpg").exists() for t, _ in SLOTS) or not (HERE / caption_file).exists():
        print(f"-- skipped {key}: images or caption missing", file=sys.stderr); continue
    caption = (HERE / caption_file).read_text().strip().replace("'", "''")
    for target, utc in SLOTS:
        image = base64.b64encode((HERE / f"bf-{key}-{target}.jpg").read_bytes()).decode()
        label = f"black-friday {key} {target}"
        print(
            "insert into instagram_scheduled (label, target, caption, image, publish_at) "
            f"select '{label}', '{target}', '{caption}', decode('{image}', 'base64'), '{date} {utc}' "
            f"where not exists (select 1 from instagram_scheduled where label = '{label}');"
        )
print("commit;")
