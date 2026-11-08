"""Prints the SQL that queues the Amazon guide post in instagram_scheduled.
Mon 2026-11-09, Dominican time (UTC-4): feed 11:00, story 18:00.
Usage: python3 schedule_sql.py | <psql against the production database>
Re-running does not duplicate: a label already queued is skipped."""
import base64
from pathlib import Path

HERE = Path(__file__).resolve().parent
caption = (HERE / "caption-amazon-guia.txt").read_text().strip().replace("'", "''")
SLOTS = [("feed", "2026-11-09 15:00:00+00"), ("story", "2026-11-09 22:00:00+00")]

print("begin;")
for target, publish_at in SLOTS:
    image = base64.b64encode((HERE / f"amazon-guia-{target}.jpg").read_bytes()).decode()
    label = f"amazon guia {target}"
    print(
        "insert into instagram_scheduled (label, target, caption, image, publish_at) "
        f"select '{label}', '{target}', '{caption}', decode('{image}', 'base64'), '{publish_at}' "
        f"where not exists (select 1 from instagram_scheduled where label = '{label}');"
    )
print("select label, target, status, publish_at from instagram_scheduled where label like 'amazon guia%';")
print("commit;")
