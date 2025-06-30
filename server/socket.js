const User = require('./models/User');

const setupSocket = (io) => {
  // Add middleware to handle authentication and attach user data
  io.use(async (socket, next) => {
    const userId = socket.handshake.query.userId;
    if (!userId) {
      return next(new Error('Authentication error'));
    }
    try {
      const user = await User.findById(userId);
      if (!user) {
        return next(new Error('User not found'));
      }
      socket.user = user;
      next();
    } catch (error) {
      next(error);
    }
  });

  io.on('connection', async (socket) => {
    console.log('New client connected:', socket.id);
    
    try {
      // Update user's online status
      await User.findByIdAndUpdate(socket.user._id, { 
        isOnline: true,
        socketId: socket.id
      });
      
      // Join a room for this user
      socket.join(`user_${socket.user._id}`);
      
      // Notify others that this user is now online
      socket.broadcast.emit('user_online', { userId: socket.user._id });
      
      // Update online users count
      const onlineUsers = await User.countDocuments({ isOnline: true });
      io.emit('online_users', onlineUsers);
      
    } catch (error) {
      console.error('Error handling socket connection:', error);
    }

    // Handle disconnection
    socket.on('disconnect', async () => {
      console.log('Client disconnected:', socket.id);
      
      try {
        // Update user's online status
        await User.findByIdAndUpdate(socket.user._id, { 
          isOnline: false,
          $unset: { socketId: 1 }
        });
        
        // Notify others that this user is now offline
        socket.broadcast.emit('user_offline', { userId: socket.user._id });
        
        // Update online users count
        const onlineUsers = await User.countDocuments({ isOnline: true });
        io.emit('online_users', onlineUsers);
        
      } catch (error) {
        console.error('Error handling socket disconnection:', error);
      }
    });

    // Handle typing events
    socket.on('typing', () => {
      socket.broadcast.emit('user_typing', { userId: socket.user._id });
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  });
};

module.exports = setupSocket;
