import { create } from 'zustand';
import { upsertRoom, deleteRoom, getRooms, updateRoomStatus, getRoomsByDepartment } from '@/api/roomApi';
import { ROOM_STATUS_MESSAGES } from '@/constants/messages';
import { RoomStatus } from '@/constants/room';
import type { Room, RoomDraft } from '@/models/room';
import { formatRoomStatus } from '@/utils/formatters';
import { roomflowMessage } from '@/utils/message';

interface RoomFilters {
  floor?: string;
  capacityRange?: string;
  equipment?: string[];
  status?: RoomStatus;
}

interface RoomState {
  rooms: Room[];
  filters: RoomFilters;
  loading: boolean;
  initialize: () => Promise<void>;
  setFilters: (filters: RoomFilters) => void;
  saveRoom: (draft: RoomDraft) => Promise<void>;
  setRoomStatus: (roomId: string, status: RoomStatus) => Promise<void>;
  removeRoom: (roomId: string) => Promise<void>;
  getAccessibleRooms: (department?: string, isAdmin?: boolean) => Room[];
}

export const useRoomStore = create<RoomState>((set, get) => ({
  rooms: [],
  filters: {},
  loading: false,
  async initialize() {
    set({ loading: true });
    try {
      const rooms = await getRooms();
      set({ rooms });
    } finally {
      set({ loading: false });
    }
  },
  setFilters(filters) {
    set({ filters });
  },
  async saveRoom(draft) {
    set({ loading: true });
    try {
      const saved = await upsertRoom(draft);
      const rooms = await getRooms();
      set({ rooms });
      roomflowMessage.success(`${saved.name} 已保存，状态：${formatRoomStatus(saved.status)}`);
    } finally {
      set({ loading: false });
    }
  },
  async setRoomStatus(roomId, status) {
    set({ loading: true });
    try {
      const rooms = await updateRoomStatus(roomId, status);
      set({ rooms });
      roomflowMessage.info(ROOM_STATUS_MESSAGES[status]);
    } finally {
      set({ loading: false });
    }
  },
  async removeRoom(roomId) {
    const rooms = await deleteRoom(roomId);
    set({ rooms });
    roomflowMessage.warning('会议室已删除');
  },
  getAccessibleRooms(department, isAdmin = false) {
    const { rooms } = get();
    if (isAdmin) {
      return rooms;
    }
    return rooms.filter((room) => room.departments.length === 0 || department ? room.departments.includes(department as any) : true);
  },
}));
