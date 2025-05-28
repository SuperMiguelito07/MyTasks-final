import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { User } from '../supabase';
import { authService } from '../services/supabaseService';
import { scheduleTaskReminders } from '../services/taskReminderService';

// Tipo para el contexto de autenticación
type AuthContextType = {
  user: User | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: any }>;
  signUp: (email: string, password: string, nom: string, phoneNumber?: string) => Promise<{ success: boolean; error?: any }>;
  signOut: () => Promise<void>;
};

// Crear el contexto
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Props para el proveedor de autenticación
type AuthProviderProps = {
  children: ReactNode;
};

// Proveedor de autenticación
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Efecto para cargar el usuario actual al iniciar la aplicación
  useEffect(() => {
    const loadUser = async () => {
      setLoading(true);
      try {
        // Verificar si hay una sesión activa
        const { user, error } = await authService.getCurrentUser();
        
        if (error) {
          // Solo registrar el error si no es un error común de sesión
          if (!(error instanceof Error && error.message === 'Auth session missing!')) {
            console.error('Error al obtener el usuario actual:', error);
          }
          setUser(null);
          setError(null);
        } else if (user) {
          // Evitar log excesivo de objetos de usuario
          setUser(user);
          setError(null);
          
          // Iniciar el servicio de recordatorios de tareas (solo una vez)
          try {
            // Usar una variable global para evitar iniciar el servicio múltiples veces
            const w = window as any;
            if (!w.__taskRemindersInitialized) {
              scheduleTaskReminders(user.id);
              w.__taskRemindersInitialized = true;
              console.log('Servicio de recordatorios de tareas iniciado para el usuario:', user.id);
            }
          } catch (reminderError) {
            console.error('Error al iniciar el servicio de recordatorios:', reminderError);
            // No fallamos la carga del usuario si falla el servicio de recordatorios
          }
        } else {
          setUser(null);
          setError(null);
        }
      } catch (err) {
        console.error('Error al cargar el usuario:', err);
        setError('Error al iniciar la aplicación');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    // Configurar un temporizador para redirigir si la carga tarda demasiado
    const timeoutId = setTimeout(() => {
      if (loading) {
        console.log('Tiempo de carga excedido, finalizando estado de carga');
        setLoading(false);
      }
    }, 5000); // Aumentado de 2000ms a 5000ms para dar más tiempo

    loadUser();

    // Limpiar el temporizador cuando el componente se desmonte
    return () => clearTimeout(timeoutId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Eliminada la dependencia [loading] para evitar bucles

  // Función para iniciar sesión optimizada con useCallback
  const signIn = useCallback(async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const { user: authUser, error: authError } = await authService.signIn(email, password);
      
      if (authError) {
        setError('Error al iniciar sessió: ' + authError.message);
        return { success: false, error: authError };
      }
      
      setUser(authUser);
      return { success: true };
    } catch (err: any) {
      setError('Error inesperat al iniciar sessió');
      return { success: false, error: err };
    } finally {
      setLoading(false);
    }
  }, []);

  // Función para registrarse optimizada con useCallback
  const signUp = useCallback(async (email: string, password: string, nom: string, phoneNumber?: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const { user: authUser, error: authError } = await authService.signUp(email, password, nom, phoneNumber);
      
      if (authError) {
        setError('Error al registrar-se: ' + authError.message);
        return { success: false, error: authError };
      }
      
      setUser(authUser);
      return { success: true };
    } catch (err: any) {
      setError('Error inesperat al registrar-se');
      return { success: false, error: err };
    } finally {
      setLoading(false);
    }
  }, []);

  // Función para cerrar sesión optimizada con useCallback
  const signOut = useCallback(async () => {
    setLoading(true);
    
    try {
      const { error: signOutError } = await authService.signOut();
      
      if (signOutError) {
        setError('Error al tancar sessió: ' + signOutError.message);
      } else {
        setUser(null);
        setError(null);
      }
    } catch (err: any) {
      setError('Error inesperat al tancar sessió');
    } finally {
      setLoading(false);
    }
  }, []);

  // Valor del contexto memoizado para evitar renderizaciones innecesarias
  const value = useMemo(() => ({
    user,
    loading,
    error,
    signIn,
    signUp,
    signOut,
  }), [user, loading, error, signIn, signUp, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook personalizado para usar el contexto de autenticación
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  
  return context;
};
