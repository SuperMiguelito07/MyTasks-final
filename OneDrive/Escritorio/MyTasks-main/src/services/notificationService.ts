import { supabase, Notification } from '../supabase';

// Función para enviar notificación por correo electrónico
export const sendEmailNotification = async (
  email: string,
  subject: string,
  message: string
): Promise<{ success: boolean; error?: any }> => {
  try {
    // En un entorno real, aquí se integraría con un servicio de correo electrónico como SendGrid
    // Por ahora, simulamos el envío de correo electrónico
    console.log(`Enviando correo electrónico a ${email}`);
    console.log(`Asunto: ${subject}`);
    console.log(`Mensaje: ${message}`);
    
    // Simulamos una operación exitosa
    return { success: true };
  } catch (error) {
    console.error('Error al enviar notificación por correo electrónico:', error);
    return { success: false, error };
  }
};

// Función para guardar notificación en la base de datos
export const saveNotificationToDatabase = async (
  notification: Omit<Notification, 'id'>
): Promise<{ success: boolean; notification?: Notification; error?: any }> => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert([notification])
      .select()
      .single();
    
    if (error) {
      console.error('Error al guardar notificación en la base de datos:', error);
      return { success: false, error };
    }
    
    return { success: true, notification: data };
  } catch (error) {
    console.error('Error inesperado al guardar notificación:', error);
    return { success: false, error };
  }
};

// Función para crear y enviar una notificación completa
export const createNotification = async (
  userId: string,
  message: string,
  options?: {
    sendEmail?: boolean;
    emailSubject?: string;
    relatedTaskId?: string;
    relatedProjectId?: string;
  }
): Promise<{ success: boolean; notification?: Notification; error?: any }> => {
  try {
    // Crear objeto de notificación
    const notificationData: Omit<Notification, 'id'> = {
      user_id: userId,
      message,
      read: false,
      created_at: new Date().toISOString(),
      related_task_id: options?.relatedTaskId || null,
      related_project_id: options?.relatedProjectId || null
    };
    
    // Guardar notificación en la base de datos
    const { success, notification, error } = await saveNotificationToDatabase(notificationData);
    
    if (!success) {
      return { success: false, error };
    }
    
    // Si se solicita enviar correo electrónico, obtener el email del usuario y enviarlo
    if (options?.sendEmail) {
      // Obtener el email del usuario
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('email')
        .eq('id', userId)
        .single();
      
      if (userError) {
        console.error('Error al obtener email del usuario:', userError);
        // Continuamos aunque haya error, ya que la notificación ya se guardó en la base de datos
      } else if (userData) {
        // Enviar correo electrónico
        const emailSubject = options.emailSubject || 'Notificación de MyTask';
        await sendEmailNotification(userData.email, emailSubject, message);
      }
    }
    
    return { success: true, notification };
  } catch (error) {
    console.error('Error inesperado al crear notificación:', error);
    return { success: false, error };
  }
};

// Función para obtener notificaciones del usuario
export const getUserNotifications = async (
  userId: string
): Promise<{ notifications: Notification[]; error?: any }> => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error al obtener notificaciones:', error);
      return { notifications: [], error };
    }
    
    return { notifications: data || [] };
  } catch (error) {
    console.error('Error inesperado al obtener notificaciones:', error);
    return { notifications: [], error };
  }
};

// Función para marcar una notificación como leída
export const markNotificationAsRead = async (
  notificationId: string
): Promise<{ success: boolean; error?: any }> => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);
    
    if (error) {
      console.error('Error al marcar notificación como leída:', error);
      return { success: false, error };
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error inesperado al marcar notificación como leída:', error);
    return { success: false, error };
  }
};
