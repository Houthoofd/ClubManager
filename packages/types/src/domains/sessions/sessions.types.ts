/**
 * Generated TypeScript types for sessions domain
 * @generated - Do not edit manually
 */

export interface Instructors {
  id: number;
  user_id: number;
  /** Spécialité de l'instructeur */
  specialization?: string;
  bio?: string;
  /** Certifications et qualifications */
  certifications?: string;
  active?: boolean;
  created_at?: string;
}

export interface InstructorsInsert {
  user_id: number;
  /** Spécialité de l'instructeur */
  specialization?: string;
  bio?: string;
  /** Certifications et qualifications */
  certifications?: string;
  active?: boolean;
}

export interface InstructorsUpdate {
  user_id?: number;
  /** Spécialité de l'instructeur */
  specialization?: string;
  bio?: string;
  /** Certifications et qualifications */
  certifications?: string;
  active?: boolean;
  created_at?: string;
}

export interface SessionTypes {
  id: number;
  activity_id: number;
  name: string;
  description?: string;
  duration_minutes?: number;
  /** NULL = illimité */
  max_participants?: number;
  price?: number;
  active?: boolean;
}

export interface SessionTypesInsert {
  activity_id: number;
  name: string;
  description?: string;
  duration_minutes?: number;
  /** NULL = illimité */
  max_participants?: number;
  price?: number;
  active?: boolean;
}

export interface SessionTypesUpdate {
  activity_id?: number;
  name?: string;
  description?: string;
  duration_minutes?: number;
  /** NULL = illimité */
  max_participants?: number;
  price?: number;
  active?: boolean;
}

export interface Sessions {
  id: number;
  session_type_id: number;
  instructor_id: number;
  date: string;
  start_time: string;
  end_time: string;
  /** Lieu de la session (salle, terrain, etc.) */
  location?: string;
  max_participants?: number;
  current_participants?: number;
  status?: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
  notes?: string;
  created_at?: string;
}

export interface SessionsInsert {
  session_type_id: number;
  instructor_id: number;
  date: string;
  start_time: string;
  end_time: string;
  /** Lieu de la session (salle, terrain, etc.) */
  location?: string;
  max_participants?: number;
  current_participants?: number;
  status?: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
  notes?: string;
}

export interface SessionsUpdate {
  session_type_id?: number;
  instructor_id?: number;
  date?: string;
  start_time?: string;
  end_time?: string;
  /** Lieu de la session (salle, terrain, etc.) */
  location?: string;
  max_participants?: number;
  current_participants?: number;
  status?: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
  notes?: string;
  created_at?: string;
}

export interface SessionEnrollments {
  id: number;
  user_id: number;
  session_id: number;
  status?: 'pending' | 'confirmed' | 'attended' | 'absent' | 'cancelled';
  enrolled_at?: string;
  notes?: string;
}

export interface SessionEnrollmentsInsert {
  user_id: number;
  session_id: number;
  status?: 'pending' | 'confirmed' | 'attended' | 'absent' | 'cancelled';
  enrolled_at?: string;
  notes?: string;
}

export interface SessionEnrollmentsUpdate {
  user_id?: number;
  session_id?: number;
  status?: 'pending' | 'confirmed' | 'attended' | 'absent' | 'cancelled';
  enrolled_at?: string;
  notes?: string;
}

