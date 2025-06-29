import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User } from '../types/auth';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, role: string, profileData: any) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const token = localStorage.getItem('rsams_token');
    if (token) {
      // Verify token with backend
      verifyToken(token);
    } else {
      setLoading(false);
    }
  }, []);

  const verifyToken = async (token: string) => {
    try {
      const response = await fetch('/api/auth/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.data.user);
      } else {
        // Token is invalid, remove it
        localStorage.removeItem('rsams_token');
        localStorage.removeItem('rsams_user');
      }
    } catch (error) {
      console.error('Token verification error:', error);
      localStorage.removeItem('rsams_token');
      localStorage.removeItem('rsams_user');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      if (response.ok) {
        const data = await response.json();
        const { user: userData, token } = data.data;
        
        setUser(userData);
        localStorage.setItem('rsams_token', token);
        localStorage.setItem('rsams_user', JSON.stringify(userData));
        return true;
      } else {
        const errorData = await response.json();
        console.error('Login failed:', errorData.message);
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const register = async (email: string, password: string, role: string, profileData: any): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          password,
          role,
          name: profileData.name,
          studentId: profileData.studentId,
          phone: profileData.phone,
          address: profileData.address
        })
      });

      if (response.ok) {
        const data = await response.json();
        const { user: userData, token } = data.data;
        
        setUser(userData);
        localStorage.setItem('rsams_token', token);
        localStorage.setItem('rsams_user', JSON.stringify(userData));
        return true;
      } else {
        const errorData = await response.json();
        console.error('Registration failed:', errorData.message);
        return false;
      }
    } catch (error) {
      console.error('Registration error:', error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('rsams_token');
    localStorage.removeItem('rsams_user');
  };

  const value = {
    user,
    login,
    register,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};