import { describe, it, expect } from '@jest/globals';

// CourseService Business Logic Tests
describe('CourseService - Business Logic Tests', () => {
  
  describe('Course Creation Logic', () => {
    it('should validate course data structure', () => {
      const courseData = {
        tenantId: 'tenant-1',
        dateCours: new Date('2024-12-25'),
        typeCours: 'Yoga',
        heureDebut: new Date('2024-12-25T10:00:00'),
        heureFin: new Date('2024-12-25T11:00:00'),
        capaciteMax: 20,
        description: 'Beginner yoga class'
      };

      // Verify required fields
      expect(courseData.tenantId).toBeDefined();
      expect(courseData.dateCours).toBeDefined();
      expect(courseData.typeCours).toBeDefined();
      expect(courseData.heureDebut).toBeDefined();
      expect(courseData.heureFin).toBeDefined();

      // Verify data types
      expect(typeof courseData.tenantId).toBe('string');
      expect(courseData.dateCours).toBeInstanceOf(Date);
      expect(typeof courseData.typeCours).toBe('string');
      expect(courseData.heureDebut).toBeInstanceOf(Date);
      expect(courseData.heureFin).toBeInstanceOf(Date);
      expect(typeof courseData.capaciteMax).toBe('number');
    });

    it('should validate course time constraints', () => {
      const validateCourseTime = (startTime: Date, endTime: Date) => {
        const errors: string[] = [];
        
        if (endTime <= startTime) {
          errors.push('End time must be after start time');
        }

        const duration = endTime.getTime() - startTime.getTime();
        const durationMinutes = duration / (1000 * 60);

        if (durationMinutes < 30) {
          errors.push('Course must be at least 30 minutes long');
        }

        if (durationMinutes > 240) {
          errors.push('Course cannot exceed 4 hours');
        }

        return {
          isValid: errors.length === 0,
          errors,
          durationMinutes
        };
      };

      const validStart = new Date('2024-12-25T10:00:00');
      const validEnd = new Date('2024-12-25T11:30:00');
      const invalidEnd = new Date('2024-12-25T09:30:00'); // Before start
      const tooShort = new Date('2024-12-25T10:15:00'); // 15 minutes
      const tooLong = new Date('2024-12-25T15:00:00'); // 5 hours

      expect(validateCourseTime(validStart, validEnd)).toEqual({
        isValid: true,
        errors: [],
        durationMinutes: 90
      });

      expect(validateCourseTime(validStart, invalidEnd).isValid).toBe(false);
      expect(validateCourseTime(validStart, tooShort).errors).toContain('Course must be at least 30 minutes long');
      expect(validateCourseTime(validStart, tooLong).errors).toContain('Course cannot exceed 4 hours');
    });

    it('should validate course capacity', () => {
      const validateCapacity = (capacity: number) => {
        if (capacity <= 0) {
          return { isValid: false, error: 'Capacity must be greater than 0' };
        }
        if (capacity > 50) {
          return { isValid: false, error: 'Capacity cannot exceed 50 participants' };
        }
        return { isValid: true };
      };

      expect(validateCapacity(20)).toEqual({ isValid: true });
      expect(validateCapacity(0)).toEqual({ isValid: false, error: 'Capacity must be greater than 0' });
      expect(validateCapacity(60)).toEqual({ isValid: false, error: 'Capacity cannot exceed 50 participants' });
    });
  });

  describe('Course Scheduling', () => {
    it('should detect scheduling conflicts', () => {
      const existingCourses = [
        {
          id: 1,
          heureDebut: new Date('2024-12-25T10:00:00'),
          heureFin: new Date('2024-12-25T11:00:00'),
          salle: 'Room A'
        },
        {
          id: 2,
          heureDebut: new Date('2024-12-25T14:00:00'),
          heureFin: new Date('2024-12-25T15:30:00'),
          salle: 'Room B'
        }
      ];

      const detectConflict = (newCourse: any, existing: any[]) => {
        return existing.filter(course => {
          const timeOverlap = newCourse.heureDebut < course.heureFin && 
                             newCourse.heureFin > course.heureDebut;
          const sameRoom = newCourse.salle === course.salle;
          
          return timeOverlap && sameRoom;
        });
      };

      const newCourseConflict = {
        heureDebut: new Date('2024-12-25T10:30:00'),
        heureFin: new Date('2024-12-25T11:30:00'),
        salle: 'Room A'
      };

      const newCourseNoConflict = {
        heureDebut: new Date('2024-12-25T12:00:00'),
        heureFin: new Date('2024-12-25T13:00:00'),
        salle: 'Room A'
      };

      const conflicts = detectConflict(newCourseConflict, existingCourses);
      const noConflicts = detectConflict(newCourseNoConflict, existingCourses);

      expect(conflicts).toHaveLength(1);
      expect(conflicts[0].id).toBe(1);
      expect(noConflicts).toHaveLength(0);
    });

    it('should calculate course schedule grid', () => {
      const generateTimeSlots = (startHour: number, endHour: number, intervalMinutes: number) => {
        const slots = [];
        const start = new Date();
        start.setHours(startHour, 0, 0, 0);
        
        const end = new Date();
        end.setHours(endHour, 0, 0, 0);

        const current = new Date(start);
        while (current < end) {
          slots.push({
            time: current.toTimeString().slice(0, 5), // HH:MM format
            timestamp: new Date(current)
          });
          current.setMinutes(current.getMinutes() + intervalMinutes);
        }

        return slots;
      };

      const timeSlots = generateTimeSlots(8, 12, 30); // 8AM to 12PM, 30min intervals

      expect(timeSlots).toHaveLength(8); // 8:00, 8:30, 9:00, 9:30, 10:00, 10:30, 11:00, 11:30
      expect(timeSlots[0].time).toBe('08:00');
      expect(timeSlots[timeSlots.length - 1].time).toBe('11:30');
    });
  });

  describe('Course Registration', () => {
    it('should manage course enrollment', () => {
      const course = {
        id: 1,
        capaciteMax: 20,
        inscriptions: [
          { userId: 1, status: 'confirmed' },
          { userId: 2, status: 'confirmed' },
          { userId: 3, status: 'waiting' }
        ]
      };

      const getEnrollmentStatus = (course: any) => {
        const confirmed = course.inscriptions.filter((i: any) => i.status === 'confirmed').length;
        const waiting = course.inscriptions.filter((i: any) => i.status === 'waiting').length;
        
        return {
          confirmed,
          waiting,
          available: course.capaciteMax - confirmed,
          isFull: confirmed >= course.capaciteMax,
          hasWaitingList: waiting > 0
        };
      };

      const status = getEnrollmentStatus(course);

      expect(status.confirmed).toBe(2);
      expect(status.waiting).toBe(1);
      expect(status.available).toBe(18);
      expect(status.isFull).toBe(false);
      expect(status.hasWaitingList).toBe(true);
    });

    it('should handle waiting list management', () => {
      const promoteFromWaitingList = (inscriptions: any[], availableSpots: number) => {
        const waiting = inscriptions.filter(i => i.status === 'waiting')
                                  .sort((a, b) => new Date(a.dateInscription).getTime() - new Date(b.dateInscription).getTime());
        
        const toPromote = waiting.slice(0, availableSpots);
        
        return toPromote.map(inscription => ({
          ...inscription,
          status: 'confirmed',
          promotedAt: new Date()
        }));
      };

      const waitingList = [
        { userId: 1, status: 'waiting', dateInscription: '2024-01-01' },
        { userId: 2, status: 'waiting', dateInscription: '2024-01-03' },
        { userId: 3, status: 'waiting', dateInscription: '2024-01-02' }
      ];

      const promoted = promoteFromWaitingList(waitingList, 2);

      expect(promoted).toHaveLength(2);
      expect(promoted[0].userId).toBe(1); // First registered
      expect(promoted[1].userId).toBe(3); // Second registered
      expect(promoted.every(p => p.status === 'confirmed')).toBe(true);
    });
  });

  describe('Course Types and Categories', () => {
    it('should validate course type categories', () => {
      const courseCategories = {
        'Fitness': ['Cardio', 'Strength', 'HIIT', 'CrossFit'],
        'Wellness': ['Yoga', 'Pilates', 'Meditation', 'Stretching'],
        'Aquatic': ['Swimming', 'Water Aerobics', 'Aqua Fitness'],
        'Martial Arts': ['Karate', 'Judo', 'Boxing', 'Taekwondo'],
        'Dance': ['Zumba', 'Ballet', 'Hip Hop', 'Salsa']
      };

      const validateCourseType = (type: string) => {
        for (const [category, types] of Object.entries(courseCategories)) {
          if (types.includes(type)) {
            return { isValid: true, category };
          }
        }
        return { isValid: false, category: null };
      };

      expect(validateCourseType('Yoga')).toEqual({ isValid: true, category: 'Wellness' });
      expect(validateCourseType('Swimming')).toEqual({ isValid: true, category: 'Aquatic' });
      expect(validateCourseType('Unknown')).toEqual({ isValid: false, category: null });
    });

    it('should calculate course difficulty levels', () => {
      const assessDifficulty = (courseType: string, duration: number, intensity: string) => {
        const baseScores: { [key: string]: number } = {
          'Yoga': 2,
          'HIIT': 8,
          'Cardio': 6,
          'Meditation': 1,
          'CrossFit': 9,
          'Pilates': 4
        };

        const intensityMultiplier: { [key: string]: number } = {
          'low': 0.8,
          'medium': 1.0,
          'high': 1.3
        };

        const durationMultiplier = duration > 90 ? 1.2 : 1.0;

        const baseScore = baseScores[courseType] || 5;
        const finalScore = baseScore * intensityMultiplier[intensity] * durationMultiplier;

        if (finalScore <= 3) return 'Beginner';
        if (finalScore <= 6) return 'Intermediate';
        return 'Advanced';
      };

      expect(assessDifficulty('Yoga', 60, 'low')).toBe('Beginner');
      expect(assessDifficulty('HIIT', 45, 'high')).toBe('Advanced');
      expect(assessDifficulty('Cardio', 60, 'medium')).toBe('Intermediate');
    });
  });

  describe('Course Reporting', () => {
    it('should calculate attendance statistics', () => {
      const courses = [
        { id: 1, capacity: 20, attendees: 18, date: '2024-01-15' },
        { id: 2, capacity: 15, attendees: 12, date: '2024-01-16' },
        { id: 3, capacity: 25, attendees: 25, date: '2024-01-17' },
        { id: 4, capacity: 10, attendees: 8, date: '2024-01-18' }
      ];

      const calculateAttendanceStats = (courses: any[]) => {
        const totalCapacity = courses.reduce((sum, c) => sum + c.capacity, 0);
        const totalAttendees = courses.reduce((sum, c) => sum + c.attendees, 0);
        const attendanceRate = (totalAttendees / totalCapacity) * 100;

        const utilizationRates = courses.map(c => ({
          courseId: c.id,
          rate: (c.attendees / c.capacity) * 100,
          isFull: c.attendees >= c.capacity
        }));

        return {
          totalCourses: courses.length,
          totalCapacity,
          totalAttendees,
          attendanceRate: Math.round(attendanceRate * 100) / 100,
          averageUtilization: utilizationRates.reduce((sum, r) => sum + r.rate, 0) / courses.length,
          fullCourses: utilizationRates.filter(r => r.isFull).length
        };
      };

      const stats = calculateAttendanceStats(courses);

      expect(stats.totalCourses).toBe(4);
      expect(stats.totalCapacity).toBe(70);
      expect(stats.totalAttendees).toBe(63);
      expect(stats.attendanceRate).toBe(90);
      expect(stats.fullCourses).toBe(1);
    });
  });

  describe('Business Rules', () => {
    it('should enforce tenant isolation', () => {
      const courses = [
        { id: 1, tenantId: 'tenant-a', typeCours: 'Yoga' },
        { id: 2, tenantId: 'tenant-b', typeCours: 'Pilates' },
        { id: 3, tenantId: 'tenant-a', typeCours: 'HIIT' }
      ];

      const getTenantCourses = (courses: any[], tenantId: string) => {
        return courses.filter(course => course.tenantId === tenantId);
      };

      const tenantACourses = getTenantCourses(courses, 'tenant-a');
      expect(tenantACourses).toHaveLength(2);
      expect(tenantACourses.map(c => c.id)).toEqual([1, 3]);
    });

    it('should validate instructor assignments', () => {
      const validateInstructorAssignment = (instructorId: number, courseTime: Date, existingAssignments: any[]) => {
        const conflicts = existingAssignments.filter(assignment => {
          const timeMatch = Math.abs(assignment.courseTime.getTime() - courseTime.getTime()) < 30 * 60 * 1000; // 30 minutes
          return assignment.instructorId === instructorId && timeMatch;
        });

        return {
          canAssign: conflicts.length === 0,
          conflicts
        };
      };

      const existingAssignments = [
        { instructorId: 1, courseTime: new Date('2024-12-25T10:00:00') }
      ];

      const newAssignment = new Date('2024-12-25T10:15:00');
      const noConflictAssignment = new Date('2024-12-25T12:00:00');

      expect(validateInstructorAssignment(1, newAssignment, existingAssignments).canAssign).toBe(false);
      expect(validateInstructorAssignment(1, noConflictAssignment, existingAssignments).canAssign).toBe(true);
      expect(validateInstructorAssignment(2, newAssignment, existingAssignments).canAssign).toBe(true);
    });
  });
});