import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { LogOut, User, GraduationCap, Users, Shield } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();

  const getRoleIcon = () => {
    switch (user?.role) {
      case 'ADMIN':
        return <Shield className="w-5 h-5 text-red-600" />;
      case 'TEACHER':
        return <Users className="w-5 h-5 text-blue-600" />;
      case 'STUDENT':
        return <GraduationCap className="w-5 h-5 text-green-600" />;
      default:
        return <User className="w-5 h-5" />;
    }
  };

  const getRoleColor = () => {
    switch (user?.role) {
      case 'ADMIN':
        return 'bg-red-50 border-red-200';
      case 'TEACHER':
        return 'bg-blue-50 border-blue-200';
      case 'STUDENT':
        return 'bg-green-50 border-green-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getUserName = () => {
    if (user?.studentProfile?.name) return user.studentProfile.name;
    if (user?.teacherProfile?.name) return user.teacherProfile.name;
    return user?.email || 'User';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className={`shadow-sm border-b-2 ${getRoleColor()}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                {getRoleIcon()}
                <h1 className="text-xl font-bold text-gray-900">
                  RSAMS
                </h1>
              </div>
              <div className="hidden sm:block">
                <span className="text-sm text-gray-600">
                  Role-Based Student Attendance Management System
                </span>
              </div>
            </div>
            
            {user && (
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  {getRoleIcon()}
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {getUserName()}
                    </div>
                    <div className="text-xs text-gray-500 capitalize">
                      {user.role.toLowerCase()}
                      {user.studentProfile?.studentId && ` • ${user.studentProfile.studentId}`}
                    </div>
                  </div>
                </div>
                <button
                  onClick={logout}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                >
                  <LogOut className="w-4 h-4 mr-1" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
};

export default Layout;