import { supabase, User, Project, Task, Notification } from '../supabase';

// Servicios de autenticación
export const authService = {
  // Registrar un nuevo usuario
  async signUp(email: string, password: string, name: string, phoneNumber?: string): Promise<{ user: User | null; error: any }> {
    try {
      // Registrar el usuario en la autenticación de Supabase
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name, // Pasar el nombre como metadato para que el trigger lo use
            phone_number: phoneNumber || null // Pasar el número de teléfono como metadato
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

      // El trigger de Supabase debería crear automáticamente el registro en la tabla users
      // Esperamos un momento y luego intentamos obtener el usuario
      await new Promise(resolve => setTimeout(resolve, 500));

      // Obtener el perfil del usuario
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .maybeSingle();

      if (userError) {
        console.error('Error al obtener perfil de usuario:', userError);
        // Aún así devolvemos el usuario autenticado
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

      // Si el usuario no existe en la tabla users a pesar del trigger, lo creamos manualmente
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

  // Iniciar sesión
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

      // Obtener el perfil del usuario
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

      // Si el usuario no existe en la tabla users, lo creamos
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

  // Cerrar sesión
  async signOut(): Promise<{ error: any }> {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  // Obtener el usuario actual
  async getCurrentUser(): Promise<{ user: User | null; error: any }> {
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();

      if (authError) {
        // No mostramos error si simplemente no hay sesión activa
        if (authError.name === 'AuthSessionMissingError') {
          return { user: null, error: authError };
        }
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
        console.log('Usuario autenticado pero no existe en la tabla users, creando perfil...');
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
            console.error('Error al crear perfil de usuario automáticamente:', createError);
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

// Servicios de proyectos
export const projectService = {
  // Obtener todos los proyectos de un usuario
  async getProjects(userId: string): Promise<{ projects: Project[]; error: any }> {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('owner_id', userId)
      .eq('is_archived', false)
      .order('created_at', { ascending: false });
    
    return { projects: data || [], error };
  },

  // Obtener un proyecto por ID
  async getProjectById(projectId: string): Promise<{ project: Project | null; error: any }> {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();
    
    return { project: data, error };
  },

  // Crear un nuevo proyecto
  async createProject(project: Omit<Project, 'id'>): Promise<{ project: Project | null; error: any }> {
    const { data, error } = await supabase
      .from('projects')
      .insert([project])
      .select()
      .single();
    
    return { project: data, error };
  },

  // Actualizar un proyecto
  async updateProject(projectId: string, updates: Partial<Project>): Promise<{ project: Project | null; error: any }> {
    const { data, error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', projectId)
      .select()
      .single();
    
    return { project: data, error };
  },

  // Eliminar un proyecto
  async deleteProject(projectId: string): Promise<{ error: any }> {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId);
    
    return { error };
  }
};

// Servicios de tareas
export const taskService = {
  // Obtener todas las tareas de un proyecto
  async getTasks(projectId: string): Promise<{ tasks: Task[]; error: any }> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('project_id', projectId)
      .eq('is_archived', false)
      .order('created_at', { ascending: false });
    
    return { tasks: data || [], error };
  },

  // Obtener una tarea por ID
  async getTaskById(taskId: string): Promise<{ task: Task | null; error: any }> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .single();
    
    return { task: data, error };
  },

  // Crear una nueva tarea
  async createTask(task: Omit<Task, 'id'>): Promise<{ task: Task | null; error: any }> {
    const { data, error } = await supabase
      .from('tasks')
      .insert([task])
      .select()
      .single();
    
    return { task: data, error };
  },

  // Actualizar una tarea
  async updateTask(taskId: string, updates: Partial<Task>): Promise<{ task: Task | null; error: any }> {
    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', taskId)
      .select()
      .single();
    
    return { task: data, error };
  },

  // Eliminar una tarea
  async deleteTask(taskId: string): Promise<{ error: any }> {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId);
    
    return { error };
  }
};

// Servicios de notificaciones
export const notificationService = {
  // Obtener todas las notificaciones de un usuario
  async getNotifications(userId: string): Promise<{ notifications: Notification[]; error: any }> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    return { notifications: data || [], error };
  },

  // Marcar una notificación como leída
  async markAsRead(notificationId: string): Promise<{ notification: Notification | null; error: any }> {
    const { data, error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId)
      .select()
      .single();
    
    return { notification: data, error };
  },

  // Eliminar una notificación
  async deleteNotification(notificationId: string): Promise<{ error: any }> {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);
    
    return { error };
  },

  // Crear una nueva notificación
  async createNotification(notification: Omit<Notification, 'id'>): Promise<{ notification: Notification | null; error: any }> {
    const { data, error } = await supabase
      .from('notifications')
      .insert([notification])
      .select()
      .single();
    
    return { notification: data, error };
  }
};

// Servicios de preferencias de usuario
export const userPreferencesService = {
  // Obtener las preferencias de un usuario
  async getUserPreferences(userId: string): Promise<{ preferences: any; error: any }> {
    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    
    return { preferences: data, error };
  },

  // Actualizar las preferencias de un usuario
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
