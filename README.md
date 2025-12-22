# Van Hanh Maimai Championship - Tournament Controller

A real-time tournament controller application for **Van Hanh Maimai Championship**. This system provides a comprehensive solution for managing song randomization, ban/pick phases, and live stream overlays for maimai tournament events.

## Overview

This application consists of multiple synchronized pages designed for tournament broadcasting:

- **Controller Page** (`/controller`) - Main control panel for tournament operators
- **Random Display** (`/`) - Song randomization display with animated reveal
- **Match Display** (`/match-display`) - Current match song display for streams
- **Text Display** (`/text-display`) - Player names and round information overlay

## Features

- Real-time song randomization with animated overlay reveal
- Ban/Pick phase management with keyboard navigation
- Multiple song pool support for different tournament rounds
- Live synchronization between controller and display pages via WebSocket
- Customizable player names and round labels
- Stream-ready transparent overlays for OBS integration

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm, yarn, pnpm, or bun

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

4. Open [http://localhost:3000/controller](http://localhost:3000/controller) to access the control panel

### Available Pages

| Page | URL | Description |
|------|-----|-------------|
| Controller | `/controller` | Main control panel |
| Random Display | `/` | Song randomization overlay |
| Match Display | `/match-display` | Current match display |
| Text Display | `/text-display` | Player/round text overlay |

## Usage

1. Open the Controller page to manage the tournament
2. Select the appropriate song pool for the current round
3. Configure random count, pick count, and ban count
4. Press **Start** to randomize songs (overlay will cover results)
5. Press **Show song** to reveal results with diagonal wipe animation
6. Use Ban/Pick controls to manage song selection
7. Navigate to Match Display for the final song lineup

## Technology Stack

- Next.js 14 (React Framework)
- TypeScript
- Socket.IO (Real-time Communication)
- Tailwind CSS

## Links

### Official Pages

- Facebook Page: https://www.facebook.com/profile.php?id=61579710413403
- Stream: https://www.youtube.com/live/Qd18K1g0GOg?si=M-Ci3IHr17kfWfjk

### Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Socket.IO Documentation](https://socket.io/docs/v4/)

## Credits

This project is developed by **Soralia Studio**.

### Development Team

| Role | Name |
|------|------|
| Lead Developer | Hidr0 |
| Contributor | Shard |
| Contributor | Necros1s |

## License

This project is developed for Van Hanh Maimai Championship tournament events.

---

**Van Hanh Maimai Championship** - Tournament Controller System
