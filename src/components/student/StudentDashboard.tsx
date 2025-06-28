import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { 
  Calendar, 
  Clock, 
  BookOpen, 
  FileText, 
  TrendingUp, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Plus
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [leaveReason, setLeaveReason] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('rsams_token');
      const response = await fetch('/api/student/dashboard', {
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

  const handleAttendanceSubmit = async () => {
    if (!selectedCourse) return;
    
    setSubmitting(true);
    try {
      const token = localStorage.getItem('rsams_token');
      const response = await fetch('/api/student/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          courseId: selectedCourse,
          date: new Date().toISOString().split('T')[0],
          status: 'PRESENT'
        })
      });

      if (response.ok) {
        alert('Attendance marked successfully');
        setSelectedCourse('');
        fetchDashboardData();
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to mark attendance');
      }
    } catch (error) {
      console.error('Error marking attendance:', error);
      alert('Failed to mark attendance');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLeaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveReason || !startDate || !endDate) return;

    setSubmitting(true);
    try {
      const token = localStorage.getItem('rsams_token');
      const response = await fetch('/api/student/leave-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          reason: leaveReason,
          startDate,
          endDate
        })
      });

      if (response.ok) {
        alert('Leave request submitted successfully');
        setLeaveReason('');
        setStartDate('');
        setEndDate('');
        fetchDashboardData();
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to submit leave request');
      }
    } catch (error) {
      console.error('Error submitting leave request:', error);
      alert('Failed to submit leave request');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'REJECTED':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-50 text-green-800 border-green-200';
      case 'REJECTED':
        return 'bg-red-50 text-red-800 border-red-200';
      default:
        return 'bg-yellow-50 text-yellow-800 border-yellow-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const enrollments = dashboardData?.enrollments || [];
  const attendanceStats = dashboardData?.attendanceStats || [];
  const recentAttendance = dashboardData?.recentAttendance || [];
  const pendingLeaves = dashboardData?.pendingLeaves || [];

  // Calculate overall attendance percentage
  const totalAttendance = attendanceStats.reduce((sum: number, stat: any) => sum + stat._count.status, 0);
  const presentCount = attendanceStats.find((stat: any) => stat.status === 'PRESENT')?._count.status || 0;
  const attendancePercentage = totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : 0;

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-lg shadow-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">
          Welcome back, {user?.studentProfile?.name || user?.email}!
        </h1>
        <p className="text-green-100">
          {user?.studentProfile?.studentId && `Student ID: ${user.studentProfile.studentId} | `}
          Track your attendance and manage leave requests
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
          <div className="flex items-center">
            <BookOpen className="w-8 h-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Enrolled Courses</p>
              <p className="text-2xl font-bold text-gray-900">{enrollments.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
          <div className="flex items-center">
            <CheckCircle className="w-8 h-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Overall Attendance</p>
              <p className="text-2xl font-bold text-gray-900">{attendancePercentage}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-yellow-500">
          <div className="flex items-center">
            <Clock className="w-8 h-8 text-yellow-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Leaves</p>
              <p className="text-2xl font-bold text-gray-900">{pendingLeaves.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
          <div className="flex items-center">
            <TrendingUp className="w-8 h-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Records</p>
              <p className="text-2xl font-bold text-gray-900">{totalAttendance}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Mark Attendance */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Calendar className="w-5 h-5 mr-2 text-blue-600" />
            Mark Today's Attendance
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Course
              </label>
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Choose a course...</option>
                {enrollments.map((enrollment: any) => (
                  <option key={enrollment.courseId} value={enrollment.courseId}>
                    {enrollment.course.name} ({enrollment.course.code})
                  </option>
                ))}
              </select>
            </div>
            
            <button
              onClick={handleAttendanceSubmit}
              disabled={!selectedCourse || submitting}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center"
            >
              {submitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              ) : (
                <CheckCircle className="w-4 h-4 mr-2" />
              )}
              {submitting ? 'Marking...' : 'Mark Present'}
            </button>
          </div>
        </div>

        {/* Submit Leave Request */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FileText className="w-5 h-5 mr-2 text-orange-600" />
            Submit Leave Request
          </h2>
          
          <form onSubmit={handleLeaveSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Leave
              </label>
              <textarea
                value={leaveReason}
                onChange={(e) => setLeaveReason(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Please provide reason for leave..."
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                />
              </div>
            </div>
            
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-orange-600 text-white py-2 px-4 rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center"
            >
              {submitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              {submitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </form>
        </div>
      </div>

      {/* Recent Attendance */}
      {recentAttendance.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Recent Attendance
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Course
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentAttendance.slice(0, 10).map((attendance: any) => (
                  <tr key={attendance.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {attendance.course.name} ({attendance.course.code})
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(attendance.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        attendance.status === 'PRESENT' ? 'bg-green-100 text-green-800 border-green-200' :
                        attendance.status === 'ABSENT' ? 'bg-red-100 text-red-800 border-red-200' :
                        'bg-yellow-100 text-yellow-800 border-yellow-200'
                      }`}>
                        {attendance.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Leave Requests History */}
      {pendingLeaves.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FileText className="w-5 h-5 mr-2 text-gray-600" />
            Leave Requests
          </h2>
          
          <div className="space-y-4">
            {pendingLeaves.map((request: any) => (
              <div key={request.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{request.reason}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(request.startDate).toLocaleDateString()} to {new Date(request.endDate).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(request.status)}`}>
                    {getStatusIcon(request.status)}
                    <span className="ml-1">{request.status}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;