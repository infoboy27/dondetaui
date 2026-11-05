"""Prints the SQL that queues the November Eneba Reels in instagram_scheduled
(needs migration 030: the `video` column). Times are Dominican time (UTC-4):
  - fc27-reel-2026-11/fc27-reel.mp4         Sat 2026-11-07 19:00
  - black-friday-2026-11/eneba-bf-reel.mp4  Thu 2026-11-26 19:00 (Eneba's Black Friday offers start that day)
Usage: python3 eneba-reels-2026-11.py | <psql against the production database>
Re-running does not duplicate: a label already queued is skipped."""
import base64
from pathlib import Path

HERE = Path(__file__).resolve().parent
REELS = [  # (label, video, cover, caption, publish_at UTC)
    ("eneba fc27 reel", "fc27-reel-2026-11/fc27-reel.mp4", "fc27-reel-2026-11/fc27-reel-cover.jpg",
     "fc27-reel-2026-11/caption-fc27-reel.txt", "2026-11-07 23:00:00+00"),
    ("eneba black-friday reel", "black-friday-2026-11/eneba-bf-reel.mp4", "black-friday-2026-11/eneba-bf-reel-cover.jpg",
     "black-friday-2026-11/caption-eneba-bf-reel.txt", "2026-11-26 23:00:00+00"),
]

def b64(path): return base64.b64encode((HERE / path).read_bytes()).decode()

print("begin;")
for label, video, cover, caption_file, publish_at in REELS:
    caption = (HERE / caption_file).read_text().strip().replace("'", "''")
    print(
        "insert into instagram_scheduled (label, target, caption, image, video, publish_at) "
        f"select '{label}', 'feed', '{caption}', decode('{b64(cover)}', 'base64'), decode('{b64(video)}', 'base64'), '{publish_at}' "
        f"where not exists (select 1 from instagram_scheduled where label = '{label}');"
    )
print("select label, target, status, publish_at, octet_length(video) as video_bytes from instagram_scheduled where label like 'eneba%';")
print("commit;")
