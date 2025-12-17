"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  subscribeToMessages,
  sendMessage,
  GameState,
  DEFAULT_GAME_STATE,
  ChannelMessage,
  MessageType,
} from "../lib/gameChannel";
import { Song } from "../interface";

// Hook for display pages (Home, Match Display) - LISTEN ONLY
export function useGameDisplay() {
  const [state, setState] = useState<GameState>(DEFAULT_GAME_STATE);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationSlots, setAnimationSlots] = useState<Song[]>([]);

  useEffect(() => {
    const unsubscribe = subscribeToMessages((message: ChannelMessage) => {
      switch (message.type) {
        case "FULL_STATE_SYNC":
          setState(message.payload);
          break;

        case "SETTINGS_UPDATE":
          setState((prev) => ({ ...prev, ...message.payload }));
          break;

        case "RANDOM_START":
          setIsAnimating(true);
          // Set initial animation slots from pool immediately
          const initialPool = message.payload.animationPool || [];
          const randomCount = message.payload.randomCount || 4;
          if (initialPool.length > 0) {
            const shuffled = [...initialPool].sort(() => Math.random() - 0.5);
            setAnimationSlots(shuffled.slice(0, randomCount));
          }
          setState((prev) => ({
            ...prev,
            phase: "random",
            randomCount: randomCount, // Sync randomCount from controller
            animationPool: initialPool,
            randomResults: [],
          }));
          break;

        case "RANDOM_ANIMATION":
          // Update slots during animation
          setAnimationSlots(message.payload.slots);
          break;

        case "RANDOM_COMPLETE":
          setIsAnimating(false);
          setAnimationSlots([]);
          setState((prev) => ({
            ...prev,
            randomResults: message.payload.results,
            phase: "random",
          }));
          break;

        case "SHOW_BAN_PICK":
          setState((prev) => ({ ...prev, phase: "banpick" }));
          break;

        case "BAN_SONG":
          setState((prev) => ({
            ...prev,
            bannedSongs: [...prev.bannedSongs, message.payload.song],
          }));
          break;

        case "PICK_SONG":
          setState((prev) => ({
            ...prev,
            pickedSongs: [...prev.pickedSongs, message.payload.song],
          }));
          break;

        case "SHOW_FINAL_RESULTS":
          setState((prev) => ({ ...prev, phase: "final" }));
          break;

        case "GO_TO_MATCH":
          setState((prev) => ({
            ...prev,
            phase: "match",
            matchSongs: message.payload.songs,
            currentMatchIndex: 0,
          }));
          break;

        case "MATCH_NEXT":
          setState((prev) => ({
            ...prev,
            currentMatchIndex: Math.min(
              prev.currentMatchIndex + 1,
              prev.matchSongs.length - 1
            ),
          }));
          break;

        case "MATCH_PREV":
          setState((prev) => ({
            ...prev,
            currentMatchIndex: Math.max(prev.currentMatchIndex - 1, 0),
          }));
          break;

        case "RESET":
          setState({
            ...DEFAULT_GAME_STATE,
            selectedPool: state.selectedPool,
            randomCount: state.randomCount,
            pickCount: state.pickCount,
            banCount: state.banCount,
            lockedTracks: state.lockedTracks,
            hiddenTracks: state.hiddenTracks,
          });
          setIsAnimating(false);
          setAnimationSlots([]);
          break;
      }
    });

    return unsubscribe;
  }, []);

  return {
    state,
    isAnimating,
    animationSlots,
  };
}

