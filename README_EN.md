# WhoisSpy - Who Is the Spy (WeChat Mini Program)

A real-time multiplayer party game "Who Is the Spy" built as a WeChat Mini Program.

## Features

- **Create Room** — Customize player count (3–12), spy count (1–3), game rounds, speaking/voting timers, and more
- **Join Room** — Join instantly with a 6-digit room code; optional custom nickname
- **Real-time Gameplay** — WebSocket-driven multiplayer interaction with automatic reconnection
- **Game Flow** — Deal → Seated speaking turns → Anonymous voting → Elimination → Win/loss detection
- **Word Bank Management** — 100+ built-in word pairs; create, edit, delete custom word banks; bulk import via script
- **Advanced Options** — Spectator mode, nickname display, skip voting, and other configurable toggles

## Tech Stack

### Client (WeChat Mini Program)

| Technology | Description |
|------------|-------------|
| JavaScript (ES6) | Native WeChat Mini Program framework, no third-party UI libraries |
| WXML / WXSS | Templates & styles with CSS custom properties for design tokens |
| WebSocket | `wx.connectSocket` native API for server communication |
| Local Storage | `wx.setStorageSync` / `wx.getStorageSync` for persistent config |

### Server (Node.js)

| Technology | Description |
|------------|-------------|
| Node.js | Pure built-in modules only — zero npm dependencies |
| HTTP + WebSocket | Hand-rolled WebSocket implementation (HTTP upgrade, frame encode/decode, masking, ping/pong) |
| In-Memory Storage | Room state stored in a `Map`; no database |

### Communication Protocol

```
Client → Server:  { type: "request", requestId, action, payload }
Server → Client:  { type: "response", requestId, ok, payload/error }
Server broadcast: { type: "event", event: "room_state", payload }
```

## Quick Start

### Start the Backend Server

```bash
# Option 1: Use the batch script (Windows)
start-server.bat

# Option 2: Run directly
node server/server.js
```

The server listens on `ws://0.0.0.0:3001` by default. Override with the `PORT` environment variable.

### Run the Mini Program Client

1. Download and install [WeChat DevTools](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
2. Import this project directory
3. Preview in the simulator — the client connects to `ws://127.0.0.1:3001` by default
4. Server address can be changed on the home page via the Settings panel

## Project Structure

```
├── app.js / app.json / app.wxss    # Mini program entry & global config
├── pages/
│   ├── index/        # Home (menu, rules, server settings)
│   ├── create/       # Create room (room parameter config)
│   ├── join/         # Join room (enter room code)
│   ├── room/         # Game room (lobby / speaking / voting / result in one page)
│   └── wordbank/     # Word bank management (CRUD for word pairs)
├── components/       # 9 reusable UI components
├── utils/
│   ├── storage.js    # Local storage wrapper
│   ├── socket.js     # WebSocket client (request/response + event subscription)
│   └── game.js       # Client-side game logic
├── server/
│   └── server.js     # Node.js WebSocket server
└── images/           # Static assets
```

## Game Flow

1. Host **creates a room** and receives a 6-digit room code
2. Other players **join** using the room code
3. Host **starts the game** — roles (civilian/spy) are assigned and words are distributed
4. Players **take turns speaking** in seat order, describing their word
5. After all players have spoken, **anonymous voting** begins
6. The player with the most votes is eliminated; ties are broken randomly
7. Spy eliminated → **civilians win**; only 2 players remain with spy alive → **spy wins**
8. Game ends — **both words and all roles are revealed**

## Word Banks

The system ships with **100 built-in word pairs** covering everyday categories (food, transportation, school, household items, etc.). Players can also create custom word banks in the Word Bank Management page, each containing multiple "civilian word / spy word" pairs. Bulk import is supported via a simple text format (one pair per line, comma-separated).

## License

This project is for educational and personal use only.
