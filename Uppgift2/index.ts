// index.ts
// =====================================================
//  Uppgift 2–6 + lite extra struktur (frivilligt)
//  - Hello (/)
//  - Health (/health)
//  - v1/users (enkel in-memory CRUD light)
//  - Dynamisk param (/:id) – ligger sist pga routing-ordning
//  - 404 + felhantering
// =====================================================

import express, { Request, Response, NextFunction } from 'express';
import { getDb, closeClient } from './database';

const app = express();
const PORT = process.env.PORT || 3000;

// ----------------------------------------------------
// Grund-middleware
// ----------------------------------------------------
app.use(express.json()); // för JSON-body

// enkel logger
app.use((req, _res, next) => {
  console.log(`${new Date().toISOString()}  ${req.method} ${req.originalUrl}`);
  next();
});

// ----------------------------------------------------
// Uppgift 2: Hello World
// ----------------------------------------------------
app.get('/', (_req, res) => {
  res.send('Hello World från Express + TypeScript!');
});

// ----------------------------------------------------
// Uppgift 2/3: Health (ping MongoDB)
// ----------------------------------------------------
app.get('/health', async (_req, res) => {
  try {
    const db = await getDb();
    await db.command({ ping: 1 });
    res.json({ ok: true, db: 'up' });
  } catch (err) {
    res.status(500).json({ ok: false, error: (err as Error).message });
  }
});

// ----------------------------------------------------
// Uppgift 6: Versionshantering (v1) + 201 Created
//  + lite extra endpoints runt User (frivilligt)
// ----------------------------------------------------
interface User {
  id: number;
  name: string;
  email?: string;
}

// En enkel in-memory “databas”
const users: User[] = [];

/**
 * POST /v1/users
 * Skapar en User och returnerar 201 + { ok, user }
 * (Själva uppgift 6-kravet)
 */
app.post('/v1/users', (req: Request, res: Response) => {
  // Minimal validering (frivillig del)
  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
  const email =
    typeof req.body?.email === 'string' ? req.body.email.trim() : undefined;

  const user: User = {
    id: Date.now(),
    name: name || 'Test User',
    email: email || 'test@example.com',
  };

  users.push(user);
  // Viktigt: sätt status först, sedan json()
  res.status(201).json({ ok: true, user });
});

/**
 * GET /v1/users
 * Lista alla (frivillig)
 */
app.get('/v1/users', (_req, res) => {
  res.json({ ok: true, count: users.length, users });
});

/**
 * GET /v1/users/:id
 * Hämta en (frivillig)
 */
app.get('/v1/users/:id', (req, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) return res.status(400).send('Not a number');

  const user = users.find(u => u.id === id);
  if (!user) return res.status(404).json({ ok: false, error: 'Not found' });

  res.json({ ok: true, user });
});

/**
 * DELETE /v1/users/:id
 * Ta bort en (frivillig)
 */
app.delete('/v1/users/:id', (req, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) return res.status(400).send('Not a number');

  const idx = users.findIndex(u => u.id === id);
  if (idx === -1) return res.status(404).json({ ok: false, error: 'Not found' });

  const [removed] = users.splice(idx, 1);
  res.json({ ok: true, removed });
});

// ----------------------------------------------------
// Uppgift 4–5: Dynamisk parameter – läggs SIST
//  (så att den inte tar över /v1/* routes)
// ----------------------------------------------------
app.get('/:id', (req: Request, res: Response) => {
  const id = Number(req.params.id);

  if (Number.isNaN(id)) {
    return res.status(400).send('Not a number'); // status före send()
  }

  res.send({ id });
});

// ----------------------------------------------------
// 404 & Error-handlers
// ----------------------------------------------------
app.use((_req, res) => {
  res.status(404).json({ ok: false, error: 'Route not found' });
});

app.use(
  (err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    console.error('❌ Internal error:', err);
    res.status(500).json({ ok: false, error: 'Internal Server Error' });
  }
);

// ----------------------------------------------------
// Starta endast om DB svarar (Uppgift 3-tänket)
// ----------------------------------------------------
async function start() {
  try {
    const db = await getDb();
    await db.command({ ping: 1 });
    console.log('✅ DB up');

    app.listen(PORT, () => {
      console.log(`✅ Listening on port ${PORT}`);
      console.log(`➡️  Start the app: http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('❌ DB error:', (err as Error).message);
    process.exit(1);
  }
}

// Snygg stängning
process.on('SIGINT', async () => {
  await closeClient();
  process.exit(0);
});

start();
