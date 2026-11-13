"""Prints the SQL that queues the paid-promo Reel (bf-ad-reel-ahora.mp4) to be
published by the autopilot on its next run (it checks every few minutes).
Usage: python3 publish_ad_reel_now.py | <psql against the production database>
Re-running does not duplicate: the label is skipped if already queued."""
import base64
from pathlib import Path

HERE = Path(__file__).resolve().parent
LABEL = "black-friday ad-reel ahora"
b64 = lambda name: base64.b64encode((HERE / name).read_bytes()).decode()
caption = (HERE / "caption-ad-reel-ahora.txt").read_text().strip().replace("'", "''")
print("begin;")
print(
    "insert into instagram_scheduled (label, target, caption, image, video, publish_at) "
    f"select '{LABEL}', 'feed', '{caption}', decode('{b64('bf-ad-reel-ahora-cover.jpg')}', 'base64'), "
    f"decode('{b64('bf-ad-reel-ahora.mp4')}', 'base64'), now() "
    f"where not exists (select 1 from instagram_scheduled where label = '{LABEL}');"
)
print("commit;")
print(f"select label, status, publish_at, octet_length(video) as video_bytes from instagram_scheduled where label = '{LABEL}';")
