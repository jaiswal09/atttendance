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
  Plus,
  BarChart3,
  Filter,
  Download
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [leaveReason, setLeaveReason] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [allCourses, setAllCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Reports state
  const [reportData, setReportData] = useState<any>(null);
  const [reportCourse, setReportCourse] = useState('');
  const [reportPeriod, setReportPeriod] = useState('month');
  const [attendanceFilter, setAttendanceFilter] = useState('ALL');
  const [filteredAttendance, setFilteredAttendance] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
    fetchAllCourses();
  }, []);

  useEffect(() => {
    if (activeTab === 'reports') {
      fetchReportData();
    }
  }, [activeTab, reportCourse, reportPeriod]);

  useEffect(() => {
    if (reportData?.attendanceHistory) {
      filterAttendanceData();
    }
  }, [reportData, attendanceFilter, reportCourse]);

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

  const fetchAllCourses = async () => {
    try {
      const token = localStorage.getItem('rsams_token');
      const response = await fetch('/api/admin/courses', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAllCourses(data.data.courses);
      }
    } catch (error) {
      console.error('Error fetching all courses:', error);
    }
  };

  const fetchReportData = async () => {
    try {
      const token = localStorage.getItem('rsams_token');
      const params = new URLSearchParams({
        period: reportPeriod,
        ...(reportCourse && { courseId: reportCourse })
      });

      const [analyticsResponse, attendanceResponse] = await Promise.all([
        fetch(`/api/student/analytics?${params}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`/api/student/attendance?${params}&limit=100`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (analyticsResponse.ok && attendanceResponse.ok) {
        const [analyticsData, attendanceData] = await Promise.all([
          analyticsResponse.json(),
          attendanceResponse.json()
        ]);

        setReportData({
          ...analyticsData.data,
          attendanceHistory: attendanceData.data.attendances
        });
      }
    } catch (error) {
      console.error('Error fetching report data:', error);
    }
  };

  const filterAttendanceData = () => {
    if (!reportData?.attendanceHistory) return;

    let filtered = reportData.attendanceHistory;

    // Filter by course
    if (reportCourse) {
      filtered = filtered.filter((record: any) => record.courseId === reportCourse);
    }

    // Filter by attendance status
    if (attendanceFilter !== 'ALL') {
      filtered = filtered.filter((record: any) => record.status === attendanceFilter);
    }

    setFilteredAttendance(filtered);
  };

  const handleAttendanceSubmit = async () => {
    if (!selectedCourse) return;
    
    setSubmitting(true);
    try {
      const token = localStorage.getItem('rsams_token');
      const today = new Date().toISOString().split('T')[0];
      
      const response = await fetch('/api/student/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          courseId: selectedCourse,
          date: today,
          status: 'PRESENT'
        })
      });

      if (response.ok) {
        alert('Attendance marked successfully for today!');
        setSelectedCourse('');
        fetchDashboardData();
        if (activeTab === 'reports') {
          fetchReportData();
        }
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

  const exportReport = (format: string) => {
    alert(`Exporting ${attendanceFilter} attendance report as ${format} - Feature coming soon`);
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

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
    { id: 'reports', label: 'My Reports', icon: BarChart3 }
  ];

  const renderDashboard = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
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
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <p className="text-sm text-blue-800">
                  <strong>Today's Date:</strong> {new Date().toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
              
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
                  {/* Show enrolled courses first */}
                  <optgroup label="My Enrolled Courses">
                    {enrollments.map((enrollment: any) => (
                      <option key={enrollment.courseId} value={enrollment.courseId}>
                        {enrollment.course.name} ({enrollment.course.code})
                      </option>
                    ))}
                  </optgroup>
                  {/* Show all other courses */}
                  {allCourses.length > 0 && (
                    <optgroup label="All Available Courses">
                      {allCourses
                        .filter(course => !enrollments.some((e: any) => e.courseId === course.id))
                        .map((course: any) => (
                          <option key={course.id} value={course.id}>
                            {course.name} ({course.code})
                          </option>
                        ))}
                    </optgroup>
                  )}
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
                {submitting ? 'Marking...' : 'Mark Present for Today'}
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
                    min={new Date().toISOString().split('T')[0]}
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
                    min={startDate || new Date().toISOString().split('T')[0]}
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
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getAttendanceStatusColor(attendance.status)}`}>
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
                      <p className="text-xs text-gray-400 mt-1">
                        Submitted: {new Date(request.createdAt).toLocaleDateString()}
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

  const renderReports = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">My Attendance Reports</h3>
        <div className="flex space-x-4">
          <button
            onClick={() => exportReport('PDF')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <Download className="w-4 h-4 mr-2" />
            Export PDF
          </button>
          <button
            onClick={() => exportReport('Excel')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <Download className="w-4 h-4 mr-2" />
            Export Excel
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Filter className="w-5 h-5 mr-2" />
          Report Filters
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Course
            </label>
            <select
              value={reportCourse}
              onChange={(e) => setReportCourse(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">All Courses</option>
              {dashboardData?.enrollments?.map((enrollment: any) => (
                <option key={enrollment.courseId} value={enrollment.courseId}>
                  {enrollment.course.name} ({enrollment.course.code})
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Time Period
            </label>
            <select
              value={reportPeriod}
              onChange={(e) => setReportPeriod(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="week">Last Week</option>
              <option value="month">Last Month</option>
              <option value="semester">Last Semester</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Attendance Status
            </label>
            <select
              value={attendanceFilter}
              onChange={(e) => setAttendanceFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="ALL">All Status</option>
              <option value="PRESENT">Present Only</option>
              <option value="ABSENT">Absent Only</option>
              <option value="LATE">Late Only</option>
              <option value="EXCUSED">Excused Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Charts */}
      {reportData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {reportData.attendanceStats && reportData.attendanceStats.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Attendance Distribution</h4>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={reportData.attendanceStats}
                    dataKey="_count.status"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                  >
                    {reportData.attendanceStats.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={['#10B981', '#EF4444', '#8B5CF6', '#F59E0B'][index % 4]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {reportData.dailyAttendance && reportData.dailyAttendance.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Daily Attendance Trend</h4>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={reportData.dailyAttendance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="_count.status" stroke="#10B981" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* Detailed Attendance Table */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">
          Detailed Attendance Records
          {attendanceFilter !== 'ALL' && (
            <span className="ml-2 text-sm font-normal text-gray-600">
              (Showing {attendanceFilter} records only)
            </span>
          )}
        </h4>
        
        {filteredAttendance.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Course
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Notes
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Marked At
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAttendance.map((attendance: any) => (
                  <tr key={attendance.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {new Date(attendance.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {attendance.course.name} ({attendance.course.code})
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getAttendanceStatusColor(attendance.status)}`}>
                        {attendance.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {attendance.notes || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(attendance.markedAt).toLocaleDateString()} {new Date(attendance.markedAt).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No attendance records found for the selected filters
          </div>
        )}
      </div>

      {/* Summary Statistics */}
      {filteredAttendance.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Summary Statistics</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {filteredAttendance.filter(a => a.status === 'PRESENT').length}
              </p>
              <p className="text-sm text-gray-600">Present</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">
                {filteredAttendance.filter(a => a.status === 'ABSENT').length}
              </p>
              <p className="text-sm text-gray-600">Absent</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">
                {filteredAttendance.filter(a => a.status === 'LATE').length}
              </p>
              <p className="text-sm text-gray-600">Late</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">
                {filteredAttendance.filter(a => a.status === 'EXCUSED').length}
              </p>
              <p className="text-sm text-gray-600">Excused</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return renderDashboard();
      case 'reports':
        return renderReports();
      default:
        return renderDashboard();
    }
  };

  if (loading && activeTab === 'dashboard') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

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

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                activeTab === tab.id
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className={`w-5 h-5 mr-2 ${
                activeTab === tab.id ? 'text-green-500' : 'text-gray-400 group-hover:text-gray-500'
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

export default StudentDashboard;