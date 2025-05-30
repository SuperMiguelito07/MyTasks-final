// Importamos supabase para operaciones con la base de datos cuando sea necesario
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { supabase } from '../supabase';

// Configuración del cliente de Twilio usando variables de entorno
// Estas variables deben configurarse en el archivo .env.local y en Netlify
const accountSid = process.env.REACT_APP_TWILIO_ACCOUNT_SID;
const authToken = process.env.REACT_APP_TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.REACT_APP_TWILIO_PHONE_NUMBER;

// Imprimir las variables de entorno para depuración (solo los primeros caracteres por seguridad)
console.log('Variables de entorno de Twilio disponibles:', {
  accountSid: accountSid ? `${accountSid.substring(0, 5)}...` : 'no disponible',
  authToken: authToken ? `${authToken.substring(0, 3)}...` : 'no disponible',
  twilioPhoneNumber: twilioPhoneNumber || 'no disponible'
});

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
          // Usar una función compatible con todos los navegadores
          const auth = window.btoa(`${accountSid}:${authToken}`);
          console.log('Autenticación generada (primeros caracteres):', auth.substring(0, 10) + '...');
          
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
const useRealClient = true; // Siempre usamos el cliente real para enviar SMS

// Número de teléfono verificado en la cuenta de Twilio
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const VERIFIED_PHONE_NUMBER = '+34669472052'; // Solo este número está verificado

// Inicializar el cliente de Twilio
if (useRealClient && accountSid && authToken) {
  console.log('Usando cliente real de Twilio con las credenciales configuradas');
  twilioClient = createTwilioClient();
} else {
  console.warn('Usando modo de simulación para SMS.');
  twilioClient = simulatedTwilioClient;
}

// Función simplificada para enviar SMS usando Twilio
export const sendSMS = async (
  phoneNumber: string,
  message: string
): Promise<{ success: boolean; error?: any; messageId?: string }> => {
  // En cuentas de prueba de Twilio, solo se pueden enviar SMS a números verificados
  // Este número debe configurarse en las variables de entorno
  const targetPhoneNumber = phoneNumber;
  
  console.log(`Enviando SMS a ${targetPhoneNumber}: ${message}`);
  
  // Verificar que tenemos todas las credenciales necesarias
  if (!accountSid || !authToken || !twilioPhoneNumber) {
    console.error('Faltan credenciales de Twilio:', { 
      accountSid: accountSid ? 'disponible' : 'no disponible', 
      authToken: authToken ? 'disponible' : 'no disponible',
      twilioPhoneNumber: twilioPhoneNumber || 'no disponible' 
    });
    return { 
      success: false, 
      error: { message: 'Faltan credenciales de Twilio. Verifica tu configuración en Netlify.' } 
    };
  }
  
  try {
    // Enviar SMS directamente usando la API REST de Twilio
    console.log(`Intentando enviar SMS a ${targetPhoneNumber} con mensaje: ${message}`);
    
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
          success: false, 
          error: { message: errorText } 
        };
      }
    }
  } catch (error) {
    console.error('Error inesperado al enviar SMS:', error);
    
    // Intentar analizar el mensaje de error
    let errorMessage = 'Error desconocido al enviar SMS';
    let errorCode = 0;
    
    if (error instanceof Error) {
      errorMessage = error.message;
      
      // Detectar si es un error de número no verificado (común en cuentas de prueba)
      if (
        errorMessage.includes('not a verified') || 
        errorMessage.includes('unverified')
      ) {
        errorMessage = `El número ${targetPhoneNumber} no está verificado en tu cuenta de prueba de Twilio. ` +
                     `Debes verificar este número en el panel de Twilio o actualizar a una cuenta de pago.`;
      }
    }
    
    // Si es un error de Twilio, puede tener una estructura específica
    const twilioError = error as any;
    if (twilioError.code) {
      errorCode = twilioError.code;
    }
    
    return { success: false, error: { code: errorCode, message: errorMessage } };
  }
};

// Función para obtener el número de teléfono del usuario o el número verificado
export const getUserPhoneNumber = async (userId: string): Promise<string> => {
  // Número verificado configurado en las variables de entorno
  const verifiedPhoneNumber = process.env.REACT_APP_VERIFIED_PHONE_NUMBER || '';
  
  try {
    console.log(`Obteniendo número de teléfono para el usuario ${userId}`);
    
    // En una cuenta de prueba de Twilio, siempre usamos el número verificado
    // independientemente del número que tenga el usuario en la base de datos
    console.log(`Usando número verificado: ${verifiedPhoneNumber}`);
    return verifiedPhoneNumber;
    
    /* Comentado para evitar problemas con la base de datos
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
    
    console.log(`Número de teléfono obtenido: ${data.phone_number}`);
    return data.phone_number;
    */
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
    
    // Enviar el SMS
    console.log(`Enviando SMS de tarea creada: ${message}`);
    return sendSMS(phoneNumber, message);
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
