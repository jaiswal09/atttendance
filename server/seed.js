import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create admin user
  const adminPasswordHash = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@rsams.edu' },
    update: {},
    create: {
      email: 'admin@rsams.edu',
      passwordHash: adminPasswordHash,
      role: 'ADMIN'
    }
  });

  console.log('✅ Admin user created');

  // Create sample courses
  const courses = await Promise.all([
    prisma.course.upsert({
      where: { code: 'CS101' },
      update: {},
      create: {
        name: 'Introduction to Computer Science',
        code: 'CS101',
        description: 'Basic concepts of computer science and programming',
        credits: 3
      }
    }),
    prisma.course.upsert({
      where: { code: 'CS201' },
      update: {},
      create: {
        name: 'Data Structures and Algorithms',
        code: 'CS201',
        description: 'Advanced data structures and algorithm design',
        credits: 4
      }
    }),
    prisma.course.upsert({
      where: { code: 'MATH101' },
      update: {},
      create: {
        name: 'Calculus I',
        code: 'MATH101',
        description: 'Differential and integral calculus',
        credits: 3
      }
    }),
    prisma.course.upsert({
      where: { code: 'PHYS101' },
      update: {},
      create: {
        name: 'Physics I',
        code: 'PHYS101',
        description: 'Mechanics and thermodynamics',
        credits: 4
      }
    })
  ]);

  console.log('✅ Sample courses created');

  // Create sample teachers
  const teacherPasswordHash = await bcrypt.hash('teacher123', 12);
  const teachers = await Promise.all([
    prisma.user.upsert({
      where: { email: 'sarah.johnson@rsams.edu' },
      update: {},
      create: {
        email: 'sarah.johnson@rsams.edu',
        passwordHash: teacherPasswordHash,
        role: 'TEACHER',
        teacherProfile: {
          create: {
            name: 'Dr. Sarah Johnson',
            phone: '+1-555-0101',
            address: '123 University Ave, Academic City'
          }
        }
      }
    }),
    prisma.user.upsert({
      where: { email: 'michael.brown@rsams.edu' },
      update: {},
      create: {
        email: 'michael.brown@rsams.edu',
        passwordHash: teacherPasswordHash,
        role: 'TEACHER',
        teacherProfile: {
          create: {
            name: 'Dr. Michael Brown',
            phone: '+1-555-0102',
            address: '456 College St, Academic City'
          }
        }
      }
    }),
    prisma.user.upsert({
      where: { email: 'emily.davis@rsams.edu' },
      update: {},
      create: {
        email: 'emily.davis@rsams.edu',
        passwordHash: teacherPasswordHash,
        role: 'TEACHER',
        teacherProfile: {
          create: {
            name: 'Prof. Emily Davis',
            phone: '+1-555-0103',
            address: '789 Education Blvd, Academic City'
          }
        }
      }
    })
  ]);

  console.log('✅ Sample teachers created');

  // Create sample students
  const studentPasswordHash = await bcrypt.hash('student123', 12);
  const students = await Promise.all([
    prisma.user.upsert({
      where: { email: 'john.smith@student.rsams.edu' },
      update: {},
      create: {
        email: 'john.smith@student.rsams.edu',
        passwordHash: studentPasswordHash,
        role: 'STUDENT',
        studentProfile: {
          create: {
            name: 'John Smith',
            studentId: 'ST2024001',
            phone: '+1-555-1001',
            address: '100 Student Housing, Campus'
          }
        }
      }
    }),
    prisma.user.upsert({
      where: { email: 'emma.wilson@student.rsams.edu' },
      update: {},
      create: {
        email: 'emma.wilson@student.rsams.edu',
        passwordHash: studentPasswordHash,
        role: 'STUDENT',
        studentProfile: {
          create: {
            name: 'Emma Wilson',
            studentId: 'ST2024002',
            phone: '+1-555-1002',
            address: '101 Student Housing, Campus'
          }
        }
      }
    }),
    prisma.user.upsert({
      where: { email: 'alex.johnson@student.rsams.edu' },
      update: {},
      create: {
        email: 'alex.johnson@student.rsams.edu',
        passwordHash: studentPasswordHash,
        role: 'STUDENT',
        studentProfile: {
          create: {
            name: 'Alex Johnson',
            studentId: 'ST2024003',
            phone: '+1-555-1003',
            address: '102 Student Housing, Campus'
          }
        }
      }
    }),
    prisma.user.upsert({
      where: { email: 'maria.garcia@student.rsams.edu' },
      update: {},
      create: {
        email: 'maria.garcia@student.rsams.edu',
        passwordHash: studentPasswordHash,
        role: 'STUDENT',
        studentProfile: {
          create: {
            name: 'Maria Garcia',
            studentId: 'ST2024004',
            phone: '+1-555-1004',
            address: '103 Student Housing, Campus'
          }
        }
      }
    })
  ]);

  console.log('✅ Sample students created');

  // Get teacher and student profiles
  const teacherProfiles = await prisma.teacherProfile.findMany();
  const studentProfiles = await prisma.studentProfile.findMany();

  // Assign teachers to courses
  const courseAssignments = await Promise.all([
    // Dr. Sarah Johnson -> CS101, CS201
    prisma.courseAssignment.upsert({
      where: {
        teacherId_courseId: {
          teacherId: teacherProfiles[0].id,
          courseId: courses[0].id
        }
      },
      update: {},
      create: {
        teacherId: teacherProfiles[0].id,
        courseId: courses[0].id
      }
    }),
    prisma.courseAssignment.upsert({
      where: {
        teacherId_courseId: {
          teacherId: teacherProfiles[0].id,
          courseId: courses[1].id
        }
      },
      update: {},
      create: {
        teacherId: teacherProfiles[0].id,
        courseId: courses[1].id
      }
    }),
    // Dr. Michael Brown -> MATH101
    prisma.courseAssignment.upsert({
      where: {
        teacherId_courseId: {
          teacherId: teacherProfiles[1].id,
          courseId: courses[2].id
        }
      },
      update: {},
      create: {
        teacherId: teacherProfiles[1].id,
        courseId: courses[2].id
      }
    }),
    // Prof. Emily Davis -> PHYS101
    prisma.courseAssignment.upsert({
      where: {
        teacherId_courseId: {
          teacherId: teacherProfiles[2].id,
          courseId: courses[3].id
        }
      },
      update: {},
      create: {
        teacherId: teacherProfiles[2].id,
        courseId: courses[3].id
      }
    })
  ]);

  console.log('✅ Teacher course assignments created');

  // Enroll students in courses
  const enrollments = [];
  for (const student of studentProfiles) {
    // Each student enrolled in 2-3 courses
    const coursesToEnroll = courses.slice(0, Math.floor(Math.random() * 2) + 2);
    
    for (const course of coursesToEnroll) {
      const enrollment = await prisma.enrollment.upsert({
        where: {
          studentId_courseId: {
            studentId: student.id,
            courseId: course.id
          }
        },
        update: {},
        create: {
          studentId: student.id,
          courseId: course.id
        }
      });
      enrollments.push(enrollment);
    }
  }

  console.log('✅ Student enrollments created');

  // Create sample attendance records for the last 30 days
  const attendanceRecords = [];
  const today = new Date();
  const statuses = ['PRESENT', 'ABSENT', 'EXCUSED', 'LATE'];

  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    // Skip weekends
    if (date.getDay() === 0 || date.getDay() === 6) continue;

    for (const enrollment of enrollments) {
      // 85% chance of having attendance record for each day
      if (Math.random() > 0.15) {
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        // Higher probability for PRESENT
        const finalStatus = Math.random() > 0.2 ? 'PRESENT' : status;

        try {
          const attendance = await prisma.attendance.upsert({
            where: {
              studentId_courseId_date: {
                studentId: enrollment.studentId,
                courseId: enrollment.courseId,
                date: date
              }
            },
            update: {},
            create: {
              studentId: enrollment.studentId,
              courseId: enrollment.courseId,
              date: date,
              status: finalStatus
            }
          });
          attendanceRecords.push(attendance);
        } catch (error) {
          // Skip if already exists
        }
      }
    }
  }

  console.log('✅ Sample attendance records created');

  // Create sample leave requests
  const leaveRequests = await Promise.all([
    prisma.leaveRequest.create({
      data: {
        studentId: studentProfiles[0].id,
        reason: 'Medical appointment with specialist',
        startDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
        endDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        status: 'PENDING'
      }
    }),
    prisma.leaveRequest.create({
      data: {
        studentId: studentProfiles[1].id,
        reason: 'Family emergency - need to travel home',
        startDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        status: 'PENDING'
      }
    }),
    prisma.leaveRequest.create({
      data: {
        studentId: studentProfiles[2].id,
        reason: 'Job interview opportunity',
        startDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        endDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        status: 'APPROVED',
        reviewedBy: teacherProfiles[0].id,
        reviewNotes: 'Approved for career development',
        reviewedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)
      }
    })
  ]);

  console.log('✅ Sample leave requests created');

  console.log('🎉 Database seeding completed successfully!');
  console.log('\n📋 Demo Accounts:');
  console.log('Admin: admin@rsams.edu / admin123');
  console.log('Teacher: sarah.johnson@rsams.edu / teacher123');
  console.log('Student: john.smith@student.rsams.edu / student123');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });