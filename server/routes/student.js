import express from 'express';
import { authenticateToken, requireStudent } from '../middleware/auth.js';
import { validateAttendance, validateLeaveRequest, validateRequest } from '../middleware/validation.js';

const router = express.Router();

// Get student dashboard data
router.get('/dashboard', authenticateToken, requireStudent, async (req, res) => {
  try {
    const studentId = req.user.studentProfile.id;

    // Get enrolled courses
    const enrollments = await req.prisma.enrollment.findMany({
      where: { 
        studentId,
        isActive: true
      },
      include: {
        course: true
      }
    });

    // Get attendance statistics
    const attendanceStats = await req.prisma.attendance.groupBy({
      by: ['status'],
      where: {
        studentId
      },
      _count: {
        status: true
      }
    });

    // Get recent attendance
    const recentAttendance = await req.prisma.attendance.findMany({
      where: { studentId },
      include: {
        course: true,
        session: true
      },
      orderBy: { date: 'desc' },
      take: 10
    });

    // Get pending leave requests
    const pendingLeaves = await req.prisma.leaveRequest.findMany({
      where: {
        studentId,
        status: 'PENDING'
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: {
        enrollments,
        attendanceStats,
        recentAttendance,
        pendingLeaves
      }
    });
  } catch (error) {
    console.error('Student dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data'
    });
  }
});

// Mark attendance
router.post('/attendance', authenticateToken, requireStudent, validateAttendance, validateRequest, async (req, res) => {
  try {
    const { courseId, date, status, notes } = req.body;
    const studentId = req.user.studentProfile.id;

    // Check if student is enrolled in the course
    const enrollment = await req.prisma.enrollment.findUnique({
      where: {
        studentId_courseId: {
          studentId,
          courseId
        }
      }
    });

    if (!enrollment || !enrollment.isActive) {
      return res.status(403).json({
        success: false,
        message: 'You are not enrolled in this course'
      });
    }

    // Check if attendance already exists for this date
    const existingAttendance = await req.prisma.attendance.findUnique({
      where: {
        studentId_courseId_date: {
          studentId,
          courseId,
          date: new Date(date)
        }
      }
    });

    if (existingAttendance) {
      return res.status(400).json({
        success: false,
        message: 'Attendance already marked for this date'
      });
    }

    // Create attendance record
    const attendance = await req.prisma.attendance.create({
      data: {
        studentId,
        courseId,
        date: new Date(date),
        status,
        notes
      },
      include: {
        course: true
      }
    });

    res.status(201).json({
      success: true,
      message: 'Attendance marked successfully',
      data: { attendance }
    });
  } catch (error) {
    console.error('Mark attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark attendance'
    });
  }
});

// Get attendance history
router.get('/attendance', authenticateToken, requireStudent, async (req, res) => {
  try {
    const studentId = req.user.studentProfile.id;
    const { courseId, startDate, endDate, page = 1, limit = 50 } = req.query;

    const where = { studentId };
    
    if (courseId) where.courseId = courseId;
    if (startDate) where.date = { ...where.date, gte: new Date(startDate) };
    if (endDate) where.date = { ...where.date, lte: new Date(endDate) };

    const [attendances, total] = await Promise.all([
      req.prisma.attendance.findMany({
        where,
        include: {
          course: true,
          session: true
        },
        orderBy: { date: 'desc' },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit)
      }),
      req.prisma.attendance.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        attendances,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch attendance history'
    });
  }
});

// Submit leave request
router.post('/leave-request', authenticateToken, requireStudent, validateLeaveRequest, validateRequest, async (req, res) => {
  try {
    const { reason, startDate, endDate } = req.body;
    const studentId = req.user.studentProfile.id;

    // Check for overlapping leave requests
    const overlappingLeave = await req.prisma.leaveRequest.findFirst({
      where: {
        studentId,
        status: { in: ['PENDING', 'APPROVED'] },
        OR: [
          {
            startDate: { lte: new Date(endDate) },
            endDate: { gte: new Date(startDate) }
          }
        ]
      }
    });

    if (overlappingLeave) {
      return res.status(400).json({
        success: false,
        message: 'You already have a leave request for overlapping dates'
      });
    }

    const leaveRequest = await req.prisma.leaveRequest.create({
      data: {
        studentId,
        reason,
        startDate: new Date(startDate),
        endDate: new Date(endDate)
      }
    });

    res.status(201).json({
      success: true,
      message: 'Leave request submitted successfully',
      data: { leaveRequest }
    });
  } catch (error) {
    console.error('Submit leave request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit leave request'
    });
  }
});

// Get leave requests
router.get('/leave-requests', authenticateToken, requireStudent, async (req, res) => {
  try {
    const studentId = req.user.studentProfile.id;
    const { status, page = 1, limit = 20 } = req.query;

    const where = { studentId };
    if (status) where.status = status;

    const [leaveRequests, total] = await Promise.all([
      req.prisma.leaveRequest.findMany({
        where,
        include: {
          reviewer: {
            select: {
              name: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit)
      }),
      req.prisma.leaveRequest.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        leaveRequests,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get leave requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leave requests'
    });
  }
});

// Get attendance analytics
router.get('/analytics', authenticateToken, requireStudent, async (req, res) => {
  try {
    const studentId = req.user.studentProfile.id;
    const { courseId, period = 'month' } = req.query;

    // Calculate date range based on period
    const now = new Date();
    let startDate;
    
    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'semester':
        startDate = new Date(now.getTime() - 120 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    const where = {
      studentId,
      date: { gte: startDate }
    };

    if (courseId) where.courseId = courseId;

    // Get attendance statistics
    const attendanceStats = await req.prisma.attendance.groupBy({
      by: ['status'],
      where,
      _count: { status: true }
    });

    // Get daily attendance for chart
    const dailyAttendance = await req.prisma.attendance.groupBy({
      by: ['date'],
      where,
      _count: { status: true },
      orderBy: { date: 'asc' }
    });

    // Get course-wise attendance
    const courseAttendance = await req.prisma.attendance.groupBy({
      by: ['courseId'],
      where: { studentId },
      _count: { status: true }
    });

    // Get course details for course attendance
    const courseIds = courseAttendance.map(ca => ca.courseId);
    const courses = await req.prisma.course.findMany({
      where: { id: { in: courseIds } },
      select: { id: true, name: true, code: true }
    });

    const courseAttendanceWithDetails = courseAttendance.map(ca => ({
      ...ca,
      course: courses.find(c => c.id === ca.courseId)
    }));

    res.json({
      success: true,
      data: {
        attendanceStats,
        dailyAttendance,
        courseAttendance: courseAttendanceWithDetails
      }
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics'
    });
  }
});

export default router;