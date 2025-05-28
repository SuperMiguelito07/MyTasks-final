import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { Project, Task } from '../supabase';
import { projectService, taskService } from '../services/supabaseService';
import { useAuth } from './AuthContext';
import { sendTaskCreatedSMS, sendTaskCompletedSMS } from '../services/smsService';

// Tipo para el contexto de proyectos
type ProjectContextType = {
  projects: Project[];
  currentProject: Project | null;
  tasks: Task[];
  loading: boolean;
  error: string | null;
  fetchProjects: () => Promise<void>;
  fetchTasks: (projectId: string) => Promise<void>;
  setCurrentProject: (project: Project | null) => void;
  createProject: (name: string, description: string) => Promise<Project | null>;
  updateProject: (projectId: string, updates: Partial<Project>) => Promise<Project | null>;
  deleteProject: (projectId: string) => Promise<boolean>;
  createTask: (task: Omit<Task, 'id'>) => Promise<Task | null>;
  updateTask: (taskId: string, updates: Partial<Task>) => Promise<Task | null>;
  deleteTask: (taskId: string) => Promise<boolean>;
  moveTask: (taskId: string, newStatus: 'To Do' | 'Doing' | 'Done') => Promise<Task | null>;
};

// Crear el contexto
const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

// Props para el proveedor de proyectos
type ProjectProviderProps = {
  children: ReactNode;
};

