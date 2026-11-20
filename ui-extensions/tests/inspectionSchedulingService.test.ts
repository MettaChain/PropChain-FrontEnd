import {
  bookInspection,
  cancelBooking,
  dueReminders,
  getAvailableSlots,
  rescheduleBooking,
  SchedulingConflictError,
  sendReminders,
  type InspectionBooking,
  type InspectorAvailability,
} from '../lib/inspectionSchedulingService';

const slot = (day: number, hour: number) => ({
  startsAt: `2026-03-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:00:00.000Z`,
  endsAt: `2026-03-${String(day).padStart(2, '0')}T${String(hour + 1).padStart(2, '0')}:00:00.000Z`,
});

const availability: InspectorAvailability = {
  inspectorId: 'insp-1',
  slots: [slot(2, 9), slot(2, 10), slot(3, 9)],
};

const range = { startsAt: '2026-03-01T00:00:00.000Z', endsAt: '2026-03-04T00:00:00.000Z' };

const booking: InspectionBooking = {
  id: 'b-1',
  propertyId: 'prop-1',
  inspectorId: 'insp-1',
  slot: slot(2, 9),
  status: 'scheduled',
};

describe('inspection scheduling', () => {
  it('returns the inspector slots inside the requested range', () => {
    expect(getAvailableSlots(availability, [], range)).toHaveLength(3);
  });

  it('excludes slots taken by a scheduled booking', () => {
    expect(getAvailableSlots(availability, [booking], range)).toEqual([slot(2, 10), slot(3, 9)]);
  });

  it('books a free slot and sets a reminder 24 hours before', () => {
    const created = bookInspection({
      availability,
      bookings: [],
      propertyId: 'prop-2',
      slot: slot(2, 10),
    });

    expect(created.status).toBe('scheduled');
    expect(created.slot).toEqual(slot(2, 10));
    expect(created.remindAt).toBe('2026-03-01T10:00:00.000Z');
  });

  it('rejects a conflicting booking', () => {
    expect(() =>
      bookInspection({ availability, bookings: [booking], propertyId: 'prop-2', slot: slot(2, 9) }),
    ).toThrow(SchedulingConflictError);
  });

  it('reschedules to a free slot and rejects a taken one', () => {
    const second: InspectionBooking = { ...booking, id: 'b-2', slot: slot(2, 10) };

    expect(rescheduleBooking(booking, slot(3, 9), [booking, second]).slot).toEqual(slot(3, 9));
    expect(() => rescheduleBooking(booking, slot(2, 10), [booking, second])).toThrow(
      SchedulingConflictError,
    );
  });

  it('cancels a booking and releases the slot', () => {
    const cancelled = cancelBooking(booking);

    expect(cancelled.status).toBe('cancelled');
    expect(cancelled.remindAt).toBeUndefined();
    expect(getAvailableSlots(availability, [cancelled], range)).toContainEqual(slot(2, 9));
  });

  it('sends only due reminders', async () => {
    const due: InspectionBooking = { ...booking, remindAt: '2026-03-01T09:00:00.000Z' };
    const later: InspectionBooking = { ...booking, id: 'b-3', remindAt: '2026-04-01T09:00:00.000Z' };
    const send = jest.fn();

    expect(dueReminders([due, later], new Date('2026-03-02T00:00:00.000Z'))).toEqual([due]);
    expect(await sendReminders([due, later], send, new Date('2026-03-02T00:00:00.000Z'))).toBe(1);
    expect(send).toHaveBeenCalledWith(due);
  });
});
