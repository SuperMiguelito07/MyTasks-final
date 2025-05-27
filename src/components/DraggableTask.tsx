import React, { useState, useEffect, useRef } from 'react';
import { Task } from '../supabase';

interface DraggableTaskProps {
  task: Task;
  onMove: (taskId: string, newStatus: 'To Do' | 'Doing' | 'Done') => Promise<void>;
  onDelete: (taskId: string) => Promise<void>;
}

const DraggableTask: React.FC<DraggableTaskProps> = ({ task, onMove, onDelete }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const taskRef = useRef<HTMLDivElement>(null);
  
  // Detectar si estamos en un dispositivo móvil
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

  // Formatear la fecha para mostrarla de forma amigable
  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    
    const date = new Date(dateString);
    return date.toLocaleDateString('ca-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Manejadores para arrastrar
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData('taskId', task.id);
    e.dataTransfer.setData('currentStatus', task.status);
    e.dataTransfer.effectAllowed = 'move';
    
    // Añadir un pequeño retraso para que la clase se aplique después de que comience el arrastre
    setTimeout(() => {
      setIsDragging(true);
    }, 0);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  // Manejadores para dispositivos táctiles
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    // No hacemos nada en el inicio del toque, solo registramos el evento
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    // En dispositivos móviles, expandimos/colapsamos la tarjeta al tocarla
    if (isMobile) {
      setIsExpanded(!isExpanded);
    }
  };
  
  // Determinar el color de la tarjeta según la fecha de vencimiento
  const getTaskStyle = () => {
    if (!task.due_date) return {};
    
    const dueDate = new Date(task.due_date);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Eliminar las horas, minutos y segundos para comparar solo fechas
    today.setHours(0, 0, 0, 0);
    tomorrow.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);
    
    if (dueDate < today) {
      return { borderLeft: '4px solid var(--danger-color)' };
    } else if (dueDate.getTime() === today.getTime()) {
      return { borderLeft: '4px solid var(--warning-color)' };
    } else if (dueDate.getTime() === tomorrow.getTime()) {
      return { borderLeft: '4px solid var(--info-color)' };
    }
    
    return {};
  };

  return (
    <div 
      ref={taskRef}
      className={`task-card ${isDragging ? 'dragging' : ''} ${isExpanded ? 'expanded' : ''}`}
      draggable={!isMobile}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onClick={() => isMobile && setIsExpanded(!isExpanded)}
      style={getTaskStyle()}
      role="article"
      aria-label={`Tasca: ${task.title}`}
    >
      <div className="task-header">
        <h4>{task.title}</h4>
        {task.due_date && (
          <span className="task-date">{formatDate(task.due_date)}</span>
        )}
      </div>
      
      <div className={`task-content ${isExpanded || !isMobile ? 'visible' : 'hidden'}`}>
        {task.description && <p className="task-description">{task.description}</p>}
        
        <div className="task-actions">
          {task.status !== 'To Do' && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onMove(task.id, 'To Do');
              }}
              aria-label="Moure a Per Fer"
            >
              Per Fer
            </button>
          )}
          {task.status !== 'Doing' && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onMove(task.id, 'Doing');
              }}
              aria-label="Moure a En Progrés"
            >
              En Progrés
            </button>
          )}
          {task.status !== 'Done' && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onMove(task.id, 'Done');
              }}
              aria-label="Moure a Completades"
            >
              Completada
            </button>
          )}
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onDelete(task.id);
            }}
            aria-label="Eliminar tasca"
          >
            Eliminar
          </button>
        </div>
      </div>
      
      {isMobile && (
        <div className="task-expand-indicator">
          {isExpanded ? '▲' : '▼'}
        </div>
      )}
    </div>
  );
};

export default DraggableTask;
