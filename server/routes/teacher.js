import express from 'express';
import { authenticateToken, requireTeacherOrAdmin } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validation.js';
import { body } from 'express-validator';

const router = express.Router();

// Get teacher dashboard data
router.get('/dashboard', authenticateToken, requireTeacherOrAdmin, async (req, res) => {
  try {
    const teacherId = req.user.teacherProfile?.id;

    if (!teacherId) {
      return res.status(403).json({
        success: false,
        message: 'Teacher profile not found'
      });
    }

    // Get assigned courses
    const courseAssignments = await req.prisma.courseAssignment.findMany({
      where: { 
        teacherId,
        isActive: true
      },
      include: {
        course: {
          include: {
            enrollments: {
              where: { isActive: true },
              include: {
                student: true
              }
            }
          }
        }
      }
    });

    // Get pending leave requests for students in teacher's courses
    const courseIds = courseAssignments.map(ca => ca.courseId);
    const studentIds = courseAssignments.flatMap(ca => 
      ca.course.enrollments.map(e => e.studentId)
    );

    const pendingLeaves = await req.prisma.leaveRequest.findMany({
      where: {
        studentId: { in: studentIds },
        status: 'PENDING'
      },
      include: {
        student: true
      },
      orderBy: { createdAt: 'desc' }
    });

    // Get recent attendance statistics
    const attendanceStats = await req.prisma.attendance.groupBy({
      by: ['courseId', 'status'],
      where: {
        courseId: { in: courseIds },
        date: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      },
      _count: { status: true }
    });

    res.json({
      success: true,
      data: {
        courseAssignments,
        pendingLeaves,
        attendanceStats
      }
    });
  } catch (error) {
    console.error('Teacher dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data'
    });
  }
});

// Get students in a course
router.get('/course/:courseId/students', authenticateToken, requireTeacherOrAdmin, async (req, res) => {
  try {
    const { courseId } = req.params;
    const teacherId = req.user.teacherProfile?.id;

    // Verify teacher is assigned to this course (unless admin)
    if (req.user.role !== 'ADMIN') {
      const assignment = await req.prisma.courseAssignment.findUnique({
        where: {
          teacherId_courseId: {
            teacherId,
            courseId
          }
        }
      });

      if (!assignment || !assignment.isActive) {
        return res.status(403).json({
          success: false,
          message: 'You are not assigned to this course'
        });
      }
    }

    // Get students enrolled in the course
    const enrollments = await req.prisma.enrollment.findMany({
      where: {
        courseId,
        isActive: true
      },
      include: {
        student: true
      },
      orderBy: {
        student: {
          name: 'asc'
        }
      }
    });

    res.json({
      success: true,
      data: { enrollments }
    });
  } catch (error) {
    console.error('Get course students error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch course students'
    });
  }
});

