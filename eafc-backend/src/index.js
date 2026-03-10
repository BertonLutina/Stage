require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const { testConnection } = require('./config/db');
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

app.set('io', io);

const PORT = process.env.PORT || 3000;

testConnection().then(() => {
  server.listen(PORT, () => {
    console.log(`[Server] Stage Backend running on port ${PORT}`);
  });
});
