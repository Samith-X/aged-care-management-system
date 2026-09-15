import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  initialInventory,
  initialMaintenance,
  initialMembers,
  initialReservations,
  initialRooms,
  initialSchedules,
  initialServices,
  initialStaff,
} from '../data/mockData';
import { makeId, todayISO } from '../utils/helpers';

const AppDataContext = createContext(null);
const STORAGE_KEY = 'careconnect-prototype-data-v1';

const seed = {
  members: initialMembers,
  staff: initialStaff,
  services: initialServices,
  rooms: initialRooms,
  reservations: initialReservations,
  maintenance: initialMaintenance,
  inventory: initialInventory,
  schedules: initialSchedules,
};

const cloneState = (source) => ({
  members: (source.members || []).map((item) => ({ ...item, careTeam: [...(item.careTeam || [])], medications: (item.medications || []).map((med) => ({ ...med })) })),
  staff: (source.staff || []).map((item) => ({ ...item, qualifications: [...(item.qualifications || [])] })),
  services: (source.services || []).map((item) => ({ ...item, checklist: [...(item.checklist || [])], staffRequirements: [...(item.staffRequirements || [])] })),
  rooms: (source.rooms || []).map((item) => ({ ...item })),
  reservations: (source.reservations || []).map((item) => ({ ...item })),
  maintenance: (source.maintenance || []).map((item) => ({ ...item })),
  inventory: (source.inventory || []).map((item) => ({ ...item })),
  schedules: (source.schedules || []).map((item) => ({ ...item })),
});

/**
 * Repairs room/member/reservation relationships when older localStorage data is loaded.
 * This is intentionally conservative: it never displaces an existing resident from a room.
 */
const reconcileRoomState = (source) => {
  const current = cloneState({ ...seed, ...source });
  const roomClaims = new Map();

  // Active reservations are the strongest source of truth.
  current.reservations
    .filter((reservation) => reservation.status === 'Active')
    .forEach((reservation) => {
      const memberExists = current.members.some((member) => member.id === reservation.memberId);
      const roomExists = current.rooms.some((room) => room.id === reservation.roomId);
      if (memberExists && roomExists && !roomClaims.has(reservation.roomId)) {
        roomClaims.set(reservation.roomId, reservation.memberId);
      }
    });

  // Existing room resident IDs are next.
  current.rooms.forEach((room) => {
    const memberExists = current.members.some((member) => member.id === room.residentId);
    if (room.residentId && memberExists && !roomClaims.has(room.id)) {
      roomClaims.set(room.id, room.residentId);
    }
  });

  // Finally repair the old prototype behaviour where a member could contain a room number
  // without the Facility module being updated.
  current.members.forEach((member) => {
    if (!member.room || member.room === 'Unassigned') return;
    const room = current.rooms.find((item) => item.number === member.room);
    if (!room || room.status === 'Maintenance') return;
    const existingClaim = roomClaims.get(room.id);
    if (!existingClaim || existingClaim === member.id) roomClaims.set(room.id, member.id);
  });

  current.rooms = current.rooms.map((room) => {
    const residentId = roomClaims.get(room.id);
    if (!residentId) return room;
    return { ...room, status: 'Occupied', residentId };
  });

  current.members = current.members.map((member) => {
    const room = current.rooms.find((item) => item.residentId === member.id);
    if (room) return { ...member, room: room.number };

    // If the saved member points to a room claimed by somebody else, remove the stale link.
    if (member.room && member.room !== 'Unassigned') {
      const savedRoom = current.rooms.find((item) => item.number === member.room);
      if (savedRoom?.residentId && savedRoom.residentId !== member.id) {
        return { ...member, room: 'Unassigned' };
      }
    }
    return member;
  });

  // Ensure every room/member link has an active reservation so the Facilities reservation
  // table and occupancy numbers tell the same story.
  const reservations = [...current.reservations];
  current.rooms.forEach((room) => {
    if (!room.residentId) return;
    const hasActive = reservations.some(
      (reservation) => reservation.status === 'Active' && reservation.roomId === room.id && reservation.memberId === room.residentId,
    );
    if (!hasActive) {
      reservations.push({
        id: makeId('RS', reservations),
        roomId: room.id,
        memberId: room.residentId,
        startDate: todayISO(),
        status: 'Active',
      });
    }
  });
  current.reservations = reservations;

  return current;
};

