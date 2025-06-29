const User = require('./models/User');

const setupSocket = (io) => {
  io.on('connection', async (socket) => {
    console.log('New client connected:', socket.id);
    
    // Extract user ID from handshake query
    const userId = socket.handshake.query.userId;
    
    if (userId) {
      try {
        // Update user's online status
        await User.findByIdAndUpdate(userId, { 
          isOnline: true,
          socketId: socket.id
        });
        
        // Join a room for this user
        socket.join(`user_${userId}`);
        
        // Notify others that this user is now online
        socket.broadcast.emit('user_online', { userId });
        
      } catch (error) {
        console.error('Error handling socket connection:', error);
      }
    }

    // Handle disconnection
    socket.on('disconnect', async () => {
      console.log('Client disconnected:', socket.id);
      
      if (userId) {
        try {
          // Update user's online status
          await User.findByIdAndUpdate(userId, { 
            isOnline: false,
            $unset: { socketId: 1 }
          });
          
          // Notify others that this user is now offline
          socket.broadcast.emit('user_offline', { userId });
          
        } catch (error) {
          console.error('Error handling socket disconnection:', error);
        }
      }
    });
  });
};

module.exports = setupSocket;
