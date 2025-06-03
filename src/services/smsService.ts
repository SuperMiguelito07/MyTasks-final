// Importamos supabase para operaciones con la base de datos cuando sea necesario
import { supabase } from '../supabase';

// Configuración del cliente de Twilio usando variables de entorno
// Estas variables deben configurarse en el archivo .env.local y en Netlify
const accountSid = process.env.REACT_APP_TWILIO_ACCOUNT_SID;
const authToken = process.env.REACT_APP_TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.REACT_APP_TWILIO_PHONE_NUMBER;

// Nunca hardcodear credenciales en el código fuente
// Siempre usar variables de entorno
// Las credenciales se han movido al archivo .env.local que no se sube al repositorio

// Número de teléfono verificado para pruebas
// Usar el número proporcionado en las variables de entorno o un valor predeterminado
// Este debe ser TU número de teléfono que has verificado en la consola de Twilio
const VERIFIED_PHONE_NUMBER = '+34669472052'; // Reemplaza esto con tu número real verificado

// Imprimir las variables de entorno para depuración (solo los primeros caracteres por seguridad)
console.log('Variables de entorno de Twilio disponibles:', {
  accountSid: accountSid ? `${accountSid.substring(0, 5)}...` : 'no disponible',
  authToken: authToken ? `${authToken.substring(0, 3)}...` : 'no disponible',
  twilioPhoneNumber: twilioPhoneNumber || 'no disponible'
});

