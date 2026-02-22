/**
 * CourseCard Stories
 *
 * Storybook stories for the CourseCard component
 * Demonstrates various course types and states
 */

import type { Meta, StoryObj } from '@storybook/react';
import { CourseCard } from './CourseCard';

// ============================================================================
// Meta Configuration
// ============================================================================

const meta: Meta<typeof CourseCard> = {
  title: 'Features/Courses/CourseCard',
  component: CourseCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    id: { control: 'text' },
    name: { control: 'text' },
    description: { control: 'text' },
    instructor: { control: 'text' },
    instructorId: { control: 'text' },
    schedule: { control: 'text' },
    duration: { control: 'number' },
    level: {
      control: 'select',
      options: ['beginner', 'intermediate', 'advanced', 'all'],
    },
    category: { control: 'text' },
    capacity: { control: 'number' },
    enrolled: { control: 'number' },
    available: { control: 'boolean' },
    price: { control: 'number' },
    startDate: { control: 'date' },
    endDate: { control: 'date' },
    image: { control: 'text' },
    onClick: { action: 'clicked' },
    onEnroll: { action: 'enroll' },
    onViewDetails: { action: 'view-details' },
  },
};

export default meta;
type Story = StoryObj<typeof CourseCard>;

// ============================================================================
// Stories
// ============================================================================

/**
 * Default CourseCard
 * Basic course card with essential information
 */
export const Default: Story = {
  args: {
    id: '1',
    name: 'Yoga pour Débutants',
    description: 'Cours de yoga adapté aux débutants pour découvrir les bases',
    instructor: 'Sophie Martin',
    instructorId: '101',
    schedule: 'Lundi & Mercredi 18:00-19:00',
    duration: 60,
    level: 'beginner',
    category: 'Yoga',
    capacity: 20,
    enrolled: 12,
    available: true,
    price: 15.00,
    startDate: '2024-02-01',
    endDate: '2024-06-30',
  },
};

/**
 * Yoga Intermediate
 * Intermediate level yoga class
 */
export const YogaIntermediate: Story = {
  args: {
    id: '2',
    name: 'Vinyasa Flow',
    description: 'Cours de Vinyasa dynamique pour niveau intermédiaire',
    instructor: 'Sophie Martin',
    instructorId: '101',
    schedule: 'Mardi & Jeudi 19:00-20:30',
    duration: 90,
    level: 'intermediate',
    category: 'Yoga',
    capacity: 15,
    enrolled: 14,
    available: true,
    price: 20.00,
    startDate: '2024-02-01',
    endDate: '2024-06-30',
    image: 'https://via.placeholder.com/400x200?text=Vinyasa+Flow',
  },
};

/**
 * Fitness Boot Camp
 * High-intensity fitness class
 */
export const FitnessBootCamp: Story = {
  args: {
    id: '3',
    name: 'Boot Camp Fitness',
    description: 'Entraînement intensif en circuit training pour tous niveaux',
    instructor: 'Thomas Bernard',
    instructorId: '102',
    schedule: 'Lundi, Mercredi, Vendredi 07:00-08:00',
    duration: 60,
    level: 'all',
    category: 'Fitness',
    capacity: 25,
    enrolled: 18,
    available: true,
    price: 18.00,
    startDate: '2024-02-05',
    endDate: '2024-07-31',
  },
};

/**
 * Martial Arts Advanced
 * Advanced martial arts class
 */
export const MartialArtsAdvanced: Story = {
  args: {
    id: '4',
    name: 'Karaté Avancé',
    description: 'Cours de karaté pour pratiquants confirmés (ceinture marron minimum)',
    instructor: 'Laurent Petit',
    instructorId: '103',
    schedule: 'Mardi & Vendredi 20:00-21:30',
    duration: 90,
    level: 'advanced',
    category: 'Arts Martiaux',
    capacity: 12,
    enrolled: 10,
    available: true,
    price: 25.00,
    startDate: '2024-02-01',
    endDate: '2024-12-31',
    image: 'https://via.placeholder.com/400x200?text=Karate',
  },
};

/**
 * Swimming Lessons
 * Swimming course for kids
 */
export const SwimmingLessons: Story = {
  args: {
    id: '5',
    name: 'Natation Enfants 6-10 ans',
    description: 'Cours de natation pour enfants débutants et intermédiaires',
    instructor: 'Claire Rousseau',
    instructorId: '104',
    schedule: 'Samedi 10:00-11:00',
    duration: 60,
    level: 'beginner',
    category: 'Natation',
    capacity: 10,
    enrolled: 9,
    available: true,
    price: 22.00,
    startDate: '2024-02-03',
    endDate: '2024-06-29',
  },
};

