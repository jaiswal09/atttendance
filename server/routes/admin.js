import express from 'express';
import bcrypt from 'bcryptjs';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { validateCourse, validateRequest } from '../middleware/validation.js';
import { body } from 'express-validator';

const router = express.Router();

// Get admin dashboard data
router.get('/dashboard', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // Get user counts
    const userCounts = await req.prisma.user.groupBy({
      by: ['role'],
      _count: { role: true },
      where: { isActive: true }
    });

    // Get total courses
    const totalCourses = await req.prisma.course.count({
      where: { isActive: true }
    });

    // Get recent activities (simplified)
    const recentUsers = await req.prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        studentProfile: { select: { name: true } },
        teacherProfile: { select: { name: true } }
      }
    });

    // Get attendance statistics
    const attendanceStats = await req.prisma.attendance.groupBy({
      by: ['status'],
      _count: { status: true },
      where: {
        date: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        }
      }
    });

    // Get pending leave requests count
    const pendingLeaves = await req.prisma.leaveRequest.count({
      where: { status: 'PENDING' }
    });

    res.json({
      success: true,
      data: {
        userCounts,
        totalCourses,
        recentUsers,
        attendanceStats,
        pendingLeaves
      }
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data'
    });
  }
});

// Get all users
router.get('/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { role, search, page = 1, limit = 20 } = req.query;

    const where = {};
    if (role) where.role = role;
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { studentProfile: { name: { contains: search, mode: 'insensitive' } } },
        { teacherProfile: { name: { contains: search, mode: 'insensitive' } } }
      ];
    }

    const [users, total] = await Promise.all([
      req.prisma.user.findMany({
        where,
        include: {
          studentProfile: true,
          teacherProfile: true
        },
        orderBy: { createdAt: 'desc' },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit)
      }),
      req.prisma.user.count({ where })
    ]);

    // Remove sensitive data
    const sanitizedUsers = users.map(user => {
      const { passwordHash, loginAttempts, lockedUntil, ...sanitizedUser } = user;
      return sanitizedUser;
    });

    res.json({
      success: true,
      data: {
        users: sanitizedUsers,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users'
    });
  }
});

// Create new user
router.post('/users',
  authenticateToken,
  requireAdmin,
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('role').isIn(['STUDENT', 'TEACHER', 'ADMIN']).withMessage('Invalid role'),
    body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
    body('studentId').optional().trim().isLength({ min: 3, max: 20 }).withMessage('Student ID must be between 3 and 20 characters')
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { email, password, role, name, studentId, phone, address } = req.body;

      // Check if user already exists
      const existingUser = await req.prisma.user.findUnique({
        where: { email }
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'User with this email already exists'
        });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS) || 12);

      // Create user with profile
      const userData = {
        email,
        passwordHash,
        role
      };

      if (role === 'STUDENT') {
        if (studentId) {
          const existingStudent = await req.prisma.studentProfile.findUnique({
            where: { studentId }
          });

          if (existingStudent) {
            return res.status(400).json({
              success: false,
              message: 'Student ID already exists'
            });
          }
        }

        userData.studentProfile = {
          create: {
            name,
            studentId: studentId || `ST${Date.now()}`,
            phone,
            address
          }
        };
      } else if (role === 'TEACHER') {
        userData.teacherProfile = {
          create: {
            name,
            phone,
            address
          }
        };
      }

      const user = await req.prisma.user.create({
        data: userData,
        include: {
          studentProfile: true,
          teacherProfile: true
        }
      });

      // Remove sensitive data
      const { passwordHash: _, loginAttempts, lockedUntil, ...userResponse } = user;

      res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: { user: userResponse }
      });
    } catch (error) {
      console.error('Create user error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create user'
      });
    }
  }
);

