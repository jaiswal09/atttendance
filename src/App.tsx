import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import Layout from './components/ui/Layout';
import LoginForm from './components/auth/LoginForm';
import StudentDashboard from './components/student/StudentDashboard';
import TeacherDashboard from './components/teacher/TeacherDashboard';
import AdminDashboard from './components/admin/AdminDashboard';

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading RSAMS...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginForm />;
  }

  const getDashboard = () => {
    switch (user.role) {
      case 'STUDENT':
        return <StudentDashboard />;
      case 'TEACHER':
        return <TeacherDashboard />;
      case 'ADMIN':
        return <AdminDashboard />;
      default:
        return <div className="text-center py-12">Invalid user role</div>;
    }
  };

  return (
    <Layout>
      <Routes>
        <Route path="/" element={getDashboard()} />
        <Route path="/dashboard" element={getDashboard()} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
};

export default App;