/**
 * Almost Full Course
 * Course with only 1 spot remaining
 */
export const AlmostFull: Story = {
  args: {
    id: '6',
    name: 'Pilates Mat',
    description: 'Cours de Pilates au sol pour renforcement musculaire',
    instructor: 'Emma Blanc',
    instructorId: '105',
    schedule: 'Mercredi 12:00-13:00',
    duration: 60,
    level: 'all',
    category: 'Pilates',
    capacity: 15,
    enrolled: 14,
    available: true,
    price: 18.00,
    startDate: '2024-02-07',
    endDate: '2024-06-26',
  },
};

/**
 * Full Course
 * Course with no available spots
 */
export const FullCourse: Story = {
  args: {
    id: '7',
    name: 'Zumba Party',
    description: 'Cours de Zumba énergique sur musiques latines',
    instructor: 'Julie Laurent',
    instructorId: '106',
    schedule: 'Jeudi 18:30-19:30',
    duration: 60,
    level: 'all',
    category: 'Danse',
    capacity: 20,
    enrolled: 20,
    available: false,
    price: 16.00,
    startDate: '2024-02-01',
    endDate: '2024-05-31',
  },
};

/**
 * Premium Course
 * High-end course with higher price
 */
export const PremiumCourse: Story = {
  args: {
    id: '8',
    name: 'Coaching Personnel Premium',
    description: 'Séances de coaching personnalisé adaptées à vos objectifs',
    instructor: 'François Dupuis',
    instructorId: '107',
    schedule: 'Sur rendez-vous',
    duration: 60,
    level: 'all',
    category: 'Coaching',
    capacity: 1,
    enrolled: 0,
    available: true,
    price: 80.00,
    startDate: '2024-02-01',
    endDate: '2024-12-31',
    image: 'https://via.placeholder.com/400x200?text=Premium+Coaching',
  },
};

/**
 * Free Trial Course
 * Free introductory course
 */
export const FreeTrialCourse: Story = {
  args: {
    id: '9',
    name: 'Découverte CrossFit - Gratuit',
    description: 'Séance découverte gratuite pour essayer le CrossFit',
    instructor: 'Antoine Roux',
    instructorId: '108',
    schedule: 'Samedi 16:00-17:00',
    duration: 60,
    level: 'beginner',
    category: 'CrossFit',
    capacity: 8,
    enrolled: 5,
    available: true,
    price: 0,
    startDate: '2024-02-10',
    endDate: '2024-02-10',
  },
};

/**
 * Short Duration Course
 * 30-minute express class
 */
export const ShortDuration: Story = {
  args: {
    id: '10',
    name: 'Express Stretching',
    description: 'Séance rapide de stretching pour la pause déjeuner',
    instructor: 'Camille Lefevre',
    instructorId: '109',
    schedule: 'Mardi & Jeudi 12:30-13:00',
    duration: 30,
    level: 'all',
    category: 'Stretching',
    capacity: 15,
    enrolled: 8,
    available: true,
    price: 10.00,
    startDate: '2024-02-01',
    endDate: '2024-06-30',
  },
};

/**
 * Long Duration Course
 * 2-hour intensive class
 */
export const LongDuration: Story = {
  args: {
    id: '11',
    name: 'Danse Contemporaine Intensive',
    description: 'Atelier intensif de danse contemporaine avec chorégraphie',
    instructor: 'Isabelle Garnier',
    instructorId: '110',
    schedule: 'Samedi 14:00-16:00',
    duration: 120,
    level: 'intermediate',
    category: 'Danse',
    capacity: 12,
    enrolled: 7,
    available: true,
    price: 30.00,
    startDate: '2024-02-03',
    endDate: '2024-06-29',
    image: 'https://via.placeholder.com/400x200?text=Contemporary+Dance',
  },
};

/**
 * Weekend Workshop
 * Special weekend course
 */
export const WeekendWorkshop: Story = {
  args: {
    id: '12',
    name: 'Stage Boxing Week-end',
    description: 'Stage intensif de boxe française sur un week-end complet',
    instructor: 'Julien Girard',
    instructorId: '111',
    schedule: 'Samedi & Dimanche 09:00-17:00',
    duration: 480,
    level: 'all',
    category: 'Boxe',
    capacity: 16,
    enrolled: 12,
    available: true,
    price: 120.00,
    startDate: '2024-03-02',
    endDate: '2024-03-03',
  },
};

/**
 * Course with Long Name
 * Test name truncation
 */
