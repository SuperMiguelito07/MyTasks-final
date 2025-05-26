import { supabase } from '../supabase';

// Simulación de envío de SMS (en un entorno real, aquí usaríamos Twilio u otro servicio de SMS)
export const sendSMS = async (
  phoneNumber: string,
  message: string
): Promise<{ success: boolean; error?: any }> => {
  try {
    console.log(`[SMS Simulado] Enviando SMS a ${phoneNumber}: ${message}`);
    
    // Registrar el SMS enviado en la base de datos para seguimiento
    const { error } = await supabase
      .from('sms_logs')
      .insert([
        { 
          phone_number: phoneNumber,
          message: message,
          sent_at: new Date().toISOString(),
          status: 'sent'
        }
      ]);
    
    if (error) {
      console.error('Error al registrar el SMS en la base de datos:', error);
      // Continuamos aunque haya error en el registro
    }
    
    // En un entorno real, aquí iría la llamada a la API de Twilio o similar
    // Por ejemplo:
    // const twilioResponse = await twilioClient.messages.create({
    //   body: message,
    //   from: '+1234567890', // Tu número de Twilio
    //   to: phoneNumber
    // });
    
    return { success: true };
  } catch (error) {
    console.error('Error al enviar SMS:', error);
    return { success: false, error };
  }
};

// Función para obtener el número de teléfono del usuario
export const getUserPhoneNumber = async (userId: string): Promise<string | null> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('phone_number')
      .eq('id', userId)
      .single();
    
    if (error || !data) {
      console.error('Error al obtener el número de teléfono del usuario:', error);
      return null;
    }
    
    return data.phone_number;
  } catch (error) {
    console.error('Error inesperado al obtener el número de teléfono:', error);
    return null;
  }
};

// Función para enviar SMS de notificación de tarea creada
export const sendTaskCreatedSMS = async (
  userId: string,
  taskTitle: string,
  projectName: string
): Promise<{ success: boolean; error?: any }> => {
  const phoneNumber = await getUserPhoneNumber(userId);
  
  if (!phoneNumber) {
    console.error('No se pudo enviar SMS: número de teléfono no disponible');
    return { success: false, error: 'Número de teléfono no disponible' };
  }
  
  const message = `MyTask: S'ha creat una nova tasca "${taskTitle}" al projecte "${projectName}".`;
  return sendSMS(phoneNumber, message);
};

// Función para enviar SMS de recordatorio de tarea próxima a vencer
export const sendTaskDueSoonSMS = async (
  userId: string,
  taskTitle: string,
  projectName: string
): Promise<{ success: boolean; error?: any }> => {
  const phoneNumber = await getUserPhoneNumber(userId);
  
  if (!phoneNumber) {
    console.error('No se pudo enviar SMS: número de teléfono no disponible');
    return { success: false, error: 'Número de teléfono no disponible' };
  }
  
  const message = `MyTask: RECORDATORI! La tasca "${taskTitle}" al projecte "${projectName}" venç demà.`;
  return sendSMS(phoneNumber, message);
};

// Función para enviar SMS de tarea completada
export const sendTaskCompletedSMS = async (
  userId: string,
  taskTitle: string,
  projectName: string
): Promise<{ success: boolean; error?: any }> => {
  const phoneNumber = await getUserPhoneNumber(userId);
  
  if (!phoneNumber) {
    console.error('No se pudo enviar SMS: número de teléfono no disponible');
    return { success: false, error: 'Número de teléfono no disponible' };
  }
  
  const message = `MyTask: COMPLETADA! La tasca "${taskTitle}" al projecte "${projectName}" ha estat marcada com a finalitzada.`;
  return sendSMS(phoneNumber, message);
};