const loadSeed = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return reconcileRoomState(saved ? { ...seed, ...JSON.parse(saved) } : seed);
  } catch {
    return reconcileRoomState(seed);
  }
};

const applyRoomAssignment = (current, memberId, roomId, startDate = todayISO()) => {
  const member = current.members.find((item) => item.id === memberId);
  if (!member) return { ok: false, message: 'Member record could not be found.', next: current };

  const targetRoom = roomId ? current.rooms.find((item) => item.id === roomId) : null;
  if (roomId && !targetRoom) return { ok: false, message: 'Select a valid room.', next: current };

  if (targetRoom) {
    const conflictingReservation = current.reservations.some(
      (reservation) => reservation.status === 'Active' && reservation.roomId === targetRoom.id && reservation.memberId !== memberId,
    );
    const occupiedByAnother = targetRoom.residentId && targetRoom.residentId !== memberId;
    if (targetRoom.status === 'Maintenance') {
      return { ok: false, message: 'The selected room is currently under maintenance.', next: current };
    }
    if (occupiedByAnother || conflictingReservation || (targetRoom.status === 'Occupied' && targetRoom.residentId !== memberId)) {
      return { ok: false, message: 'The selected room is already occupied.', next: current };
    }
  }

  const currentRoom = current.rooms.find((room) => room.residentId === memberId || room.number === member.room);
  const sameRoom = Boolean(targetRoom && currentRoom?.id === targetRoom.id);
  const activeSameReservation = targetRoom
    ? current.reservations.find(
        (reservation) => reservation.status === 'Active' && reservation.roomId === targetRoom.id && reservation.memberId === memberId,
      )
    : null;

  let reservations = current.reservations.map((reservation) => {
    if (reservation.status !== 'Active' || reservation.memberId !== memberId) return reservation;
    if (sameRoom && activeSameReservation?.id === reservation.id) return reservation;
    return { ...reservation, status: 'Cancelled' };
  });

  let newReservation = activeSameReservation || null;
  if (targetRoom && !activeSameReservation) {
    newReservation = {
      id: makeId('RS', reservations),
      roomId: targetRoom.id,
      memberId,
      startDate: startDate || todayISO(),
      status: 'Active',
    };
    reservations = [...reservations, newReservation];
  }

  const rooms = current.rooms.map((room) => {
    if (targetRoom && room.id === targetRoom.id) {
      return { ...room, status: 'Occupied', residentId: memberId };
    }
    if (room.residentId === memberId || (!targetRoom && room.number === member.room)) {
      return { ...room, status: 'Available', residentId: '' };
    }
    return room;
  });

  const members = current.members.map((item) =>
    item.id === memberId ? { ...item, room: targetRoom ? targetRoom.number : 'Unassigned' } : item,
  );

  return {
    ok: true,
    reservation: newReservation,
    next: { ...current, members, rooms, reservations },
  };
};

