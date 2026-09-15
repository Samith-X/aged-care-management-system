-- CareConnect / ICT30017 Team 2F
-- Supabase schema + demo seed data
-- Run this in Supabase -> SQL Editor -> New query.
-- This script is designed to match the current React prototype data model.
-- IMPORTANT: Core aged-care tables have RLS enabled but NO access policies.
-- Your security teammate should add Auth/RBAC/RLS policies before the React app
-- reads/writes sensitive tables through the browser.

begin;

-- ------------------------------------------------------------
-- 1. Safe connection-test table
-- ------------------------------------------------------------
create table if not exists public.app_status (
  id integer primary key,
  message text not null,
  updated_at timestamptz not null default now()
);

insert into public.app_status (id, message)
values (1, 'CareConnect Supabase connection is working')
on conflict (id) do update
set message = excluded.message,
    updated_at = now();

alter table public.app_status enable row level security;

drop policy if exists "public can read app status" on public.app_status;
create policy "public can read app status"
on public.app_status
for select
to anon, authenticated
using (true);

-- ------------------------------------------------------------
-- 2. Members / residents
-- ------------------------------------------------------------
create table if not exists public.members (
  id text primary key,
  name text not null,
  dob date,
  phone text,
  email text,
  room text not null default 'Unassigned',
  care_level text not null default 'Low'
    check (care_level in ('Low', 'Medium', 'High')),
  status text not null default 'Active',
  accessibility text,
  emergency_contact text,
  representative text,
  care_plan text,
  care_team text[] not null default '{}',
  medications jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 3. Staff
-- ------------------------------------------------------------
create table if not exists public.staff (
  id text primary key,
  name text not null,
  role text not null,
  employment text,
  status text not null default 'Active',
  phone text,
  email text,
  qualifications text[] not null default '{}',
  availability text,
  credential_expiry date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 4. Services
-- ------------------------------------------------------------
create table if not exists public.services (
  id text primary key,
  name text not null unique,
  description text,
  duration integer not null default 30 check (duration > 0),
  status text not null default 'Active'
    check (status in ('Active', 'Inactive')),
  checklist text[] not null default '{}',
  staff_requirements text[] not null default '{}',
  facility_requirement text not null default 'None',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 5. Rooms
-- ------------------------------------------------------------
create table if not exists public.rooms (
  id text primary key,
  number text not null unique,
  type text not null default 'Single',
  wing text,
  status text not null default 'Available'
    check (status in ('Available', 'Occupied', 'Maintenance')),
  resident_id text references public.members(id) on update cascade on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 6. Room reservations
-- ------------------------------------------------------------
create table if not exists public.reservations (
  id text primary key,
  room_id text not null references public.rooms(id) on update cascade on delete restrict,
  member_id text not null references public.members(id) on update cascade on delete restrict,
  start_date date not null default current_date,
  status text not null default 'Active'
    check (status in ('Active', 'Cancelled', 'Completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists reservations_one_active_room
  on public.reservations(room_id)
  where status = 'Active';

create unique index if not exists reservations_one_active_member
  on public.reservations(member_id)
  where status = 'Active';

-- ------------------------------------------------------------
-- 7. Maintenance
-- ------------------------------------------------------------
create table if not exists public.maintenance_issues (
  id text primary key,
  location text not null,
  issue text not null,
  priority text not null default 'Medium'
    check (priority in ('Low', 'Medium', 'High')),
  status text not null default 'Open'
    check (status in ('Open', 'In Progress', 'Resolved')),
  reported date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 8. Inventory
-- ------------------------------------------------------------
create table if not exists public.inventory_items (
  id text primary key,
  name text not null,
  category text,
  location text,
  quantity integer not null default 0 check (quantity >= 0),
  minimum integer not null default 0 check (minimum >= 0),
  batch text,
  expiry date,
  medication boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 9. Scheduling
-- ------------------------------------------------------------
create table if not exists public.schedules (
  id text primary key,
  date date not null,
  time time not null,
  member_id text not null references public.members(id) on update cascade on delete restrict,
  service_id text not null references public.services(id) on update cascade on delete restrict,
  staff_id text not null references public.staff(id) on update cascade on delete restrict,
  room text not null default 'Not required',
  status text not null default 'Scheduled'
    check (status in ('Scheduled', 'Completed', 'Cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists schedules_staff_timeslot
  on public.schedules(date, time, staff_id)
  where status <> 'Cancelled';

-- ------------------------------------------------------------
-- 10. Updated-at helper
-- ------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare
  t text;
begin
  foreach t in array array[
    'members','staff','services','rooms','reservations',
    'maintenance_issues','inventory_items','schedules'
  ]
  loop
    execute format('drop trigger if exists set_updated_at on public.%I', t);
    execute format(
      'create trigger set_updated_at before update on public.%I
       for each row execute function public.set_updated_at()',
      t
    );
  end loop;
end
$$;

-- ------------------------------------------------------------
-- 11. Demo seed data
-- ------------------------------------------------------------
insert into public.members
(id, name, dob, phone, email, room, care_level, status, accessibility,
 emergency_contact, representative, care_plan, care_team, medications)
values
(
 'M001','Margaret Wilson','1941-03-12','0412 555 201',
 'margaret.wilson@example.com','A-12','High','Active',
 'Walking frame; hearing aid',
 'John Wilson · Son · 0412 555 301','John Wilson',
 'Assist with showering, mobility and meal preparation. Encourage hydration and daily walking as tolerated.',
 array['ST001','ST003'],
 '[{"id":"MED001","name":"Paracetamol","dose":"1 g","route":"Oral","frequency":"PRN","status":"Active"},{"id":"MED002","name":"Amlodipine","dose":"5 mg","route":"Oral","frequency":"Daily","status":"Active"}]'::jsonb
),
(
 'M002','Robert Brown','1937-11-04','0412 555 202',
 'robert.brown@example.com','B-04','Medium','Active',
 'Glasses; low vision signage',
 'Anna Brown · Daughter · 0412 555 302','Anna Brown',
 'Prompt with personal care. Support physiotherapy program and monitor skin integrity.',
 array['ST002','ST004'],
 '[{"id":"MED003","name":"Metformin","dose":"500 mg","route":"Oral","frequency":"Twice daily","status":"Active"}]'::jsonb
),
(
 'M003','Helen Jones','1946-07-18','0412 555 203',
 'helen.jones@example.com','A-08','Low','Active',
 'No special requirement',
 'Mark Jones · Son · 0412 555 303','Mark Jones',
 'Independent with most ADLs. Provide medication prompts and weekly wellbeing review.',
 array['ST001'],
 '[{"id":"MED004","name":"Atorvastatin","dose":"20 mg","route":"Oral","frequency":"Nightly","status":"Active"}]'::jsonb
),
(
 'M004','Peter Williams','1939-02-25','0412 555 204',
 'peter.williams@example.com','C-02','High','Active',
 'Wheelchair; transfer assistance',
 'Laura Williams · Daughter · 0412 555 304','Laura Williams',
 'Two-person transfer when required. Pressure care, continence support and mobility assistance.',
 array['ST003','ST004'],
 '[]'::jsonb
)
on conflict (id) do nothing;

insert into public.staff
(id, name, role, employment, status, phone, email, qualifications, availability, credential_expiry)
values
('ST001','Emma Taylor','Registered Nurse','Permanent','Active','0412 600 101','emma.taylor@careconnect.local',
 array['Registered Nurse','Medication Competency','First Aid'],'Mon–Fri 07:00–15:30','2027-05-30'),
('ST002','Sarah Lee','Physiotherapist','Part-time','Active','0412 600 102','sarah.lee@careconnect.local',
 array['Physiotherapy','Manual Handling'],'Mon, Wed, Fri 08:30–16:30','2027-01-20'),
('ST003','Todd Smith','Personal Care Worker','Permanent','Active','0412 600 103','todd.smith@careconnect.local',
 array['Certificate III Individual Support','Manual Handling'],'Tue–Sat 06:30–15:00','2026-11-10'),
('ST004','Sam Taylor','Personal Care Worker','Casual','Active','0412 600 104','sam.taylor@careconnect.local',
 array['Certificate III Individual Support','First Aid'],'Flexible','2027-03-01'),
('ST005','Olivia Chen','Facility Administrator','Permanent','Active','0412 600 105','olivia.chen@careconnect.local',
 array['Administration','WHS'],'Mon–Fri 08:00–16:00','2027-08-15')
on conflict (id) do nothing;

insert into public.services
(id, name, description, duration, status, checklist, staff_requirements, facility_requirement)
values
('SV001','Showering Assistance',
 'Personal care support for showering, dressing and safe bathroom use.',
 45,'Active',
 array['Confirm consent','Prepare bathroom','Assist shower','Skin check','Document completion'],
 array['Certificate III Individual Support'],'Accessible Bathroom'),
('SV002','Medication Assistance',
 'Medication support by authorised healthcare staff according to current medication records.',
 20,'Active',
 array['Verify member','Check medication record','Provide/assist medication','Document outcome'],
 array['Registered Nurse','Medication Competency'],'None'),
('SV003','Physiotherapy Session',
 'Individual mobility and rehabilitation session.',
 60,'Active',
 array['Review plan','Assess mobility','Complete exercises','Document response'],
 array['Physiotherapy'],'Therapy Room'),
('SV004','Community Outing',
 'Supported social or community participation activity.',
 120,'Inactive',
 array['Confirm booking','Check transport','Confirm contact details','Document attendance'],
 array['First Aid'],'Vehicle')
on conflict (id) do nothing;

insert into public.rooms
(id, number, type, wing, status, resident_id)
values
('R001','A-08','Single','A Wing','Occupied','M003'),
('R002','A-12','Single','A Wing','Occupied','M001'),
('R003','B-04','Single','B Wing','Occupied','M002'),
('R004','B-07','Single','B Wing','Available',null),
('R005','C-02','Accessible','C Wing','Occupied','M004'),
('R006','C-05','Accessible','C Wing','Available',null)
on conflict (id) do nothing;

insert into public.reservations
(id, room_id, member_id, start_date, status)
values
('RS001','R002','M001','2026-01-12','Active'),
('RS002','R003','M002','2026-02-02','Active'),
('RS003','R001','M003','2026-03-10','Active'),
('RS004','R005','M004','2026-04-05','Active')
on conflict (id) do nothing;

insert into public.maintenance_issues
(id, location, issue, priority, status, reported)
values
('MT001','Room B-07','Call bell intermittently disconnecting','High','Open','2026-09-15'),
('MT002','A Wing lounge','Loose cupboard handle','Low','Resolved','2026-09-10')
on conflict (id) do nothing;

insert into public.inventory_items
(id, name, category, location, quantity, minimum, batch, expiry, medication)
values
('INV001','Disposable Gloves','PPE','Central Store',20,50,'GLV-2608','2029-08-01',false),
('INV002','Wound Dressings','Clinical','Treatment Room',12,20,'WD-2609','2028-09-30',false),
('INV003','Surgical Masks','PPE','Central Store',8,40,'MSK-2606','2029-06-15',false),
('INV004','Paracetamol 500 mg','Medication','Medication Room',180,100,'PCM-2610','2027-10-31',true),
('INV005','Amlodipine 5 mg','Medication','Medication Room',70,60,'AML-2607','2027-03-31',true),
('INV006','Hand Sanitiser','Hygiene','Central Store',45,30,'HS-2609','2028-09-30',false)
on conflict (id) do nothing;

insert into public.schedules
(id, date, time, member_id, service_id, staff_id, room, status)
values
('SC001','2026-09-16','08:00','M001','SV001','ST003','Accessible Bathroom 1','Scheduled'),
('SC002','2026-09-16','09:00','M002','SV003','ST002','Therapy Room','Scheduled'),
('SC003','2026-09-16','10:30','M003','SV002','ST001','Medication Room','Scheduled'),
('SC004','2026-09-16','11:00','M004','SV001','ST004','Accessible Bathroom 2','Scheduled'),
('SC005','2026-09-17','09:30','M001','SV003','ST002','Therapy Room','Scheduled')
on conflict (id) do nothing;

-- ------------------------------------------------------------
-- 12. RLS: secure by default
-- ------------------------------------------------------------
alter table public.members enable row level security;
alter table public.staff enable row level security;
alter table public.services enable row level security;
alter table public.rooms enable row level security;
alter table public.reservations enable row level security;
alter table public.maintenance_issues enable row level security;
alter table public.inventory_items enable row level security;
alter table public.schedules enable row level security;

commit;


