import { supabase } from '../supabase';
import { sendTaskDueSoonSMS } from './smsService';

// Variable para almacenar la última vez que se verificaron las tareas
let lastCheckTime = 0;

// Función simplificada para verificar tareas que vencen pronto
export const checkUpcomingTasks = async (userId: string) => {
  try {
    // Evitar verificaciones demasiado frecuentes (mínimo 1 hora entre verificaciones)
    const now = Date.now();
    if (now - lastCheckTime < 60 * 60 * 1000) { // 1 hora en milisegundos
      console.log('Omitiendo verificación de tareas, la última verificación fue hace menos de 1 hora');
      return;
    }
    
    // Actualizar el tiempo de la última verificación
    lastCheckTime = now;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(23, 59, 59, 999);
    
    console.log('Consultando tareas próximas a vencer para el usuario', userId);
    
    // Consultar tareas que vencen en las próximas 24 horas
    const { data: tasks, error } = await supabase
      .from('tasks')
      .select(`
        id,
        title,
        due_date,
        project:project_id (id, name)
      `)
      .eq('assigned_to', userId)
      .eq('status', 'todo') // Solo tareas pendientes
      .gte('due_date', today.toISOString())
      .lte('due_date', tomorrow.toISOString())
      .order('due_date', { ascending: true });
    
    if (error) {
      console.error('Error al obtener tareas próximas a vencer:', error);
      return;
    }
    
    // Procesar las tareas y enviar notificaciones
    return processTasks(userId, tasks || []);
  } catch (error) {
    console.error('Error inesperado al verificar tareas próximas a vencer:', error);
  }
};

// Función para procesar las tareas y enviar notificaciones
const processTasks = async (userId: string, tasks: any[]) => {
  try {
    console.log(`Procesando ${tasks.length} tareas próximas a vencer para el usuario ${userId}`);
    
    if (tasks.length === 0) {
      return { success: true, message: 'No hay tareas próximas a vencer' };
    }
    
    // Procesar cada tarea y enviar notificación
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const results = await Promise.all(
      tasks.map(async (task) => {
        try {
          // Obtener el nombre del proyecto de forma segura
          const projectName = task.project ? task.project.name || 'un proyecto' : 'un proyecto';
          
          // Enviar SMS de recordatorio
          const smsResult = await sendTaskDueSoonSMS(
            userId,
            task.title,
            projectName,
            task.due_date || new Date().toISOString() // Pasar la fecha de vencimiento como cuarto parámetro
          );
          
          if (smsResult.success) {
            console.log(`SMS de recordatorio enviado para la tarea "${task.title}" que vence mañana`);
          } else {
            console.error(`Error al enviar SMS de recordatorio para la tarea "${task.title}":`, smsResult.error);
          }
        } catch (error) {
          console.error(`Error al procesar la tarea ${task.title}:`, error);
        }
      })
    );
    
    return { success: true, message: 'Tareas procesadas correctamente' };
  } catch (error) {
    console.error('Error al procesar el lote de tareas:', error);
    return { success: false, message: 'Error al procesar el lote de tareas' };
  }
};

// Función para programar verificación diaria de tareas (simplificado)
export const scheduleTaskReminders = (userId: string) => {
  // Verificar tareas próximas a vencer al cargar la aplicación
  if (typeof window !== 'undefined') {
    // Verificar tareas inmediatamente
    setTimeout(() => {
      console.log('Verificando tareas próximas a vencer');
      checkUpcomingTasks(userId);
    }, 2000);
    
    // Programar verificación cada hora
    setInterval(() => {
      console.log('Verificando tareas próximas a vencer (verificación periódica)');
      checkUpcomingTasks(userId);
    }, 60 * 60 * 1000); // Cada hora
  }
};
