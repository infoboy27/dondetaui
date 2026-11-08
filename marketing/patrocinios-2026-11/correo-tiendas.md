# Correo para tiendas (plantilla)

**Asunto:** DóndeTa le envió {N} clientes a {Tienda} en los últimos 30 días

Hola, {Nombre}:

Soy Jonatan, de DóndeTa (dondeta.com.do), el comparador de precios de tiendas dominicanas. En los últimos 30 días, {N} personas hicieron clic desde DóndeTa hacia productos de {Tienda}, ya decididas a comprar.

Queremos ofrecerle formatos para destacar su tienda sin cambiar lo que nos hace útiles: siempre mostramos primero el precio más bajo y todo lo pagado va marcado. Le adjunto el kit con los números y los formatos (tienda destacada por categoría, banner de Black Friday y posts en Instagram).

¿Le parece si conversamos 15 minutos esta semana?

Saludos,
Jonatan
DóndeTa

Clics por tienda (últimos 30 días, sin bots), para el {N} de cada correo:

```sql
select r.name, count(*) from outbound_clicks o join retailers r on r.id = o.retailer_id
where not o.is_bot and o.clicked_at > now() - interval '30 days' group by 1 order by 2 desc;
```
