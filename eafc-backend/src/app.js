const express = require('express');
const cors = require('cors');
const path = require('path');
const errorMiddleware = require('./middleware/errorMiddleware');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const teamRoutes = require('./routes/teams');
const tournamentRoutes = require('./routes/tournaments');
const matchRoutes = require('./routes/matches');
const socialRoutes = require('./routes/social');
const uploadRoutes = require('./routes/uploads');

function createApp(passportInstance) {
  const app = express();
  app.use(cors({ origin: '*', credentials: false })); // Allow all origins (ngrok, physical device, etc.)
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(passportInstance.initialize());
  app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));
  app.use('/auth', authRoutes);
  app.use('/users', userRoutes);
  app.use('/teams', teamRoutes);
  app.use('/tournaments', tournamentRoutes);
  app.use('/matches', matchRoutes);
  app.use('/social', socialRoutes);
  app.use('/uploads', uploadRoutes);
  app.get('/health', (req, res) => res.json({ status: 'ok' }));
  app.use(errorMiddleware);
  return app;
}

module.exports = createApp;
