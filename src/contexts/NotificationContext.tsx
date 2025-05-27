import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useUserPreferences } from './UserPreferencesContext';
import { Notification } from '../supabase';
import { supabase } from '../supabase';

// Tipo para el contexto de notificaciones
type NotificationContextType = {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  fetchNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
};

// Crear el contexto
const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Props para el proveedor de notificaciones
type NotificationProviderProps = {
  children: React.ReactNode;
};

// Proveedor de notificaciones
export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const { preferences } = useUserPreferences();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Función para obtener las notificaciones del usuario
  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error al obtener notificaciones:', error);
        setError('Error al obtener notificaciones');
      } else {
        setNotifications(data || []);
      }
    } catch (err) {
      console.error('Error inesperado al obtener notificaciones:', err);
      setError('Error inesperado al obtener notificaciones');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Función para marcar una notificación como leída
  const markAsRead = async (notificationId: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);
      
      if (error) {
        console.error('Error al marcar notificación como leída:', error);
      } else {
        // Actualizar la lista de notificaciones
        setNotifications(prevNotifications => 
          prevNotifications.map(n => 
            n.id === notificationId ? { ...n, read: true } : n
          )
        );
      }
    } catch (err) {
      console.error('Error inesperado al marcar notificación como leída:', err);
    }
  };

  // Cargar notificaciones cuando cambia el usuario
  useEffect(() => {
    if (user) {
      fetchNotifications();
    } else {
      setNotifications([]);
    }
  }, [user, fetchNotifications]);

  // Calcular el número de notificaciones no leídas
  const unreadCount = notifications.filter(n => !n.read).length;



  // Función para eliminar una notificación
  const deleteNotification = async (notificationId: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);
      
      if (error) {
        console.error('Error al eliminar notificación:', error);
      } else {
        // Actualizar la lista de notificaciones
        setNotifications(prevNotifications => 
          prevNotifications.filter(n => n.id !== notificationId)
        );
      }
    } catch (err) {
      console.error('Error inesperado al eliminar notificación:', err);
    }
  };

  // Valor del contexto
  const value = {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    deleteNotification,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

// Hook personalizado para usar el contexto de notificaciones
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  
  if (context === undefined) {
    throw new Error('useNotifications debe ser usado dentro de un NotificationProvider');
  }
  
  return context;
};
