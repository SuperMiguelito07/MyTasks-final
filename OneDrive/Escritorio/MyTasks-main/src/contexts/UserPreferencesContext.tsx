import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';

// Tipo para las preferencias de usuario
interface UserPreferences {
  emailNotifications: boolean;
  inAppNotifications: boolean;
  darkMode: boolean;
}

// Tipo para el contexto de preferencias
type UserPreferencesContextType = {
  preferences: UserPreferences;
  loading: boolean;
  error: string | null;
  updatePreferences: (newPreferences: Partial<UserPreferences>) => Promise<void>;
};

// Valores predeterminados para las preferencias
const defaultPreferences: UserPreferences = {
  emailNotifications: true,
  inAppNotifications: true,
  darkMode: false,
};

// Crear el contexto
const UserPreferencesContext = createContext<UserPreferencesContextType | undefined>(undefined);

// Props para el proveedor
type UserPreferencesProviderProps = {
  children: React.ReactNode;
};

// Proveedor de preferencias de usuario
export const UserPreferencesProvider: React.FC<UserPreferencesProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar preferencias del usuario
  const loadPreferences = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Aquí se implementaría la lógica para cargar las preferencias desde la base de datos
      // Por ahora, usamos localStorage como almacenamiento temporal
      const savedPreferences = localStorage.getItem(`user_preferences_${user.id}`);
      
      if (savedPreferences) {
        setPreferences(JSON.parse(savedPreferences));
      }
    } catch (err) {
      console.error('Error al cargar preferencias:', err);
      setError('Error al cargar preferencias');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Actualizar preferencias del usuario
  const updatePreferences = async (newPreferences: Partial<UserPreferences>) => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Combinar las preferencias actuales con las nuevas
      const updatedPreferences = {
        ...preferences,
        ...newPreferences,
      };
      
      // Aquí se implementaría la lógica para guardar las preferencias en la base de datos
      // Por ahora, usamos localStorage como almacenamiento temporal
      localStorage.setItem(`user_preferences_${user.id}`, JSON.stringify(updatedPreferences));
      
      setPreferences(updatedPreferences);
    } catch (err) {
      console.error('Error al actualizar preferencias:', err);
      setError('Error al actualizar preferencias');
    } finally {
      setLoading(false);
    }
  };

  // Cargar preferencias cuando cambia el usuario
  useEffect(() => {
    if (user) {
      loadPreferences();
    } else {
      setPreferences(defaultPreferences);
    }
  }, [user, loadPreferences]);

  // Valor del contexto
  const value = {
    preferences,
    loading,
    error,
    updatePreferences,
  };

  return (
    <UserPreferencesContext.Provider value={value}>
      {children}
    </UserPreferencesContext.Provider>
  );
};

// Hook personalizado para usar el contexto de preferencias
export const useUserPreferences = () => {
  const context = useContext(UserPreferencesContext);
  
  if (context === undefined) {
    throw new Error('useUserPreferences debe ser usado dentro de un UserPreferencesProvider');
  }
  
  return context;
};
