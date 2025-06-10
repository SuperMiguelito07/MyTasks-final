import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { User } from '../supabase';
import { authService } from '../services/supabaseService';

// Tipus per al context d'autenticació
// Defineix l'estructura del context que proporciona les funcionalitats d'autenticació
type AuthContextType = {
  user: User | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: any }>;
  signUp: (email: string, password: string, nom: string, phoneNumber?: string) => Promise<{ success: boolean; error?: any }>;
  signOut: () => Promise<void>;
};

// Crear el context
// Inicialitzem el context amb undefined com a valor per defecte
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Props per al proveïdor d'autenticació
// Defineix les propietats que accepta el component proveïdor
type AuthProviderProps = {
  children: ReactNode;
};

// Proveïdor d'autenticació
// Component que gestiona l'estat d'autenticació i proporciona funcions per iniciar sessió, registrar-se i tancar sessió
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Efecte per carregar l'usuari actual en iniciar l'aplicació
  // S'executa només una vegada quan es munta el component
  useEffect(() => {
    const loadUser = async () => {
      setLoading(true);
      try {
        // Verificar si hi ha una sessió activa
        const { user: authUser, error: authError } = await authService.getCurrentUser();
        
        if (authError) {
          // Només registrar l'error si no és un error comú de sessió
          if (!(authError instanceof Error && authError.message === 'Auth session missing!')) {
            console.error('Error al obtener el usuario actual:', authError);
          }
          setUser(null);
          setError(null);
        } else if (authUser) {
          // Evitar log excessiu d'objectes d'usuari
          setUser(authUser);
          setError(null);
        } else {
          setUser(null);
          setError(null);
        }
      } catch (err) {
        console.error('Error al carregar l\'usuari:', err);
        setError('Error al iniciar l\'aplicació');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    // Configurar un temporitzador per redirigir si la càrrega triga massa
    // Això evita que l'usuari es quedi en un estat de càrrega indefinit
    const timeoutId = setTimeout(() => {
      if (loading) {
        console.log('Temps de càrrega excedit, finalitzant estat de càrrega');
        setLoading(false);
      }
    }, 5000); // Augmentat de 2000ms a 5000ms per donar més temps

    loadUser();

    // Netejar el temporitzador quan el component es desmunti
    // Això evita problemes de memòria i errors si el component ja no existeix
    return () => clearTimeout(timeoutId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Eliminada la dependència [loading] per evitar bucles

  // Funció per iniciar sessió optimitzada amb useCallback
  // Utilitza el servei d'autenticació per validar les credencials
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

  // Funció per registrar-se optimitzada amb useCallback
  // Crea un nou usuari amb les dades proporcionades
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

  // Funció per tancar sessió optimitzada amb useCallback
  // Tanca la sessió actual i neteja l'estat d'usuari
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

  const value = useMemo(() => ({
    user,
    loading,
    error,
    signIn,
    signUp,
    signOut,
  }), [user, loading, error]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook personalitzat per utilitzar el context d'autenticació
// Simplifica l'accés al context des de qualsevol component
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth ha de ser utilitzat dins d\'un AuthProvider');
  }
  
  return context;
};