// Hook for Controller page - FULL CONTROL
export function useGameController() {
  const [state, setState] = useState<GameState>(DEFAULT_GAME_STATE);
  const [songData, setSongData] = useState<Song[]>([]);
  const [isLoadingPool, setIsLoadingPool] = useState(true);
  const animationFrameRef = useRef<number>();
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

  // Sync full state to display pages
  const syncState = useCallback(() => {
    sendMessage("FULL_STATE_SYNC", state);
  }, [state]);

  // Update settings
  const updateSettings = useCallback((updates: Partial<GameState>) => {
    setState((prev) => {
      const newState = { ...prev, ...updates };
      sendMessage("SETTINGS_UPDATE", updates);
      return newState;
    });
  }, []);

  // Get random unique songs
  const getRandomSongs = useCallback((pool: Song[], count: number): Song[] => {
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }, []);

  // Start random with animation
  const triggerRandom = useCallback(() => {
    const excludeIds = [
      ...state.fixedSongs.map((s: Song) => s.id),
      state.lockedTracks.track3?.id,
      state.lockedTracks.track4?.id,
    ].filter(Boolean);

    const availablePool = songData.filter((s) => !excludeIds.includes(s.id));

    if (availablePool.length < state.randomCount) {
      alert("Not enough songs in pool!");
      return;
    }

    // Pre-calculate final results
    const finalResults = getRandomSongs(availablePool, state.randomCount);
    const animationPool = getRandomSongs(
      availablePool,
      Math.min(60, availablePool.length)
    );

    // Update local state
    setState((prev) => ({
      ...prev,
      phase: "random",
      randomResults: [],
      bannedSongs: [],
      pickedSongs: [],
      animationPool,
    }));

    // Notify display pages to start animation
    sendMessage("RANDOM_START", { animationPool });

    // Run animation
    animationStartRef.current = Date.now();

    const animate = () => {
      const elapsed = Date.now() - animationStartRef.current;
      const duration = 3000;

      if (elapsed < duration) {
        const slots = getRandomSongs(animationPool, state.randomCount);
        sendMessage("RANDOM_ANIMATION", { slots });
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        // Animation complete
        setState((prev) => ({ ...prev, randomResults: finalResults }));
        sendMessage("RANDOM_COMPLETE", { results: finalResults });
      }
    };

    animate();
  }, [songData, state, getRandomSongs]);

  // Go to ban/pick phase
  const goToBanPick = useCallback(() => {
    setState((prev) => ({ ...prev, phase: "banpick" }));
    sendMessage("SHOW_BAN_PICK", {});
  }, []);

  // Ban a song
  const banSong = useCallback(
    (song: Song) => {
      if (state.bannedSongs.length >= state.banCount) return;

      setState((prev) => ({
        ...prev,
        bannedSongs: [...prev.bannedSongs, song],
      }));
      sendMessage("BAN_SONG", { song });
    },
    [state.bannedSongs.length, state.banCount]
  );

  // Pick a song
  const pickSong = useCallback(
    (song: Song) => {
      if (state.bannedSongs.length < state.banCount) return;
      if (state.pickedSongs.length >= state.pickCount) return;

      const newPicked = [...state.pickedSongs, song];
      setState((prev) => ({
        ...prev,
        pickedSongs: newPicked,
      }));
      sendMessage("PICK_SONG", { song });

      // Check if complete
      if (newPicked.length >= state.pickCount) {
        setTimeout(() => {
          setState((prev) => ({ ...prev, phase: "final" }));
          sendMessage("SHOW_FINAL_RESULTS", {});
        }, 500);
      }
    },
    [state]
  );

  // Go to match display
  const goToMatch = useCallback(() => {
    const matchSongs = [
      ...state.pickedSongs,
      ...(state.lockedTracks.track3 ? [state.lockedTracks.track3] : []),
      ...(state.lockedTracks.track4 ? [state.lockedTracks.track4] : []),
    ];

    setState((prev) => ({
      ...prev,
      phase: "match",
      matchSongs,
      currentMatchIndex: 0,
    }));
    sendMessage("GO_TO_MATCH", { songs: matchSongs });
  }, [state.pickedSongs, state.lockedTracks]);

  // Match navigation
  const matchNext = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentMatchIndex: Math.min(
        prev.currentMatchIndex + 1,
        prev.matchSongs.length - 1
      ),
    }));
    sendMessage("MATCH_NEXT", {});
  }, []);

  const matchPrev = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentMatchIndex: Math.max(prev.currentMatchIndex - 1, 0),
    }));
    sendMessage("MATCH_PREV", {});
  }, []);

  // Reset game
  const resetGame = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    setState((prev) => ({
      ...prev,
      phase: "idle",
      randomResults: [],
      bannedSongs: [],
      pickedSongs: [],
      animationPool: [],
      matchSongs: [],
      currentMatchIndex: 0,
    }));
    sendMessage("RESET", {});
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return {
    state,
    songData,
    isLoadingPool,
    updateSettings,
    triggerRandom,
    goToBanPick,
    banSong,
    pickSong,
    goToMatch,
    matchNext,
    matchPrev,
    resetGame,
    syncState,
  };
}