// Get attendance for a course and date
router.get('/course/:courseId/attendance', authenticateToken, requireTeacherOrAdmin, async (req, res) => {
  try {
    const { courseId } = req.params;
    const { date, page = 1, limit = 50 } = req.query;
    const teacherId = req.user.teacherProfile?.id;

    // Verify teacher is assigned to this course (unless admin)
    if (req.user.role !== 'ADMIN') {
      const assignment = await req.prisma.courseAssignment.findUnique({
        where: {
          teacherId_courseId: {
            teacherId,
            courseId
          }
        }
      });

      if (!assignment || !assignment.isActive) {
        return res.status(403).json({
          success: false,
          message: 'You are not assigned to this course'
        });
      }
    }

    const where = { courseId };
    if (date) where.date = new Date(date);

    const [attendances, total] = await Promise.all([
      req.prisma.attendance.findMany({
        where,
        include: {
          student: true,
          session: true
        },
        orderBy: [
          { date: 'desc' },
          { student: { name: 'asc' } }
        ],
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
    console.error('Get course attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch course attendance'
    });
  }
});

// Update student attendance
router.put('/attendance/:attendanceId', 
  authenticateToken, 
  requireTeacherOrAdmin,
  [
    body('status').isIn(['PRESENT', 'ABSENT', 'EXCUSED', 'LATE']).withMessage('Invalid attendance status'),
    body('notes').optional().isLength({ max: 500 }).withMessage('Notes must be less than 500 characters')
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { attendanceId } = req.params;
      const { status, notes } = req.body;
      const teacherId = req.user.teacherProfile?.id;

      // Get the attendance record
      const attendance = await req.prisma.attendance.findUnique({
        where: { id: attendanceId },
        include: { course: true }
      });

      if (!attendance) {
        return res.status(404).json({
          success: false,
          message: 'Attendance record not found'
        });
      }

      // Verify teacher is assigned to this course (unless admin)
      if (req.user.role !== 'ADMIN') {
        const assignment = await req.prisma.courseAssignment.findUnique({
          where: {
            teacherId_courseId: {
              teacherId,
              courseId: attendance.courseId
            }
          }
        });

        if (!assignment || !assignment.isActive) {
          return res.status(403).json({
            success: false,
            message: 'You are not assigned to this course'
          });
        }
      }

      // Update attendance
      const updatedAttendance = await req.prisma.attendance.update({
        where: { id: attendanceId },
        data: { status, notes },
        include: {
          student: true,
          course: true
        }
      });

      res.json({
        success: true,
        message: 'Attendance updated successfully',
        data: { attendance: updatedAttendance }
      });
    } catch (error) {
      console.error('Update attendance error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update attendance'
      });
    }
  }
);

// Create attendance record for student
router.post('/attendance',
  authenticateToken,
  requireTeacherOrAdmin,
  [
    body('studentId').notEmpty().withMessage('Student ID is required'),
    body('courseId').notEmpty().withMessage('Course ID is required'),
    body('date').isISO8601().withMessage('Valid date is required'),
    body('status').isIn(['PRESENT', 'ABSENT', 'EXCUSED', 'LATE']).withMessage('Invalid attendance status'),
    body('notes').optional().isLength({ max: 500 }).withMessage('Notes must be less than 500 characters')
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { studentId, courseId, date, status, notes } = req.body;
      const teacherId = req.user.teacherProfile?.id;

      // Verify teacher is assigned to this course (unless admin)
      if (req.user.role !== 'ADMIN') {
        const assignment = await req.prisma.courseAssignment.findUnique({
          where: {
            teacherId_courseId: {
              teacherId,
              courseId
            }
          }
        });

        if (!assignment || !assignment.isActive) {
          return res.status(403).json({
            success: false,
            message: 'You are not assigned to this course'
          });
        }
      }

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
        return res.status(400).json({
          success: false,
          message: 'Student is not enrolled in this course'
        });
      }

      // Check if attendance already exists
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
          message: 'Attendance already exists for this date'
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
          student: true,
          course: true
        }
      });

      res.status(201).json({
        success: true,
        message: 'Attendance created successfully',
        data: { attendance }
      });
    } catch (error) {
      console.error('Create attendance error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create attendance record'
      });
    }
  }
);

