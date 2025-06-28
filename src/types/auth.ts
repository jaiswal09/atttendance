
export interface User {
  id: string;
  email: string;
  role: 'STUDENT' | 'TEACHER' | 'ADMIN';
  studentProfile?: StudentProfile;
  teacherProfile?: TeacherProfile;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface StudentProfile {
  id: string;
  userId: string;
  name: string;
  studentId: string;
  phone?: string;
  address?: string;
  enrollments?: Enrollment[];
}

export interface TeacherProfile {
  id: string;
  userId: string;
  name: string;
  phone?: string;
  address?: string;
  courseAssignments?: CourseAssignment[];
}

export interface Course {
  id: string;
  name: string;
  code: string;
  description?: string;
  credits?: number;
  isActive?: boolean;
}

export interface Enrollment {
  id: string;
  studentId: string;
  courseId: string;
  course: Course;
  enrolledAt: string;
  isActive: boolean;
}

export interface CourseAssignment {
  id: string;
  teacherId: string;
  courseId: string;
  course: Course;
  assignedAt: string;
  isActive: boolean;
}

export interface Attendance {
  id: string;
  studentId: string;
  courseId: string;
  sessionId?: string;
  date: string;
  status: 'PRESENT' | 'ABSENT' | 'EXCUSED' | 'LATE';
  notes?: string;
  markedAt: string;
  updatedAt: string;
  student?: StudentProfile;
  course?: Course;
}

export interface LeaveRequest {
  id: string;
  studentId: string;
  reason: string;
  startDate: string;
  endDate: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewedBy?: string;
  reviewNotes?: string;
  createdAt: string;
  updatedAt: string;
  reviewedAt?: string;
  student?: StudentProfile;
  reviewer?: TeacherProfile;
}