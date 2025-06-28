import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { 
  Shield, 
  Users, 
  BookOpen, 
  FileText, 
  Settings, 
  TrendingUp,
  Plus,
  Edit,
  Trash2,
  Eye,
  UserPlus
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    if (activeTab === 'users') {
      fetchUsers();
    } else if (activeTab === 'courses') {
      fetchCourses();
    }
  }, [activeTab]);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('rsams_token');
      const response = await fetch('/api/admin/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setDashboardData(data.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('rsams_token');
      const response = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.data.users);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchCourses = async () => {
    try {
      const token = localStorage.getItem('rsams_token');
      const response = await fetch('/api/admin/courses', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCourses(data.data.courses);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const handleUserAction = (userId: string, action: string) => {
    alert(`${action} user ${userId} - Feature coming soon`);
  };

  const handleCourseAction = (courseId: string, action: string) => {
    alert(`${action} course ${courseId} - Feature coming soon`);
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: TrendingUp },
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'courses', label: 'Course Management', icon: BookOpen },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'TEACHER':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'STUDENT':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: boolean) => {
    return status 
      ? 'bg-green-100 text-green-800 border-green-200'
      : 'bg-red-100 text-red-800 border-red-200';
  };

  const renderOverview = () => {
    if (!dashboardData) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      );
    }

    const userCounts = dashboardData.userCounts || [];
    const recentUsers = dashboardData.recentUsers || [];
    const attendanceStats = dashboardData.attendanceStats || [];

    return (
      <div className="space-y-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-red-500">
            <h3 className="text-sm font-medium text-gray-600">Total Courses</h3>
            <div className="flex items-baseline mt-2">
              <p className="text-2xl font-bold text-gray-900">{dashboardData.totalCourses || 0}</p>
            </div>
          </div>
          
          {userCounts.map((stat: any, index: number) => (
            <div key={index} className="bg-white rounded-lg shadow-md p-6 border-l-4 border-red-500">
              <h3 className="text-sm font-medium text-gray-600">{stat.role}S</h3>
              <div className="flex items-baseline mt-2">
                <p className="text-2xl font-bold text-gray-900">{stat._count.role}</p>
              </div>
            </div>
          ))}
          
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-red-500">
            <h3 className="text-sm font-medium text-gray-600">Pending Leaves</h3>
            <div className="flex items-baseline mt-2">
              <p className="text-2xl font-bold text-gray-900">{dashboardData.pendingLeaves || 0}</p>
            </div>
          </div>
        </div>

        {/* Recent Users */}
        {recentUsers.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Users</h3>
            <div className="space-y-3">
              {recentUsers.slice(0, 5).map((user: any) => (
                <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {user.studentProfile?.name || user.teacherProfile?.name || user.email}
                    </p>
                    <p className="text-xs text-gray-600">{user.role} - {user.email}</p>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Attendance Statistics */}
        {attendanceStats.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Attendance Statistics (Last 30 Days)
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={attendanceStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="status" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="_count.status" fill="#EF4444" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    );
  };

  const renderUserManagement = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">User Management</h3>
        <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700">
          <UserPlus className="w-4 h-4 mr-2" />
          Add New User
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user: any) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {user.studentProfile?.name || user.teacherProfile?.name || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {user.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRoleColor(user.role)}`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(user.isActive)}`}>
                    {user.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <button
                    onClick={() => handleUserAction(user.id, 'View')}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleUserAction(user.id, 'Edit')}
                    className="text-green-600 hover:text-green-700"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleUserAction(user.id, 'Delete')}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderCourseManagement = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Course Management</h3>
        <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700">
          <Plus className="w-4 h-4 mr-2" />
          Add New Course
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Course Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Course Code
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Students
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Teachers
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {courses.map((course: any) => (
              <tr key={course.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {course.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {course.code}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {course.enrollments?.length || 0}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {course.assignments?.length || 0}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <button
                    onClick={() => handleCourseAction(course.id, 'View')}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleCourseAction(course.id, 'Edit')}
                    className="text-green-600 hover:text-green-700"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleCourseAction(course.id, 'Delete')}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'users':
        return renderUserManagement();
      case 'courses':
        return renderCourseManagement();
      case 'reports':
        return <div className="text-center py-12">Reports section coming soon...</div>;
      case 'settings':
        return <div className="text-center py-12">Settings section coming soon...</div>;
      default:
        return renderOverview();
    }
  };

  if (loading && activeTab === 'overview') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-lg shadow-lg p-6 text-white">
        <div className="flex items-center">
          <Shield className="w-8 h-8 mr-3" />
          <div>
            <h1 className="text-2xl font-bold mb-2">
              Administrator Dashboard
            </h1>
            <p className="text-red-100">
              Complete oversight and management of the RSAMS system
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                activeTab === tab.id
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className={`w-5 h-5 mr-2 ${
                activeTab === tab.id ? 'text-red-500' : 'text-gray-400 group-hover:text-gray-500'
              }`} />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {renderContent()}
    </div>
  );
};

export default AdminDashboard;