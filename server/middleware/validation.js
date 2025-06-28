import { body, validationResult } from 'express-validator';

export const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// Auth validation rules
export const validateRegister = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  body('role')
    .isIn(['STUDENT', 'TEACHER'])
    .withMessage('Role must be either STUDENT or TEACHER'),
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
];

export const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

// Student validation rules
export const validateAttendance = [
  body('courseId')
    .notEmpty()
    .withMessage('Course ID is required'),
  body('date')
    .isISO8601()
    .withMessage('Valid date is required'),
  body('status')
    .isIn(['PRESENT', 'ABSENT', 'EXCUSED', 'LATE'])
    .withMessage('Invalid attendance status'),
];

export const validateLeaveRequest = [
  body('reason')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Reason must be between 10 and 500 characters'),
  body('startDate')
    .isISO8601()
    .withMessage('Valid start date is required'),
  body('endDate')
    .isISO8601()
    .withMessage('Valid end date is required')
    .custom((endDate, { req }) => {
      if (new Date(endDate) < new Date(req.body.startDate)) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),
];

// Course validation rules
export const validateCourse = [
  body('name')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Course name must be between 3 and 100 characters'),
  body('code')
    .trim()
    .isLength({ min: 3, max: 20 })
    .matches(/^[A-Z0-9]+$/)
    .withMessage('Course code must be alphanumeric and uppercase'),
  body('credits')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('Credits must be between 1 and 10'),
];