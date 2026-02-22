/**
 * TeacherCard Stories
 *
 * Storybook stories for the TeacherCard component
 * Demonstrates various teacher states and configurations
 */

import type { Meta, StoryObj } from '@storybook/react';
import { TeacherCard } from './TeacherCard';

// ============================================================================
// Meta Configuration
// ============================================================================

const meta: Meta<typeof TeacherCard> = {
  title: 'Features/Teachers/TeacherCard',
  component: TeacherCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    id: { control: 'text' },
    userId: { control: 'text' },
    firstName: { control: 'text' },
    lastName: { control: 'text' },
    email: { control: 'text' },
    phone: { control: 'text' },
    specialization: { control: 'text' },
    bio: { control: 'text' },
    certifications: { control: 'text' },
    active: { control: 'boolean' },
    hireDate: { control: 'date' },
    coursesCount: { control: 'number' },
    avatar: { control: 'text' },
    onClick: { action: 'clicked' },
    onEdit: { action: 'edit' },
    onDelete: { action: 'delete' },
    onViewCourses: { action: 'view-courses' },
  },
};

export default meta;
type Story = StoryObj<typeof TeacherCard>;

// ============================================================================
// Stories
// ============================================================================

/**
 * Default TeacherCard
 * Basic teacher card with essential information
 */
export const Default: Story = {
  args: {
    id: '1',
    userId: '101',
    firstName: 'Marie',
    lastName: 'Dubois',
    email: 'marie.dubois@clubmanager.com',
    phone: '+32 475 12 34 56',
    specialization: 'Danse Classique',
    bio: 'Professeur de danse classique avec 10 ans d\'expérience',
    active: true,
    hireDate: '2020-09-01',
    coursesCount: 5,
  },
};

/**
 * Yoga Teacher
 * Teacher specialized in yoga
 */
export const YogaTeacher: Story = {
  args: {
    id: '2',
    userId: '102',
    firstName: 'Sophie',
    lastName: 'Martin',
    email: 'sophie.martin@clubmanager.com',
    phone: '+32 485 23 45 67',
    specialization: 'Yoga & Méditation',
    bio: 'Instructrice certifiée en Hatha Yoga et Vinyasa, passionnée par le bien-être holistique',
    certifications: 'RYT-200, RYT-500',
    active: true,
    hireDate: '2019-03-15',
    coursesCount: 8,
  },
};

/**
 * Fitness Coach
 * High-energy fitness instructor
 */
export const FitnessCoach: Story = {
  args: {
    id: '3',
    userId: '103',
    firstName: 'Thomas',
    lastName: 'Bernard',
    email: 'thomas.bernard@clubmanager.com',
    phone: '+32 495 34 56 78',
    specialization: 'Fitness & Musculation',
    bio: 'Coach sportif diplômé, spécialisé en préparation physique et musculation',
    certifications: 'BPJEPS, CQP',
    active: true,
    hireDate: '2021-01-10',
    coursesCount: 12,
  },
};

/**
 * Martial Arts Instructor
 * Teacher specialized in martial arts
 */
export const MartialArtsInstructor: Story = {
  args: {
    id: '4',
    userId: '104',
    firstName: 'Laurent',
    lastName: 'Petit',
    email: 'laurent.petit@clubmanager.com',
    phone: '+32 470 45 67 89',
    specialization: 'Arts Martiaux',
    bio: 'Instructeur de Karaté et Judo, ceinture noire 3ème Dan',
    certifications: 'Ceinture Noire 3ème Dan, DEJEPS',
    active: true,
    hireDate: '2018-06-20',
    coursesCount: 6,
  },
};

/**
 * Swimming Coach
 * Teacher specialized in swimming
 */
export const SwimmingCoach: Story = {
  args: {
    id: '5',
    userId: '105',
    firstName: 'Claire',
    lastName: 'Rousseau',
    email: 'claire.rousseau@clubmanager.com',
    phone: '+32 477 56 78 90',
    specialization: 'Natation',
    bio: 'Maître-nageur sauveteur, spécialiste de l\'enseignement de la natation pour tous âges',
    certifications: 'BEESAN, PSE1',
    active: true,
    hireDate: '2022-02-01',
    coursesCount: 10,
  },
};

