import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useProjects } from '../contexts/ProjectContext';
import { useNotifications } from '../contexts/NotificationContext';
import { useUserPreferences } from '../contexts/UserPreferencesContext';
import { Navigate } from 'react-router-dom';
import { Task } from '../supabase';
import MobileNav from '../components/MobileNav';
import NotificationCenter from '../components/NotificationCenter';
import NotificationSettings from '../components/NotificationSettings';

const Dashboard: React.FC = () => {
  const { user, signOut } = useAuth();
  const { 
    projects, 
    currentProject, 
    tasks, 
    setCurrentProject,
    createProject,
    deleteProject,
    createTask,
    deleteTask,
    moveTask
  } = useProjects();
  // Usar los hooks de notificaciones y preferencias
  const { notifications, fetchNotifications, addNotification } = useNotifications();
  const { preferences } = useUserPreferences();

  // Estados para formularios
  const [showNewProject, setShowNewProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  
  const [showNewTask, setShowNewTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  
  // Estado para mostrar configuración de notificaciones
  const [showSettings, setShowSettings] = useState(false);
  
  // Estado para navegación móvil
  const [activeTab, setActiveTab] = useState<'projects' | 'tasks'>('projects');
  
  // Detectar si estamos en un dispositivo móvil
  const [isMobile, setIsMobile] = useState(false);
  
  // Efecto para detectar el tamaño de la pantalla
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    // Comprobar al cargar
    checkIfMobile();
    
    // Comprobar al cambiar el tamaño de la ventana
    window.addEventListener('resize', checkIfMobile);
    
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);
  
  // Efecto para cargar notificaciones periódicamente
  useEffect(() => {
    // Cargar notificaciones inicialmente
    fetchNotifications();
    
    // Configurar intervalo para actualizar notificaciones cada minuto
    const intervalId = setInterval(() => {
      fetchNotifications();
    }, 60000);
    
    return () => {
      clearInterval(intervalId);
    };
  }, [fetchNotifications]);

  // Si no hay usuario autenticado, redirigir a la página de autenticación
  if (!user) {
    return <Navigate to="/auth" />;
  }

  // Manejar la creación de un nuevo proyecto
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName) return;

    const project = await createProject(newProjectName, newProjectDesc);
    if (project) {
      setNewProjectName('');
      setNewProjectDesc('');
      setShowNewProject(false);
    }
  };

  // Manejar la creación de una nueva tarea
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle || !currentProject) return;

    const task: Omit<Task, 'id'> = {
      project_id: currentProject.id,
      title: newTaskTitle,
      description: newTaskDesc,
      status: 'To Do',
      created_at: new Date().toISOString(),
      due_date: newTaskDueDate ? new Date(newTaskDueDate).toISOString() : null,
      assigned_to: user.id
    };

    const newTask = await createTask(task);
    if (newTask) {
      setNewTaskTitle('');
      setNewTaskDesc('');
      setNewTaskDueDate('');
      setShowNewTask(false);
      
      // Crear notificación para la nueva tarea
      await addNotification(
        `Nueva tarea creada: ${newTaskTitle} en el proyecto ${currentProject.name}`,
        {
          sendEmail: true,
          emailSubject: 'Nueva tarea creada en MyTask',
          relatedTaskId: newTask.id,
          relatedProjectId: currentProject.id
        }
      );
    }
  };

  // Manejar el cambio de estado de una tarea
  const handleMoveTask = async (taskId: string, newStatus: 'To Do' | 'Doing' | 'Done') => {
    const updatedTask = await moveTask(taskId, newStatus);
    
    // Si la tarea se ha movido a "Done", crear una notificación
    if (updatedTask && newStatus === 'Done' && currentProject) {
      await addNotification(
        `Tarea completada: ${updatedTask.title} en el proyecto ${currentProject.name}`,
        {
          sendEmail: true,
          emailSubject: 'Tarea completada en MyTask',
          relatedTaskId: updatedTask.id,
          relatedProjectId: currentProject.id
        }
      );
    }
  };

  // Manejar la eliminación de una tarea
  const handleDeleteTask = async (taskId: string) => {
    if (window.confirm('Estàs segur que vols eliminar aquesta tasca?')) {
      await deleteTask(taskId);
    }
  };

  // Manejar la eliminación de un proyecto
  const handleDeleteProject = async (projectId: string) => {
    if (window.confirm('Estàs segur que vols eliminar aquest projecte i totes les seves tasques?')) {
      await deleteProject(projectId);
    }
  };

  // Filtrar tareas por estado
  const todoTasks = tasks.filter(task => task.status === 'To Do');
  const doingTasks = tasks.filter(task => task.status === 'Doing');
  const doneTasks = tasks.filter(task => task.status === 'Done');

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="app-title">
          <h1>MyTask</h1>
        </div>
        <div className="user-info">
          <span>Hola, {user.name}</span>
          <NotificationCenter />
          <button onClick={signOut} className="btn-logout">Tancar Sessió</button>
        </div>
      </header>

      {/* Navegación móvil */}
      {isMobile && (
        <MobileNav 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          onSettingsClick={() => setShowSettings(!showSettings)}
        />
      )}
      
      {/* Panel de configuración de notificaciones */}
      {showSettings && (
        <div className="settings-overlay">
          <div className="settings-panel">
            <button 
              className="close-settings" 
              onClick={() => setShowSettings(false)}
            >
              ✕
            </button>
            <NotificationSettings />
          </div>
        </div>
      )}
      
      <div className="dashboard-content">
        <aside className={`projects-sidebar ${isMobile && activeTab !== 'projects' ? 'hidden' : ''}`}>
          <div className="projects-header">
            <h2>Els meus projectes</h2>
            <button 
              className="btn-add" 
              onClick={() => setShowNewProject(!showNewProject)}
            >
              {showNewProject ? 'Cancel·lar' : 'Nou Projecte'}
            </button>
          </div>

          {showNewProject && (
            <form onSubmit={handleCreateProject} className="new-project-form">
              <input
                type="text"
                placeholder="Nom del projecte"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                required
              />
              <textarea
                placeholder="Descripció"
                value={newProjectDesc}
                onChange={(e) => setNewProjectDesc(e.target.value)}
              />
              <button type="submit" className="btn-primary">Crear Projecte</button>
            </form>
          )}

          <ul className="projects-list">
            {projects.length === 0 ? (
              <li className="no-projects">No tens cap projecte encara</li>
            ) : (
              projects.map(project => (
                <li 
                  key={project.id} 
                  className={`project-item ${currentProject?.id === project.id ? 'active' : ''}`}
                  onClick={() => setCurrentProject(project)}
                >
                  <span className="project-name">{project.name}</span>
                  <button 
                    className="btn-delete" 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteProject(project.id);
                    }}
                  >
                    Eliminar
                  </button>
                </li>
              ))
            )}
          </ul>
        </aside>

        <main className={`tasks-board ${isMobile && activeTab !== 'tasks' ? 'hidden' : ''}`}>
          {currentProject ? (
            <>
              <div className="board-header">
                <h2>{currentProject.name}</h2>
                <p className="project-description">{currentProject.description}</p>
                <button 
                  className="btn-add" 
                  onClick={() => setShowNewTask(!showNewTask)}
                >
                  {showNewTask ? 'Cancel·lar' : 'Nova Tasca'}
                </button>
              </div>

              {showNewTask && (
                <form onSubmit={handleCreateTask} className="new-task-form">
                  <input
                    type="text"
                    placeholder="Títol de la tasca"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    required
                  />
                  <textarea
                    placeholder="Descripció"
                    value={newTaskDesc}
                    onChange={(e) => setNewTaskDesc(e.target.value)}
                  />
                  <input
                    type="date"
                    placeholder="Data de venciment"
                    value={newTaskDueDate}
                    onChange={(e) => setNewTaskDueDate(e.target.value)}
                  />
                  <button type="submit" className="btn-primary">Crear Tasca</button>
                </form>
              )}

              <div className="kanban-board">
                <div className="kanban-column">
                  <h3>To Do</h3>
                  <div className="tasks-container">
                    {todoTasks.length === 0 ? (
                      <p className="no-tasks">No hi ha tasques pendents</p>
                    ) : (
                      todoTasks.map(task => (
                        <div key={task.id} className="task-card">
                          <h4>{task.title}</h4>
                          <p>{task.description}</p>
                          {task.due_date && (
                            <p className="due-date">Venciment: {new Date(task.due_date).toLocaleDateString()}</p>
                          )}
                          <div className="task-actions">
                            <button onClick={() => handleMoveTask(task.id, 'Doing')}>Moure a Doing</button>
                            <button onClick={() => handleDeleteTask(task.id)}>Eliminar</button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="kanban-column">
                  <h3>Doing</h3>
                  <div className="tasks-container">
                    {doingTasks.length === 0 ? (
                      <p className="no-tasks">No hi ha tasques en progrés</p>
                    ) : (
                      doingTasks.map(task => (
                        <div key={task.id} className="task-card">
                          <h4>{task.title}</h4>
                          <p>{task.description}</p>
                          {task.due_date && (
                            <p className="due-date">Venciment: {new Date(task.due_date).toLocaleDateString()}</p>
                          )}
                          <div className="task-actions">
                            <button onClick={() => handleMoveTask(task.id, 'To Do')}>Moure a To Do</button>
                            <button onClick={() => handleMoveTask(task.id, 'Done')}>Moure a Done</button>
                            <button onClick={() => handleDeleteTask(task.id)}>Eliminar</button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="kanban-column">
                  <h3>Done</h3>
                  <div className="tasks-container">
                    {doneTasks.length === 0 ? (
                      <p className="no-tasks">No hi ha tasques completades</p>
                    ) : (
                      doneTasks.map(task => (
                        <div key={task.id} className="task-card">
                          <h4>{task.title}</h4>
                          <p>{task.description}</p>
                          {task.due_date && (
                            <p className="due-date">Venciment: {new Date(task.due_date).toLocaleDateString()}</p>
                          )}
                          <div className="task-actions">
                            <button onClick={() => handleMoveTask(task.id, 'Doing')}>Moure a Doing</button>
                            <button onClick={() => handleDeleteTask(task.id)}>Eliminar</button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="no-project-selected">
              <h2>Selecciona un projecte o crea un de nou</h2>
              <p>Utilitza el panell lateral per seleccionar un projecte existent o crear-ne un de nou.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
