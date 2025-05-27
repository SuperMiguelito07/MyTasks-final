import { supabase } from '../supabase';

// Configuración del cliente de Twilio
const accountSid = process.env.REACT_APP_TWILIO_ACCOUNT_SID || 'AC9c1165f492832c0ea91885b254acdfa0';
const authToken = process.env.REACT_APP_TWILIO_AUTH_TOKEN || 'e45a103c92467455839e69ed186781c9';
const twilioPhoneNumber = process.env.REACT_APP_TWILIO_PHONE_NUMBER || '+17625725930';

// Interfaz para el cliente de Twilio
interface TwilioLike {
  messages: {
    create: (params: any) => Promise<any>;
  };
}

// Cliente de Twilio para enviar SMS reales
const createTwilioClient = () => {
  // Creamos un cliente que usa la API REST de Twilio directamente
  const client: TwilioLike = {
    messages: {
      create: async (params: any) => {
        try {
          // Construir la URL de la API de Twilio
          const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
          
          // Crear las credenciales en formato Base64
          const auth = btoa(`${accountSid}:${authToken}`);
          
          // Crear el cuerpo de la solicitud en formato FormData
          const formData = new URLSearchParams();
          formData.append('To', params.to);
          formData.append('From', params.from);
          formData.append('Body', params.body);
          
          // Realizar la solicitud HTTP
          console.log('Enviando SMS real a través de la API de Twilio');
          const response = await fetch(url, {
            method: 'POST',
            headers: {
              'Authorization': `Basic ${auth}`,
              'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: formData
          });
          
          // Procesar la respuesta
          if (response.ok) {
            const data = await response.json();
            console.log('SMS enviado correctamente:', data);
            return data;
          } else {
            const errorData = await response.text();
            console.error('Error al enviar SMS:', errorData);
            throw new Error(errorData);
          }
        } catch (error) {
          console.error('Error al enviar SMS:', error);
          throw error;
        }
      }
    }
  };
  
  return client;
};

// Cliente simulado de Twilio para pruebas
const simulatedTwilioClient: TwilioLike = {
  messages: {
    create: async (params: any) => {
      console.log('Simulando envío de SMS:', params);
      return {
        sid: 'SIMULATED_' + Date.now(),
        status: 'delivered',
        to: params.to,
        body: params.body
      };
    }
  }
};

// Decidir qué cliente usar
let twilioClient: TwilioLike | null = null;

// Usar el cliente real si estamos en producción o si se ha solicitado explícitamente
const useRealClient = true; // Cambiar a true para usar el cliente real

if (useRealClient && accountSid && authToken) {
  console.log('Usando cliente real de Twilio con las credenciales configuradas');
  twilioClient = createTwilioClient();
} else {
  console.warn('Usando modo de simulación para SMS.');
  twilioClient = simulatedTwilioClient;
}

// Función para enviar SMS usando Twilio o simulación si no está configurado
export const sendSMS = async (
  phoneNumber: string,
  message: string
): Promise<{ success: boolean; error?: any; messageId?: string }> => {
  try {
    // Variable para almacenar la entrada de log
    let logEntry: any = null;
    
    // En producción, intentamos registrar en la base de datos
    // En desarrollo, solo simulamos el registro
    if (process.env.NODE_ENV === 'production') {
      // Registrar el SMS en la base de datos para seguimiento
      const { error: dbError, data: logData } = await supabase
        .from('sms_logs')
        .insert([
          { 
            phone_number: phoneNumber,
            message: message,
            sent_at: new Date().toISOString(),
            status: 'pending'
          }
        ])
        .select();
      
      if (dbError) {
        console.error('Error al registrar el SMS en la base de datos:', dbError);
        // Continuamos aunque haya error en el registro
      } else {
        logEntry = logData && logData[0];
      }
    } else {
      // En desarrollo, solo simulamos el registro
      console.log('Desarrollo: Simulando registro de SMS en la base de datos');
      // Creamos un objeto simulado para mantener la consistencia del código
      logEntry = {
        id: 'dev-' + Date.now(),
        phone_number: phoneNumber,
        message: message,
        sent_at: new Date().toISOString(),
        status: 'pending'
      };
    }
    
    // Si el cliente de Twilio está disponible, enviar SMS real
    if (twilioClient && twilioPhoneNumber) {
      try {
        const twilioResponse = await twilioClient.messages.create({
          body: message,
          from: twilioPhoneNumber,
          to: phoneNumber
        });
        
        // Actualizar el estado del SMS en la base de datos
        if (process.env.NODE_ENV === 'production') {
          if (logEntry) {
            await supabase
              .from('sms_logs')
              .update({ 
                status: 'sent',
                external_id: twilioResponse.sid
              })
              .eq('id', logEntry.id);
          }
        } else {
          // En desarrollo, solo simulamos la actualización
          console.log('Desarrollo: Simulando actualización de estado de SMS a "sent"');
        }
        
        console.log(`SMS enviado a ${phoneNumber} con SID: ${twilioResponse.sid}`);
        return { success: true, messageId: twilioResponse.sid };
      } catch (twilioError: any) {
        console.error('Error al enviar SMS con Twilio:', twilioError);
        
        // Verificar si es un error de número no verificado
        const errorMessage = twilioError.message || JSON.stringify(twilioError);
        const isUnverifiedNumber = 
          errorMessage.includes('not a verified') || 
          errorMessage.includes('unverified') || 
          errorMessage.includes('21608');
        
        if (isUnverifiedNumber) {
          console.warn(`El número ${phoneNumber} no está verificado en tu cuenta de Twilio. ` +
                      `En cuentas de prueba, solo puedes enviar SMS a números verificados. ` +
                      `Verifica el número en tu panel de Twilio o actualiza a una cuenta de pago.`);
        }
        
        // Actualizar el estado del SMS en la base de datos
        if (process.env.NODE_ENV === 'production') {
          if (logEntry) {
            await supabase
              .from('sms_logs')
              .update({ 
                status: 'failed',
                error_message: isUnverifiedNumber 
                  ? 'Número no verificado en cuenta de prueba de Twilio' 
                  : JSON.stringify(twilioError)
              })
              .eq('id', logEntry.id);
          }
        } else {
          // En desarrollo, solo simulamos la actualización
          console.log('Desarrollo: Simulando actualización de estado de SMS a "failed"');
          console.log(isUnverifiedNumber 
            ? 'Error: Número no verificado en cuenta de prueba de Twilio' 
            : `Error: ${errorMessage}`);
        }
        
        return { 
          success: false, 
          error: isUnverifiedNumber 
            ? { message: 'Número no verificado en cuenta de prueba de Twilio' } 
            : twilioError 
        };
      }
    } else {
      // Modo de simulación si Twilio no está configurado
      console.log(`[SMS Simulado] Enviando SMS a ${phoneNumber}: ${message}`);
      
      // Actualizar el estado del SMS en la base de datos
      if (logEntry && logEntry[0]) {
        await supabase
          .from('sms_logs')
          .update({ status: 'simulated' })
          .eq('id', logEntry[0].id);
      }
      
      return { success: true };
    }
  } catch (error) {
    console.error('Error inesperado al enviar SMS:', error);
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