export const LongName: Story = {
  args: {
    id: '13',
    name: 'Cours de Yoga Thérapeutique et Méditation Pleine Conscience pour la Gestion du Stress et de l\'Anxiété',
    description: 'Approche holistique combinant yoga doux et techniques de méditation',
    instructor: 'Alexandre Bonnet',
    instructorId: '112',
    schedule: 'Dimanche 09:00-10:30',
    duration: 90,
    level: 'beginner',
    category: 'Yoga',
    capacity: 12,
    enrolled: 6,
    available: true,
    price: 22.00,
    startDate: '2024-02-04',
    endDate: '2024-06-30',
  },
};

/**
 * Course with Long Description
 * Test description truncation
 */
export const LongDescription: Story = {
  args: {
    id: '14',
    name: 'Body Balance',
    description: 'Cours inspiré du Tai Chi, Yoga et Pilates qui améliore votre esprit, votre corps et votre vie. Contrôlé par la respiration et accompagné de musiques inspirantes, il vous apporte une sensation de bien-être holistique dans une ambiance détendue tout en vous relaxant et en vous tonifiant. Des postures et mouvements simples mais très efficaces.',
    instructor: 'Amélie Mercier',
    instructorId: '113',
    schedule: 'Lundi 19:00-20:00',
    duration: 60,
    level: 'all',
    category: 'Fitness',
    capacity: 18,
    enrolled: 11,
    available: true,
    price: 17.00,
    startDate: '2024-02-05',
    endDate: '2024-06-24',
  },
};

/**
 * New Course
 * Recently added course with few enrollments
 */
export const NewCourse: Story = {
  args: {
    id: '15',
    name: 'Aérobic Débutant',
    description: 'Nouveau cours d\'aérobic adapté aux débutants',
    instructor: 'Chloé Fontaine',
    instructorId: '114',
    schedule: 'Vendredi 17:00-18:00',
    duration: 60,
    level: 'beginner',
    category: 'Aérobic',
    capacity: 20,
    enrolled: 3,
    available: true,
    price: 15.00,
    startDate: '2024-02-15',
    endDate: '2024-06-30',
  },
};

/**
 * Course with Actions
 * Course card with enroll and details buttons
 */
export const WithActions: Story = {
  args: {
    id: '16',
    name: 'Spinning Cardio',
    description: 'Cours de vélo indoor haute intensité',
    instructor: 'Marc Lefebvre',
    instructorId: '115',
    schedule: 'Lundi, Mercredi, Vendredi 18:00-19:00',
    duration: 60,
    level: 'intermediate',
    category: 'Cardio',
    capacity: 15,
    enrolled: 10,
    available: true,
    price: 19.00,
    startDate: '2024-02-01',
    endDate: '2024-06-30',
    onEnroll: (course) => console.log('Enroll in course:', course),
    onViewDetails: (course) => console.log('View details:', course),
  },
};

/**
 * Clickable Card
 * Course card that can be clicked
 */
export const Clickable: Story = {
  args: {
    id: '17',
    name: 'Danse Salsa',
    description: 'Apprenez les pas de base de la salsa dans une ambiance festive',
    instructor: 'Carlos Rodriguez',
    instructorId: '116',
    schedule: 'Jeudi 20:00-21:30',
    duration: 90,
    level: 'beginner',
    category: 'Danse',
    capacity: 16,
    enrolled: 12,
    available: true,
    price: 18.00,
    startDate: '2024-02-01',
    endDate: '2024-05-30',
    onClick: (course) => console.log('Clicked course:', course),
  },
};

/**
 * Unavailable Course
 * Course that is no longer available
 */
export const Unavailable: Story = {
  args: {
    id: '18',
    name: 'Yoga Prénatal',
    description: 'Cours de yoga adapté aux femmes enceintes - Session complète',
    instructor: 'Sophie Martin',
    instructorId: '101',
    schedule: 'Vendredi 10:00-11:00',
    duration: 60,
    level: 'all',
    category: 'Yoga',
    capacity: 8,
    enrolled: 8,
    available: false,
    price: 20.00,
    startDate: '2024-01-05',
    endDate: '2024-04-26',
  },
};

/**
 * Interactive Playground
 * Playground to test all combinations
 */
export const Playground: Story = {
  args: {
    id: '999',
    name: 'Nom du Cours',
    description: 'Description du cours...',
    instructor: 'Nom Professeur',
    instructorId: '999',
    schedule: 'Horaires',
    duration: 60,
    level: 'all',
    category: 'Catégorie',
    capacity: 20,
    enrolled: 10,
    available: true,
    price: 15.00,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  },
};
