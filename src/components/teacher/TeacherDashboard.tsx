import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { 
  Users, 
  BookOpen, 
  FileText, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Edit3,
  X,
  Save
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const TeacherDashboard: React.FC = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState<any[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
  const [allCourses, setAllCourses] = useState<any[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [selectedAttendance, setSelectedAttendance] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  // Attendance edit form
  const [attendanceForm, setAttendanceForm] = useState({
    status: '',
    notes: ''
  });

  useEffect(() => {
    fetchDashboardData();
    fetchLeaveRequests();
    fetchAllCourses();
    fetchAttendanceRecords();
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      fetchCourseStudents();
    }
  }, [selectedCourse]);

  useEffect(() => {
    // Auto-set today's date whenever component mounts or date changes
    setSelectedDate(new Date().toISOString().split('T')[0]);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('rsams_token');
      const response = await fetch('/api/teacher/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setDashboardData(data.data);
        if (data.data.courseAssignments.length > 0) {
          setSelectedCourse(data.data.courseAssignments[0].courseId);
        }
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

  const fetchCourseStudents = async () => {
    if (!selectedCourse) return;

    try {
      const token = localStorage.getItem('rsams_token');
      const response = await fetch(`/api/teacher/course/${selectedCourse}/students`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStudents(data.data.enrollments);
      }
    } catch (error) {
      console.error('Error fetching course students:', error);
    }
  };

  const fetchLeaveRequests = async () => {
    try {
      const token = localStorage.getItem('rsams_token');
      const response = await fetch('/api/teacher/leave-requests?status=PENDING', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setLeaveRequests(data.data.leaveRequests);
      }
    } catch (error) {
      console.error('Error fetching leave requests:', error);
    }
  };

  const fetchAttendanceRecords = async () => {
    try {
      const token = localStorage.getItem('rsams_token');
      const response = await fetch('/api/admin/attendance?limit=50', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Filter to only show records for courses this teacher is assigned to
        const teacherCourseIds = dashboardData?.courseAssignments?.map((ca: any) => ca.courseId) || [];
        const filteredRecords = data.data.attendances.filter((record: any) => 
          teacherCourseIds.includes(record.courseId)
        );
        setAttendanceRecords(filteredRecords);
      }
    } catch (error) {
      console.error('Error fetching attendance records:', error);
    }
  };

  const updateAttendance = async (studentId: string, newStatus: string) => {
    try {
      const token = localStorage.getItem('rsams_token');
      const response = await fetch('/api/teacher/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          studentId,
          courseId: selectedCourse,
          date: selectedDate,
          status: newStatus
        })
      });

      if (response.ok) {
        alert(`Attendance updated to ${newStatus}`);
        fetchCourseStudents();
        fetchAttendanceRecords();
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to update attendance');
      }
    } catch (error) {
      console.error('Error updating attendance:', error);
      alert('Failed to update attendance');
    }
  };

  const handleEditAttendance = (attendance: any) => {
    setSelectedAttendance(attendance);
    setAttendanceForm({
      status: attendance.status,
      notes: attendance.notes || ''
    });
    setShowAttendanceModal(true);
  };

  const handleUpdateAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAttendance) return;

    setSubmitting(true);
    try {
      const token = localStorage.getItem('rsams_token');
      const response = await fetch(`/api/teacher/attendance/${selectedAttendance.id}`, {
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
        setSelectedAttendance(null);
        fetchAttendanceRecords();
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

  const handleLeaveAction = async (requestId: string, action: 'APPROVED' | 'REJECTED') => {
    try {
      const token = localStorage.getItem('rsams_token');
      const response = await fetch(`/api/teacher/leave-request/${requestId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status: action,
          reviewNotes: `${action.toLowerCase()} by teacher`
        })
      });

      if (response.ok) {
        alert(`Leave request ${action.toLowerCase()} successfully`);
        fetchLeaveRequests();
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to update leave request');
      }
    } catch (error) {
      console.error('Error updating leave request:', error);
      alert('Failed to update leave request');
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const courseAssignments = dashboardData?.courseAssignments || [];
  const totalStudents = courseAssignments.reduce((sum: number, assignment: any) => 
    sum + assignment.course.enrollments.length, 0);

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg shadow-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">
          Welcome, {user?.teacherProfile?.name || user?.email}!
        </h1>
        <p className="text-blue-100">
          Manage your courses, track student attendance, and review leave requests
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
          <div className="flex items-center">
            <BookOpen className="w-8 h-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Courses Assigned</p>
              <p className="text-2xl font-bold text-gray-900">{courseAssignments.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
          <div className="flex items-center">
            <Users className="w-8 h-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Students</p>
              <p className="text-2xl font-bold text-gray-900">{totalStudents}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-yellow-500">
          <div className="flex items-center">
            <AlertCircle className="w-8 h-8 text-yellow-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Leaves</p>
              <p className="text-2xl font-bold text-gray-900">{leaveRequests.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
          <div className="flex items-center">
            <Calendar className="w-8 h-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Today's Date</p>
              <p className="text-sm font-bold text-gray-900">
                {new Date().toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Course Selection and Attendance Management */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <Edit3 className="w-5 h-5 mr-2 text-blue-600" />
            Manage Attendance
          </h2>
          <div className="flex space-x-4">
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Course</option>
              {/* Show assigned courses first */}
              <optgroup label="My Assigned Courses">
                {courseAssignments.map((assignment: any) => (
                  <option key={assignment.courseId} value={assignment.courseId}>
                    {assignment.course.name} ({assignment.course.code})
                  </option>
                ))}
              </optgroup>
              {/* Show all other courses */}
              {allCourses.length > 0 && (
                <optgroup label="All Courses">
                  {allCourses
                    .filter(course => !courseAssignments.some((ca: any) => ca.courseId === course.id))
                    .map((course: any) => (
                      <option key={course.id} value={course.id}>
                        {course.name} ({course.code})
                      </option>
                    ))}
                </optgroup>
              )}
            </select>
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Date:</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
                className="px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
              >
                Today
              </button>
            </div>
          </div>
        </div>

        {selectedCourse && students.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {students.map((enrollment: any) => (
                  <tr key={enrollment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {enrollment.student.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {enrollment.student.studentId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => updateAttendance(enrollment.studentId, 'PRESENT')}
                        className="text-green-600 hover:text-green-700 px-2 py-1 rounded bg-green-50 hover:bg-green-100 transition-colors"
                      >
                        Present
                      </button>
                      <button
                        onClick={() => updateAttendance(enrollment.studentId, 'ABSENT')}
                        className="text-red-600 hover:text-red-700 px-2 py-1 rounded bg-red-50 hover:bg-red-100 transition-colors"
                      >
                        Absent
                      </button>
                      <button
                        onClick={() => updateAttendance(enrollment.studentId, 'EXCUSED')}
                        className="text-yellow-600 hover:text-yellow-700 px-2 py-1 rounded bg-yellow-50 hover:bg-yellow-100 transition-colors"
                      >
                        Excused
                      </button>
                      <button
                        onClick={() => updateAttendance(enrollment.studentId, 'LATE')}
                        className="text-purple-600 hover:text-purple-700 px-2 py-1 rounded bg-purple-50 hover:bg-purple-100 transition-colors"
                      >
                        Late
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {selectedCourse && students.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No students enrolled in this course
          </div>
        )}

        {!selectedCourse && (
          <div className="text-center py-8 text-gray-500">
            Please select a course to manage attendance
          </div>
        )}
      </div>

      {/* Recent Attendance Records - Edit Feature */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Edit3 className="w-5 h-5 mr-2 text-green-600" />
          Recent Attendance Records (Editable)
        </h2>
        
        {attendanceRecords.length > 0 ? (
          <div className="overflow-x-auto">
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
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {attendanceRecords.slice(0, 10).map((attendance: any) => (
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleEditAttendance(attendance)}
                        className="text-blue-600 hover:text-blue-700 inline-flex items-center"
                      >
                        <Edit3 className="w-4 h-4 mr-1" />
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No attendance records found for your courses
          </div>
        )}
      </div>

      {/* Leave Requests */}
      {leaveRequests.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FileText className="w-5 h-5 mr-2 text-orange-600" />
            Pending Leave Requests
          </h2>
          
          <div className="space-y-4">
            {leaveRequests.map((request: any) => (
              <div key={request.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-gray-900">
                      {request.student.name} ({request.student.studentId})
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">{request.reason}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(request.startDate).toLocaleDateString()} to {new Date(request.endDate).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Submitted: {new Date(request.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={() => handleLeaveAction(request.id, 'APPROVED')}
                      className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors"
                    >
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Approve
                    </button>
                    <button
                      onClick={() => handleLeaveAction(request.id, 'REJECTED')}
                      className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700 transition-colors"
                    >
                      <XCircle className="w-3 h-3 mr-1" />
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {leaveRequests.length === 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FileText className="w-5 h-5 mr-2 text-orange-600" />
            Leave Requests
          </h2>
          <div className="text-center py-8 text-gray-500">
            No pending leave requests
          </div>
        </div>
      )}

      {/* Attendance Edit Modal */}
      {showAttendanceModal && selectedAttendance && (
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
              <p className="text-sm font-medium text-gray-900">{selectedAttendance.student?.name}</p>
              <p className="text-xs text-gray-600">{selectedAttendance.course?.name} - {new Date(selectedAttendance.date).toLocaleDateString()}</p>
            </div>
            
            <form onSubmit={handleUpdateAttendance} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Attendance Status</label>
                <select
                  value={attendanceForm.status}
                  onChange={(e) => setAttendanceForm({...attendanceForm, status: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                >
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

export default TeacherDashboard;