/**
 * Generated TypeScript types for events domain
 * @generated - Do not edit manually
 */

export interface EventTypes {
  id: number;
  name: string;
  description?: string;
  /** Couleur pour le calendrier */
  color?: string;
  icon?: string;
}

export interface EventTypesInsert {
  name: string;
  description?: string;
  /** Couleur pour le calendrier */
  color?: string;
  icon?: string;
}

export interface EventTypesUpdate {
  name?: string;
  description?: string;
  /** Couleur pour le calendrier */
  color?: string;
  icon?: string;
}

export interface Events {
  id: number;
  event_type_id: number;
  title: string;
  description?: string;
  location?: string;
  start_date: string;
  end_date: string;
  start_time?: string;
  end_time?: string;
  /** NULL = illimité */
  max_participants?: number;
  current_participants?: number;
  registration_required?: boolean;
  registration_deadline?: string;
  price?: number;
  image_url?: string;
  status?: 'draft' | 'published' | 'cancelled' | 'completed';
  created_by: number;
  created_at?: string;
  updated_at?: string;
}

export interface EventsInsert {
  event_type_id: number;
  title: string;
  description?: string;
  location?: string;
  start_date: string;
  end_date: string;
  start_time?: string;
  end_time?: string;
  /** NULL = illimité */
  max_participants?: number;
  current_participants?: number;
  registration_required?: boolean;
  registration_deadline?: string;
  price?: number;
  image_url?: string;
  status?: 'draft' | 'published' | 'cancelled' | 'completed';
  created_by: number;
}

export interface EventsUpdate {
  event_type_id?: number;
  title?: string;
  description?: string;
  location?: string;
  start_date?: string;
  end_date?: string;
  start_time?: string;
  end_time?: string;
  /** NULL = illimité */
  max_participants?: number;
  current_participants?: number;
  registration_required?: boolean;
  registration_deadline?: string;
  price?: number;
  image_url?: string;
  status?: 'draft' | 'published' | 'cancelled' | 'completed';
  created_by?: number;
  created_at?: string;
  updated_at?: string;
}

export interface EventRegistrations {
  id: number;
  event_id: number;
  user_id: number;
  status?: 'pending' | 'confirmed' | 'cancelled' | 'attended';
  payment_status?: 'unpaid' | 'paid' | 'refunded';
  notes?: string;
  registered_at?: string;
}

export interface EventRegistrationsInsert {
  event_id: number;
  user_id: number;
  status?: 'pending' | 'confirmed' | 'cancelled' | 'attended';
  payment_status?: 'unpaid' | 'paid' | 'refunded';
  notes?: string;
  registered_at?: string;
}

export interface EventRegistrationsUpdate {
  event_id?: number;
  user_id?: number;
  status?: 'pending' | 'confirmed' | 'cancelled' | 'attended';
  payment_status?: 'unpaid' | 'paid' | 'refunded';
  notes?: string;
  registered_at?: string;
}

