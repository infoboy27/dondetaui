"""Prints the SQL that queues the card-discount launch post in instagram_scheduled.
Both the feed post and the story go out on the next autopilot cycle (every
10 min). Usage: python3 schedule_sql.py | <psql against the production database>
Re-running does not duplicate: a label already queued is skipped."""
import base64
from pathlib import Path

HERE = Path(__file__).resolve().parent
caption = (HERE / "caption-lanzamiento.txt").read_text().strip().replace("'", "''")

print("begin;")
for target in ("feed", "story"):
    image = base64.b64encode((HERE / f"tarjetas-{target}.jpg").read_bytes()).decode()
    label = f"tarjetas lanzamiento {target}"
    print(
        "insert into instagram_scheduled (label, target, caption, image, publish_at) "
        f"select '{label}', '{target}', '{caption}', decode('{image}', 'base64'), now() "
        f"where not exists (select 1 from instagram_scheduled where label = '{label}');"
    )
print("select label, target, status, publish_at from instagram_scheduled where label like 'tarjetas%';")
print("commit;")
