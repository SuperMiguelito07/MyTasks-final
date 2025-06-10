// Configuració de Supabase i definició de tipus utilitzats a l'aplicació
import { createClient } from '@supabase/supabase-js';

// Crea una instància de Supabase client utilitzant les variables d'entorn
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || '';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';
// Utilitzem les variables de entorno per les credenciales de Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Definició de tipus per a la base de dades
export type User = {
  id: string;
  name: string;
  email: string;
  phone_number?: string | null;
  created_at: string;
};

export type Project = {
  id: string;
  name: string;
  description: string;
  owner_id: string;
  created_at: string;
  is_archived?: boolean;
};

export type Task = {
  id: string;
  project_id: string;
  title: string;
  description: string;
  status: 'To Do' | 'Doing' | 'Done';
  created_at: string;
  due_date: string | null;
  assigned_to: string | null;
  is_archived?: boolean;
};