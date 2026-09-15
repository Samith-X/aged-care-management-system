# CareConnect — Aged Care Management System Prototype

Frontend prototype for **ICT30017 Project A — Team 2F**.


## Version 1.1 improvements

- Member room allocation is now synchronised with Facility Management.
- Assigning a room while creating a resident automatically marks the room **Occupied**, links the resident and creates an active reservation.
- Changing or removing a room from the member profile automatically releases the previous room and updates reservation history.
- Older prototype data in `localStorage` is repaired on load when a member has a room number but the Facility room was not updated.
- Personal developer naming was removed from the navigation; the interface now identifies the project as **ICT Project A · Team 2F**.
- Visual styling was refreshed across navigation, cards, tables, forms, room states and profile pages.

## What is included

This React prototype implements the main aged-care management modules described in the team specification and user-flow document:

- Dashboard / operational overview
- Member management
  - create/search member records
  - member profile
  - care plan
  - care team assignment
  - member medication records
  - family/emergency contacts
- Staff management
  - staff profiles
  - roles/employment status
  - qualifications/credentials
  - availability information
- Service management
  - service catalogue
  - duration
  - activity checklist
  - staff requirements
  - facility requirements
  - active/inactive status
- Scheduling
  - member + active service + qualified staff matching
  - date/time booking
  - simple conflict check
  - cancellation
- Facility management
  - room records
  - room availability
  - room reservations
  - cancellation returns a room to Available
  - maintenance issues and resolution
- Inventory management
  - stock records
  - minimum stock levels
  - low-stock identification
  - stock adjustment
  - medication stock view
- Reports / management summary
- Settings / backend-security handoff notes
- Mock login screen ready to be replaced by Supabase Auth

## User-flow mapping

| User flow | Prototype location |
| --- | --- |
| F1 Manage Room Records | Facilities → Rooms |
| F2 Reserve a Room for a Resident | Facilities → Reservations → Reserve room |
| F3 Update/Cancel Reservation | Facilities → Reservations |
| F4 Maintenance Issue | Facilities → Maintenance |
| I1 Manage Inventory Item | Inventory → All Inventory |
| I2 Update Stock Quantity | Inventory → Adjust |
| I3 Low Stock / Restocking | Inventory → Low Stock |
| I4 Medication Inventory | Inventory → Medication Stock / Medication page |
| S1 Create / Configure Service | Services |
| S2 Staff Requirements | Services → Required qualifications |
| S3 Facility Requirements | Services → Facility requirement |
| S4 Activate / Deactivate Service | Services → Activate/Deactivate |
| M1 Manage Member Record | Members / Member Profile |
| M2 Assign Care Team | Member Profile → Care Team |
| M3 Staff Qualifications | Staff |
| M4 Staff Availability | Staff |
| Scheduling gap in source flow document | Scheduling module added so the integrated workflows have a destination |

## Technology

- React
- Vite
- React Router
- Plain CSS
- Browser localStorage for prototype persistence

There is intentionally **no UI framework** and no icon package, reducing dependency and styling conflicts for the team.

## Run locally

Requirements: Node.js 18+ recommended.

```bash
npm install
npm run dev
```

Open the URL printed by Vite (normally `http://localhost:5173`).

The default route opens the Dashboard. To demonstrate the mock login page, open:

```text
/login
```

## Production build check

```bash
npm run build
```

The generated production files will appear in `dist/`.

## Prototype data

The current version uses realistic mock records and stores changes in browser `localStorage` under:

```text
careconnect-prototype-data-v1
```

Use **Settings → Reset demo data** to restore the original sample dataset.

This is deliberate: the frontend can be demonstrated independently while database/authentication/security work is implemented by teammates.

## Supabase integration handoff

Use the **existing Team 2F Supabase project**. Do not create a second project unless the team agrees.

Create a local `.env` file based on `.env.example`:

```env
VITE_SUPABASE_URL=<existing Team 2F project URL>
VITE_SUPABASE_ANON_KEY=<public anon/publishable key>
```

### Important security rule

Only a browser-safe **anon/publishable** key belongs in the React frontend. Never commit or expose:

- `service_role` key
- database password
- access tokens
- private secrets

`.env` is already excluded by `.gitignore`.

## Suggested security teammate responsibilities

The current mock login and open routes create a clean integration boundary. The security teammate can add:

1. `@supabase/supabase-js`
2. Supabase client module
3. Supabase Auth login/logout/session handling
4. Auth context
5. Protected routes
6. Role-based UI permissions
7. Row Level Security policies in Supabase
8. Audit fields / database security testing

Suggested roles:

- Administrator
- Manager
- Nurse / Healthcare Staff
- Carer / Support Worker
- Facility Staff
- Inventory Staff

## Recommended Git workflow

```text
main
└── develop
    ├── feature/frontend-prototype
    ├── feature/security
    ├── feature/database
    └── feature/testing
```

Example first push:

```bash
git init
git add .
git commit -m "Build aged care management React prototype"
git branch -M main
git remote add origin <YOUR_GITHUB_REPOSITORY_URL>
git push -u origin main
```

Do not commit `.env`.

## Notes for assessment / demonstration

This is a **prototype**, not a clinical production system. Medication and care-plan information is demonstration data only. Clinical decision support, diagnosis and prescribing are not implemented.

The UI was structured so that the team can progressively replace local mock operations with Supabase queries without redesigning the pages.
