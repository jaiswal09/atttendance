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
  UserPlus,
  Search,
  Filter,
  RefreshCw,
  X,
  Save,
  Download
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // User Management Modal States
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [userForm, setUserForm] = useState({
    email: '',
    password: '',
    role: 'STUDENT',
    name: '',
    studentId: '',
    phone: '',
    address: '',
    isActive: true
  });

  // Course Management Modal States
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<any>(null);
  const [courseForm, setCourseForm] = useState({
    name: '',
    code: '',
    description: '',
    credits: 3,
    isActive: true
  });

  // Attendance Management States
  const [attendanceFilters, setAttendanceFilters] = useState({
    search: '',
    courseId: '',
    studentId: '',
    status: '',
    startDate: '',
    endDate: ''
  });
  const [filteredAttendance, setFilteredAttendance] = useState<any[]>([]);
  const [allStudents, setAllStudents] = useState<any[]>([]);

  // Attendance Edit Modal
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [editingAttendance, setEditingAttendance] = useState<any>(null);
  const [attendanceForm, setAttendanceForm] = useState({
    status: '',
    notes: ''
  });

  useEffect(() => {
    fetchDashboardData();
    if (activeTab === 'users') {
      fetchUsers();
    } else if (activeTab === 'courses') {
      fetchCourses();
    } else if (activeTab === 'attendance') {
      fetchAttendanceRecords();
      fetchAllStudents();
    }
  }, [activeTab]);

  useEffect(() => {
    if (attendanceRecords.length > 0) {
      filterAttendanceRecords();
    }
  }, [attendanceRecords, attendanceFilters]);

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

  const fetchAttendanceRecords = async () => {
    try {
      const token = localStorage.getItem('rsams_token');
      const response = await fetch('/api/admin/attendance?limit=200', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAttendanceRecords(data.data.attendances);
      }
    } catch (error) {
      console.error('Error fetching attendance records:', error);
    }
  };

  const fetchAllStudents = async () => {
    try {
      const token = localStorage.getItem('rsams_token');
      const response = await fetch('/api/admin/users?role=STUDENT', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAllStudents(data.data.users.filter((u: any) => u.studentProfile));
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const filterAttendanceRecords = () => {
    let filtered = [...attendanceRecords];

    // Search filter
    if (attendanceFilters.search) {
      const searchTerm = attendanceFilters.search.toLowerCase();
      filtered = filtered.filter(record => 
        record.student?.name?.toLowerCase().includes(searchTerm) ||
        record.student?.studentId?.toLowerCase().includes(searchTerm) ||
        record.course?.name?.toLowerCase().includes(searchTerm) ||
        record.course?.code?.toLowerCase().includes(searchTerm) ||
        record.notes?.toLowerCase().includes(searchTerm)
      );
    }

    // Course filter
    if (attendanceFilters.courseId) {
      filtered = filtered.filter(record => record.courseId === attendanceFilters.courseId);
    }

    // Student filter
    if (attendanceFilters.studentId) {
      filtered = filtered.filter(record => record.studentId === attendanceFilters.studentId);
    }

    // Status filter
    if (attendanceFilters.status) {
      filtered = filtered.filter(record => record.status === attendanceFilters.status);
    }

    // Date range filter
    if (attendanceFilters.startDate) {
      filtered = filtered.filter(record => 
        new Date(record.date) >= new Date(attendanceFilters.startDate)
      );
    }

    if (attendanceFilters.endDate) {
      filtered = filtered.filter(record => 
        new Date(record.date) <= new Date(attendanceFilters.endDate)
      );
    }

    setFilteredAttendance(filtered);
  };

  const clearFilters = () => {
    setAttendanceFilters({
      search: '',
      courseId: '',
      studentId: '',
      status: '',
      startDate: '',
      endDate: ''
    });
  };

  // User Management Functions
  const handleCreateUser = () => {
    setEditingUser(null);
    setUserForm({
      email: '',
      password: '',
      role: 'STUDENT',
      name: '',
      studentId: '',
      phone: '',
      address: '',
      isActive: true
    });
    setShowUserModal(true);
  };

  const handleEditUser = (user: any) => {
    setEditingUser(user);
    setUserForm({
      email: user.email,
      password: '',
      role: user.role,
      name: user.studentProfile?.name || user.teacherProfile?.name || '',
      studentId: user.studentProfile?.studentId || '',
      phone: user.studentProfile?.phone || user.teacherProfile?.phone || '',
      address: user.studentProfile?.address || user.teacherProfile?.address || '',
      isActive: user.isActive
    });
    setShowUserModal(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const token = localStorage.getItem('rsams_token');
      const url = editingUser 
        ? `/api/admin/users/${editingUser.id}`
        : '/api/admin/users';
      
      const method = editingUser ? 'PUT' : 'POST';
      
      const body: any = {
        name: userForm.name,
        phone: userForm.phone,
        address: userForm.address,
        isActive: userForm.isActive
      };

      if (!editingUser) {
        body.email = userForm.email;
        body.password = userForm.password;
        body.role = userForm.role;
        if (userForm.role === 'STUDENT' && userForm.studentId) {
          body.studentId = userForm.studentId;
        }
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        alert(`User ${editingUser ? 'updated' : 'created'} successfully!`);
        setShowUserModal(false);
        fetchUsers(); // Refresh users list immediately
        fetchDashboardData(); // Refresh dashboard stats
      } else {
        const error = await response.json();
        alert(error.message || `Failed to ${editingUser ? 'update' : 'create'} user`);
      }
    } catch (error) {
      console.error('Error saving user:', error);
      alert(`Failed to ${editingUser ? 'update' : 'create'} user`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to deactivate this user?')) return;

    try {
      const token = localStorage.getItem('rsams_token');
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        alert('User deactivated successfully!');
        fetchUsers(); // Refresh users list immediately
        fetchDashboardData(); // Refresh dashboard stats
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to deactivate user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to deactivate user');
    }
  };

  // Course Management Functions
  const handleCreateCourse = () => {
    setEditingCourse(null);
    setCourseForm({
      name: '',
      code: '',
      description: '',
      credits: 3,
      isActive: true
    });
    setShowCourseModal(true);
  };

  const handleEditCourse = (course: any) => {
    setEditingCourse(course);
    setCourseForm({
      name: course.name,
      code: course.code,
      description: course.description || '',
      credits: course.credits,
      isActive: course.isActive
    });
    setShowCourseModal(true);
  };

  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const token = localStorage.getItem('rsams_token');
      const url = editingCourse 
        ? `/api/admin/courses/${editingCourse.id}`
        : '/api/admin/courses';
      
      const method = editingCourse ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(courseForm)
      });

      if (response.ok) {
        alert(`Course ${editingCourse ? 'updated' : 'created'} successfully!`);
        setShowCourseModal(false);
        fetchCourses(); // Refresh courses list immediately
        fetchDashboardData(); // Refresh dashboard stats
      } else {
        const error = await response.json();
        alert(error.message || `Failed to ${editingCourse ? 'update' : 'create'} course`);
      }
    } catch (error) {
      console.error('Error saving course:', error);
      alert(`Failed to ${editingCourse ? 'update' : 'create'} course`);
    } finally {
      setSubmitting(false);
    }
  };

  // Attendance Management Functions
  const handleEditAttendance = (attendance: any) => {
    setEditingAttendance(attendance);
    setAttendanceForm({
      status: attendance.status,
      notes: attendance.notes || ''
    });
    setShowAttendanceModal(true);
  };

  const handleUpdateAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAttendance) return;

    setSubmitting(true);
    try {
      const token = localStorage.getItem('rsams_token');
      const response = await fetch(`/api/teacher/attendance/${editingAttendance.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(attendanceForm)
      });

      if (response.ok) {
        alert('Attendance updated successfully!');
        setShowAttendanceModal(false);
        setEditingAttendance(null);
        fetchAttendanceRecords(); // Refresh attendance records immediately
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to update attendance');
      }
    } catch (error) {
      console.error('Error updating attendance:', error);
      alert('Failed to update attendance');
    } finally {
      setSubmitting(false);
    }
  };

  const exportData = (format: string) => {
    alert(`Exporting ${activeTab} data as ${format} - Feature coming soon`);
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: TrendingUp },
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'courses', label: 'Course Management', icon: BookOpen },
    { id: 'attendance', label: 'Attendance Management', icon: FileText },
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

  const getAttendanceStatusColor = (status: string) => {
    switch (status) {
      case 'PRESENT':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'ABSENT':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'LATE':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'EXCUSED':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
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
        <div className="flex space-x-3">
          <button
            onClick={() => fetchUsers()}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
          <button
            onClick={handleCreateUser}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Add New User
          </button>
        </div>
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
                  {user.studentProfile?.studentId && (
                    <div className="text-xs text-gray-500">{user.studentProfile.studentId}</div>
                  )}
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
                    onClick={() => handleEditUser(user)}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteUser(user.id)}
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
        <div className="flex space-x-3">
          <button
            onClick={() => fetchCourses()}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
          <button
            onClick={handleCreateCourse}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add New Course
          </button>
        </div>
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
                Credits
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
                  {course.description && (
                    <div className="text-xs text-gray-500">{course.description}</div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {course.code}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {course.credits}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {course.enrollments?.length || 0}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {course.assignments?.length || 0}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <button
                    onClick={() => handleEditCourse(course)}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderAttendanceManagement = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Attendance Management</h3>
        <div className="flex space-x-3">
          <button
            onClick={() => fetchAttendanceRecords()}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Data
          </button>
          <button
            onClick={() => exportData('PDF')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <Download className="w-4 h-4 mr-2" />
            Export PDF
          </button>
          <button
            onClick={() => exportData('Excel')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <Download className="w-4 h-4 mr-2" />
            Export Excel
          </button>
        </div>
      </div>

      {/* Advanced Filters */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-lg font-semibold text-gray-900 flex items-center">
            <Filter className="w-5 h-5 mr-2" />
            Advanced Filters
          </h4>
          <button
            onClick={clearFilters}
            className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <X className="w-4 h-4 mr-1" />
            Clear All
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          {/* Search */}
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={attendanceFilters.search}
                onChange={(e) => setAttendanceFilters({...attendanceFilters, search: e.target.value})}
                className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Search students, courses, notes..."
              />
            </div>
          </div>

          {/* Course Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
            <select
              value={attendanceFilters.courseId}
              onChange={(e) => setAttendanceFilters({...attendanceFilters, courseId: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="">All Courses</option>
              {courses.map((course: any) => (
                <option key={course.id} value={course.id}>
                  {course.code} - {course.name}
                </option>
              ))}
            </select>
          </div>

          {/* Student Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Student</label>
            <select
              value={attendanceFilters.studentId}
              onChange={(e) => setAttendanceFilters({...attendanceFilters, studentId: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="">All Students</option>
              {allStudents.map((student: any) => (
                <option key={student.studentProfile.id} value={student.studentProfile.id}>
                  {student.studentProfile.name} ({student.studentProfile.studentId})
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={attendanceFilters.status}
              onChange={(e) => setAttendanceFilters({...attendanceFilters, status: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="">All Status</option>
              <option value="PRESENT">Present</option>
              <option value="ABSENT">Absent</option>
              <option value="LATE">Late</option>
              <option value="EXCUSED">Excused</option>
            </select>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={attendanceFilters.startDate}
              onChange={(e) => setAttendanceFilters({...attendanceFilters, startDate: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={attendanceFilters.endDate}
              onChange={(e) => setAttendanceFilters({...attendanceFilters, endDate: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
        </div>

        {/* Active Filters Display */}
        {(attendanceFilters.search || attendanceFilters.courseId || attendanceFilters.studentId || 
          attendanceFilters.status || attendanceFilters.startDate || attendanceFilters.endDate) && (
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="text-sm font-medium text-gray-700">Active Filters:</span>
            {attendanceFilters.search && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Search: {attendanceFilters.search}
                <button
                  onClick={() => setAttendanceFilters({...attendanceFilters, search: ''})}
                  className="ml-1 text-blue-600 hover:text-blue-800"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {attendanceFilters.status && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Status: {attendanceFilters.status}
                <button
                  onClick={() => setAttendanceFilters({...attendanceFilters, status: ''})}
                  className="ml-1 text-blue-600 hover:text-blue-800"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {attendanceFilters.startDate && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                From: {attendanceFilters.startDate}
                <button
                  onClick={() => setAttendanceFilters({...attendanceFilters, startDate: ''})}
                  className="ml-1 text-blue-600 hover:text-blue-800"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Results Summary */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600">
            Showing <span className="font-medium">{filteredAttendance.length}</span> of{' '}
            <span className="font-medium">{attendanceRecords.length}</span> attendance records
          </div>
          <div className="flex space-x-4 text-sm">
            <span className="text-green-600">
              Present: {filteredAttendance.filter(a => a.status === 'PRESENT').length}
            </span>
            <span className="text-red-600">
              Absent: {filteredAttendance.filter(a => a.status === 'ABSENT').length}
            </span>
            <span className="text-purple-600">
              Late: {filteredAttendance.filter(a => a.status === 'LATE').length}
            </span>
            <span className="text-yellow-600">
              Excused: {filteredAttendance.filter(a => a.status === 'EXCUSED').length}
            </span>
          </div>
        </div>
      </div>

      {/* Attendance Records Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {filteredAttendance.length > 0 ? (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Course
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Notes
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAttendance.map((attendance: any) => (
                <tr key={attendance.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {attendance.student?.name}
                    <div className="text-xs text-gray-500">{attendance.student?.studentId}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {attendance.course?.name}
                    <div className="text-xs text-gray-500">{attendance.course?.code}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {new Date(attendance.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getAttendanceStatusColor(attendance.status)}`}>
                      {attendance.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                    {attendance.notes || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleEditAttendance(attendance)}
                      className="text-blue-600 hover:text-blue-700 inline-flex items-center"
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No attendance records found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {attendanceRecords.length === 0 
                ? 'No attendance records exist in the system.'
                : 'Try adjusting your filters to see more results.'
              }
            </p>
          </div>
        )}
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
      case 'attendance':
        return renderAttendanceManagement();
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

      {/* User Modal */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingUser ? 'Edit User' : 'Create New User'}
              </h3>
              <button
                onClick={() => setShowUserModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSaveUser} className="space-y-4">
              {!editingUser && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                    <input
                      type="email"
                      value={userForm.email}
                      onChange={(e) => setUserForm({...userForm, email: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                    <input
                      type="password"
                      value={userForm.password}
                      onChange={(e) => setUserForm({...userForm, password: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                      required
                      minLength={8}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                    <select
                      value={userForm.role}
                      onChange={(e) => setUserForm({...userForm, role: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                      required
                    >
                      <option value="STUDENT">Student</option>
                      <option value="TEACHER">Teacher</option>
                      <option value="ADMIN">Administrator</option>
                    </select>
                  </div>
                </>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  value={userForm.name}
                  onChange={(e) => setUserForm({...userForm, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  required
                />
              </div>
              
              {(!editingUser && userForm.role === 'STUDENT') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Student ID</label>
                  <input
                    type="text"
                    value={userForm.studentId}
                    onChange={(e) => setUserForm({...userForm, studentId: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="Leave empty for auto-generation"
                  />
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={userForm.phone}
                  onChange={(e) => setUserForm({...userForm, phone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <textarea
                  value={userForm.address}
                  onChange={(e) => setUserForm({...userForm, address: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  rows={3}
                />
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={userForm.isActive}
                  onChange={(e) => setUserForm({...userForm, isActive: e.target.checked})}
                  className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                  Active User
                </label>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowUserModal(false)}
                  className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 flex items-center"
                >
                  {submitting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  {submitting ? 'Saving...' : (editingUser ? 'Update User' : 'Create User')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Course Modal */}
      {showCourseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingCourse ? 'Edit Course' : 'Create New Course'}
              </h3>
              <button
                onClick={() => setShowCourseModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSaveCourse} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Course Name *</label>
                <input
                  type="text"
                  value={courseForm.name}
                  onChange={(e) => setCourseForm({...courseForm, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Course Code *</label>
                <input
                  type="text"
                  value={courseForm.code}
                  onChange={(e) => setCourseForm({...courseForm, code: e.target.value.toUpperCase()})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  required
                  placeholder="e.g., CS101"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={courseForm.description}
                  onChange={(e) => setCourseForm({...courseForm, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  rows={3}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Credits</label>
                <input
                  type="number"
                  value={courseForm.credits}
                  onChange={(e) => setCourseForm({...courseForm, credits: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  min="1"
                  max="10"
                />
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="courseActive"
                  checked={courseForm.isActive}
                  onChange={(e) => setCourseForm({...courseForm, isActive: e.target.checked})}
                  className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                />
                <label htmlFor="courseActive" className="ml-2 block text-sm text-gray-900">
                  Active Course
                </label>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCourseModal(false)}
                  className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 flex items-center"
                >
                  {submitting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  {submitting ? 'Saving...' : (editingCourse ? 'Update Course' : 'Create Course')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Attendance Edit Modal */}
      {showAttendanceModal && editingAttendance && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Edit Attendance</h3>
              <button
                onClick={() => setShowAttendanceModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mb-4 p-3 bg-gray-50 rounded-md">
              <p className="text-sm font-medium text-gray-900">{editingAttendance.student?.name}</p>
              <p className="text-xs text-gray-600">
                {editingAttendance.course?.name} - {new Date(editingAttendance.date).toLocaleDateString()}
              </p>
            </div>
            
            <form onSubmit={handleUpdateAttendance} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Attendance Status</label>
                <select
                  value={attendanceForm.status}
                  onChange={(e) => setAttendanceForm({...attendanceForm, status: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  required
                >
                  <option value="PRESENT">Present</option>
                  <option value="ABSENT">Absent</option>
                  <option value="LATE">Late</option>
                  <option value="EXCUSED">Excused</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={attendanceForm.notes}
                  onChange={(e) => setAttendanceForm({...attendanceForm, notes: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  rows={3}
                  placeholder="Optional notes about this attendance record..."
                />
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAttendanceModal(false)}
                  className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 flex items-center"
                >
                  {submitting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  {submitting ? 'Updating...' : 'Update Attendance'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;