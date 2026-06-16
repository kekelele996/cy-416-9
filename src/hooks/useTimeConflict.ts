import { useMemo } from 'react';
import { CONFLICT_MESSAGES } from '@/constants/messages';
import type { BookingDraft } from '@/models/booking';
import { useAuth } from '@/hooks/useAuth';
import { useBookingStore } from '@/stores/bookingStore';
import { useRoomStore } from '@/stores/roomStore';
import { isRoomAccessibleByDepartment } from '@/api/roomApi';
import { findRoomConflicts } from '@/utils/timeRange';

export function useTimeConflict(draft: Partial<BookingDraft>) {
  const bookings = useBookingStore((state) => state.bookings);
  const rooms = useRoomStore((state) => state.rooms);
  const { currentUser, isAdmin } = useAuth();

  const visibleBookings = useMemo(() => {
    if (isAdmin) {
      return bookings;
    }
    return bookings.filter((booking) => {
      const room = rooms.find((r) => r.id === booking.room_id);
      return !room || isRoomAccessibleByDepartment(room, currentUser?.department);
    });
  }, [bookings, currentUser?.department, isAdmin, rooms]);

  return useMemo(() => {
    if (!draft.room_id || !draft.start_time || !draft.end_time) {
      return {
        hasConflict: false,
        conflicts: [],
        message: '请选择会议室和完整时间段',
      };
    }

    const conflicts = findRoomConflicts(visibleBookings, draft.room_id, {
      start: draft.start_time,
      end: draft.end_time,
    });

    return {
      hasConflict: conflicts.length > 0,
      conflicts,
      message:
        conflicts.length > 0
          ? `${CONFLICT_MESSAGES.conflictFound}：${conflicts.map((item) => item.title).join('、')}`
          : CONFLICT_MESSAGES.noConflict,
    };
  }, [visibleBookings, draft.room_id, draft.start_time, draft.end_time]);
}
