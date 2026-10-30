# Card discounts launch (Instagram)

- `tarjetas-feed.jpg` / `tarjetas-story.jpg` — made by `make_creatives.py`.
- `caption-lanzamiento.txt` — feed caption.
- `promos-2026-10-29.sql` / `notes-2026-10-29.sql` — the promotions loaded at launch.
- `schedule_sql.py` — prints the SQL that queues both images in
  `instagram_scheduled`; the autopilot publishes them on its next cycle.

Publish only after the feature is in production **and** real promotions are
loaded at /admin/tarjetas; otherwise people open the site and see no card
prices. Queue both with `schedule_sql.py`, or upload them from the admin's
"Publicación propia" (CustomPost). Published 2026-10-29.