export function AppDataProvider({ children }) {
  const [data, setData] = useState(loadSeed);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  const setCollection = (key, updater) => {
    setData((current) => ({
      ...current,
      [key]: typeof updater === 'function' ? updater(current[key]) : updater,
    }));
  };

  const addMember = (payload) => {
    const requestedRoom = payload.roomId ? data.rooms.find((room) => room.id === payload.roomId) : null;
    if (payload.roomId && (!requestedRoom || requestedRoom.status !== 'Available' || requestedRoom.residentId)) {
      return { ok: false, message: 'The selected room is no longer available.' };
    }

    const member = {
      id: makeId('M', data.members),
      name: payload.name.trim(),
      dob: payload.dob || '',
      phone: payload.phone || '',
      email: payload.email || '',
      room: 'Unassigned',
      careLevel: payload.careLevel || 'Low',
      status: payload.status || 'Active',
      accessibility: payload.accessibility || 'No special requirement',
      emergencyContact: payload.emergencyContact || '',
      representative: payload.representative || '',
      carePlan: payload.carePlan || '',
      careTeam: payload.careTeam || [],
      medications: payload.medications || [],
    };

    let next = { ...data, members: [...data.members, member] };
    if (payload.roomId) {
      const assigned = applyRoomAssignment(next, member.id, payload.roomId, payload.startDate || todayISO());
      if (!assigned.ok) return assigned;
      next = assigned.next;
    }

    setData(next);
    const savedMember = next.members.find((item) => item.id === member.id) || member;
    return { ok: true, member: savedMember };
  };

  const updateMember = (id, payload) => {
    // Room allocation is deliberately excluded here. It must go through assignRoomToMember
    // so Member and Facility data remain synchronised.
    const { room: _room, roomId: _roomId, ...safePayload } = payload;
    setCollection('members', (items) => items.map((item) => (item.id === id ? { ...item, ...safePayload } : item)));
  };

  const assignRoomToMember = (memberId, roomId, startDate = todayISO()) => {
    const result = applyRoomAssignment(data, memberId, roomId, startDate);
    if (result.ok) setData(result.next);
    return { ok: result.ok, message: result.message, reservation: result.reservation };
  };

  const addStaff = (payload) => {
    const staffMember = {
      id: makeId('ST', data.staff),
      name: payload.name.trim(),
      role: payload.role || 'Personal Care Worker',
      employment: payload.employment || 'Permanent',
      status: payload.status || 'Active',
      phone: payload.phone || '',
      email: payload.email || '',
      qualifications: payload.qualifications || [],
      availability: payload.availability || '',
      credentialExpiry: payload.credentialExpiry || '',
    };
    setCollection('staff', (items) => [...items, staffMember]);
    return staffMember;
  };

  const updateStaff = (id, payload) => {
    setCollection('staff', (items) => items.map((item) => (item.id === id ? { ...item, ...payload } : item)));
  };

  const addService = (payload) => {
    const service = {
      id: makeId('SV', data.services),
      name: payload.name.trim(),
      description: payload.description || '',
      duration: Number(payload.duration) || 30,
      status: payload.status || 'Active',
      checklist: payload.checklist || [],
      staffRequirements: payload.staffRequirements || [],
      facilityRequirement: payload.facilityRequirement || 'None',
    };
    setCollection('services', (items) => [...items, service]);
    return service;
  };

  const updateService = (id, payload) => {
    setCollection('services', (items) => items.map((item) => (item.id === id ? { ...item, ...payload } : item)));
  };

  const addRoom = (payload) => {
    const room = {
      id: makeId('R', data.rooms),
      number: payload.number.trim(),
      type: payload.type || 'Single',
      wing: payload.wing || '',
      status: payload.status || 'Available',
      residentId: payload.residentId || '',
    };
    setCollection('rooms', (items) => [...items, room]);
    return room;
  };

  const updateRoom = (id, payload) => {
    setCollection('rooms', (items) => items.map((item) => (item.id === id ? { ...item, ...payload } : item)));
  };

  const reserveRoom = ({ roomId, memberId, startDate }) => assignRoomToMember(memberId, roomId, startDate || todayISO());

  const cancelReservation = (reservationId) => {
    const reservation = data.reservations.find((item) => item.id === reservationId);
    if (!reservation || reservation.status !== 'Active') return;
    const room = data.rooms.find((item) => item.id === reservation.roomId);

    setData((current) => ({
      ...current,
      reservations: current.reservations.map((item) =>
        item.id === reservationId ? { ...item, status: 'Cancelled' } : item,
      ),
      rooms: current.rooms.map((item) =>
        item.id === reservation.roomId && item.residentId === reservation.memberId
          ? { ...item, status: 'Available', residentId: '' }
          : item,
      ),
      members: current.members.map((item) =>
        item.id === reservation.memberId && room && item.room === room.number ? { ...item, room: 'Unassigned' } : item,
      ),
    }));
  };

  const addMaintenance = (payload) => {
    const issue = {
      id: makeId('MT', data.maintenance),
      location: payload.location.trim(),
      issue: payload.issue.trim(),
      priority: payload.priority || 'Medium',
      status: 'Open',
      reported: payload.reported || todayISO(),
    };
    setCollection('maintenance', (items) => [...items, issue]);
    return issue;
  };

  const updateMaintenance = (id, payload) => {
    setCollection('maintenance', (items) => items.map((item) => (item.id === id ? { ...item, ...payload } : item)));
  };

  const addInventoryItem = (payload) => {
    const item = {
      id: makeId('INV', data.inventory),
      name: payload.name.trim(),
      category: payload.category || 'General',
      location: payload.location || 'Central Store',
      quantity: Number(payload.quantity) || 0,
      minimum: Number(payload.minimum) || 0,
      batch: payload.batch || '',
      expiry: payload.expiry || '',
      medication: Boolean(payload.medication),
    };
    setCollection('inventory', (items) => [...items, item]);
    return item;
  };

  const adjustInventory = (id, adjustment) => {
    const numeric = Number(adjustment);
    if (!Number.isFinite(numeric)) return;
    setCollection('inventory', (items) =>
      items.map((item) => (item.id === id ? { ...item, quantity: Math.max(0, item.quantity + numeric) } : item)),
    );
  };

  const addSchedule = (payload) => {
    const service = data.services.find((item) => item.id === payload.serviceId);
    const staffMember = data.staff.find((item) => item.id === payload.staffId);
    if (!service || service.status !== 'Active') return { ok: false, message: 'Only active services can be scheduled.' };
    if (!staffMember || staffMember.status !== 'Active') return { ok: false, message: 'Only active staff can be assigned.' };

    const missing = service.staffRequirements.filter((requirement) => !staffMember.qualifications.includes(requirement));
    if (missing.length) {
      return { ok: false, message: `Selected staff member does not meet: ${missing.join(', ')}.` };
    }

    const conflict = data.schedules.some(
      (item) => item.date === payload.date && item.time === payload.time && item.staffId === payload.staffId && item.status !== 'Cancelled',
    );
    if (conflict) return { ok: false, message: 'The selected staff member already has a booking at this time.' };

    const schedule = {
      id: makeId('SC', data.schedules),
      date: payload.date,
      time: payload.time,
      memberId: payload.memberId,
      serviceId: payload.serviceId,
      staffId: payload.staffId,
      room: payload.room || 'Not required',
      status: 'Scheduled',
    };
    setCollection('schedules', (items) => [...items, schedule]);
    return { ok: true, schedule };
  };

  const updateSchedule = (id, payload) => {
    setCollection('schedules', (items) => items.map((item) => (item.id === id ? { ...item, ...payload } : item)));
  };

  const resetDemo = () => setData(reconcileRoomState(seed));

  const value = useMemo(
    () => ({
      ...data,
      addMember,
      updateMember,
      assignRoomToMember,
      addStaff,
      updateStaff,
      addService,
      updateService,
      addRoom,
      updateRoom,
      reserveRoom,
      cancelReservation,
      addMaintenance,
      updateMaintenance,
      addInventoryItem,
      adjustInventory,
      addSchedule,
      updateSchedule,
      resetDemo,
    }),
    [data],
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const context = useContext(AppDataContext);
  if (!context) throw new Error('useAppData must be used inside AppDataProvider');
  return context;
}
