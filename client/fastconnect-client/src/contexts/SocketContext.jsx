import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';

const SocketContext = createContext();

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    // Initialize socket connection
    const newSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
      query: { userId: user._id },
      withCredentials: true,
    });

    setSocket(newSocket);

    // Set up event listeners
    newSocket.on('user_online', ({ userId }) => {
      setOnlineUsers(prev => {
        if (!prev.includes(userId)) {
          return [...prev, userId];
        }
        return prev;
      });
    });

    newSocket.on('user_offline', ({ userId }) => {
      setOnlineUsers(prev => prev.filter(id => id !== userId));
    });

    // Clean up on unmount
    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, [user]);

  const value = {
    socket,
    onlineUsers,
    isOnline: (userId) => onlineUsers.includes(userId),
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketContext;
