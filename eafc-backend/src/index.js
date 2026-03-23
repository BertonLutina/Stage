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
        data.content || '',
        data.message_type || 'text',
        data.media_url || null,
        data.media_metadata || null
      );
      const payload = { id: saved.id, ...data, message_type: saved.message_type, media_url: saved.media_url, media_metadata: saved.media_metadata, created_at: saved.created_at };
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
        data.content || '',
        data.message_type || 'text',
        data.media_url || null,
        data.media_metadata || null
      );
      const payload = { id: saved.id, ...data, message_type: saved.message_type, media_url: saved.media_url, media_metadata: saved.media_metadata, created_at: saved.created_at };
      teamChatNamespace.to(`team_${data.teamId}`).emit('new_message', payload);
    } catch (err) {
      socket.emit('chat_error', { message: 'Failed to send message' });
    }
  });

  socket.on('poll_vote', async (data) => {
    try {
      const { messageId, teamId, optionIndex, user_id } = data;
      const isMember = await teamModel.isTeamMember(teamId, user_id);
      if (!isMember) {
        socket.emit('chat_error', { message: 'You must be a team member to vote' });
        return;
      }
      const { pool } = require('./config/db');
      const [rows] = await pool.query(
        'SELECT id, team_id, user_id, gamer_tag, content, message_type, media_url, media_metadata, created_at FROM team_chat_messages WHERE id = ? AND team_id = ?',
        [messageId, teamId]
      );
      const msg = rows[0];
      if (!msg || (msg.message_type || 'text') !== 'poll') return;
      const meta = typeof msg.media_metadata === 'string' ? JSON.parse(msg.media_metadata || '{}') : (msg.media_metadata || {});
      const options = meta.options || [];
      const opt = options[optionIndex];
      if (!opt) return;
      const voters = opt.voters || [];
      const idx = voters.indexOf(user_id);
      const multiple = !!meta.multiple;
      if (idx >= 0) {
        voters.splice(idx, 1);
        opt.votes = Math.max(0, (opt.votes || 0) - 1);
      } else {
        if (!multiple) {
          options.forEach((o, i) => {
            if (i !== optionIndex && o.voters) {
              const i2 = o.voters.indexOf(user_id);
              if (i2 >= 0) {
                o.voters.splice(i2, 1);
                o.votes = Math.max(0, (o.votes || 0) - 1);
              }
            }
          });
        }
        opt.voters = [...(opt.voters || []), user_id];
        opt.votes = (opt.votes || 0) + 1;
      }
      meta.options = options;
      const updated = await teamModel.updateTeamChatMessageMediaMetadata(messageId, meta);
      const payload = { id: updated.id, team_id: updated.team_id, user_id: updated.user_id, gamer_tag: updated.gamer_tag, content: updated.content, message_type: updated.message_type, media_url: updated.media_url, media_metadata: meta, created_at: updated.created_at };
      teamChatNamespace.to(`team_${teamId}`).emit('poll_updated', payload);
    } catch (err) {
      socket.emit('chat_error', { message: 'Failed to vote' });
    }
  });
});

app.set('io', io);

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0'; // 0.0.0.0 = accept connections from any interface (required for device/emulator)

testConnection().then(() => {
  server.listen(PORT, HOST, () => {
    console.log(`[Server] Stage Backend running on http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}`);
    if (HOST === '0.0.0.0') {
      try {
        const os = require('os');
        const nets = os.networkInterfaces();
        let printed = false;
        for (const name of Object.keys(nets)) {
          if (printed) break;
          for (const net of nets[name]) {
            if (net.family === 'IPv4' && !net.internal) {
              console.log(`[Server] Physical device on same WiFi → use in .env: EXPO_PUBLIC_API_URL=http://${net.address}:${PORT}`);
              printed = true;
              break;
            }
          }
        }
      } catch (_) {}
    }
  });
});
