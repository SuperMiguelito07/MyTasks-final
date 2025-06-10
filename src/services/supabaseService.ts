import { supabase, User, Project, Task } from '../supabase';

export const authService = {
  // Registra un nou usuari amb el correu electrònic, contrasenya i nom proporcionats
  async signUp(email: string, password: string, name: string, phoneNumber?: string): Promise<{ user: User | null; error: any }> {
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name, 
            phone_number: phoneNumber || null 
          }
        }
      });

      if (authError) {
        console.error('Error al registrar usuario:', authError);
        return { user: null, error: authError };
      }

      if (!authData.user) {
        return { user: null, error: 'No se pudo crear el usuario' };
      }

      await new Promise(resolve => setTimeout(resolve, 500));

      // Obté el perfil d'usuari des de la base de dades
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .maybeSingle();

      if (userError) {
        console.error('Error al obtener perfil de usuario:', userError);
        return { 
          user: {
            id: authData.user.id,
            name,
            email,
            phone_number: phoneNumber || null,
            created_at: new Date().toISOString(),
          }, 
          error: userError 
        };
      }

      // Si el perfil d'usuari no existeix, crea un de nou
      if (!userData) {
        try {
          const { data: newUserData, error: profileError } = await supabase
            .from('users')
            .insert([
              {
                id: authData.user.id,
                name: name,
                email: email,
                phone_number: phoneNumber || null,
                created_at: new Date().toISOString()
              }
            ])
            .select()
            .maybeSingle();

          if (profileError) {
            console.error('Error al crear perfil de usuario manualmente:', profileError);
            return { 
              user: {
                id: authData.user.id,
                name,
                email,
                phone_number: phoneNumber || null,
                created_at: new Date().toISOString(),
              }, 
              error: profileError 
            };
          }
          
          return { user: newUserData || null, error: null };
        } catch (error) {
          console.error('Error inesperado al crear perfil de usuario:', error);
          return { 
            user: {
              id: authData.user.id,
              name,
              email,
              phone_number: phoneNumber || null,
              created_at: new Date().toISOString(),
            }, 
            error 
          };
        }
      }

      return { user: userData, error: null };
    } catch (error) {
      console.error('Error en el proceso de registro:', error);
      return { user: null, error };
    }
  },

  // Inicia sessió amb el correu electrònic i contrasenya proporcionats
  async signIn(email: string, password: string): Promise<{ user: User | null; error: any }> {
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        return { user: null, error: authError };
      }

      if (!authData.user) {
        return { user: null, error: 'No se pudo iniciar sesión' };
      }

      // Obté el perfil d'usuari des de la base de dades
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .maybeSingle();

      if (userError) {
        console.error('Error al obtener perfil de usuario:', userError);
        // Creamos un usuario básico con los datos disponibles
        return { 
          user: {
            id: authData.user.id,
            name: authData.user.email?.split('@')[0] || 'Usuario',
            email: authData.user.email || '',
            created_at: new Date().toISOString(),
          }, 
          error: userError 
        };
      }

      // Si el perfil d'usuari no existeix, crea un de nou
      if (!userData) {
        const { data: newUserData, error: newUserError } = await supabase
          .from('users')
          .insert([
            {
              id: authData.user.id,
              name: authData.user.email?.split('@')[0] || 'Usuario',
              email: authData.user.email || '',
              created_at: new Date().toISOString(),
            },
          ])
          .select()
          .maybeSingle();

        if (newUserError) {
          console.error('Error al crear perfil de usuario automáticamente:', newUserError);
          return { 
            user: {
              id: authData.user.id,
              name: authData.user.email?.split('@')[0] || 'Usuario',
              email: authData.user.email || '',
              created_at: new Date().toISOString(),
            }, 
            error: newUserError 
          };
        }

        return { user: newUserData, error: null };
      }

      return { user: userData, error: null };
    } catch (error) {
      console.error('Error en el proceso de inicio de sesión:', error);
      return { user: null, error };
    }
  },

  // Tanca la sessió de l'usuari actual
  async signOut(): Promise<{ error: any }> {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  // Obté l'usuari actual des de l'autenticació
  async getCurrentUser(): Promise<{ user: User | null; error: any }> {
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();

      if (authError) {
        // No mostramos error si simplemente no hay sesión activa
        if (authError.name === 'AuthSessionMissingError') {
          return { user: null, error: authError };
        }
        console.error('Error al obtener usuario actual:', authError);
        return { user: null, error: authError };
      }

      if (!authData.user) {
        return { user: null, error: 'No hay usuario autenticado' };
      }

      // Obtener el perfil del usuario
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .maybeSingle();

      if (userError) {
        console.error('Error al obtener perfil de usuario:', userError);
        // Si hay un error al obtener el perfil, devolvemos un usuario básico
        return { 
          user: {
            id: authData.user.id,
            name: authData.user.email?.split('@')[0] || 'Usuario',
            email: authData.user.email || '',
            created_at: new Date().toISOString(),
          }, 
          error: userError 
        };
      }

      // Si el usuario no existe en la tabla users, lo creamos automáticamente
      if (!userData) {
        // Intentamos crear un perfil solo si tenemos una sesión válida
        // Esto evita intentos repetidos que generan errores 401
        const { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData.session) {
          return { user: null, error: new Error('No hay sesión activa') };
        }
        
        // Intentar crear el perfil solo una vez por sesión
        try {
          const { data: newUserData, error: createError } = await supabase
            .from('users')
            .insert([
              {
                id: authData.user.id,
                name: authData.user.email?.split('@')[0] || 'Usuario',
                email: authData.user.email || '',
                created_at: new Date().toISOString(),
              },
            ])
            .select()
            .maybeSingle();

          if (createError) {
            // Evitar log repetitivo de errores 401
            if (createError.code !== '401') {
              console.error('Error al crear perfil de usuario:', createError);
            }
            // Aún así devolvemos un usuario básico
            return { 
              user: {
                id: authData.user.id,
                name: authData.user.email?.split('@')[0] || 'Usuario',
                email: authData.user.email || '',
                created_at: new Date().toISOString(),
              }, 
              error: createError 
            };
          }

          return { user: newUserData, error: null };
        } catch (createErr) {
          console.error('Error inesperado al crear perfil de usuario:', createErr);
          return { 
            user: {
              id: authData.user.id,
              name: authData.user.email?.split('@')[0] || 'Usuario',
              email: authData.user.email || '',
              created_at: new Date().toISOString(),
            }, 
            error: createErr 
          };
        }
      }

      return { user: userData, error: null };
    } catch (error) {
      console.error('Error al obtener usuario actual:', error);
      return { user: null, error };
    }
  }
};

