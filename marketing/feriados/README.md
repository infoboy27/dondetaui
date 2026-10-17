# Calendario de feriados comerciales (Instagram)

Solo ocasiones comerciales, sin religiosas: San Valentín, Día de las Madres
(último domingo de mayo, como en RD), Día de los Padres (último domingo de
julio), regreso a clases, Black Friday, Cyber Monday, compras navideñas y fin
de año. Cada ocasión tiene 1–3 momentos; cada momento es un post de feed
(11:00) y una historia (18:00), hora de RD.

- `occasions.py`: fechas (calculadas para cualquier año), textos y subtítulos. Se edita aquí.
  `python3 occasions.py` valida las reglas de fecha.
- `creatives.py` / `build.py`: generan los JPG en `out/<año>/` (ignorado por git).
- `schedule_sql.py <año> [--skip claves]`: imprime el SQL que encola los posts en
  `instagram_scheduled`; omite fechas pasadas y es idempotente por etiqueta.

## Cargar un año en producción

```bash
cd marketing/feriados
python3 build.py 2027
python3 schedule_sql.py 2027 | ssh -p 1600 <servidor> 'cd ~/dondeta && docker compose exec -T postgres sh -c "psql -U \"\$POSTGRES_USER\" -d \"\$POSTGRES_DB\" -v ON_ERROR_STOP=1"'
```

Antes de cargar: revisar los textos y diseños con el dueño, y comprobar en
`/admin/instagram` que el token de Instagram sigue conectado.
Black Friday 2026 se cargó con `../black-friday-2026-11/`; para 2026 usar
`--skip bf-1,bf-2,bf-3` y no duplicarlo.
