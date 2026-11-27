"""Prints the SQL that queues the BFSPREE feed post and story for the next
autopilot run (it checks every few minutes).
Usage: python3 queue_sql.py | <psql against the production database>
Re-running does not duplicate: a label already queued is skipped."""
import base64
from pathlib import Path

HERE = Path(__file__).resolve().parent
caption = (HERE / "caption.txt").read_text().strip().replace("'", "''")
print("begin;")
for target in ("feed", "story"):
    image = base64.b64encode((HERE / f"eneba-bfspree-{target}.jpg").read_bytes()).decode()
    label = f"eneba bfspree {target}"
    print(
        "insert into instagram_scheduled (label, target, caption, image, publish_at) "
        f"select '{label}', '{target}', '{caption}', decode('{image}', 'base64'), now() "
        f"where not exists (select 1 from instagram_scheduled where label = '{label}');"
    )
print("commit;")
print("select id, label, target, status, publish_at from instagram_scheduled where label like 'eneba bfspree%';")