// Servei de projectes: gestiona la creació, obtenció, actualització i eliminació de projectes
export const projectService = {
  // Obté tots els projectes d'un usuari
  async getProjects(userId: string): Promise<{ projects: Project[]; error: any }> {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('owner_id', userId)
      .eq('is_archived', false)
      .order('created_at', { ascending: false });
    
    return { projects: data || [], error };
  },

  // Obté un projecte per ID
  async getProjectById(projectId: string): Promise<{ project: Project | null; error: any }> {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();
    
    return { project: data, error };
  },

  // Crea un nou projecte
  async createProject(project: Omit<Project, 'id'>): Promise<{ project: Project | null; error: any }> {
    const { data, error } = await supabase
      .from('projects')
      .insert(project)
      .select()
      .single();
    
    return { project: data, error };
  },

  // Actualitza un projecte
  async updateProject(projectId: string, updates: Partial<Project>): Promise<{ project: Project | null; error: any }> {
    const { data, error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', projectId)
      .select()
      .single();
    
    return { project: data, error };
  },

  // Elimina un projecte
  async deleteProject(projectId: string): Promise<{ error: any }> {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId);
    
    return { error };
  }
};

// Servei de tasques: gestiona la creació, obtenció, actualització i eliminació de tasques
export const taskService = {
  // Obté totes les tasques d'un projecte
  async getTasks(projectId: string): Promise<{ tasks: Task[]; error: any }> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('project_id', projectId)
      .eq('is_archived', false)
      .order('created_at', { ascending: false });
    
    return { tasks: data || [], error };
  },

  // Obté una tasca per ID
  async getTaskById(taskId: string): Promise<{ task: Task | null; error: any }> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .single();
    
    return { task: data, error };
  },

  // Crea una nova tasca
  async createTask(task: Omit<Task, 'id'>): Promise<{ task: Task | null; error: any }> {
    const { data, error } = await supabase
      .from('tasks')
      .insert(task)
      .select()
      .single();
    
    return { task: data, error };
  },

  // Actualitza una tasca
  async updateTask(taskId: string, updates: Partial<Task>): Promise<{ task: Task | null; error: any }> {
    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', taskId)
      .select()
      .single();
    
    return { task: data, error };
  },

  // Elimina una tasca
  async deleteTask(taskId: string): Promise<{ error: any }> {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId);
    
    return { error };
  }
};

// Servei de notificacions: gestiona la creació, obtenció i eliminació de notificacions
export const notificationService = {
  // Obté totes les notificacions d'un usuari
  async getNotifications(userId: string): Promise<{ notifications: any[]; error: any }> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    return { notifications: data || [], error };
  },

  // Marca una notificació com a llegida
  async markAsRead(notificationId: string): Promise<{ notification: any | null; error: any }> {
    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .select()
      .single();
    
    return { notification: data, error };
  },

  // Elimina una notificació
  async deleteNotification(notificationId: string): Promise<{ error: any }> {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);
    
    return { error };
  },

  // Crea una nova notificació
  async createNotification(notification: any): Promise<{ notification: any | null; error: any }> {
    const { data, error } = await supabase
      .from('notifications')
      .insert(notification)
      .select()
      .single();
    
    return { notification: data, error };
  }
};

// Servei de preferències d'usuari: gestiona la creació i actualització de preferències d'usuari
export const userPreferencesService = {
  // Obté les preferències d'un usuari
  async getUserPreferences(userId: string): Promise<{ preferences: any; error: any }> {
    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    
    return { preferences: data, error };
  },

  // Actualitza les preferències d'un usuari
  async updateUserPreferences(userId: string, updates: any): Promise<{ preferences: any; error: any }> {
    // Primero verificamos si ya existen preferencias para este usuario
    const { data: existingPrefs } = await supabase
      .from('user_preferences')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (existingPrefs) {
      // Actualizar preferencias existentes
      const { data, error } = await supabase
        .from('user_preferences')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select()
        .single();
      
      return { preferences: data, error };
    } else {
      // Crear nuevas preferencias
      const { data, error } = await supabase
        .from('user_preferences')
        .insert([{
          user_id: userId,
          ...updates,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();
      
      return { preferences: data, error };
    }
  }
};