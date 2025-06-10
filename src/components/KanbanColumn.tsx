import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { Task } from '../supabase';
import DraggableTask from './DraggableTask';

// Aquest component representa una columna del tauler Kanban
// Gestiona l'arrossegament i deixada de tasques entre columnes

// Definició de les propietats que rep el component KanbanColumn
interface KanbanColumnProps {
  title: string;
  status: 'To Do' | 'Doing' | 'Done';
  tasks: Task[];
  onMoveTask: (taskId: string, newStatus: 'To Do' | 'Doing' | 'Done') => Promise<void>;
  onDeleteTask: (taskId: string) => Promise<void>;
}

// Utilitzem memo per evitar renderitzacions innecessàries quan les props no canvien
// Això millora el rendiment quan hi ha moltes tasques
const KanbanColumn = memo(function KanbanColumn({ 
  title, 
  status, 
  tasks, 
  onMoveTask, 
  onDeleteTask 
}: KanbanColumnProps) {
  // Estat per controlar quan una tasca s'està arrossegant sobre aquesta columna
  const [isOver, setIsOver] = useState(false);
  // Estat per detectar si estem en un dispositiu mòbil i adaptar el comportament
  const [isMobile, setIsMobile] = useState(false);
  
  // Funció memoritzada per detectar dispositius mòbils
  const checkIfMobile = useCallback(() => {
    const mobile = window.innerWidth <= 768;
    setIsMobile(mobile);
    return mobile;
  }, []);
  
  // Detectar si estem en un dispositiu mòbil
  useEffect(() => {
    // Comprovar en carregar
    checkIfMobile();
    
    // Comprovar en canviar la mida de la finestra
    window.addEventListener('resize', checkIfMobile);
    
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, [checkIfMobile]);

  // Gestors per deixar anar optimitzats amb useCallback
  // Gestor d'esdeveniment quan una tasca s'arrossega sobre la columna
  // preventDefault és necessari per permetre la deixada
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsOver(true);
  }, []);

  // Gestor d'esdeveniment quan una tasca surt de l'àrea de la columna
  const handleDragLeave = useCallback(() => {
    setIsOver(false);
  }, []);

  // Gestor d'esdeveniment quan es deixa una tasca a la columna
  // Recupera la informació de la tasca des de l'objecte dataTransfer
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsOver(false);
    
    // Obté l'ID i l'estat actual de la tasca que s'ha arrossegat
    const taskId = e.dataTransfer.getData('taskId');
    const currentStatus = e.dataTransfer.getData('currentStatus');
    
    // Només moure si la tasca s'arrossega a una columna diferent
    if (currentStatus !== status) {
      onMoveTask(taskId, status);
    }
  }, [onMoveTask, status]);

  // Determinar el color de fons de la columna segons l'estat (memoritzat)
  // Calcula el color de la vora superior de la columna segons l'estat
  // Utilitzem useMemo per evitar recalcular-ho en cada renderització
  const columnColor = useMemo(() => {
    switch (status) {
      case 'To Do':
        return { borderTop: '3px solid var(--info-color)' };
      case 'Doing':
        return { borderTop: '3px solid var(--warning-color)' };
      case 'Done':
        return { borderTop: '3px solid var(--success-color)' };
      default:
        return {};
    }
  }, [status]);

  // Renderitza la columna amb les seves tasques i gestors d'esdeveniments
  return (
    <div 
      className="kanban-column"
      style={columnColor}
    >
      <h3>{title} {tasks.length > 0 && <span className="task-count">{tasks.length}</span>}</h3>
      <div 
        className={`tasks-container ${isOver ? 'drop-target' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        role="region"
        aria-label={`Columna ${title} amb ${tasks.length} tasques`}
      >
        {isOver && (
          <div className="drop-indicator">
            Deixar aquí
          </div>
        )}
        
        {tasks.length === 0 ? (
          <p className="no-tasks">No hi ha tasques</p>
        ) : (
          tasks.map(task => (
            <DraggableTask 
              key={task.id}
              task={task}
              onMove={onMoveTask}
              onDelete={onDeleteTask}
            />
          ))
        )}
      </div>
    </div>
  );
});

// Exportem el component per utilitzar-lo a altres parts de l'aplicació
export default KanbanColumn;