// Update user
router.put('/users/:userId',
  authenticateToken,
  requireAdmin,
  [
    body('name').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
    body('phone').optional().trim(),
    body('address').optional().trim(),
    body('isActive').optional().isBoolean().withMessage('isActive must be a boolean')
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { userId } = req.params;
      const { name, phone, address, isActive } = req.body;

      const user = await req.prisma.user.findUnique({
        where: { id: userId },
        include: {
          studentProfile: true,
          teacherProfile: true
        }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const updateData = {};
      if (isActive !== undefined) updateData.isActive = isActive;

      if (user.role === 'STUDENT' && user.studentProfile) {
        updateData.studentProfile = {
          update: {
            ...(name && { name }),
            ...(phone && { phone }),
            ...(address && { address })
          }
        };
      } else if (user.role === 'TEACHER' && user.teacherProfile) {
        updateData.teacherProfile = {
          update: {
            ...(name && { name }),
            ...(phone && { phone }),
            ...(address && { address })
          }
        };
      }

      const updatedUser = await req.prisma.user.update({
        where: { id: userId },
        data: updateData,
        include: {
          studentProfile: true,
          teacherProfile: true
        }
      });

      // Remove sensitive data
      const { passwordHash, loginAttempts, lockedUntil, ...userResponse } = updatedUser;

      res.json({
        success: true,
        message: 'User updated successfully',
        data: { user: userResponse }
      });
    } catch (error) {
      console.error('Update user error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update user'
      });
    }
  }
);

// Delete user
router.delete('/users/:userId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await req.prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Soft delete by deactivating
    await req.prisma.user.update({
      where: { id: userId },
      data: { isActive: false }
    });

    res.json({
      success: true,
      message: 'User deactivated successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user'
    });
  }
});

// Get all courses
router.get('/courses', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;

    const where = { isActive: true };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [courses, total] = await Promise.all([
      req.prisma.course.findMany({
        where,
        include: {
          enrollments: {
            where: { isActive: true },
            include: { student: { select: { name: true } } }
          },
          assignments: {
            where: { isActive: true },
            include: { teacher: { select: { name: true } } }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit)
      }),
      req.prisma.course.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        courses,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch courses'
    });
  }
});

// Create new course
router.post('/courses', authenticateToken, requireAdmin, validateCourse, validateRequest, async (req, res) => {
  try {
    const { name, code, description, credits } = req.body;

    const course = await req.prisma.course.create({
      data: {
        name,
        code,
        description,
        credits: credits || 3
      }
    });

    res.status(201).json({
      success: true,
      message: 'Course created successfully',
      data: { course }
    });
  } catch (error) {
    console.error('Create course error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create course'
    });
  }
});

// Update course
router.put('/courses/:courseId', authenticateToken, requireAdmin, validateCourse, validateRequest, async (req, res) => {
  try {
    const { courseId } = req.params;
    const { name, code, description, credits, isActive } = req.body;

    const course = await req.prisma.course.update({
      where: { id: courseId },
      data: {
        name,
        code,
        description,
        credits,
        ...(isActive !== undefined && { isActive })
      }
    });

    res.json({
      success: true,
      message: 'Course updated successfully',
      data: { course }
    });
  } catch (error) {
    console.error('Update course error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update course'
    });
  }
});

// Assign teacher to course
router.post('/courses/:courseId/assign-teacher',
  authenticateToken,
  requireAdmin,
  [
    body('teacherId').notEmpty().withMessage('Teacher ID is required')
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { courseId } = req.params;
      const { teacherId } = req.body;

      // Verify teacher exists
      const teacher = await req.prisma.teacherProfile.findUnique({
        where: { id: teacherId }
      });

      if (!teacher) {
        return res.status(404).json({
          success: false,
          message: 'Teacher not found'
        });
      }

      // Check if assignment already exists
      const existingAssignment = await req.prisma.courseAssignment.findUnique({
        where: {
          teacherId_courseId: {
            teacherId,
            courseId
          }
        }
      });

      if (existingAssignment) {
        if (existingAssignment.isActive) {
          return res.status(400).json({
            success: false,
            message: 'Teacher is already assigned to this course'
          });
        } else {
          // Reactivate existing assignment
          const assignment = await req.prisma.courseAssignment.update({
            where: { id: existingAssignment.id },
            data: { isActive: true },
            include: {
              teacher: { select: { name: true } },
              course: { select: { name: true, code: true } }
            }
          });

          return res.json({
            success: true,
            message: 'Teacher assigned to course successfully',
            data: { assignment }
          });
        }
      }

      // Create new assignment
      const assignment = await req.prisma.courseAssignment.create({
        data: {
          teacherId,
          courseId
        },
        include: {
          teacher: { select: { name: true } },
          course: { select: { name: true, code: true } }
        }
      });

      res.status(201).json({
        success: true,
        message: 'Teacher assigned to course successfully',
        data: { assignment }
      });
    } catch (error) {
      console.error('Assign teacher error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to assign teacher to course'
      });
    }
  }
);

