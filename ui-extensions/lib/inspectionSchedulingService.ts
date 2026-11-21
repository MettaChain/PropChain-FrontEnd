/**
 * Property inspection scheduling (#1433).
 *
 * Availability is expressed as inspector calendar slots; a booking consumes one
 * slot. Everything is a pure function over plain data so it can be persisted or
 * replayed by the caller.
 */

export interface TimeRange {
  startsAt: string;
  endsAt: string;
}

export interface InspectorAvailability {
  inspectorId: string;
  slots: TimeRange[];
}

export type BookingStatus = 'scheduled' | 'cancelled';

export interface InspectionBooking {
  id: string;
  propertyId: string;
  inspectorId: string;
  slot: TimeRange;
  status: BookingStatus;
  remindAt?: string;
}

export class SchedulingConflictError extends Error {
  constructor(message = 'The requested inspection slot is not available') {
    super(message);
    this.name = 'SchedulingConflictError';
  }
}

const HOUR_MS = 60 * 60 * 1000;

const overlaps = (left: TimeRange, right: TimeRange): boolean =>
  new Date(left.startsAt) < new Date(right.endsAt) &&
  new Date(right.startsAt) < new Date(left.endsAt);

const isWithin = (slot: TimeRange, range: TimeRange): boolean =>
  new Date(slot.startsAt) >= new Date(range.startsAt) &&
  new Date(slot.endsAt) <= new Date(range.endsAt);

/** Slots that are inside `range` and not taken by a scheduled booking. */
export function getAvailableSlots(
  availability: InspectorAvailability,
  bookings: InspectionBooking[],
  range: TimeRange,
): TimeRange[] {
  const taken = bookings.filter((booking) => booking.status === 'scheduled');
  return availability.slots.filter(
    (slot) => isWithin(slot, range) && !taken.some((booking) => overlaps(booking.slot, slot)),
  );
}

/** Book an available slot, rejecting a slot that is already taken. */
export function bookInspection(params: {
  availability: InspectorAvailability;
  bookings: InspectionBooking[];
  propertyId: string;
  slot: TimeRange;
}): InspectionBooking {
  const available = getAvailableSlots(params.availability, params.bookings, params.slot);
  if (available.length === 0) {
    throw new SchedulingConflictError();
  }

  const reminder = new Date(new Date(params.slot.startsAt).getTime() - 24 * HOUR_MS);

  return {
    id: `${params.propertyId}:${params.slot.startsAt}`,
    propertyId: params.propertyId,
    inspectorId: params.availability.inspectorId,
    slot: params.slot,
    status: 'scheduled',
    remindAt: reminder.toISOString(),
  };
}

/** Move a booking to a new slot after checking it against the other bookings. */
export function rescheduleBooking(
  booking: InspectionBooking,
  newSlot: TimeRange,
  bookings: InspectionBooking[],
): InspectionBooking {
  const others = bookings.filter((candidate) => candidate.id !== booking.id);
  const available = getAvailableSlots(
    { inspectorId: booking.inspectorId, slots: [newSlot] },
    others,
    newSlot,
  );
  if (available.length === 0) {
    throw new SchedulingConflictError('The new inspection slot is not available');
  }
  return { ...booking, slot: newSlot };
}

/** Cancel a booking; a cancelled booking releases its slot. */
export function cancelBooking(booking: InspectionBooking): InspectionBooking {
  return { ...booking, status: 'cancelled', remindAt: undefined };
}

/** Bookings whose reminder is due at or before `now`. */
export function dueReminders(
  bookings: InspectionBooking[],
  now: Date = new Date(),
): InspectionBooking[] {
  return bookings.filter(
    (booking) =>
      booking.status === 'scheduled' &&
      booking.remindAt !== undefined &&
      new Date(booking.remindAt) <= now,
  );
}

/** Send every due reminder; returns the number of inspections reminded. */
export async function sendReminders(
  bookings: InspectionBooking[],
  send: (booking: InspectionBooking) => Promise<void> | void,
  now: Date = new Date(),
): Promise<number> {
  const due = dueReminders(bookings, now);
  for (const booking of due) {
    await send(booking);
  }
  return due.length;
}