// Get leave requests for teacher's students
router.get('/leave-requests', authenticateToken, requireTeacherOrAdmin, async (req, res) => {
  try {
    const teacherId = req.user.teacherProfile?.id;
    const { status, page = 1, limit = 20 } = req.query;

    let where = {};

    if (req.user.role !== 'ADMIN') {
      // Get students in teacher's courses
      const courseAssignments = await req.prisma.courseAssignment.findMany({
        where: { teacherId, isActive: true },
        include: {
          course: {
            include: {
              enrollments: {
                where: { isActive: true },
                select: { studentId: true }
              }
            }
          }
        }
      });

      const studentIds = courseAssignments.flatMap(ca => 
        ca.course.enrollments.map(e => e.studentId)
      );

      where.studentId = { in: studentIds };
    }

    if (status) where.status = status;

    const [leaveRequests, total] = await Promise.all([
      req.prisma.leaveRequest.findMany({
        where,
        include: {
          student: true,
          reviewer: {
            select: { name: true }
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

// Review leave request
router.put('/leave-request/:requestId',
  authenticateToken,
  requireTeacherOrAdmin,
  [
    body('status').isIn(['APPROVED', 'REJECTED']).withMessage('Status must be APPROVED or REJECTED'),
    body('reviewNotes').optional().isLength({ max: 500 }).withMessage('Review notes must be less than 500 characters')
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { requestId } = req.params;
      const { status, reviewNotes } = req.body;
      const teacherId = req.user.teacherProfile?.id;

      // Get the leave request
      const leaveRequest = await req.prisma.leaveRequest.findUnique({
        where: { id: requestId },
        include: { student: true }
      });

      if (!leaveRequest) {
        return res.status(404).json({
          success: false,
          message: 'Leave request not found'
        });
      }

      if (leaveRequest.status !== 'PENDING') {
        return res.status(400).json({
          success: false,
          message: 'Leave request has already been reviewed'
        });
      }

      // Verify teacher has permission to review this request (unless admin)
      if (req.user.role !== 'ADMIN') {
        const courseAssignments = await req.prisma.courseAssignment.findMany({
          where: { teacherId, isActive: true },
          include: {
            course: {
              include: {
                enrollments: {
                  where: { 
                    studentId: leaveRequest.studentId,
                    isActive: true 
                  }
                }
              }
            }
          }
        });

        const hasPermission = courseAssignments.some(ca => 
          ca.course.enrollments.length > 0
        );

        if (!hasPermission) {
          return res.status(403).json({
            success: false,
            message: 'You do not have permission to review this leave request'
          });
        }
      }

      // Update leave request
      const updatedLeaveRequest = await req.prisma.leaveRequest.update({
        where: { id: requestId },
        data: {
          status,
          reviewNotes,
          reviewedBy: teacherId,
          reviewedAt: new Date()
        },
        include: {
          student: true,
          reviewer: {
            select: { name: true }
          }
        }
      });

      res.json({
        success: true,
        message: `Leave request ${status.toLowerCase()} successfully`,
        data: { leaveRequest: updatedLeaveRequest }
      });
    } catch (error) {
      console.error('Review leave request error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to review leave request'
      });
    }
  }
);

// Get course analytics
router.get('/course/:courseId/analytics', authenticateToken, requireTeacherOrAdmin, async (req, res) => {
  try {
    const { courseId } = req.params;
    const { period = 'month' } = req.query;
    const teacherId = req.user.teacherProfile?.id;

    // Verify teacher is assigned to this course (unless admin)
    if (req.user.role !== 'ADMIN') {
      const assignment = await req.prisma.courseAssignment.findUnique({
        where: {
          teacherId_courseId: {
            teacherId,
            courseId
          }
        }
      });

      if (!assignment || !assignment.isActive) {
        return res.status(403).json({
          success: false,
          message: 'You are not assigned to this course'
        });
      }
    }

    // Calculate date range
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

    // Get attendance statistics
    const attendanceStats = await req.prisma.attendance.groupBy({
      by: ['status'],
      where: {
        courseId,
        date: { gte: startDate }
      },
      _count: { status: true }
    });

    // Get daily attendance trends
    const dailyAttendance = await req.prisma.attendance.groupBy({
      by: ['date'],
      where: {
        courseId,
        date: { gte: startDate }
      },
      _count: { status: true },
      orderBy: { date: 'asc' }
    });

    // Get student attendance rates
    const studentAttendance = await req.prisma.attendance.groupBy({
      by: ['studentId'],
      where: {
        courseId,
        date: { gte: startDate }
      },
      _count: { status: true }
    });

    // Get student details
    const studentIds = studentAttendance.map(sa => sa.studentId);
    const students = await req.prisma.studentProfile.findMany({
      where: { id: { in: studentIds } },
      select: { id: true, name: true, studentId: true }
    });

    const studentAttendanceWithDetails = studentAttendance.map(sa => ({
      ...sa,
      student: students.find(s => s.id === sa.studentId)
    }));

    res.json({
      success: true,
      data: {
        attendanceStats,
        dailyAttendance,
        studentAttendance: studentAttendanceWithDetails
      }
    });
  } catch (error) {
    console.error('Get course analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch course analytics'
    });
  }
});

export default router;