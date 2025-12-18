"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  getSocket,
  onGameEvent,
  emitGameEvent,
  GameState,
  DEFAULT_GAME_STATE,
  MessageType,
} from "../lib/socketClient";
import { Song } from "../interface";

// Hook for display pages (Home, Match Display) - LISTEN ONLY
export function useGameDisplay() {
  const [state, setState] = useState<GameState>(DEFAULT_GAME_STATE);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationSlots, setAnimationSlots] = useState<Song[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socket = getSocket();

    // Connection status
    const handleConnect = () => {
      console.log('🎮 Game display connected to server');
      setIsConnected(true);
    };

    const handleDisconnect = () => {
      console.log('🎮 Game display disconnected');
      setIsConnected(false);
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);

    // Game event handlers
    const unsubscribers: (() => void)[] = [];

    unsubscribers.push(
      onGameEvent('FULL_STATE_SYNC', (payload: GameState) => {
        setState(payload);
        console.log('📦 Full state synced');
      })
    );

    unsubscribers.push(
      onGameEvent('SETTINGS_UPDATE', (payload: Partial<GameState>) => {
        setState((prev) => ({ ...prev, ...payload }));
      })
    );

    unsubscribers.push(
      onGameEvent('PREVIEW_START', (payload: any) => {
        setState((prev) => ({
          ...prev,
          phase: 'preview',
          previewSongs: payload.previewSongs || [],
          randomCount: payload.randomCount || prev.randomCount,
        }));
        console.log('📺 Preview started with', payload.previewSongs?.length, 'songs');
      })
    );

    unsubscribers.push(
      onGameEvent('RANDOM_START', (payload: any) => {
        setIsAnimating(true);
        const initialPool = payload.animationPool || [];
        const randomCount = payload.randomCount || 4;
        if (initialPool.length > 0) {
          const shuffled = [...initialPool].sort(() => Math.random() - 0.5);
          setAnimationSlots(shuffled.slice(0, randomCount));
        }
        setState((prev) => ({
          ...prev,
          phase: "random",
          randomCount: randomCount,
          animationPool: initialPool,
          randomResults: [],
        }));
      })
    );

    unsubscribers.push(
      onGameEvent('RANDOM_ANIMATION', (payload: any) => {
        setAnimationSlots(payload.slots);
      })
    );

    unsubscribers.push(
      onGameEvent('RANDOM_COMPLETE', (payload: any) => {
        setIsAnimating(false);
        setAnimationSlots([]);
        setState((prev) => ({
          ...prev,
          randomResults: payload.results,
          phase: "random",
        }));
      })
    );

    unsubscribers.push(
      onGameEvent('SHOW_BAN_PICK', () => {
        setState((prev) => ({ ...prev, phase: "banpick" }));
      })
    );

    unsubscribers.push(
      onGameEvent('BAN_SONG', (payload: any) => {
        setState((prev) => ({
          ...prev,
          bannedSongs: [...prev.bannedSongs, payload.song],
        }));
      })
    );

    unsubscribers.push(
      onGameEvent('PICK_SONG', (payload: any) => {
        setState((prev) => ({
          ...prev,
          pickedSongs: [...prev.pickedSongs, payload.song],
        }));
      })
    );

    unsubscribers.push(
      onGameEvent('SHOW_FINAL_RESULTS', () => {
        setState((prev) => ({ ...prev, phase: "final" }));
      })
    );

    unsubscribers.push(
      onGameEvent('GO_TO_MATCH', (payload: any) => {
        setState((prev) => ({
          ...prev,
          phase: "match",
          matchSongs: payload.songs,
          currentMatchIndex: 0,
        }));
      })
    );

    unsubscribers.push(
      onGameEvent('MATCH_NEXT', (payload: any) => {
        setState((prev) => ({
          ...prev,
          currentMatchIndex: payload.currentMatchIndex,
        }));
      })
    );

    unsubscribers.push(
      onGameEvent('MATCH_PREV', (payload: any) => {
        setState((prev) => ({
          ...prev,
          currentMatchIndex: payload.currentMatchIndex,
        }));
      })
    );

    // Reset game state when controller resets
    unsubscribers.push(
      onGameEvent('RESET', () => {
        setState({
          ...DEFAULT_GAME_STATE
        });
        setIsAnimating(false);
        setAnimationSlots([]);
        // Also clear localStorage
        try {
          localStorage.removeItem('matchSongs');
          localStorage.removeItem('banPickLog');
          localStorage.removeItem('lockedTracks');
        } catch {}
        console.log('🔄 Game reset');
      })
    );

    // Cleanup
    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      unsubscribers.forEach((unsub) => unsub());
    };
  }, []);

  return {
    state,
    isAnimating,
    animationSlots,
    isConnected,
  };
}

