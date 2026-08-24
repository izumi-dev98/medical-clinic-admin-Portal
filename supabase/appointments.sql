-- Appointment requests submitted from the public clinic website.
create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  patient_name text not null,
  age integer not null check (age >= 0 and age <= 130),
  address text not null,
  phone_number text not null,
  doctor_name text not null,
  appointment_date date not null,
  reason text not null,
  status text not null default 'Pending' check (status in ('Pending', 'Reject', 'Completed')),
  created_at timestamptz not null default now()
);

alter table public.appointments drop constraint if exists appointments_status_check;
alter table public.appointments add constraint appointments_status_check check (status in ('Pending', 'Reject', 'Completed'));
alter table public.appointments enable row level security;

drop policy if exists "Anyone can submit appointment requests" on public.appointments;
create policy "Anyone can submit appointment requests" on public.appointments for insert to anon, authenticated with check (true);

drop policy if exists "Anon can read appointment requests" on public.appointments;
create policy "Anon can read appointment requests" on public.appointments for select to anon using (true);
drop policy if exists "Anon can update appointment requests" on public.appointments;
create policy "Anon can update appointment requests" on public.appointments for update to anon using (true) with check (true);
drop policy if exists "Anon can delete appointment requests" on public.appointments;
create policy "Anon can delete appointment requests" on public.appointments for delete to anon using (true);

-- Optional authenticated staff policy:
-- create policy "Authenticated users can view appointments" on public.appointments for select to authenticated using (true);
