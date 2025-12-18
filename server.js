const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');
const fs = require('fs').promises;
const path = require('path');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Game state in memory (synced across all clients)
let gameState = {
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

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  // Initialize Socket.IO
  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  // Socket.IO connection handler
  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);

    // Send current game state to newly connected client
    socket.emit('FULL_STATE_SYNC', gameState);

    // Handle game events from controller
    socket.on('SETTINGS_UPDATE', (payload) => {
      gameState = { ...gameState, ...payload };
      io.emit('SETTINGS_UPDATE', payload);
      console.log('Settings updated:', payload);
    });

    socket.on('PREVIEW_START', (payload) => {
      gameState.phase = 'preview';
      gameState.previewSongs = payload.previewSongs || [];
      gameState.randomCount = payload.randomCount || gameState.randomCount;
      io.emit('PREVIEW_START', payload);
      console.log('Preview started with', gameState.previewSongs.length, 'songs');
    });

    socket.on('RANDOM_START', (payload) => {
      gameState.phase = 'random';
      gameState.randomCount = payload.randomCount || gameState.randomCount;
      gameState.animationPool = payload.animationPool || [];
      gameState.randomResults = [];
      io.emit('RANDOM_START', payload);
      console.log('Random started');
    });

    socket.on('RANDOM_ANIMATION', (payload) => {
      io.emit('RANDOM_ANIMATION', payload);
    });

    socket.on('RANDOM_COMPLETE', (payload) => {
      gameState.randomResults = payload.results;
      io.emit('RANDOM_COMPLETE', payload);
      console.log('Random completed with results');
    });

    socket.on('SHOW_BAN_PICK', () => {
      gameState.phase = 'banpick';
      io.emit('SHOW_BAN_PICK');
      console.log('Showing ban/pick phase');
    });

    socket.on('BAN_SONG', (payload) => {
      gameState.bannedSongs = [...gameState.bannedSongs, payload.song];
      io.emit('BAN_SONG', payload);
      console.log('Song banned:', payload.song);
    });

    socket.on('PICK_SONG', (payload) => {
      gameState.pickedSongs = [...gameState.pickedSongs, payload.song];
      io.emit('PICK_SONG', payload);
      console.log('Song picked:', payload.song);
    });

    socket.on('SHOW_FINAL_RESULTS', () => {
      gameState.phase = 'final';
      io.emit('SHOW_FINAL_RESULTS');
      console.log('Showing final results');
    });

    socket.on('GO_TO_MATCH', (payload) => {
      gameState.phase = 'match';
      gameState.matchSongs = payload.songs;
      gameState.currentMatchIndex = 0;
      io.emit('GO_TO_MATCH', payload);
      console.log('Going to match display');
    });

    socket.on('MATCH_NEXT', () => {
      gameState.currentMatchIndex = Math.min(
        gameState.currentMatchIndex + 1,
        gameState.matchSongs.length - 1
      );
      io.emit('MATCH_NEXT', { currentMatchIndex: gameState.currentMatchIndex });
      console.log('Match next:', gameState.currentMatchIndex);
    });

    socket.on('MATCH_PREV', () => {
      gameState.currentMatchIndex = Math.max(gameState.currentMatchIndex - 1, 0);
      io.emit('MATCH_PREV', { currentMatchIndex: gameState.currentMatchIndex });
      console.log('Match prev:', gameState.currentMatchIndex);
    });

    socket.on('RESET', () => {
      gameState = {
        ...gameState,
        phase: 'idle',
        randomResults: [],
        bannedSongs: [],
        pickedSongs: [],
        animationPool: [],
        matchSongs: [],
        currentMatchIndex: 0,
      };
      io.emit('RESET');
      console.log('Game reset');
    });

    // JSON file operations
    socket.on('SAVE_JSON_FILE', async ({ filename, data }) => {
      try {
        const filePath = path.join(process.cwd(), 'public', filename);
        await fs.writeFile(filePath, JSON.stringify(data, null, 2));
        io.emit('JSON_FILE_UPDATED', { filename });
        socket.emit('SAVE_JSON_SUCCESS', { filename });
        console.log(`JSON file saved: ${filename}`);
      } catch (error) {
        socket.emit('SAVE_JSON_ERROR', { filename, error: error.message });
        console.error(`Error saving JSON file ${filename}:`, error);
      }
    });

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });

  httpServer
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
      console.log('> Socket.IO server is running');
    });
});
