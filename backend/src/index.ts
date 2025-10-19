/**
 * Energy Planet Backend - Main Entry Point (Simplified)
 */

import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';

const app: Application = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req, _res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Auth routes
app.post('/api/v1/auth/telegram', (req, res) => {
  const { initData } = req.body;
  console.log('Auth request:', { initData: initData?.substring(0, 50) });

  res.json({
    access_token: 'demo_token_' + Date.now(),
    refresh_token: 'demo_refresh_' + Date.now(),
    user_id: 'user_' + Math.random().toString(36).substr(2, 9),
    telegram_id: 12345,
    username: 'demo_user',
    is_new_user: true,
  });
});

// Session
app.post('/api/v1/session', (_req, res) => {
  res.json({
    user: {
      id: 'user_123',
      telegram_id: 12345,
      username: 'demo_user',
      created_at: new Date().toISOString(),
    },
    progress: {
      user_id: 'user_123',
      level: 1,
      xp: 0,
      xp_to_next_level: 100,
      energy: 1000,
      total_energy_produced: 1000,
      tap_level: 1,
      tap_income: 1,
      passive_income_per_sec: 10,
      last_login: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    buildings: [],
    cosmetics: [],
    active_boosts: [],
    offline_gains: {
      energy: 0,
      duration_sec: 0,
      capped: false,
    },
    server_time: new Date().toISOString(),
  });
});

// Tap
app.post('/api/v1/tap', (req, res) => {
  const { tap_count = 1 } = req.body;
  const energyGained = tap_count * 1;

  res.json({
    energy: 1000 + energyGained,
    energy_gained: energyGained,
    xp_gained: Math.floor(energyGained / 10),
    level: 1,
    level_up: false,
  });
});

// Tick
app.post('/api/v1/tick', (req, res) => {
  const { time_delta = 1 } = req.body;
  const energyGained = time_delta * 10;

  res.json({
    energy: 1000 + energyGained,
    energy_gained: energyGained,
    passive_income_per_sec: 10,
  });
});

// Upgrade
app.post('/api/v1/upgrade', (_req, res) => {
  res.json({
    success: true,
    energy: 500,
    upgrade: {
      type: 'tap',
      item_id: 'tap',
      new_level: 2,
    },
    xp_gained: 50,
    level: 1,
    level_up: false,
  });
});

// Leaderboard
app.get('/api/v1/leaderboard', (_req, res) => {
  res.json({
    leaderboard: [
      {
        rank: 1,
        user_id: 'user_1',
        username: 'TopPlayer',
        level: 50,
        total_energy_produced: 10000000,
        avatar_frame: 'golden_frame_001',
      },
      {
        rank: 2,
        user_id: 'user_2',
        username: 'SecondPlace',
        level: 45,
        total_energy_produced: 5000000,
        avatar_frame: null,
      },
    ],
    user_rank: 999,
    user_entry: {
      rank: 999,
      user_id: 'user_123',
      username: 'demo_user',
      level: 1,
      total_energy_produced: 1000,
      avatar_frame: null,
    },
    total_players: 1000,
  });
});

// Profile
app.get('/api/v1/profile/:userId', (req, res) => {
  res.json({
    user_id: req.params.userId,
    username: 'SomePlayer',
    level: 25,
    total_energy_produced: 1000000,
    leaderboard_rank: 42,
    buildings_count: 50,
    passive_income_per_sec: 500,
    equipped_cosmetics: [],
    created_at: new Date().toISOString(),
  });
});

// Cosmetics
app.get('/api/v1/cosmetics', (_req, res) => {
  res.json({
    cosmetics: [
      {
        id: 'default_frame',
        name: 'Default Frame',
        description: 'Basic avatar frame',
        category: 'avatar_frame',
        rarity: 'common',
        unlock_type: 'free',
        owned: true,
        equipped: true,
      },
    ],
  });
});

// Purchase
app.post('/api/v1/purchase', (_req, res) => {
  res.json({
    success: true,
    already_processed: false,
    purchase: {
      purchase_id: 'purchase_123',
      item_id: 'energy_pack_medium',
      granted_at: new Date().toISOString(),
    },
    updated_state: {
      energy: 51000,
    },
  });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    error: 'not_found',
    message: 'Resource not found',
  });
});

// Error handler
app.use((err: any, _req: any, res: any, _next: any) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'internal_server_error',
    message: err.message,
  });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`✅ Energy Planet Backend started!`);
  console.log(`📡 Server: http://localhost:${PORT}`);
  console.log(`🏥 Health: http://localhost:${PORT}/health`);
  console.log(`🎮 API: http://localhost:${PORT}/api/v1`);
  console.log(``);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

export default app;
