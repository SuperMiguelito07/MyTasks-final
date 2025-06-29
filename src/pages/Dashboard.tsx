// Component principal del tauler de control que gestiona la lògica de projectes i tasques
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useProjects } from '../contexts/ProjectContext';
import { Navigate } from 'react-router-dom';
import { Task } from '../supabase';
import KanbanColumn from '../components/KanbanColumn';
import '../styles/modern.css';

// Informació de l'usuari autenticat
const Dashboard: React.FC = function Dashboard() {
  const { user, signOut } = useAuth();
  
  // Informació dels projectes i tasques
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

  // Estados para formularios
  const [showNewProject, setShowNewProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  
  const [showNewTask, setShowNewTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  
  // Estado para navegación móvil
  const [activeTab, setActiveTab] = useState<'projects' | 'tasks'>('projects');
  
  // Detectar si estamos en un dispositivo móvil
  const [isMobile, setIsMobile] = useState(false);
  
  // Función para manejar el cambio de tamaño de la ventana, optimizada con useCallback
  const handleResize = useCallback(() => {
    setIsMobile(window.innerWidth < 768);
  }, []);
  
  // Función para verificar si el dispositivo es móvil
  const checkIfMobile = useCallback(() => {
    setIsMobile(window.innerWidth <= 768);
  }, []);
  
  // Efecto para detectar el tamaño de la pantalla
  useEffect(() => {
    // Comprobar al cargar
    checkIfMobile();
    
    // Comprobar al cambiar el tamaño de la ventana
    window.addEventListener('resize', checkIfMobile);
    
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, [checkIfMobile]);

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
    }
  };

  // Manejar el cambio de estado de una tarea
  const handleMoveTask = async (taskId: string, newStatus: 'To Do' | 'Doing' | 'Done') => {
    const updatedTask = await moveTask(taskId, newStatus);
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
          <button onClick={signOut} className="btn-logout">Tancar Sessió</button>
        </div>
      </header>

      <div className="dashboard-content">
        <aside className="projects-sidebar">
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

        <main className="tasks-board">
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
                <KanbanColumn
                  title="Per Fer"
                  status="To Do"
                  tasks={todoTasks}
                  onMoveTask={handleMoveTask}
                  onDeleteTask={handleDeleteTask}
                />

                <KanbanColumn
                  title="En Progrés"
                  status="Doing"
                  tasks={doingTasks}
                  onMoveTask={handleMoveTask}
                  onDeleteTask={handleDeleteTask}
                />

                <KanbanColumn
                  title="Completades"
                  status="Done"
                  tasks={doneTasks}
                  onMoveTask={handleMoveTask}
                  onDeleteTask={handleDeleteTask}
                />
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