// Enroll student in course
router.post('/courses/:courseId/enroll-student',
  authenticateToken,
  requireAdmin,
  [
    body('studentId').notEmpty().withMessage('Student ID is required')
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { courseId } = req.params;
      const { studentId } = req.body;

      // Verify student exists
      const student = await req.prisma.studentProfile.findUnique({
        where: { id: studentId }
      });

      if (!student) {
        return res.status(404).json({
          success: false,
          message: 'Student not found'
        });
      }

      // Check if enrollment already exists
      const existingEnrollment = await req.prisma.enrollment.findUnique({
        where: {
          studentId_courseId: {
            studentId,
            courseId
          }
        }
      });

      if (existingEnrollment) {
        if (existingEnrollment.isActive) {
          return res.status(400).json({
            success: false,
            message: 'Student is already enrolled in this course'
          });
        } else {
          // Reactivate existing enrollment
          const enrollment = await req.prisma.enrollment.update({
            where: { id: existingEnrollment.id },
            data: { isActive: true },
            include: {
              student: { select: { name: true, studentId: true } },
              course: { select: { name: true, code: true } }
            }
          });

          return res.json({
            success: true,
            message: 'Student enrolled in course successfully',
            data: { enrollment }
          });
        }
      }

      // Create new enrollment
      const enrollment = await req.prisma.enrollment.create({
        data: {
          studentId,
          courseId
        },
        include: {
          student: { select: { name: true, studentId: true } },
          course: { select: { name: true, code: true } }
        }
      });

      res.status(201).json({
        success: true,
        message: 'Student enrolled in course successfully',
        data: { enrollment }
      });
    } catch (error) {
      console.error('Enroll student error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to enroll student in course'
      });
    }
  }
);

// Get all attendance records
router.get('/attendance', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { courseId, studentId, startDate, endDate, status, page = 1, limit = 50 } = req.query;

    const where = {};
    if (courseId) where.courseId = courseId;
    if (studentId) where.studentId = studentId;
    if (status) where.status = status;
    if (startDate) where.date = { ...where.date, gte: new Date(startDate) };
    if (endDate) where.date = { ...where.date, lte: new Date(endDate) };

    const [attendances, total] = await Promise.all([
      req.prisma.attendance.findMany({
        where,
        include: {
          student: { select: { name: true, studentId: true } },
          course: { select: { name: true, code: true } },
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
      message: 'Failed to fetch attendance records'
    });
  }
});

// Get all leave requests
router.get('/leave-requests', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { status, studentId, page = 1, limit = 20 } = req.query;

    const where = {};
    if (status) where.status = status;
    if (studentId) where.studentId = studentId;

    const [leaveRequests, total] = await Promise.all([
      req.prisma.leaveRequest.findMany({
        where,
        include: {
          student: { select: { name: true, studentId: true } },
          reviewer: { select: { name: true } }
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

// Get system analytics
router.get('/analytics', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { period = 'month' } = req.query;

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
      where: { date: { gte: startDate } },
      _count: { status: true }
    });

    // Get daily attendance trends
    const dailyAttendance = await req.prisma.attendance.groupBy({
      by: ['date'],
      where: { date: { gte: startDate } },
      _count: { status: true },
      orderBy: { date: 'asc' }
    });

    // Get course-wise attendance
    const courseAttendance = await req.prisma.attendance.groupBy({
      by: ['courseId'],
      where: { date: { gte: startDate } },
      _count: { status: true }
    });

    // Get course details
    const courseIds = courseAttendance.map(ca => ca.courseId);
    const courses = await req.prisma.course.findMany({
      where: { id: { in: courseIds } },
      select: { id: true, name: true, code: true }
    });

    const courseAttendanceWithDetails = courseAttendance.map(ca => ({
      ...ca,
      course: courses.find(c => c.id === ca.courseId)
    }));

    // Get user registration trends
    const userRegistrations = await req.prisma.user.groupBy({
      by: ['role'],
      where: { createdAt: { gte: startDate } },
      _count: { role: true }
    });

    res.json({
      success: true,
      data: {
        attendanceStats,
        dailyAttendance,
        courseAttendance: courseAttendanceWithDetails,
        userRegistrations
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