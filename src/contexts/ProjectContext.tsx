import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { Project, Task } from '../supabase';
import { projectService, taskService } from '../services/supabaseService';
import { useAuth } from './AuthContext';
import { sendTaskCreatedSMS} from '../services/smsService';
import { supabase } from '../supabase';

// Tipus per al context de projectes
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

// Crear el context
const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

// Props per al proveïdor de projectes
type ProjectProviderProps = {
  children: ReactNode;
};

// Proveïdor de projectes
export const ProjectProvider: React.FC<ProjectProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Memòria cau per emmagatzemar les tasques per projecte i evitar crides innecessàries a l'API
  const tasksCache = useRef<Record<string, { tasks: Task[], timestamp: number }>>({});
  
  // Funció per carregar tasques embolicada en useCallback amb suport de memòria cau
  const fetchTasks = useCallback(async (projectId: string) => {
    // Verificar si tenim les tasques en memòria cau i si són recents (menys de 30 segons)
    const cachedData = tasksCache.current[projectId];
    const now = Date.now();
    
    if (cachedData && (now - cachedData.timestamp < 30000)) {
      // Utilitzar dades en memòria cau si són recents
      console.log('Utilitzant tasques en memòria cau per al projecte:', projectId);
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
        // Actualitzar l'estat i la memòria cau
        setTasks(tasks);
        tasksCache.current[projectId] = {
          tasks,
          timestamp: now
        };
      }
    } catch (err) {
      console.error('Error inesperat al carregar tasques:', err);
      setError('Error inesperat al carregar les tasques');
    } finally {
      setLoading(false);
    }
  }, []);

  // Funció per carregar projectes embolicada en useCallback
  const fetchProjects = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const { projects, error } = await projectService.getProjects(user.id);
      
      if (error) {
        console.error('Error al carregar projectes:', error);
        setError('No s\'han pogut carregar els projectes');
      } else {
        setProjects(projects);
        
        // Si no hi ha projecte actual i hi ha projectes disponibles, establir el primer com a actual
        if (!currentProject && projects.length > 0) {
          setCurrentProject(projects[0]);
        }
      }
    } catch (err) {
      console.error('Error inesperat al carregar projectes:', err);
      setError('Error inesperat al carregar els projectes');
    } finally {
      setLoading(false);
    }
  }, [currentProject, user]);

  // Cargar proyectos cuando el componente se monta o cambia el usuario
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

  // Funció per crear un projecte
  const createProject = async (nom: string, descripcio: string): Promise<Project | null> => {
    if (!user) return null;
    
    setLoading(true);
    setError(null);
    
    try {
      const { project, error } = await projectService.createProject({
        name: nom,
        description: descripcio,
        owner_id: user.id,
        created_at: new Date().toISOString()
      });
      
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

  // Funció per actualitzar un projecte
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
      setProjects(prevProjects => prevProjects.map(p => p.id === projectId ? project! : p));
      
      // Si el proyecto actual es el que se ha actualizado, actualizarlo también
      if (currentProject && currentProject.id === projectId) {
        setCurrentProject(project);
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

  // Funció per eliminar un projecte
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
      setProjects(prevProjects => prevProjects.filter(p => p.id !== projectId));
      
      // Si el proyecto actual es el que se ha eliminado, establecer otro como actual
      if (currentProject && currentProject.id === projectId) {
        const remainingProjects = projects.filter(p => p.id !== projectId);
        if (remainingProjects.length > 0) {
          setCurrentProject(remainingProjects[0]);
        } else {
          setCurrentProject(null);
        }
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

  // Funció per crear una tasca
  const createTask = async (task: Omit<Task, 'id'>): Promise<Task | null> => {
    if (!user) return null;
    
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
      
      // Obtener el nombre del proyecto
      let projectName = 'un proyecto';
      if (currentProject) {
        projectName = currentProject.name;
      } else if (task.project_id) {
        // Intentar encontrar el proyecto en la lista de proyectos
        const taskProject = projects.find(p => p.id === task.project_id);
        if (taskProject) {
          projectName = taskProject.name;
        }
      }
      
      try {
        // Intentar enviar SMS de notificació si l'usuari té habilitades les notificacions SMS
        const smsResult = await sendTaskCreatedSMS(
          user.id,
          newTask!.title,
          projectName
        );
        
        // Comprovar si l'SMS s'ha enviat correctament
        if (smsResult && smsResult.success) {
          console.log('SMS enviat correctament per a la tasca:', newTask!.title);
        } else if (smsResult) {
          console.warn('No s\'ha pogut enviar l\'SMS:', smsResult.error);
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

  // Funció per actualitzar una tasca
  const updateTask = async (taskId: string, updates: Partial<Task>): Promise<Task | null> => {
    if (setLoading) setLoading(true);
    if (setError) setError(null);
    
    try {
      // Obtenir la tasca actual abans d'actualitzar-la per comparar estats
      const currentTask = tasks?.find((t: Task) => t.id === taskId);
      if (!currentTask) {
        console.error('No s\'ha trobat la tasca per actualitzar:', taskId);
        return null;
      }
      
      const { task: updatedTask, error } = await taskService.updateTask(taskId, updates);
      
      if (error) {
        console.error('Error al actualitzar tasca:', error);
        if (setError) setError('No s\'ha pogut actualitzar la tasca');
        return null;
      }
      
      // Actualizar la lista de tareas
      if (setTasks) setTasks((prevTasks: Task[]) => prevTasks.map((t: Task) => t.id === taskId ? updatedTask! : t));
      
      // Si la tasca ha passat de no completada a completada, enviar SMS
      if (currentTask.status !== 'Done' && updatedTask!.status === 'Done') {
        console.log('Tasca marcada com a completada, enviant SMS:', updatedTask);
        try {
          // Obtenir el nom del projecte
          let projectName = 'un projecte';
          if (currentProject && typeof currentProject === 'object') {
            projectName = currentProject.name;
          } else if (currentTask.project_id) {
            // Intentar trobar el projecte a la llista de projectes
            const taskProject = projects?.find((p: Project) => p.id === currentTask.project_id);
            if (taskProject) {
              projectName = taskProject.name;
            }
          }
        } catch (smsError) {
          console.error('Error al enviar SMS de tasca completada:', smsError);
          // No fallem l'actualització de la tasca si falla l'enviament de l'SMS
        }
      }
      
      return updatedTask;
    } catch (err) {
      console.error('Error inesperat al actualitzar tasca:', err);
      if (setError) setError('Error inesperat al actualitzar la tasca');
      return null;
    } finally {
      if (setLoading) setLoading(false);
    }
  };

  // Funció per eliminar una tasca
  const deleteTask = async (taskId: string): Promise<boolean> => {
    if (setLoading) setLoading(true);
    if (setError) setError(null);
    
    try {
      const { error } = await taskService.deleteTask(taskId);
      
      if (error) {
        console.error('Error al eliminar tasca:', error);
        if (setError) setError('No s\'ha pogut eliminar la tasca');
        return false;
      }
      
      // Actualizar la lista de tareas
      if (setTasks) setTasks((prevTasks: Task[]) => prevTasks.filter((t: Task) => t.id !== taskId));
      
      return true;
    } catch (err) {
      console.error('Error inesperat al eliminar tasca:', err);
      if (setError) setError('Error inesperat al eliminar la tasca');
      return false;
    } finally {
      if (setLoading) setLoading(false);
    }
  };

  // Funció per moure una tasca a un altre estat
  const moveTask = async (taskId: string, newStatus: 'To Do' | 'Doing' | 'Done'): Promise<Task | null> => {
    // Primer obtenim la tasca actual per tenir el seu títol
    const currentTask = tasks?.find((t: Task) => t.id === taskId);
    if (!currentTask) {
      console.error('No s\'ha trobat la tasca per moure:', taskId);
      return null;
    }
    
    // Actualitzem la tasca
    const updatedTask = await updateTask(taskId, { status: newStatus });
    
    return updatedTask;
  };

  // Valor del context
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

// Hook personalitzat per utilitzar el context de projectes
export const useProjects = () => {
  const context = useContext(ProjectContext);
  
  if (context === undefined) {
    throw new Error('useProjects ha de ser utilitzat dins d\'un ProjectProvider');
  }
  
  return context;
};
