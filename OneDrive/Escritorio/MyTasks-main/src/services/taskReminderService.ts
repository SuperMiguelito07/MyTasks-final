import { supabase, Task } from '../supabase';
import { sendTaskDueSoonSMS } from './smsService';

// Función para verificar tareas que vencen pronto
export const checkUpcomingTasks = async (userId: string): Promise<void> => {
  try {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Formatear fechas para comparación con la base de datos
    const todayStr = today.toISOString().split('T')[0];
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    console.log(`Verificando tareas que vencen hoy (${todayStr}) o mañana (${tomorrowStr})`);
    
    // Obtener tareas que vencen hoy o mañana y no están completadas
    const { data: tasks, error } = await supabase
      .from('tasks')
      .select(`
        id,
        title,
        description,
        status,
        due_date,
        project_id,
        projects(name)
      `)
      .eq('assigned_to', userId)
      .neq('status', 'Done')
      .or(`due_date.eq.${todayStr},due_date.eq.${tomorrowStr}`)
      .is('is_archived', false);
    
    if (error) {
      console.error('Error al verificar tareas próximas a vencer:', error);
      return;
    }
    
    if (!tasks || tasks.length === 0) {
      console.log('No hay tareas que venzan pronto');
      return;
    }
    
    console.log(`Se encontraron ${tasks.length} tareas que vencen pronto`);
    
    // Enviar notificaciones para cada tarea
    for (const task of tasks) {
      const dueDate = new Date(task.due_date);
      const isToday = dueDate.toISOString().split('T')[0] === todayStr;
      
      // Solo enviamos SMS si la tarea vence mañana (no hoy)
      if (!isToday) {
        // Obtener el nombre del proyecto de forma segura
        const projectName = task.projects ? (task.projects as any).name || 'un proyecto' : 'un proyecto';
        
        // Enviar SMS de recordatorio
        const smsResult = await sendTaskDueSoonSMS(
          userId,
          task.title,
          projectName
        );
        
        if (smsResult.success) {
          console.log(`SMS de recordatorio enviado para la tarea "${task.title}" que vence mañana`);
        } else {
          console.error(`Error al enviar SMS de recordatorio para la tarea "${task.title}":`, smsResult.error);
        }
      }
    }
  } catch (error) {
    console.error('Error inesperado al verificar tareas próximas a vencer:', error);
  }
};

// Función para programar verificaciones diarias
export const scheduleTaskReminders = (userId: string): void => {
  // Verificar inmediatamente al iniciar sesión
  checkUpcomingTasks(userId);
  
  // Programar verificación diaria (a las 9:00 AM)
  const now = new Date();
  const tomorrow9AM = new Date(now);
  tomorrow9AM.setDate(tomorrow9AM.getDate() + 1);
  tomorrow9AM.setHours(9, 0, 0, 0);
  
  const timeUntilTomorrow = tomorrow9AM.getTime() - now.getTime();
  
  // Programar la primera verificación para mañana a las 9:00 AM
  setTimeout(() => {
    checkUpcomingTasks(userId);
    
    // Luego programar verificaciones diarias
    setInterval(() => {
      checkUpcomingTasks(userId);
    }, 24 * 60 * 60 * 1000); // 24 horas
  }, timeUntilTomorrow);
  
  console.log(`Recordatorios de tareas programados para el usuario ${userId}`);
};
