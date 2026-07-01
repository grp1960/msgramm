create table if not exists help_topics (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text,
  url         text,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

alter table help_topics enable row level security;

-- Anyone can read help topics (public)
create policy "help_topics_public_read" on help_topics
  for select using (true);

-- Seed with initial topics (no URLs yet)
insert into help_topics (title, description, sort_order) values
  ('Viewing a Breakdown', 'How to open a sentence and read the word-by-word analysis.', 10),
  ('Hovering Over Words', 'Interact with individual words to see grammar details.', 20),
  ('Searching Sentences', 'Find sentences by keyword using the search bar.', 30),
  ('Filtering by Grammar Concept', 'Use the concept browser to filter sentences by grammar topic.', 40),
  ('Adding a Sentence', 'Submit your own German sentence for breakdown.', 50),
  ('Taking a Quiz', 'Test yourself on a sentence using Activity mode.', 60),
  ('Saving a Sentence', 'Save sentences to your personal list.', 70);
