# Car BNB

Plain HTML/CSS/JS, no backend. Supabase (Postgres + Storage) is the database.

## Setup
1. Create a project at supabase.com.
2. SQL Editor: paste and run `supabase/schema.sql` (tables, access policies, `car-images` bucket).
3. Project Settings > API: copy the Project URL and anon public key into `js/config.js`.
4. Open `index.html` (or run `npx serve .` in this folder).

## Files
- `index.html` + `js/cars.js`: car listings, list-a-car form, Amazon-style car page with a rent box
- `rentals.html` + `js/rentals.js`: table of rented cars, renters, dates and next available day
- `js/common.js`: Supabase client and helpers; `css/style.css`: Airbnb-style theme

Note: the policies in `schema.sql` let anyone read and insert, which suits a demo. Add Supabase Auth before going public.
