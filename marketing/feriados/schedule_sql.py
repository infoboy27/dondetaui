"""Prints the SQL that queues a year's occasions in instagram_scheduled.
Feed 11:00 and story 18:00 Dominican time (UTC-4, no DST). Moments already in
the past are skipped, and a label already queued is not duplicated, so it is
safe to re-run.
Usage: python3 build.py 2027 && python3 schedule_sql.py 2027 [--skip bf-1,bf-2,bf-3] | <psql on production>"""
import base64
import sys
from datetime import date
from pathlib import Path
from occasions import moments

year = int(sys.argv[1])
skip = set(sys.argv[sys.argv.index("--skip") + 1].split(",")) if "--skip" in sys.argv else set()
folder = Path(__file__).resolve().parent / "out" / str(year)
SLOTS = [("feed", "15:00:00+00"), ("story", "22:00:00+00")]  # 11:00 / 18:00 UTC-4

print("begin;")
for m in moments(year):
    if m["key"] in skip or m["date"] <= date.today():
        continue
    caption = m["caption"].replace("'", "''")
    for target, utc in SLOTS:
        image = base64.b64encode((folder / f"{m['key']}-{target}.jpg").read_bytes()).decode()
        label = f"feriados {year} {m['key']} {target}"
        print(
            "insert into instagram_scheduled (label, target, caption, image, publish_at) "
            f"select '{label}', '{target}', '{caption}', decode('{image}', 'base64'), '{m['date']} {utc}' "
            f"where not exists (select 1 from instagram_scheduled where label = '{label}');"
        )
print("commit;")
