'use client';

import { io, Socket } from 'socket.io-client';

// Singleton socket instance
let socket: Socket | null = null;
let isConnecting = false;

// Check if running in browser
const isBrowser = typeof window !== 'undefined';

export function getSocket(): Socket {
  // Return null socket stub if not in browser (SSR)
  if (!isBrowser) {
    // Return a stub that won't throw errors during SSR
    return {
      on: () => {},
      off: () => {},
      emit: () => {},
      connect: () => {},
      disconnect: () => {},
      connected: false,
      id: undefined,
    } as unknown as Socket;
  }

  if (!socket && !isConnecting) {
    isConnecting = true;
    
    socket = io('http://localhost:3000', {
      transports: ['websocket', 'polling'], // WebSocket first, fallback to polling
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity,
      timeout: 20000,
      autoConnect: true,
    });

    socket.on('connect', () => {
      console.log('✅ Socket.IO connected:', socket?.id);
      isConnecting = false;
    });

    socket.on('disconnect', (reason) => {
      console.log('❌ Socket.IO disconnected:', reason);
    });

    socket.on('connect_error', (error) => {
      // Only log once per connection attempt, not spam
      if (isConnecting) {
        console.warn('Socket.IO connection error - server may not be running');
        isConnecting = false;
      }
    });
  }

  return socket!;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

// Export types for consistency
export type GamePhase = 'idle' | 'preview' | 'random' | 'banpick' | 'final' | 'match';

export interface GameState {
  // Settings
  selectedPool: string;
  randomCount: number;
  pickCount: number;
  banCount: number;
  fixedSongs: any[];
  lockedTracks: { track3?: any; track4?: any };
  hiddenTracks: { track3Hidden: boolean; track4Hidden: boolean };
  
  // Game state
  phase: GamePhase;
  previewSongs: any[];
  randomResults: any[];
  bannedSongs: any[];
  pickedSongs: any[];
  animationPool: any[];
  
  // Match display
  matchSongs: any[];
  currentMatchIndex: number;
}

export const DEFAULT_GAME_STATE: GameState = {
  selectedPool: 'newbieSemi',
  randomCount: 4,
  pickCount: 2,
  banCount: 2,
  fixedSongs: [],
  lockedTracks: {},
  hiddenTracks: { track3Hidden: false, track4Hidden: false },
  phase: 'idle',
  previewSongs: [],
  randomResults: [],
  bannedSongs: [],
  pickedSongs: [],
  animationPool: [],
  matchSongs: [],
  currentMatchIndex: 0,
};

export type MessageType = 
  | 'SETTINGS_UPDATE'
  | 'PREVIEW_START'
  | 'RANDOM_START'
  | 'RANDOM_ANIMATION'
  | 'RANDOM_COMPLETE'
  | 'SHOW_BAN_PICK'
  | 'BAN_SONG'
  | 'PICK_SONG'
  | 'SHOW_FINAL_RESULTS'
  | 'GO_TO_MATCH'
  | 'MATCH_NEXT'
  | 'MATCH_PREV'
  | 'RESET'
  | 'FULL_STATE_SYNC';

// Helper functions to emit events
export function emitGameEvent(event: MessageType, payload?: any) {
  const socket = getSocket();
  socket.emit(event, payload);
}

export function onGameEvent(event: MessageType, callback: (data: any) => void) {
  const socket = getSocket();
  socket.on(event, callback);
  
  // Return cleanup function
  return () => {
    socket.off(event, callback);
  };
}
