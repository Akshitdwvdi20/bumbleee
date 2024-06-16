const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3003;

// Map to store room details
const rooms = new Map();

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  socket.on('joinRoom', (roomID, name) => {
    socket.join(roomID);
    socket.roomID = roomID;
    socket.name = name;
    
    // Initialize room if it doesn't exist
    if (!rooms.has(roomID)) {
      rooms.set(roomID, { users: new Map() });
    }
    
    rooms.get(roomID).users.set(socket.id, name);

    // Send message to all clients in the room
    io.to(roomID).emit('message', `${name} has joined the room.`);
  });

  socket.on('screenShare', (roomID, stream) => {
    socket.to(roomID).broadcast.emit('screenShare', socket.id, stream);
  });

  socket.on('stopScreenShare', (roomID) => {
    socket.to(roomID).broadcast.emit('stopScreenShare', socket.id);
  });

  socket.on('message', (roomID, message) => {
    io.to(roomID).emit('message', message);
  });

  socket.on('leaveRoom', (roomID, name) => {
    socket.leave(roomID);
    rooms.get(roomID).users.delete(socket.id);

    // Send message to all clients in the room
    io.to(roomID).emit('message', `${name} has left the room.`);
  });

  socket.on('disconnect', () => {
    const roomID = socket.roomID;
    if (roomID && rooms.has(roomID)) {
      const userName = rooms.get(roomID).users.get(socket.id);
      rooms.get(roomID).users.delete(socket.id);
      io.to(roomID).emit('message', `${userName} has left the room.`);
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});