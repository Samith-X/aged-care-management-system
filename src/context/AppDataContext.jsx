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

const loadSeed = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? { ...seed, ...JSON.parse(saved) } : seed;
  } catch {
    return seed;
  }
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
    const member = {
      id: makeId('M', data.members),
      name: payload.name.trim(),
      dob: payload.dob || '',
      phone: payload.phone || '',
      email: payload.email || '',
      room: payload.room || 'Unassigned',
      careLevel: payload.careLevel || 'Low',
      status: payload.status || 'Active',
      accessibility: payload.accessibility || 'No special requirement',
      emergencyContact: payload.emergencyContact || '',
      representative: payload.representative || '',
      carePlan: payload.carePlan || '',
      careTeam: payload.careTeam || [],
      medications: payload.medications || [],
    };
    setCollection('members', (items) => [...items, member]);
    return member;
  };

  const updateMember = (id, payload) => {
    setCollection('members', (items) => items.map((item) => (item.id === id ? { ...item, ...payload } : item)));
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

  const reserveRoom = ({ roomId, memberId, startDate }) => {
    const room = data.rooms.find((item) => item.id === roomId);
    if (!room || room.status !== 'Available') {
      return { ok: false, message: 'The selected room is not available.' };
    }
    const member = data.members.find((item) => item.id === memberId);
    if (!member) return { ok: false, message: 'Select a valid member.' };

    const reservation = {
      id: makeId('RS', data.reservations),
      roomId,
      memberId,
      startDate: startDate || todayISO(),
      status: 'Active',
    };

    setData((current) => ({
      ...current,
      reservations: [...current.reservations, reservation],
      rooms: current.rooms.map((item) =>
        item.id === roomId ? { ...item, status: 'Occupied', residentId: memberId } : item,
      ),
      members: current.members.map((item) =>
        item.id === memberId ? { ...item, room: room.number } : item,
      ),
    }));
    return { ok: true, reservation };
  };

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
        item.id === reservation.roomId ? { ...item, status: 'Available', residentId: '' } : item,
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

  const resetDemo = () => setData(seed);

  const value = useMemo(
    () => ({
      ...data,
      addMember,
      updateMember,
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
