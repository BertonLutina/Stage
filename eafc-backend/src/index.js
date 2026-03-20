require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const { testConnection } = require('./config/db');
const matchModel = require('./models/matchModel');
const teamModel = require('./models/teamModel');
const configurePassport = require('./config/passport');
const createApp = require('./app');

const passport = configurePassport();

const app = createApp(passport);
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

const dmNamespace = io.of('/dm');
dmNamespace.on('connection', (socket) => {
  socket.on('join_room', (roomId) => socket.join(roomId));
  socket.on('send_message', (data) => {
    const roomId = [data.sender_id, data.receiver_id].sort().join('_');
    dmNamespace.to(roomId).emit('new_message', data);
  });
});

const notifNamespace = io.of('/notifications');
notifNamespace.on('connection', (socket) => {
  socket.on('subscribe', (userId) => socket.join(`user_${userId}`));
});

// Match live chat: room = match_${matchId}, all viewers can send/receive
const matchChatNamespace = io.of('/match-chat');
matchChatNamespace.on('connection', (socket) => {
  socket.on('join_match', (matchId) => socket.join(`match_${matchId}`));
  socket.on('leave_match', (matchId) => socket.leave(`match_${matchId}`));
  socket.on('send_comment', async (data) => {
    try {
      const saved = await matchModel.insertMatchChat(
        data.matchId,
        data.user_id,
        data.gamer_tag || 'Anonymous',
        data.content
      );
      const payload = { id: saved.id, ...data, created_at: saved.created_at };
      matchChatNamespace.to(`match_${data.matchId}`).emit('new_comment', payload);
    } catch (err) {
      socket.emit('chat_error', { message: 'Failed to save comment' });
    }
  });
});

// Team group chat: room = team_${teamId}, only members can send/receive
const teamChatNamespace = io.of('/team-chat');
teamChatNamespace.on('connection', (socket) => {
  socket.on('join_team', (teamId) => socket.join(`team_${teamId}`));
  socket.on('leave_team', (teamId) => socket.leave(`team_${teamId}`));
  socket.on('send_message', async (data) => {
    try {
      const isMember = await teamModel.isTeamMember(data.teamId, data.user_id);
      if (!isMember) {
        socket.emit('chat_error', { message: 'You must be a team member to send messages' });
        return;
      }
      const saved = await teamModel.insertTeamChat(
        data.teamId,
        data.user_id,
        data.gamer_tag || 'Anonymous',
        data.content
      );
      const payload = { id: saved.id, ...data, created_at: saved.created_at };
      teamChatNamespace.to(`team_${data.teamId}`).emit('new_message', payload);
    } catch (err) {
      socket.emit('chat_error', { message: 'Failed to send message' });
    }
  });
});

app.set('io', io);

const PORT = process.env.PORT || 3000;

testConnection().then(() => {
  server.listen(PORT, () => {
    console.log(`[Server] Stage Backend running on port ${PORT}`);
  });
});
