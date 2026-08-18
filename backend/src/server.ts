import 'express-async-errors';
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import path from 'path';
import http from 'http';
import { initSocketGateway } from './infrastructure/websocket/SocketGateway';
import apiRouter from './presentation/routes/index';
import { errorMiddleware } from './presentation/middlewares/errorMiddleware';

const app = express();

// ── CORS ──────────────────────────────────────────────────────────
app.use(
  cors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);

// ── Parsers ───────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Archivos estáticos (imágenes subidas) ─────────────────────────
const uploadDir = path.resolve(process.env.UPLOAD_DIR ?? 'uploads');
app.use('/uploads', express.static(uploadDir));

// ── API Routes ────────────────────────────────────────────────────
app.use('/api/v1', apiRouter);

// ── Health check ──────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

// ── Error handler (debe ir al final) ─────────────────────────────
app.use(errorMiddleware);

// ── Servidor HTTP + Socket.IO ─────────────────────────────────────
const PORT = parseInt(process.env.PORT ?? '3001', 10);
const httpServer = http.createServer(app);

initSocketGateway(httpServer);

httpServer.listen(PORT, () => {
  console.log(`✅ Backend escuchando en http://localhost:${PORT}`);
  console.log(`🔌 WebSocket listo en ws://localhost:${PORT}`);
});

export default app;
