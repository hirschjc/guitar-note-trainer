# Guitar Note Trainer

A mobile-first PWA that helps intermediate guitar players develop music theory fluency through interactive note identification exercises.

## Stack

- **Client**: Vite + React + TypeScript, Tailwind CSS v3, Framer Motion, VexFlow, Tone.js
- **Server**: Node.js + Express + TypeScript, Prisma ORM (SQLite dev / Postgres prod)
- **Testing**: Vitest + React Testing Library (client), Jest + Supertest (server), fast-check (both)
- **Monorepo**: npm workspaces

## Setup

### 1. Install dependencies (from repo root)

```bash
npm install
```

### 2. Configure server environment

```bash
cp server/.env.example server/.env
```

### 3. Initialize the database

```bash
cd server
npx prisma migrate dev --name init
cd ..
```

## Development

Run client and server in separate terminals:

```bash
# Terminal 1 — client (http://localhost:5173)
npm run dev:client

# Terminal 2 — server (http://localhost:3001)
npm run dev:server
```

The client proxies `/api/*` requests to the server automatically.

## Testing

```bash
# Run all tests
npm test

# Client tests only
npm run test:client

# Server tests only
npm run test:server
```

## Build

```bash
npm run build:client
npm run build:server
```

## Project Structure

```
guitar-note-trainer/
├── package.json          # Root monorepo (npm workspaces)
├── client/
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── tailwind.config.ts
│   ├── postcss.config.js
│   ├── index.html
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── index.css
│       └── test/
│           └── setup.ts
└── server/
    ├── package.json
    ├── tsconfig.json
    ├── jest.config.js
    ├── prisma/
    │   └── schema.prisma
    └── src/
        └── index.ts
```
