# Prototype Testing Checklist

Use this checklist after `npm install` and `npm run dev`.

## Build / startup

- [ ] `npm install` completes.
- [ ] `npm run dev` starts Vite without console errors.
- [ ] `/dashboard` loads.
- [ ] `/login` loads mock login and **Enter prototype** opens Dashboard.
- [ ] Refreshing a routed page works in the Vite dev server.

## Navigation

- [ ] Every sidebar item opens the correct module.
- [ ] Mobile menu opens/closes below tablet width.
- [ ] Unknown routes show the 404 page.

## M1 — Manage Member Record

- [ ] Members can be searched and filtered.
- [ ] Add Member validates the required name.
- [ ] New member opens a member profile.
- [ ] Member profile edits save.
- [ ] Care plan displays and can be updated.
- [ ] Medication records can be added.

## M2 — Assign Care Team

- [ ] Care Team tab displays assigned staff.
- [ ] Active staff can be assigned.
- [ ] Existing care-team staff are not offered again.
- [ ] Assigned staff can be removed.

## M3/M4 — Staff

- [ ] Staff can be searched/filtered.
- [ ] Staff record can be created and edited.
- [ ] Qualifications are stored from comma-separated input.
- [ ] Availability and credential expiry display correctly.

## S1–S4 — Services

- [ ] New service can be created.
- [ ] Service duration must be greater than zero.
- [ ] Checklist and staff requirements display.
- [ ] Facility requirement displays.
- [ ] Service can be activated/deactivated.
- [ ] Inactive services do not appear in New Booking.

## Scheduling

- [ ] Booking form shows active members/services.
- [ ] Eligible Staff only contains staff meeting selected service qualifications.
- [ ] Booking cannot save with missing required fields.
- [ ] Duplicate staff/date/time booking is prevented.
- [ ] Booking can be cancelled.

## F1 — Room Records

- [ ] Room list displays availability.
- [ ] Add Room validates required room number.
- [ ] Duplicate room number is prevented.

## F2/F3 — Reservations

- [ ] Only Available rooms appear for new reservation.
- [ ] Confirmed reservation changes room status to Occupied.
- [ ] Resident is linked to the room.
- [ ] Cancelling an active reservation changes the room back to Available.

## F4 — Maintenance

- [ ] Maintenance issue can be created.
- [ ] Location and issue details are required.
- [ ] Open issue can be marked Resolved.

## I1/I2 — Inventory

- [ ] Item can be created.
- [ ] Receive increases quantity.
- [ ] Use/Damaged/Missing decreases quantity, never below zero.
- [ ] Low Stock status is calculated from minimum quantity.

## I3 — Low Stock / Restocking

- [ ] Low Stock tab only shows low/out-of-stock items.
- [ ] Receive restock opens a pre-filled stock movement.
- [ ] Received stock updates quantity and can remove the low-stock state.

## I4 — Medication Inventory

- [ ] Medication Stock tab only shows medication inventory.
- [ ] Medication page clearly separates resident medication records from stock control.

## Persistence

- [ ] Refresh page after adding/changing records: demo changes remain via localStorage.
- [ ] Settings → Reset demo data restores the original dataset.

## Security handoff

The mock login is intentionally not authentication. The security implementation should add Supabase Auth, protected routes, RBAC and Row Level Security before treating the system as secured.
