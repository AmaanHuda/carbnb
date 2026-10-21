-- Run once in Supabase SQL Editor, after schema.sql.

create table if not exists admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);
alter table admins enable row level security;  -- no policies: only is_admin() below can read it

create or replace function is_admin() returns boolean
language sql security definer stable set search_path = public as $$
  select exists (select 1 from admins where user_id = auth.uid());
$$;

-- Only admins can delete
create policy "admin delete cars"     on cars            for delete using (is_admin());
create policy "admin delete bookings" on bookings        for delete using (is_admin());
create policy "admin delete images"   on storage.objects for delete using (bucket_id = 'car-images' and is_admin());

-- After creating your user in Authentication > Users, make them admin
-- (replace the email):
-- insert into admins (user_id) select id from auth.users where email = 'you@example.com';