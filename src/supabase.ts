import { createClient } from '@supabase/supabase-js';

// Utilizamos las variables de entorno para las credenciales de Supabase
const supabaseUrl = 'https://egoxgyvexjjykwmatiap.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVnb3hneXZleGpqeWt3bWF0aWFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcyNDIxOTMsImV4cCI6MjA2MjgxODE5M30.qUqgTq9aQtRGbdmxws_CyfLHQw31TnRElQbyDT7Tcow';

// Creamos el cliente de Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Tipos para la base de datos
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

export type Notification = {
  id: string;
  user_id: string;
  message: string;
  read: boolean;
  created_at: string;
  related_task_id?: string | null;
  related_project_id?: string | null;
};
