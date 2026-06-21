alter table sentences add column if not exists submitted_by uuid references auth.users(id) on delete set null;
