import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../supabase';
import { authService } from '../services/supabaseService';

// Tipo para el contexto de autenticación
type AuthContextType = {
  user: User | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: any }>;
  signUp: (email: string, password: string, nom: string) => Promise<{ success: boolean; error?: any }>;
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
        const { user, error } = await authService.getCurrentUser();
        
        if (error) {
          // Si el error es AuthSessionMissingError, es normal cuando no hay sesión
          if (error.__isAuthError && error.name === 'AuthSessionMissingError') {
            console.log('No hay sesión activa, usuario no autenticado');
          } else {
            console.error('Error al cargar usuario:', error);
            setError('No s\'ha pogut carregar l\'usuari');
          }
        } else {
          setUser(user);
          setError(null);
        }
      } catch (err) {
        console.error('Error inesperado al cargar usuario:', err);
        setError('Error inesperat al carregar l\'usuari');
      } finally {
        setLoading(false);
      }
    };

    // Configurar un temporizador para redirigir si la carga tarda demasiado
    const timeoutId = setTimeout(() => {
      if (loading) {
        console.log('La carga está tardando demasiado, estableciendo loading a false');
        setLoading(false);
      }
    }, 2000);

    loadUser();

    // Limpiar el temporizador cuando el componente se desmonte
    return () => clearTimeout(timeoutId);
  }, [loading]);

  // Función para iniciar sesión
  const signIn = async (email: string, password: string) => {
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
  };

  // Función para registrarse
  const signUp = async (email: string, password: string, nom: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const { user: authUser, error: authError } = await authService.signUp(email, password, nom);
      
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
  };

  // Función para cerrar sesión
  const signOut = async () => {
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
  };

  // Valor del contexto
  const value = {
    user,
    loading,
    error,
    signIn,
    signUp,
    signOut,
  };

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
