-- Own images published from /admin/instagram (campaigns such as the Eneba
-- partnership), not generated from a product.
alter table instagram_posts drop constraint if exists instagram_posts_kind_check;
alter table instagram_posts add constraint instagram_posts_kind_check check (kind in ('comparison', 'drop', 'top5', 'promo'));
