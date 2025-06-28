# RSAMS Backend Setup Guide

## Prerequisites

1. **Node.js** (v18 or higher)
2. **PostgreSQL** database
3. **npm** or **yarn** package manager

## Environment Setup

1. **Copy environment file:**
   ```bash
   cp .env.example .env
   ```

2. **Configure your `.env` file:**
   ```env
   # Database - Replace with your PostgreSQL connection string
   DATABASE_URL="postgresql://username:password@localhost:5432/rsams_db?schema=public"

   # JWT Configuration
   JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
   JWT_EXPIRES_IN="7d"

   # Server Configuration
   PORT=3001
   NODE_ENV="development"

   # CORS Configuration
   FRONTEND_URL="http://localhost:5173"

   # Security Settings
   BCRYPT_ROUNDS=12
   MAX_LOGIN_ATTEMPTS=5
   LOCK_TIME=1800000

   # Rate Limiting
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100
   ```

## Database Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Generate Prisma client:**
   ```bash
   npm run db:generate
   ```

3. **Run database migrations:**
   ```bash
   npm run db:migrate
   ```

4. **Seed the database with sample data:**
   ```bash
   npm run db:seed
   ```

## Running the Application

### Development Mode

1. **Start both frontend and backend:**
   ```bash
   npm run dev
   ```

   Or run them separately:

2. **Start backend only:**
   ```bash
   npm run dev:server
   ```

3. **Start frontend only:**
   ```bash
   npm run dev:client
   ```

### Production Mode

1. **Build the frontend:**
   ```bash
   npm run build
   ```

2. **Start the server:**
   ```bash
   npm run server
   ```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get current user profile
- `PUT /api/auth/profile` - Update user profile
- `PUT /api/auth/change-password` - Change password

### Student Routes
- `GET /api/student/dashboard` - Get student dashboard data
- `POST /api/student/attendance` - Mark attendance
- `GET /api/student/attendance` - Get attendance history
- `POST /api/student/leave-request` - Submit leave request
- `GET /api/student/leave-requests` - Get leave requests
- `GET /api/student/analytics` - Get attendance analytics

### Teacher Routes
- `GET /api/teacher/dashboard` - Get teacher dashboard data
- `GET /api/teacher/course/:courseId/students` - Get course students
- `GET /api/teacher/course/:courseId/attendance` - Get course attendance
- `POST /api/teacher/attendance` - Create attendance record
- `PUT /api/teacher/attendance/:attendanceId` - Update attendance
- `GET /api/teacher/leave-requests` - Get leave requests
- `PUT /api/teacher/leave-request/:requestId` - Review leave request
- `GET /api/teacher/course/:courseId/analytics` - Get course analytics

### Admin Routes
- `GET /api/admin/dashboard` - Get admin dashboard data
- `GET /api/admin/users` - Get all users
- `POST /api/admin/users` - Create new user
- `PUT /api/admin/users/:userId` - Update user
- `DELETE /api/admin/users/:userId` - Delete user
- `GET /api/admin/courses` - Get all courses
- `POST /api/admin/courses` - Create new course
- `PUT /api/admin/courses/:courseId` - Update course
- `POST /api/admin/courses/:courseId/assign-teacher` - Assign teacher to course
- `POST /api/admin/courses/:courseId/enroll-student` - Enroll student in course
- `GET /api/admin/attendance` - Get all attendance records
- `GET /api/admin/leave-requests` - Get all leave requests
- `GET /api/admin/analytics` - Get system analytics

## Database Management

### Prisma Studio (Database GUI)
```bash
npm run db:studio
```

### Reset Database
```bash
npx prisma migrate reset
npm run db:seed
```

### Generate New Migration
```bash
npx prisma migrate dev --name migration_name
```

## Demo Accounts

After seeding, you can use these accounts:

**Admin:**
- Email: `admin@rsams.edu`
- Password: `admin123`

**Teacher:**
- Email: `sarah.johnson@rsams.edu`
- Password: `teacher123`

**Student:**
- Email: `john.smith@student.rsams.edu`
- Password: `student123`

## Security Features

- **JWT Authentication** with secure token handling
- **Password Hashing** using bcrypt with configurable rounds
- **Rate Limiting** to prevent abuse
- **Account Locking** after failed login attempts
- **Input Validation** using express-validator
- **CORS Protection** with configurable origins
- **Helmet** for security headers
- **SQL Injection Protection** via Prisma ORM

## Error Handling

The API includes comprehensive error handling:
- Validation errors with detailed field information
- Authentication and authorization errors
- Database constraint violations
- Rate limiting responses
- Graceful server shutdown

## Monitoring and Logging

- Request logging with response times
- Error logging with stack traces (development only)
- Audit logging for admin actions
- Health check endpoint at `/api/health`

## Deployment

For production deployment:

1. Set `NODE_ENV=production` in your environment
2. Use a production PostgreSQL database
3. Generate a strong JWT secret
4. Configure proper CORS origins
5. Set up SSL/TLS encryption
6. Use a process manager like PM2
7. Set up database backups
8. Configure monitoring and logging

## Troubleshooting

**Database Connection Issues:**
- Verify PostgreSQL is running
- Check DATABASE_URL format
- Ensure database exists

**Migration Errors:**
- Reset database: `npx prisma migrate reset`
- Check for schema conflicts
- Verify Prisma version compatibility

**Authentication Issues:**
- Verify JWT_SECRET is set
- Check token expiration settings
- Ensure proper CORS configuration

**Performance Issues:**
- Add database indexes for frequently queried fields
- Implement pagination for large datasets
- Use database connection pooling
- Monitor query performance with Prisma logs