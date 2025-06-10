// Importem supabase per a operacions amb la base de dades quan sigui necessari
import { supabase } from '../supabase';

const accountSid = process.env.REACT_APP_TWILIO_ACCOUNT_SID;
const authToken = process.env.REACT_APP_TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.REACT_APP_TWILIO_PHONE_NUMBER;

const VERIFIED_PHONE_NUMBER = '+34669472052'; // Reemplaça això amb el teu número real verificat

// Imprimir les variables d'entorn per a depuració (només els primers caràcters per seguretat)
console.log('Variables d\'entorn de Twilio disponibles:', {
  accountSid: accountSid ? `${accountSid.substring(0, 5)}...` : 'no disponible',
  authToken: authToken ? `${authToken.substring(0, 3)}...` : 'no disponible',
  twilioPhoneNumber: twilioPhoneNumber || 'no disponible'
});

// Client de Twilio per enviar SMS reals
// Implementa la interfície TwilioLike utilitzant l'API REST de Twilio
// Utilitza les credencials emmagatzemades a les variables d'entorn per seguretat
const createTwilioClient = () => {
  const client = {
    messages: {
      create: async (params: any) => {
        try {
          const sid = process.env.REACT_APP_TWILIO_ACCOUNT_SID || '';
          const token = process.env.REACT_APP_TWILIO_AUTH_TOKEN || '';
          if (!sid || !token) {
            throw new Error('Falten credencials de Twilio. Verifica les variables d\'entorn.');
          }
          const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`;
          const auth = window.btoa(`${sid}:${token}`);
          const formData = new URLSearchParams();
          formData.append('To', params.to);
          formData.append('From', process.env.REACT_APP_TWILIO_PHONE_NUMBER || '');
          formData.append('Body', params.body);
          const response = await fetch(url, {
            method: 'POST',
            headers: {
              'Authorization': `Basic ${auth}`,
              'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: formData
          });
          if (response.ok) {
            const data = await response.json();
            return data;
          } else {
            const errorData = await response.text();
            throw new Error(`Error de Twilio: ${errorData}`);
          }
        } catch (error) {
          throw error;
        }
      }
    }
  };
  return client;
};

let twilioClient = createTwilioClient();

// Funció simplificada per enviar SMS utilitzant Twilio
export const sendSMS = async (
  phoneNumber: string,
  message: string,
  userId?: string // Afegim el userId per registrar a la base de dades
): Promise<{ success: boolean; error?: any; messageId?: string }> => {
  const targetPhoneNumber = VERIFIED_PHONE_NUMBER;
  console.log(`Número original: ${phoneNumber}, utilitzant número verificat: ${targetPhoneNumber}`);
  console.log(`Enviant SMS a ${targetPhoneNumber}: ${message}`);
  if (!accountSid || !authToken || !twilioPhoneNumber) {
    console.error('Falten credencials de Twilio:', { 
      accountSid: accountSid ? 'disponible' : 'no disponible', 
      authToken: authToken ? 'disponible' : 'no disponible',
      twilioPhoneNumber: twilioPhoneNumber || 'no disponible' 
    });
    return { 
      success: false, 
      error: { 
        message: 'Falten credencials de Twilio.' 
      } 
    };
  }
  try {
    if (twilioClient?.messages?.create) {
      try {
        const result = await twilioClient.messages.create({
          to: targetPhoneNumber,
          from: twilioPhoneNumber,
          body: message
        });
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
        return { 
          success: false, 
          error: { 
            code: twilioError.code || 0, 
            message: twilioError.message || 'Error desconegut al enviar SMS' 
          } 
        };
      }
    }
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const auth = window.btoa(`${accountSid}:${authToken}`);
    const formData = new URLSearchParams();
    formData.append('To', targetPhoneNumber);
    formData.append('From', twilioPhoneNumber);
    formData.append('Body', message);
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formData
    });
    if (response.ok) {
      const data = await response.json();
      return { success: true, messageId: data.sid };
    } else {
      const errorText = await response.text();
      try {
        const errorJson = JSON.parse(errorText);
        return { 
          success: false, 
          error: { 
            code: errorJson.code || 0, 
            message: errorJson.message || 'Error desconegut al enviar SMS' 
          } 
        };
      } catch (e) {
        return { 
          success: false, 
          error: { 
            message: 'Error en el servei.' 
          } 
        };
      }
    }
  } catch (error) {
    return { 
      success: false, 
      error: { 
        message: error instanceof Error ? error.message : 'Error desconegut.' 
      } 
    };
  }
};

export const logSmsToDatabase = async (
  userId: string,
  phoneNumber: string,
  message: string,
  status: 'pending' | 'sent' | 'failed',
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
      console.error('Error al registrar SMS a la base de dades:', error);
    }
  } catch (error) {
    console.error('Error inesperat al registrar SMS:', error);
  }
};

export const getUserPhoneNumber = async (userId: string): Promise<string> => {
  const verifiedPhoneNumber = VERIFIED_PHONE_NUMBER;
  try {
    const { data, error } = await supabase
      .from('users')
      .select('phone_number')
      .eq('id', userId)
      .single();
    if (error) {
      return verifiedPhoneNumber;
    }
    if (!data || !data.phone_number) {
      return verifiedPhoneNumber;
    }
    return data.phone_number; 
  } catch (error) {
    return verifiedPhoneNumber;
  }
};

export const sendTaskCreatedSMS = async (
  userId: string,
  taskTitle: string,
  projectName: string
): Promise<{ success: boolean; error?: any }> => {
  try {
    const phoneNumber = await getUserPhoneNumber(userId);
    const message = `MyTask: S'ha creat una nova tasca "${taskTitle}" al projecte "${projectName}".`;
    return sendSMS(phoneNumber, message, userId);
  } catch (error) {
    return { success: false, error };
  }
};