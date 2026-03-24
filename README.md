# Real-Time Collaborative Document Editor

A full-stack internship project for real-time collaborative editing with live sync and MongoDB persistence.

## Tech Stack

- Frontend: React (Vite), Tailwind CSS, react-quill, socket.io-client
- Backend: Node.js, Express.js, Socket.io
- Database: MongoDB with Mongoose

## Features

- Real-time text sync between users in the same document room
- Shareable document URL: `/documents/:id`
- Auto-save to MongoDB every ~2 seconds while editing
- Save indicator states: `Saving...`, `All changes saved`, and save error state

## Project Structure

- `client/` - React frontend
- `server/` - Express + Socket.io backend

## Setup

### 1) Start backend

```bash
cd server
npm install
cp .env.example .env
npm run dev
```

### 2) Start frontend

```bash
cd client
npm install
npm run dev
```

Open `http://localhost:5173`.

## Environment

Set `server/.env`:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/realtime-doc-editor
PORT=4000
CLIENT_ORIGIN=http://localhost:5173
```

Optional `client/.env`:

```env
VITE_SERVER_URL=http://localhost:4000
```

## Notes

- Do not commit `.env` files.
- Commit `.env.example` only.
