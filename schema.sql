-- Run this once in Supabase: Dashboard > SQL Editor > New query

create table if not exists cars (
  id bigint generated always as identity primary key,
  owner_name text not null,
  owner_phone text,
  title text not null,
  brand text not null,
  model text not null,
  year int not null,
  transmission text,
  fuel text,
  seats int,
  mileage int,
  color text,
  location text,
  price_per_day numeric(10,2) not null,
  description text,
  images text[] default '{}',
  created_at timestamptz default now()
);

create table if not exists bookings (
  id bigint generated always as identity primary key,
  car_id bigint not null references cars(id) on delete cascade,
  renter_name text not null,
  renter_phone text,
  start_date date not null,
  end_date date not null,
  total_price numeric(10,2),
  created_at timestamptz default now(),
  check (end_date >= start_date)
);

alter table cars enable row level security;
alter table bookings enable row level security;

-- Open access for the anon key (fine for a demo; tighten with Supabase Auth later)
create policy "public read cars"    on cars     for select using (true);
create policy "public insert cars"  on cars     for insert with check (true);
create policy "public read book"    on bookings for select using (true);
create policy "public insert book"  on bookings for insert with check (true);

-- Image storage bucket (public)
insert into storage.buckets (id, name, public) values ('car-images', 'car-images', true)
on conflict (id) do nothing;

create policy "public read images"   on storage.objects for select using (bucket_id = 'car-images');
create policy "public upload images" on storage.objects for insert with check (bucket_id = 'car-images');