// Hook for Controller page - FULL CONTROL
export function useGameController() {
  const [state, setState] = useState<GameState>(DEFAULT_GAME_STATE);
  const [songData, setSongData] = useState<Song[]>([]);
  const [isLoadingPool, setIsLoadingPool] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const animationStartRef = useRef<number>(0);

  // Pool file mapping
  const POOL_FILES: Record<string, string> = {
    newbieQual1: "/pools/N1 - newbieQual1.json",
    newbieQual2: "/pools/N2 - newbieQual2.json",
    newbieSemi: "/pools/N3 - newbieSemi.json",
    newbieFinals: "/pools/N4 - newbieFinals.json",
    proQual: "/pools/P1 - proTop3216.json",
    proTop8: "/pools/P2 - proTop8.json",
    proSemi: "/pools/P3 - proSemi.json",
    proFinals: "/pools/P4 - proFinals.json",
    top32: "/pools/top32.json",
  };

  // Socket connection setup
  useEffect(() => {
    const socket = getSocket();

    const handleConnect = () => {
      console.log('🎮 Controller connected to server');
      setIsConnected(true);
      // Sync current state to server
      emitGameEvent('SETTINGS_UPDATE', state);
    };

    const handleDisconnect = () => {
      console.log('🎮 Controller disconnected');
      setIsConnected(false);
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
    };
  }, []);

  // Load pool data
  useEffect(() => {
    const loadPool = async () => {
      setIsLoadingPool(true);
      const poolFile = POOL_FILES[state.selectedPool];

      if (!poolFile) {
        setIsLoadingPool(false);
        return;
      }

      try {
        const res = await fetch(`${poolFile}?t=${Date.now()}`, {
          cache: "no-store",
        });
        if (res.ok) {
          const data = await res.json();
          const songsWithIds = data.map((song: any, index: number) => ({
            ...song,
            id: song.id || `${song.title}-${song.diff}-${index}`,
            isDx: String(song.isDx),
          }));
          setSongData(songsWithIds);
        }
      } catch (error) {
        console.error("Error loading pool:", error);
      } finally {
        setIsLoadingPool(false);
      }
    };

    loadPool();
  }, [state.selectedPool]);

  // Update settings
  const updateSettings = useCallback((updates: Partial<GameState>) => {
    setState((prev) => {
      const newState = { ...prev, ...updates };
      emitGameEvent('SETTINGS_UPDATE', updates);
      return newState;
    });
  }, []);

  // Start randomization
  const startRandom = useCallback(() => {
    const pool = [...songData];
    const count = state.randomCount;

    if (pool.length === 0) {
      console.error("Pool is empty");
      return;
    }

    // Remove fixed songs from pool
    const availablePool = pool.filter(
      (song) => !state.fixedSongs.some((fixed) => fixed.id === song.id)
    );

    // Send RANDOM_START event with pool data
    emitGameEvent('RANDOM_START', {
      randomCount: count,
      animationPool: availablePool,
    });

    // Animate randomization
    const ANIMATION_DURATION = 3000;
    const SLOT_UPDATE_INTERVAL = 100;

    animationStartRef.current = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - animationStartRef.current;

      if (elapsed < ANIMATION_DURATION) {
        // Update slots during animation
        const shuffled = [...availablePool].sort(() => Math.random() - 0.5);
        const newSlots = shuffled.slice(0, count);

        emitGameEvent('RANDOM_ANIMATION', { slots: newSlots });

        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        // Animation complete - pick final results
        const finalShuffled = [...availablePool].sort(() => Math.random() - 0.5);
        const finalResults = finalShuffled.slice(0, count);

        emitGameEvent('RANDOM_COMPLETE', { results: finalResults });

        setState((prev) => ({
          ...prev,
          randomResults: finalResults,
          phase: "random",
        }));
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);
  }, [songData, state.randomCount, state.fixedSongs]);

  // Show ban/pick phase
  const showBanPick = useCallback(() => {
    emitGameEvent('SHOW_BAN_PICK');
    setState((prev) => ({ ...prev, phase: "banpick" }));
  }, []);

  // Ban a song
  const banSong = useCallback((song: Song) => {
    emitGameEvent('BAN_SONG', { song });
    setState((prev) => ({
      ...prev,
      bannedSongs: [...prev.bannedSongs, song],
    }));
  }, []);

  // Pick a song
  const pickSong = useCallback((song: Song) => {
    emitGameEvent('PICK_SONG', { song });
    setState((prev) => ({
      ...prev,
      pickedSongs: [...prev.pickedSongs, song],
    }));
  }, []);

  // Show final results
  const showFinalResults = useCallback(() => {
    emitGameEvent('SHOW_FINAL_RESULTS');
    setState((prev) => ({ ...prev, phase: "final" }));
  }, []);

  // Go to match display
  const goToMatch = useCallback((songs: Song[]) => {
    emitGameEvent('GO_TO_MATCH', { songs });
    setState((prev) => ({
      ...prev,
      phase: "match",
      matchSongs: songs,
      currentMatchIndex: 0,
    }));
  }, []);

  // Match navigation
  const nextMatch = useCallback(() => {
    emitGameEvent('MATCH_NEXT');
    setState((prev) => ({
      ...prev,
      currentMatchIndex: Math.min(
        prev.currentMatchIndex + 1,
        prev.matchSongs.length - 1
      ),
    }));
  }, []);

  const prevMatch = useCallback(() => {
    emitGameEvent('MATCH_PREV');
    setState((prev) => ({
      ...prev,
      currentMatchIndex: Math.max(prev.currentMatchIndex - 1, 0),
    }));
  }, []);

  // Reset game
  const reset = useCallback(() => {
    // Cancel any ongoing animation
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    emitGameEvent('RESET');
    
    setState((prev) => ({
      ...DEFAULT_GAME_STATE,
      selectedPool: prev.selectedPool,
      randomCount: prev.randomCount,
      pickCount: prev.pickCount,
      banCount: prev.banCount,
      lockedTracks: prev.lockedTracks,
      hiddenTracks: prev.hiddenTracks,
    }));
  }, []);

  return {
    state,
    songData,
    isLoadingPool,
    isConnected,
    updateSettings,
    startRandom,
    showBanPick,
    banSong,
    pickSong,
    showFinalResults,
    goToMatch,
    nextMatch,
    prevMatch,
    reset,
  };
}
