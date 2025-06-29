import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

interface ApiResponse {
  type?: string;
  message?: string;
  redirect?: boolean;
  data?: any;
}

interface AuthContextType {
  user: any | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, campus: string, batch: string) => Promise<void>;
  sendOTP: (email: string) => Promise<ApiResponse>;
  verifyAndRegister: (email: string, otp: string, password: string, name: string, campus: string, batch: string) => Promise<ApiResponse>;
  forgotPassword: (email: string) => Promise<ApiResponse>;
  resetPassword: (email: string, otp: string, newPassword: string) => Promise<ApiResponse>;
  logout: () => void;
  userId: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
      // Fetch user data
      axios.get('http://localhost:5000/api/auth/me', {
        headers: { Authorization: `Bearer ${storedToken}` }
      })
      .then(response => {
        setUser(response.data.user);
      })
      .catch(error => {
        console.error('Error fetching user data:', error);
        localStorage.removeItem('token');
        setToken(null);
      })
      .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    try {
      console.log('Attempting login for:', email);
      const response = await axios.post('http://localhost:5000/api/auth/login', { 
        email, 
        password 
      });
      
      const { token, user } = response.data;
      console.log('Login successful, user ID:', user._id);
      
      // Store auth data
      localStorage.setItem('token', token);
      localStorage.setItem('userId', user._id);
      setToken(token);
      setUser(user);
      
      // Update connection status
      try {
        console.log('Updating connection status to online...');
        const statusResponse = await axios.post(
          'http://localhost:5000/api/profile/connect', 
          {},
          { 
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            } 
          }
        );
        console.log('Connection status updated:', statusResponse.data);
      } catch (error) {
        console.error('Error updating connection status:', error);
        // Don't fail login if this fails
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const register = async (email: string, password: string, name: string, campus: string, batch: string) => {
    try {
      await axios.post('http://localhost:5000/api/auth/send-otp', { email });
      // After OTP is sent, user will need to verify and complete registration
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const sendOTP = async (email: string): Promise<ApiResponse> => {
    try {
      const response = await axios.post('http://localhost:5000/api/auth/send-otp', { email });
      return response.data;
    } catch (error) {
      console.error('Error sending OTP:', error);
      throw error;
    }
  };

  const verifyAndRegister = async (email: string, otp: string, password: string, name: string, campus: string, batch: string) => {
    try {
      const response = await axios.post('http://localhost:5000/api/auth/verify-and-register', {
        email,
        otp,
        password,
        name,
        campus,
        batch
      });
      if (response.data.redirect) {
        navigate('/login');
      }
      return response.data;
    } catch (error: any) {
      setError(error.response?.data?.message || 'An error occurred during registration');
      throw error;
    }
  };

  const forgotPassword = async (email: string) => {
    try {
      const response = await axios.post('http://localhost:5000/api/auth/forgot-password', {
        email
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'An error occurred while sending OTP');
    }
  };

  const resetPassword = async (email: string, otp: string, newPassword: string) => {
    try {
      const response = await axios.post('http://localhost:5000/api/auth/reset-password', {
        email,
        otp,
        newPassword
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'An error occurred while resetting password');
    }
  };

  const logout = async () => {
    const currentToken = token || localStorage.getItem('token');
    console.log('Starting logout process...');
    console.log('Current token exists:', !!currentToken);
    
    try {
      // First update connection status
      if (currentToken) {
        try {
          console.log('Updating connection status to offline...');
          await axios.post(
            'http://localhost:5000/api/profile/disconnect', 
            {},
            {
              headers: { 
                'Authorization': `Bearer ${currentToken}`,
                'Content-Type': 'application/json'
              }
            }
          );
          console.log('Successfully updated connection status to offline');
        } catch (error) {
          console.error('Error updating connection status:', error);
          // Continue with logout even if this fails
        }
      }
      
      // Then call backend logout
      if (currentToken) {
        try {
          console.log('Calling backend logout endpoint...');
          await axios.post(
            'http://localhost:5000/api/auth/logout', 
            {},
            {
              headers: { 
                'Authorization': `Bearer ${currentToken}`,
                'Content-Type': 'application/json'
              }
            }
          );
        } catch (error) {
          console.error('Error during backend logout:', error);
          // Continue with client-side cleanup even if backend logout fails
        }
      }
    } catch (error) {
      console.error('Unexpected error during logout:', error);
    } finally {
      // Always perform client-side cleanup
      console.log('Performing client-side cleanup...');
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      setToken(null);
      setUser(null);
      console.log('Logout process completed');
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      login,
      register,
      sendOTP,
      verifyAndRegister,
      forgotPassword,
      resetPassword,
      logout,
      userId: user?._id || localStorage.getItem('userId') || null
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
