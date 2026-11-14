-- Moderation for product reviews (user-generated content). App Store
-- Guideline 1.2 asks for: a way to report content, to block abusive users,
-- a filter for objectionable content, and action on reports within 24 h.

-- A hidden review stays in the table (the owner can unhide it) but is never
-- served: by the owner from /admin, or automatically after 3 reports.
alter table product_reviews add column if not exists hidden_at timestamptz;
alter table product_reviews add column if not exists hidden_reason text;

-- Banned users can't post or edit reviews (their existing ones stay unless
-- hidden or deleted separately).
alter table users add column if not exists reviews_banned_at timestamptz;

-- One report per user per review.
create table if not exists review_reports (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references product_reviews(id) on delete cascade,
  reporter_id uuid not null references users(id) on delete cascade,
  reason text,
  created_at timestamptz not null default now(),
  unique (review_id, reporter_id)
);
create index if not exists review_reports_review_idx on review_reports(review_id);

-- "Ocultar reseñas de este usuario": the reader hides an author everywhere.
-- Stored by author_key (a hash of the author's id, the same value the public
-- review list carries) so user ids never leave the server.
create table if not exists review_author_blocks (
  blocker_id uuid not null references users(id) on delete cascade,
  author_key text not null,
  created_at timestamptz not null default now(),
  primary key (blocker_id, author_key)
);
