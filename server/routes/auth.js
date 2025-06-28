import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { validateRegister, validateLogin, validateRequest } from '../middleware/validation.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Register new user
router.post('/register', validateRegister, validateRequest, async (req, res) => {
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
      // Check if student ID already exists
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

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Remove password hash from response
    const { passwordHash: _ignored, ...userResponse } = user;

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: userResponse,
        token
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Login user
router.post('/login', validateLogin, validateRequest, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user with profile data
    const user = await req.prisma.user.findUnique({
      where: { email },
      include: {
        studentProfile: {
          include: {
            enrollments: {
              include: {
                course: true
              }
            }
          }
        },
        teacherProfile: {
          include: {
            courseAssignments: {
              include: {
                course: true
              }
            }
          }
        }
      }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if account is locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      return res.status(423).json({
        success: false,
        message: 'Account is temporarily locked due to too many failed login attempts'
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);

    if (!isValidPassword) {
      // Increment login attempts
      const updates = {
        loginAttempts: user.loginAttempts + 1
      };

      // Lock account if too many attempts
      const maxAttempts = parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 5;
      if (updates.loginAttempts >= maxAttempts) {
        const lockTime = parseInt(process.env.LOCK_TIME) || 30 * 60 * 1000; // 30 minutes
        updates.lockedUntil = new Date(Date.now() + lockTime);
      }

      await req.prisma.user.update({
        where: { id: user.id },
        data: updates
      });

      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    // Reset login attempts and update last login
    await req.prisma.user.update({
      where: { id: user.id },
      data: {
        loginAttempts: 0,
        lockedUntil: null,
        lastLogin: new Date()
      }
    });

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Remove sensitive data from response
    const { passwordHash, loginAttempts, lockedUntil, ...userResponse } = user;

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: userResponse,
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get current user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const { passwordHash, loginAttempts, lockedUntil, ...userResponse } = req.user;
    
    res.json({
      success: true,
      data: { user: userResponse }
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile'
    });
  }
});

// Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { name, phone, address } = req.body;
    const userId = req.user.id;

    let updatedUser;

    if (req.user.role === 'STUDENT') {
      updatedUser = await req.prisma.user.update({
        where: { id: userId },
        data: {
          studentProfile: {
            update: {
              name,
              phone,
              address
            }
          }
        },
        include: {
          studentProfile: {
            include: {
              enrollments: {
                include: {
                  course: true
                }
              }
            }
          }
        }
      });
    } else if (req.user.role === 'TEACHER') {
      updatedUser = await req.prisma.user.update({
        where: { id: userId },
        data: {
          teacherProfile: {
            update: {
              name,
              phone,
              address
            }
          }
        },
        include: {
          teacherProfile: {
            include: {
              courseAssignments: {
                include: {
                  course: true
                }
              }
            }
          }
        }
      });
    }

    const { passwordHash, loginAttempts, lockedUntil, ...userResponse } = updatedUser;

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { user: userResponse }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
});

// Change password
router.put('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    // Validate new password
    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 8 characters long'
      });
    }

    // Verify current password
    const user = await req.prisma.user.findUnique({
      where: { id: userId }
    });

    const isValidPassword = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValidPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, parseInt(process.env.BCRYPT_ROUNDS) || 12);

    // Update password
    await req.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash }
    });

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password'
    });
  }
});

export default router;