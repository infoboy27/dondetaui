-- 010_store_branches.sql ran on the first deploy, before ingestion had created
-- the retailers it joins on, so it inserted no branches and "Tiendas cercanas"
-- has always been empty. Re-seed the same branches now that the retailers
-- exist. Idempotent: a branch is only added if its retailer has none by that
-- name (stores has no unique key, so ON CONFLICT would not catch duplicates).
insert into stores (retailer_id, name, address, latitude, longitude)
select r.id, b.name, b.address, b.latitude, b.longitude
from (values
  ('plaza-lama', 'Plaza Lama - Autopista Duarte', 'Autopista Juan Pablo Duarte Km 13, Santo Domingo, República Dominicana', 18.4829732, -69.9745912),
  ('plaza-lama', 'Plaza Lama - Nicolás de Ovando', 'Av. Nicolás de Ovando 508, Santo Domingo, República Dominicana', 18.506936, -69.8955616),
  ('plaza-lama', 'Plaza Lama - Av. Duarte', 'Av. Juan Pablo Duarte 78, Santo Domingo, República Dominicana', 18.5056655, -69.9143452),
  ('plaza-lama', 'Plaza Lama - Herrera', 'Av. Isabel Aguiar, Santo Domingo Oeste, República Dominicana', 18.4568427, -69.9774083),
  ('plaza-lama', 'Plaza Lama - Santiago 27 de Febrero', 'Av. 27 de Febrero, Santiago de los Caballeros, República Dominicana', 19.4788922, -70.717454),
  ('sirena', 'Sirena - Estrella Sadhalá', 'Av. Estrella Sadhalá, Santiago, República Dominicana', 19.4675618, -70.6870608),
  ('sirena', 'Sirena - Baní', 'Av. Máximo Gómez, Carretera Sánchez, Baní, Peravia, República Dominicana', 18.2777204, -70.3320746),
  ('sirena', 'Sirena - Bonao', 'Av. Las Hortensias esq. calle San Martín, Bonao, Monseñor Nouel, República Dominicana', 18.9417804, -70.4112889),
  ('sirena', 'Sirena - Calle Del Sol', 'Calle Del Sol 104, Santiago de los Caballeros, República Dominicana', 19.4495607, -70.6929383),
  ('sirena', 'Sirena - Charles de Gaulle', 'Av. Charles de Gaulle, Santo Domingo Este, República Dominicana', 18.4779337, -69.8281577),
  ('sirena', 'Sirena - Galería 360°', 'Calle Euclides Morillo 106, Arroyo Hondo, Santo Domingo, República Dominicana', 18.5043702, -69.9311058),
  ('sirena', 'Sirena - Higüey', 'Calle José A. Santana, Higüey, La Altagracia, República Dominicana', 18.6131313, -68.7114484),
  ('sirena', 'Sirena - La Vega', 'Av. Gregorio Rivas 183, La Vega, República Dominicana', 19.2252622, -70.5131542),
  ('sirena', 'Sirena - Mella', 'Av. Mella 258, Santo Domingo, República Dominicana', 18.4817419, -69.8850052),
  ('sirena', 'Sirena - Moca', 'Carretera Duarte esq. Antonio de la Maza, Moca, Espaillat, República Dominicana', 19.3944442, -70.5257565),
  ('corripio', 'Corripio - San Vicente de Paúl', 'Av. San Vicente de Paúl, Santo Domingo Este, República Dominicana', 18.5097615, -69.8621664),
  ('corripio', 'Corripio - Sambil', 'Av. John F. Kennedy, Plaza Sambil, Santo Domingo, República Dominicana', 18.4831995, -69.9118407),
  ('corripio', 'Corripio - San Isidro', 'Autopista San Isidro, Coral Mall, Santo Domingo Este, República Dominicana', 18.4864345, -69.8323499),
  ('corripio', 'Corripio - Santiago Las Colinas', 'Av. 27 de Febrero esq. calle 25, Las Colinas, Santiago, República Dominicana', 19.4785579, -70.7136109),
  ('corripio', 'Corripio - Santiago Plaza Alejo', 'Estrella Sadhalá 5, Santiago, República Dominicana', 19.4658252, -70.6866972),
  ('corripio', 'Corripio - Cotuí', 'Calle Mella 10, Cotuí, República Dominicana', 19.0395079, -70.1475012),
  ('corripio', 'Corripio - Bonao', 'Calle Los Santos 114, Bonao, República Dominicana', 18.9408231, -70.4006278),
  ('corripio', 'Corripio - La Vega', 'Calle Núñez de Cáceres 1, San Antonio, La Vega, República Dominicana', 19.2259628, -70.528043),
  ('corripio', 'Corripio - San Francisco de Macorís', 'Av. Frank Grullón 27, San Francisco de Macorís, República Dominicana', 19.2893999, -70.2479625),
  ('corripio', 'Corripio - Herrera', 'Av. Isabel Aguiar, Santo Domingo Oeste, República Dominicana', 18.4568427, -69.9774083),
  ('corripio', 'Corripio - Máximo Gómez', 'Av. Máximo Gómez, Santo Domingo, República Dominicana', 18.5055363, -69.9157803),
  ('corripio', 'Corripio - Galería 360', 'Av. John F. Kennedy, Plaza Galería 360, Santo Domingo, República Dominicana', 18.4933773, -69.8991179),
  ('corripio', 'Corripio - Independencia', 'Av. Independencia Km 10½, Santo Domingo, República Dominicana', 18.453028, -69.9242514),
  ('corripio', 'Corripio - Colina Centro', 'Av. Jacobo Majluta Azar, Colinas del Viento, Santo Domingo Norte, República Dominicana', 18.5577833, -69.9433609),
  ('corripio', 'Corripio - Villa Mella', 'Av. Hermanas Mirabal, Santo Domingo Norte, República Dominicana', 18.5308155, -69.9075063),
  ('corripio', 'Corripio - Abraham Lincoln', 'Av. Abraham Lincoln, Santo Domingo, República Dominicana', 18.451844, -69.922479),
  ('corripio', 'Corripio - Las Américas', 'Av. Marginal Las Américas, Santo Domingo Este, República Dominicana', 18.459256, -69.7228242),
  ('corripio', 'Corripio - Los Alcarrizos', 'Calle San Antonio 15, Los Alcarrizos, Santo Domingo Oeste, República Dominicana', 18.5122041, -70.0595857),
  ('jumbo', 'Jumbo - Ágora Mall', 'Av. John F. Kennedy esq. Av. Máximo Gómez, Ágora Mall, Santo Domingo, República Dominicana', 18.481222, -69.9145),
  ('jumbo', 'Jumbo - Bávaro', '8 Av. Barceló, Higüey, República Dominicana', 18.6639583, -68.4123917),
  ('jumbo', 'Jumbo - Bella Vista Mall', 'Av. Sarasota esq. Arrayanes y Las Caobas, Bella Vista Mall, Santo Domingo, República Dominicana', 18.4558831, -69.9401451),
  ('pricesmart', 'PriceSmart - Los Prados', 'Av. Charles Sumner 54, Los Prados, Santo Domingo, República Dominicana', 18.4747108, -69.9598991),
  ('pricesmart', 'PriceSmart - Arroyo Hondo', 'Av. República de Colombia 84, Altos de Arroyo Hondo, Santo Domingo, República Dominicana', 18.5068526, -69.9599495),
  ('pricesmart', 'PriceSmart - San Isidro', 'Autopista San Isidro 3, Urb. Italia, Santo Domingo Este, República Dominicana', 18.4898961, -69.8421262),
  ('pricesmart', 'PriceSmart - Santiago', 'Av. Estrella Sadhalá 21, Santiago, República Dominicana', 19.4675618, -70.6870608),
  ('pricesmart', 'PriceSmart - Bolívar', 'Av. Simón Bolívar 802, Santo Domingo, República Dominicana', 18.4631494, -69.9282759)
) as b(retailer_slug, name, address, latitude, longitude)
join retailers r on r.slug = b.retailer_slug
where not exists (
  select 1 from stores s where s.retailer_id = r.id and s.name = b.name
);
