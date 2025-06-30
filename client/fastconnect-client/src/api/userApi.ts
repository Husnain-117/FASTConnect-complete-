import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const getOnlineUsers = async () => {
  try {
    const response = await axios.get(`${API_URL}/profile/online`);
    return response.data;
  } catch (error) {
    console.error('Error fetching online users:', error);
    throw error;
  }
};