/**
 * New Teacher
 * Recently hired teacher with minimal courses
 */
export const NewTeacher: Story = {
  args: {
    id: '6',
    userId: '106',
    firstName: 'Emma',
    lastName: 'Blanc',
    email: 'emma.blanc@clubmanager.com',
    phone: '+32 488 67 89 01',
    specialization: 'Pilates',
    bio: 'Nouvelle instructrice de Pilates, certifiée Mat Pilates',
    certifications: 'Mat Pilates Level 1',
    active: true,
    hireDate: '2024-01-15',
    coursesCount: 2,
  },
};

/**
 * Experienced Teacher
 * Senior teacher with many courses
 */
export const ExperiencedTeacher: Story = {
  args: {
    id: '7',
    userId: '107',
    firstName: 'Pierre',
    lastName: 'Moreau',
    email: 'pierre.moreau@clubmanager.com',
    phone: '+32 499 78 90 12',
    specialization: 'Multi-disciplines',
    bio: 'Professeur polyvalent avec plus de 15 ans d\'expérience dans diverses disciplines sportives',
    certifications: 'BPJEPS, DEJEPS, Multiples certifications',
    active: true,
    hireDate: '2010-09-01',
    coursesCount: 25,
  },
};

/**
 * Inactive Teacher
 * Teacher currently not active
 */
export const InactiveTeacher: Story = {
  args: {
    id: '8',
    userId: '108',
    firstName: 'Nicolas',
    lastName: 'Simon',
    email: 'nicolas.simon@clubmanager.com',
    phone: '+32 471 89 01 23',
    specialization: 'Tennis',
    bio: 'Professeur de tennis en congé sabbatique',
    certifications: 'Moniteur Fédéral FFT',
    active: false,
    hireDate: '2015-04-10',
    coursesCount: 0,
  },
};

/**
 * Teacher with Avatar
 * Teacher profile with photo
 */
export const WithAvatar: Story = {
  args: {
    id: '9',
    userId: '109',
    firstName: 'Julie',
    lastName: 'Laurent',
    email: 'julie.laurent@clubmanager.com',
    phone: '+32 483 90 12 34',
    specialization: 'Zumba & Dance Fitness',
    bio: 'Instructrice passionnée de Zumba et fitness dansé',
    certifications: 'Zumba Certified, AFAA',
    active: true,
    hireDate: '2021-11-01',
    coursesCount: 9,
    avatar: 'https://i.pravatar.cc/150?img=5',
  },
};

/**
 * Teacher Without Phone
 * Teacher profile without phone number
 */
export const WithoutPhone: Story = {
  args: {
    id: '10',
    userId: '110',
    firstName: 'Antoine',
    lastName: 'Roux',
    email: 'antoine.roux@clubmanager.com',
    specialization: 'CrossFit',
    bio: 'Coach CrossFit certifié Level 2',
    certifications: 'CrossFit Level 2',
    active: true,
    hireDate: '2023-05-01',
    coursesCount: 4,
  },
};

/**
 * Teacher Without Bio
 * Minimal teacher profile
 */
export const WithoutBio: Story = {
  args: {
    id: '11',
    userId: '111',
    firstName: 'Camille',
    lastName: 'Lefevre',
    email: 'camille.lefevre@clubmanager.com',
    phone: '+32 492 01 23 45',
    specialization: 'Stretching',
    active: true,
    hireDate: '2023-10-01',
    coursesCount: 3,
  },
};

/**
 * Teacher with Long Specialization
 * Test truncation of long text
 */
export const LongSpecialization: Story = {
  args: {
    id: '12',
    userId: '112',
    firstName: 'Alexandre',
    lastName: 'Bonnet',
    email: 'alexandre.bonnet@clubmanager.com',
    phone: '+32 478 12 34 56',
    specialization: 'Yoga Thérapeutique, Méditation Pleine Conscience, Relaxation Profonde et Gestion du Stress',
    bio: 'Spécialiste en approches holistiques du bien-être',
    active: true,
    hireDate: '2019-07-15',
    coursesCount: 7,
  },
};

