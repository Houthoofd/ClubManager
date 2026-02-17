/**
 * Generated TypeScript types for documents domain
 * @generated - Do not edit manually
 */

export interface Documents {
  id: number;
  title: string;
  description?: string;
  file_url: string;
  file_name: string;
  /** Type MIME du fichier */
  file_type?: string;
  /** Taille en octets */
  file_size?: number;
  category?: 'rulebook' | 'photo' | 'video' | 'form' | 'certificate' | 'other';
  visibility?: 'public' | 'members' | 'instructors' | 'admins';
  uploaded_by: number;
  created_at?: string;
  updated_at?: string;
}

export interface DocumentsInsert {
  title: string;
  description?: string;
  file_url: string;
  file_name: string;
  /** Type MIME du fichier */
  file_type?: string;
  /** Taille en octets */
  file_size?: number;
  category?: 'rulebook' | 'photo' | 'video' | 'form' | 'certificate' | 'other';
  visibility?: 'public' | 'members' | 'instructors' | 'admins';
  uploaded_by: number;
}

export interface DocumentsUpdate {
  title?: string;
  description?: string;
  file_url?: string;
  file_name?: string;
  /** Type MIME du fichier */
  file_type?: string;
  /** Taille en octets */
  file_size?: number;
  category?: 'rulebook' | 'photo' | 'video' | 'form' | 'certificate' | 'other';
  visibility?: 'public' | 'members' | 'instructors' | 'admins';
  uploaded_by?: number;
  created_at?: string;
  updated_at?: string;
}

