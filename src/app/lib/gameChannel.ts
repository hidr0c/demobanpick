'use client';

// BroadcastChannel for cross-tab communication
// Controller is the ONLY source of truth - other pages just listen

export type GamePhase = 'idle' | 'random' | 'banpick' | 'final' | 'match';

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
  randomResults: any[];
  bannedSongs: any[];
  pickedSongs: any[];
  animationPool: any[];
  
  // Match display
  matchSongs: any[];
  currentMatchIndex: number;
}

export type MessageType = 
  | 'SETTINGS_UPDATE'
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

export interface ChannelMessage {
  type: MessageType;
  payload?: any;
  timestamp: number;
}

const CHANNEL_NAME = 'game-control';

let channel: BroadcastChannel | null = null;

export function getChannel(): BroadcastChannel {
  if (typeof window === 'undefined') {
    throw new Error('BroadcastChannel only works in browser');
  }
  
  if (!channel) {
    channel = new BroadcastChannel(CHANNEL_NAME);
  }
  
  return channel;
}

// Send message from Controller to all pages
export function sendMessage(type: MessageType, payload?: any): void {
  const channel = getChannel();
  const message: ChannelMessage = {
    type,
    payload,
    timestamp: Date.now()
  };
  channel.postMessage(message);
  
  // Also dispatch to current window (for Controller's own preview)
  window.dispatchEvent(new CustomEvent('game-message', { detail: message }));
}

// Subscribe to messages (for display pages)
export function subscribeToMessages(callback: (message: ChannelMessage) => void): () => void {
  const channel = getChannel();
  
  const handleMessage = (event: MessageEvent<ChannelMessage>) => {
    callback(event.data);
  };
  
  const handleCustomEvent = (event: CustomEvent<ChannelMessage>) => {
    callback(event.detail);
  };
  
  channel.addEventListener('message', handleMessage);
  window.addEventListener('game-message', handleCustomEvent as EventListener);
  
  return () => {
    channel.removeEventListener('message', handleMessage);
    window.removeEventListener('game-message', handleCustomEvent as EventListener);
  };
}

// Default initial state
export const DEFAULT_GAME_STATE: GameState = {
  selectedPool: 'newbieSemi',
  randomCount: 4,
  pickCount: 2,
  banCount: 0,
  fixedSongs: [],
  lockedTracks: {},
  hiddenTracks: { track3Hidden: false, track4Hidden: false },
  phase: 'idle',
  randomResults: [],
  bannedSongs: [],
  pickedSongs: [],
  animationPool: [],
  matchSongs: [],
  currentMatchIndex: 0
};
