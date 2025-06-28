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
    const storedUser = localStorage.getItem('rsams_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      // Mock authentication - replace with actual API call
      const mockUsers = [
        {
          id: '1',
          email: 'admin@rsams.edu',
          role: 'ADMIN' as const,
          profile: { id: '1', name: 'System Administrator' }
        },
        {
          id: '2',
          email: 'teacher@rsams.edu',
          role: 'TEACHER' as const,
          profile: {
            id: '2',
            name: 'Dr. Sarah Johnson',
            contact: '+1-555-0123',
            courses: [
              { id: '1', name: 'Computer Science 101', code: 'CS101' },
              { id: '2', name: 'Data Structures', code: 'CS201' }
            ]
          }
        },
        {
          id: '3',
          email: 'student@rsams.edu',
          role: 'STUDENT' as const,
          profile: {
            id: '3',
            name: 'John Smith',
            studentId: 'ST2024001',
            courses: [
              { id: '1', name: 'Computer Science 101', code: 'CS101' },
              { id: '3', name: 'Mathematics', code: 'MATH101' }
            ]
          }
        }
      ];

      const foundUser = mockUsers.find(u => u.email === email && password === 'password123');
      
      if (foundUser) {
        setUser(foundUser);
        localStorage.setItem('rsams_user', JSON.stringify(foundUser));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const register = async (email: string, password: string, role: string, profileData: any): Promise<boolean> => {
    try {
      // Mock registration - replace with actual API call
      const newUser: User = {
        id: Date.now().toString(),
        email,
        role: role as 'STUDENT' | 'TEACHER' | 'ADMIN',
        profile: { id: Date.now().toString(), ...profileData }
      };
      
      setUser(newUser);
      localStorage.setItem('rsams_user', JSON.stringify(newUser));
      return true;
    } catch (error) {
      console.error('Registration error:', error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
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