/**
 * Teacher with Long Bio
 * Test bio truncation
 */
export const LongBio: Story = {
  args: {
    id: '13',
    userId: '113',
    firstName: 'Isabelle',
    lastName: 'Garnier',
    email: 'isabelle.garnier@clubmanager.com',
    phone: '+32 488 23 45 67',
    specialization: 'Danse Contemporaine',
    bio: 'Danseuse et chorégraphe professionnelle avec plus de 20 ans de carrière internationale. Formée à l\'Opéra de Paris et ayant performé dans les plus grandes salles du monde. Passionnée par la transmission de son art et l\'exploration de nouvelles formes de mouvement contemporain.',
    certifications: 'Diplôme d\'État, Prix de Paris',
    active: true,
    hireDate: '2012-09-01',
    coursesCount: 15,
  },
};

/**
 * Teacher with Multiple Certifications
 * Highly certified instructor
 */
export const MultipleCertifications: Story = {
  args: {
    id: '14',
    userId: '114',
    firstName: 'François',
    lastName: 'Dupuis',
    email: 'francois.dupuis@clubmanager.com',
    phone: '+32 499 34 56 78',
    specialization: 'Coaching Personnel',
    bio: 'Coach sportif polyvalent et nutritionniste',
    certifications: 'BPJEPS, DEJEPS, DU Nutrition, Personal Trainer Certified, TRX Instructor',
    active: true,
    hireDate: '2016-03-01',
    coursesCount: 18,
  },
};

/**
 * Teacher with Actions
 * Teacher card with all action buttons
 */
export const WithActions: Story = {
  args: {
    id: '15',
    userId: '115',
    firstName: 'Amélie',
    lastName: 'Mercier',
    email: 'amelie.mercier@clubmanager.com',
    phone: '+32 471 45 67 89',
    specialization: 'Body Balance',
    bio: 'Instructrice certifiée Les Mills Body Balance',
    certifications: 'Les Mills Certified',
    active: true,
    hireDate: '2020-06-15',
    coursesCount: 6,
    onEdit: (teacher) => console.log('Edit teacher:', teacher),
    onDelete: (teacher) => console.log('Delete teacher:', teacher),
    onViewCourses: (teacher) => console.log('View courses:', teacher),
  },
};

/**
 * Clickable Card
 * Teacher card that can be clicked
 */
export const Clickable: Story = {
  args: {
    id: '16',
    userId: '116',
    firstName: 'Julien',
    lastName: 'Girard',
    email: 'julien.girard@clubmanager.com',
    phone: '+32 483 56 78 90',
    specialization: 'Boxe',
    bio: 'Champion régional de boxe française',
    active: true,
    hireDate: '2021-08-01',
    coursesCount: 5,
    onClick: (teacher) => console.log('Clicked teacher:', teacher),
  },
};

/**
 * No Courses Assigned
 * Teacher without any active courses
 */
export const NoCoursesAssigned: Story = {
  args: {
    id: '17',
    userId: '117',
    firstName: 'Chloé',
    lastName: 'Fontaine',
    email: 'chloe.fontaine@clubmanager.com',
    phone: '+32 492 67 89 01',
    specialization: 'Aérobic',
    bio: 'Nouvelle recrue, en attente d\'affectation de cours',
    certifications: 'Aérobic Instructor Level 1',
    active: true,
    hireDate: '2024-01-20',
    coursesCount: 0,
  },
};

/**
 * Interactive Playground
 * Playground to test all combinations
 */
export const Playground: Story = {
  args: {
    id: '999',
    userId: '999',
    firstName: 'Prénom',
    lastName: 'Nom',
    email: 'professeur@clubmanager.com',
    phone: '+32 4XX XX XX XX',
    specialization: 'Spécialisation',
    bio: 'Biographie du professeur...',
    certifications: 'Certifications',
    active: true,
    hireDate: new Date().toISOString().split('T')[0],
    coursesCount: 5,
  },
};