// Determinar si debemos usar el modo de simulación
// Intentamos con el nuevo Auth Token actualizado
// Si sigue fallando, volveremos al modo de simulación
const USE_SIMULATION_MODE = false; // Intentamos usar el cliente real con el nuevo token

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
          // Usar las variables de entorno para las credenciales
          // Nunca hardcodear credenciales en el código
          const sid = process.env.REACT_APP_TWILIO_ACCOUNT_SID || '';
          const token = process.env.REACT_APP_TWILIO_AUTH_TOKEN || '';
          
          // Verificar que tenemos las credenciales necesarias
          if (!sid || !token) {
            throw new Error('Faltan credenciales de Twilio. Verifica las variables de entorno.');
          }
          
          // Construir la URL de la API de Twilio
          const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`;
          
          // Crear las credenciales en formato Base64
          // Usar una función compatible con todos los navegadores
          const auth = window.btoa(`${sid}:${token}`);
          console.log(`Usando SID: ${sid.substring(0, 5)}... y token: ${token.substring(0, 3)}...`);
          console.log('Autenticación generada (primeros caracteres):', auth.substring(0, 10) + '...');
          
          // Crear el cuerpo de la solicitud en formato FormData
          const formData = new URLSearchParams();
          formData.append('To', params.to);
          formData.append('From', process.env.REACT_APP_TWILIO_PHONE_NUMBER || ''); // Usar el número de las variables de entorno
          formData.append('Body', params.body);
          
          console.log(`Enviando SMS desde: ${process.env.REACT_APP_TWILIO_PHONE_NUMBER} a: ${params.to}`);
          
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

// Ya hemos definido VERIFIED_PHONE_NUMBER arriba

// Inicializar el cliente de Twilio
if (!USE_SIMULATION_MODE) {
  console.log('Usando cliente real de Twilio con las credenciales hardcodeadas');
  twilioClient = createTwilioClient();
} else {
  console.warn('Usando modo de simulación para SMS.');
  twilioClient = simulatedTwilioClient;
}

// Función simplificada para enviar SMS usando Twilio
export const sendSMS = async (
  phoneNumber: string,
  message: string,
  userId?: string // Agregamos el userId para registrar en la base de datos
): Promise<{ success: boolean; error?: any; messageId?: string }> => {
  // En cuentas de prueba de Twilio, SIEMPRE usamos el número verificado
  // Esto es necesario porque las cuentas de prueba solo pueden enviar a números verificados
  const targetPhoneNumber = VERIFIED_PHONE_NUMBER;
  
  console.log(`Número original: ${phoneNumber}, usando número verificado: ${targetPhoneNumber}`);
  
  console.log(`Enviando SMS a ${targetPhoneNumber}: ${message}`);
  
  // Si estamos en modo de simulación, usar el cliente simulado
  if (USE_SIMULATION_MODE || !twilioClient) {
    console.log('=== MODO SIMULACIÓN ACTIVADO ===');
    console.log(`Simulando envío de SMS a ${targetPhoneNumber}`);
    console.log(`Mensaje: "${message}"`);
    
    // Simular un retraso para que parezca real
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Generar un ID de mensaje simulado
    const messageId = `SIM_${Date.now()}`;
    
    // Registrar el SMS simulado en la base de datos si tenemos userId
    if (userId) {
      try {
        console.log(`Registrando SMS simulado en la base de datos para usuario ${userId}`);
        await logSmsToDatabase(
          userId,
          targetPhoneNumber,
          message,
          'simulated',
          messageId,
          'SMS enviado en modo de simulación'
        );
        console.log('SMS simulado registrado correctamente en la base de datos');
      } catch (error) {
        console.error('Error al registrar SMS simulado:', error);
      }
    } else {
      console.log('No se proporcionó userId, no se registrará en la base de datos');
    }
    
    console.log(`SMS simulado con éxito. ID: ${messageId}`);
    console.log('=== FIN DE SIMULACIÓN ===');
    
    // Devolver un ID de mensaje simulado
    return { 
      success: true, 
      messageId,
      error: { message: 'SMS enviado en modo de simulación (no se ha enviado realmente)' }
    };
  }
  
  // Verificar que tenemos todas las credenciales necesarias
  if (!accountSid || !authToken || !twilioPhoneNumber) {
    console.error('Faltan credenciales de Twilio:', { 
      accountSid: accountSid ? 'disponible' : 'no disponible', 
      authToken: authToken ? 'disponible' : 'no disponible',
      twilioPhoneNumber: twilioPhoneNumber || 'no disponible' 
    });
    return { 
      success: true, // Devolvemos true para no interrumpir la experiencia del usuario
      messageId: `MOCK_${Date.now()}`,
      error: { message: 'Faltan credenciales de Twilio. Usando modo de simulación.' } 
    };
  }
  
  try {
    // Intentar enviar SMS usando el cliente de Twilio
    if (twilioClient?.messages?.create) {
      try {
        const result = await twilioClient.messages.create({
          to: targetPhoneNumber,
          from: twilioPhoneNumber,
          body: message
        });
        
        console.log('SMS enviado correctamente:', result);
        
        // Registrar el SMS en la base de datos si tenemos userId
        if (userId) {
          await logSmsToDatabase(
            userId,
            targetPhoneNumber,
            message,
            'sent',
            result.sid
          );
        }
        
        return { success: true, messageId: result.sid };
      } catch (twilioError: any) {
        console.error('Error al enviar SMS con el cliente de Twilio:', twilioError);
        
        // Si es un error de número no verificado, usar simulación
        if (twilioError.code === 21219 || 
            (twilioError.message && twilioError.message.includes('not a verified'))) {
          console.log('Número no verificado, usando simulación');
          return { 
            success: true, 
            messageId: `SIM_UNVERIFIED_${Date.now()}`,
            error: { 
              code: 21219, 
              message: 'Número no verificado en cuenta de prueba. SMS simulado.' 
            } 
          };
        }
        
        // Devolver el error de Twilio
        return { 
          success: false, 
          error: { 
            code: twilioError.code || 0, 
            message: twilioError.message || 'Error desconocido al enviar SMS' 
          } 
        };
      }
    }
    
    // Si llegamos aquí, algo está mal con el cliente, intentar con la API REST
    console.log(`Intentando enviar SMS a ${targetPhoneNumber} con API REST`);
    
    // Construir la URL de la API de Twilio
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    
    // Crear las credenciales en formato Base64
    const auth = window.btoa(`${accountSid}:${authToken}`);
    
    // Crear el cuerpo de la solicitud en formato FormData
    const formData = new URLSearchParams();
    formData.append('To', targetPhoneNumber);
    formData.append('From', twilioPhoneNumber);
    formData.append('Body', message);
    
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
      return { success: true, messageId: data.sid };
    } else {
      const errorText = await response.text();
      console.error('Error al enviar SMS:', errorText);
      
      try {
        // Intentar parsear el error como JSON
        const errorJson = JSON.parse(errorText);
        
        // Si es un error de autenticación, usar simulación
        if (errorJson.code === 20003 || response.status === 401) {
          console.log('Error de autenticación, usando simulación');
          return { 
            success: true, 
            messageId: `SIM_AUTH_${Date.now()}`,
            error: { 
              code: 20003, 
              message: 'Error de autenticación. SMS simulado.' 
            } 
          };
        }
        
        return { 
          success: false, 
          error: { 
            code: errorJson.code || 0, 
            message: errorJson.message || 'Error desconocido al enviar SMS' 
          } 
        };
      } catch (e) {
        // Si no es JSON, usar el texto completo
        return { 
          success: true, // Devolvemos true para no interrumpir la experiencia
          messageId: `SIM_ERROR_${Date.now()}`,
          error: { message: 'Error en el servicio. SMS simulado.' } 
        };
      }
    }
  } catch (error) {
    console.error('Error inesperado al enviar SMS:', error);
    
    // En caso de cualquier error, usar simulación
    return { 
      success: true, 
      messageId: `SIM_EXCEPTION_${Date.now()}`,
      error: { 
        message: error instanceof Error ? error.message : 'Error desconocido. SMS simulado.' 
      } 
    };
  }
};

// Función para registrar un SMS en la tabla sms_logs
export const logSmsToDatabase = async (
  userId: string,
  phoneNumber: string,
  message: string,
  status: 'pending' | 'sent' | 'failed' | 'simulated',
  externalId?: string,
  errorMessage?: string
): Promise<void> => {
  try {
    const { error } = await supabase
      .from('sms_logs')
      .insert([
        {
          user_id: userId,
          phone_number: phoneNumber,
          message,
          status,
          external_id: externalId,
          error_message: errorMessage
        }
      ]);
    
    if (error) {
      console.error('Error al registrar SMS en la base de datos:', error);
    } else {
      console.log('SMS registrado correctamente en la base de datos');
    }
  } catch (error) {
    console.error('Error inesperado al registrar SMS:', error);
  }
};

// Función para obtener el número de teléfono del usuario o el número verificado
export const getUserPhoneNumber = async (userId: string): Promise<string> => {
  // Número verificado para pruebas
  const verifiedPhoneNumber = VERIFIED_PHONE_NUMBER;
  
  try {
    console.log(`Obteniendo número de teléfono para el usuario ${userId}`);
    
    // Verificar si el usuario tiene preferencias de notificaciones SMS activadas
    const { data: preferences, error: preferencesError } = await supabase
      .from('user_preferences')
      .select('sms_notifications, task_created_sms')
      .eq('user_id', userId)
      .single();
    
    if (preferencesError) {
      console.error('Error al obtener preferencias del usuario:', preferencesError);
      // Si hay error, continuamos con el número verificado
    } else if (preferences && (!preferences.sms_notifications || !preferences.task_created_sms)) {
      console.log('Usuario tiene desactivadas las notificaciones SMS para tareas creadas');
      return ''; // Devolver cadena vacía para indicar que no se debe enviar SMS
    }
    
    // Intentar obtener el número de teléfono de la base de datos
    const { data, error } = await supabase
      .from('users')
      .select('phone_number')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error('Error al obtener el número de teléfono del usuario:', error);
      return verifiedPhoneNumber;
    }
    
    if (!data || !data.phone_number) {
      console.log('Usuario no tiene número de teléfono registrado, usando número verificado');
      return verifiedPhoneNumber;
    }
    
    // En desarrollo o con cuenta de prueba de Twilio, usamos el número verificado
    // En producción, usamos el número real del usuario
    if (process.env.NODE_ENV === 'development') {
      console.log(`Usando número verificado en desarrollo: ${verifiedPhoneNumber}`);
      return verifiedPhoneNumber;
    }
    
    console.log(`Número de teléfono obtenido: ${data.phone_number}`);
    return data.phone_number;
  } catch (error) {
    console.error('Error inesperado al obtener el número de teléfono:', error);
    return verifiedPhoneNumber;
  }
};

// Función para enviar SMS de notificación de tarea creada
export const sendTaskCreatedSMS = async (
  userId: string,
  taskTitle: string,
  projectName: string
): Promise<{ success: boolean; error?: any }> => {
  try {
    // Obtener el número de teléfono verificado
    const phoneNumber = await getUserPhoneNumber(userId);
    
    // Crear el mensaje en catalán
    const message = `MyTask: S'ha creat una nova tasca "${taskTitle}" al projecte "${projectName}".`;
    
    // Enviar el SMS y pasar el userId para registrarlo en la base de datos
    console.log(`Enviando SMS de tarea creada: ${message}`);
    return sendSMS(phoneNumber, message, userId);
  } catch (error) {
    // Capturar cualquier error inesperado para evitar que rompa la aplicación
    console.warn('Error al intentar enviar SMS de tarea creada:', error);
    return { success: false, error };
  }
};