// Proveedor de proyectos
export const ProjectProvider: React.FC<ProjectProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Cache para almacenar las tareas por proyecto y evitar llamadas innecesarias a la API
  const tasksCache = useRef<Record<string, { tasks: Task[], timestamp: number }>>({});
  
  // Función para cargar tareas envuelta en useCallback con soporte de caché
  const fetchTasks = useCallback(async (projectId: string) => {
    // Verificar si tenemos las tareas en caché y si son recientes (menos de 30 segundos)
    const cachedData = tasksCache.current[projectId];
    const now = Date.now();
    
    if (cachedData && (now - cachedData.timestamp < 30000)) {
      // Usar datos en caché si son recientes
      console.log('Usando tareas en caché para el proyecto:', projectId);
      setTasks(cachedData.tasks);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const { tasks, error } = await taskService.getTasks(projectId);
      
      if (error) {
        console.error('Error al cargar tareas:', error);
        setError('No s\'han pogut carregar les tasques');
      } else {
        // Actualizar el estado y la caché
        setTasks(tasks);
        tasksCache.current[projectId] = {
          tasks,
          timestamp: now
        };
      }
    } catch (err) {
      console.error('Error inesperado al cargar tareas:', err);
      setError('Error inesperat al carregar les tasques');
    } finally {
      setLoading(false);
    }
  }, []);

  // Función para cargar proyectos envuelta en useCallback
  const fetchProjects = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const { projects, error } = await projectService.getProjects(user.id);
      
      if (error) {
        console.error('Error al cargar proyectos:', error);
        setError('No s\'han pogut carregar els projectes');
      } else {
        setProjects(projects);
        
        // Si no hay proyecto actual y hay proyectos disponibles, establecer el primero como actual
        if (!currentProject && projects.length > 0) {
          setCurrentProject(projects[0]);
        }
      }
    } catch (err) {
      console.error('Error inesperado al cargar proyectos:', err);
      setError('Error inesperat al carregar els projectes');
    } finally {
      setLoading(false);
    }
  }, [user, currentProject]);

  // Cargar proyectos cuando el usuario cambia
  useEffect(() => {
    if (user) {
      fetchProjects();
    } else {
      setProjects([]);
      setCurrentProject(null);
      setTasks([]);
    }
  }, [user, fetchProjects]);

  // Cargar tareas cuando cambia el proyecto actual
  useEffect(() => {
    if (currentProject) {
      fetchTasks(currentProject.id);
    } else {
      setTasks([]);
    }
  }, [currentProject, fetchTasks]);

  // Función para crear un proyecto
  const createProject = async (nom: string, descripcio: string): Promise<Project | null> => {
    if (!user) return null;
    
    setLoading(true);
    setError(null);
    
    try {
      const newProject: Omit<Project, 'id'> = {
        name: nom,
        description: descripcio,
        owner_id: user.id,
        created_at: new Date().toISOString(),
        is_archived: false
      };
      
      const { project, error } = await projectService.createProject(newProject);
      
      if (error) {
        console.error('Error al crear proyecto:', error);
        setError('No s\'ha pogut crear el projecte');
        return null;
      }
      
      // Actualizar la lista de proyectos
      setProjects(prevProjects => [...prevProjects, project!]);
      
      // Establecer el nuevo proyecto como actual
      setCurrentProject(project);
      
      return project;
    } catch (err) {
      console.error('Error inesperado al crear proyecto:', err);
      setError('Error inesperat al crear el projecte');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Función para actualizar un proyecto
  const updateProject = async (projectId: string, updates: Partial<Project>): Promise<Project | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const { project, error } = await projectService.updateProject(projectId, updates);
      
      if (error) {
        console.error('Error al actualizar proyecto:', error);
        setError('No s\'ha pogut actualitzar el projecte');
        return null;
      }
      
      // Actualizar la lista de proyectos
      setProjects(prevProjects => 
        prevProjects.map(p => p.id === projectId ? { ...p, ...updates } : p)
      );
      
      // Actualizar el proyecto actual si es el que se ha modificado
      if (currentProject && currentProject.id === projectId) {
        setCurrentProject({ ...currentProject, ...updates });
      }
      
      return project;
    } catch (err) {
      console.error('Error inesperado al actualizar proyecto:', err);
      setError('Error inesperat al actualitzar el projecte');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Función para eliminar un proyecto
  const deleteProject = async (projectId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      const { error } = await projectService.deleteProject(projectId);
      
      if (error) {
        console.error('Error al eliminar proyecto:', error);
        setError('No s\'ha pogut eliminar el projecte');
        return false;
      }
      
      // Actualizar la lista de proyectos
      const updatedProjects = projects.filter(p => p.id !== projectId);
      setProjects(updatedProjects);
      
      // Si el proyecto eliminado era el actual, establecer otro como actual
      if (currentProject && currentProject.id === projectId) {
        setCurrentProject(updatedProjects.length > 0 ? updatedProjects[0] : null);
      }
      
      return true;
    } catch (err) {
      console.error('Error inesperado al eliminar proyecto:', err);
      setError('Error inesperat al eliminar el projecte');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Función para crear una tarea
  const createTask = async (task: Omit<Task, 'id'>): Promise<Task | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const { task: newTask, error } = await taskService.createTask(task);
      
      if (error) {
        console.error('Error al crear tarea:', error);
        setError('No s\'ha pogut crear la tasca');
        return null;
      }
      
      // Actualizar la lista de tareas
      setTasks(prevTasks => [...prevTasks, newTask!]);
      
      // Enviar SMS para la nueva tarea automáticamente
      console.log('Enviando SMS automáticamente para la nueva tarea:', newTask);
      try {
        // Obtener el nombre del proyecto
        let projectName = 'un proyecto';
        if (currentProject) {
          projectName = currentProject.name;
        }
        
        // Enviar SMS de notificación de tarea creada
        const smsResult = await sendTaskCreatedSMS(
          user!.id,
          newTask!.title,
          projectName
        );
        
        if (smsResult.success) {
          console.log('SMS enviado correctamente para la tarea:', newTask!.title);
        } else {
          console.warn('No se pudo enviar el SMS:', smsResult.error);
        }
      } catch (smsError) {
        console.error('Error al enviar SMS:', smsError);
        // No fallamos la creación de la tarea si falla el envío del SMS
      }
      
      return newTask;
    } catch (err) {
      console.error('Error inesperado al crear tarea:', err);
      setError('Error inesperat al crear la tasca');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Función para actualizar una tarea
  const updateTask = async (taskId: string, updates: Partial<Task>): Promise<Task | null> => {
    setLoading(true);
    setError(null);
    
    try {
      // Obtener la tarea actual antes de actualizarla para comparar estados
      const currentTask = tasks.find(t => t.id === taskId);
      const { task: updatedTask, error } = await taskService.updateTask(taskId, updates);
      
      if (error) {
        console.error('Error al actualizar tarea:', error);
        setError('No s\'ha pogut actualitzar la tasca');
        return null;
      }
      
      // Actualizar la lista de tareas
      setTasks(prevTasks => 
        prevTasks.map(t => t.id === taskId ? { ...t, ...updates } : t)
      );
      
      // Verificar si la tarea se ha marcado como completada
      if (updates.status === 'Done' && currentTask?.status !== 'Done' && currentTask) {
        console.log('Tarea marcada como completada, enviando SMS...');
        try {
          // Obtener el nombre del proyecto
          let projectName = 'un proyecto';
          if (currentProject) {
            projectName = currentProject.name;
          } else if (currentTask.project_id) {
            // Intentar encontrar el proyecto en la lista de proyectos
            const taskProject = projects.find(p => p.id === currentTask.project_id);
            if (taskProject) {
              projectName = taskProject.name;
            }
          }
          
          // Enviar SMS de tarea completada
          const smsResult = await sendTaskCompletedSMS(
            user!.id,
            currentTask.title,
            projectName
          );
          
          console.log('Resultado del SMS de tarea completada:', smsResult);
        } catch (smsError) {
          console.error('Error al enviar SMS de tarea completada:', smsError);
          // No fallamos la actualización de la tarea si falla el envío del SMS
        }
      }
      
      return updatedTask;
    } catch (err) {
      console.error('Error inesperado al actualizar tarea:', err);
      setError('Error inesperat al actualitzar la tasca');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Función para eliminar una tarea
  const deleteTask = async (taskId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      const { error } = await taskService.deleteTask(taskId);
      
      if (error) {
        console.error('Error al eliminar tarea:', error);
        setError('No s\'ha pogut eliminar la tasca');
        return false;
      }
      
      // Actualizar la lista de tareas
      setTasks(prevTasks => prevTasks.filter(t => t.id !== taskId));
      
      return true;
    } catch (err) {
      console.error('Error inesperado al eliminar tarea:', err);
      setError('Error inesperat al eliminar la tasca');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Función para mover una tarea a otro estado
  const moveTask = async (taskId: string, newStatus: 'To Do' | 'Doing' | 'Done'): Promise<Task | null> => {
    // Primero obtenemos la tarea actual para tener su título
    const currentTask = tasks.find(t => t.id === taskId);
    if (!currentTask) {
      console.error('No se encontró la tarea para mover:', taskId);
      return null;
    }
    
    // Actualizamos la tarea
    const updatedTask = await updateTask(taskId, { status: newStatus });
    
    if (updatedTask) {
      // Solo enviamos SMS si la tarea se ha marcado como completada
      if (newStatus === 'Done') {
        console.log('Enviando SMS para tarea completada:', updatedTask);
        try {
          // Obtener el nombre del proyecto
          let projectName = 'un proyecto';
          if (currentProject) {
            projectName = currentProject.name;
          }
          
          const smsResult = await sendTaskCompletedSMS(
            user!.id,
            currentTask.title,
            projectName
          );
          
          console.log('Resultado del SMS de tarea completada:', smsResult);
        } catch (smsError) {
          console.error('Error al enviar SMS de tarea completada:', smsError);
          // No fallamos la actualización de la tarea si falla el envío del SMS
        }
      }
    }
    
    return updatedTask;
  };

  // Valor del contexto
  const value = {
    projects,
    currentProject,
    tasks,
    loading,
    error,
    fetchProjects,
    fetchTasks,
    setCurrentProject,
    createProject,
    updateProject,
    deleteProject,
    createTask,
    updateTask,
    deleteTask,
    moveTask,
  };

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
};

// Hook personalizado para usar el contexto de proyectos
export const useProjects = () => {
  const context = useContext(ProjectContext);
  
  if (context === undefined) {
    throw new Error('useProjects debe ser usado dentro de un ProjectProvider');
  }
  
  return context;
};
