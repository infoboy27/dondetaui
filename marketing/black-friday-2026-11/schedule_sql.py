"""Prints the SQL that queues the Black Friday posts in instagram_scheduled.
Times are Dominican time (UTC-4, no DST): feed 11:00, story 18:00.
Usage: python3 schedule_sql.py | <psql against the production database>
Re-running does not duplicate: a label already queued is skipped."""
import base64
from pathlib import Path

HERE = Path(__file__).resolve().parent
POSTS = [  # (file key, caption file, date)
    ("1-teaser", "caption-1-teaser.txt", "2026-11-13"),
    ("2-antes", "caption-2-antes.txt", "2026-11-24"),
    ("3-hoy", "caption-3-hoy.txt", "2026-11-27"),
]
SLOTS = [("feed", "15:00:00+00"), ("story", "22:00:00+00")]  # 11:00 / 18:00 UTC-4

print("begin;")
for key, caption_file, date in POSTS:
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
