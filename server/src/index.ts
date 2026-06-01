import 'dotenv/config';
import express from 'express';
import session from 'express-session';
import passport from 'passport';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));

app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  },
}));

app.use(passport.initialize());
app.use(passport.session());

import './config/passport';
import authRoutes from './routes/auth';
import adminRoutes from './routes/admin';
import usersRoutes from './routes/users';
import homeworkRoutes from './routes/homework';
import chatRoutes from './routes/chat';
import portalRoutes from './routes/portal';
import settingsRoutes from './routes/settings';
import wordRoutes from './routes/word';

app.use('/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/homework', homeworkRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/portal', portalRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/word', wordRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Shepherd server running on port ${PORT}`);
});

export default app;