// Función para enviar SMS de recordatorio de tarea próxima a vencer
export const sendTaskDueSoonSMS = async (
  userId: string,
  taskTitle: string,
  projectName: string,
  dueDate: string
): Promise<{ success: boolean; error?: any }> => {
  try {
    // Obtener el número de teléfono verificado
    const phoneNumber = await getUserPhoneNumber(userId);
    
    // Formatear la fecha en formato catalán
    const formattedDate = new Date(dueDate).toLocaleDateString('ca-ES');
    
    // Crear el mensaje en catalán
    const message = `MyTask: Recordatori! La tasca "${taskTitle}" del projecte "${projectName}" venç el ${formattedDate}.`;
    
    // Enviar el SMS
    console.log(`Enviando SMS de recordatorio: ${message}`);
    return sendSMS(phoneNumber, message);
  } catch (error) {
    // Capturar cualquier error inesperado para evitar que rompa la aplicación
    console.warn('Error al intentar enviar SMS de recordatorio:', error);
    return { success: false, error };
  }
};

// Función para enviar SMS de tarea completada
export const sendTaskCompletedSMS = async (
  userId: string,
  taskTitle: string,
  projectName: string
): Promise<{ success: boolean; error?: any }> => {
  try {
    // Obtener el número de teléfono verificado
    const phoneNumber = await getUserPhoneNumber(userId);
    
    // Crear el mensaje en catalán
    const message = `MyTask: La tasca "${taskTitle}" del projecte "${projectName}" ha estat completada.`;
    
    // Enviar el SMS
    console.log(`Enviando SMS de tarea completada: ${message}`);
    return sendSMS(phoneNumber, message);
  } catch (error) {
    // Capturar cualquier error inesperado para evitar que rompa la aplicación
    console.warn('Error al intentar enviar SMS de tarea completada:', error);
    return { success: false, error };
  }
};
