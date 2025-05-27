import React, { useState } from 'react';
import { Task } from '../supabase';

interface DraggableTaskProps {
  task: Task;
  onMove: (taskId: string, newStatus: 'To Do' | 'Doing' | 'Done') => Promise<void>;
  onDelete: (taskId: string) => Promise<void>;
}

const DraggableTask: React.FC<DraggableTaskProps> = ({ task, onMove, onDelete }) => {
  const [isDragging, setIsDragging] = useState(false);

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

  return (
    <div 
      className={`task-card ${isDragging ? 'dragging' : ''}`}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <h4>{task.title}</h4>
      {task.description && <p>{task.description}</p>}
      {task.due_date && (
        <p className="due-date">Venciment: {formatDate(task.due_date)}</p>
      )}
      <div className="task-actions">
        {task.status !== 'To Do' && (
          <button onClick={() => onMove(task.id, 'To Do')}>Moure a To Do</button>
        )}
        {task.status !== 'Doing' && (
          <button onClick={() => onMove(task.id, 'Doing')}>Moure a Doing</button>
        )}
        {task.status !== 'Done' && (
          <button onClick={() => onMove(task.id, 'Done')}>Moure a Done</button>
        )}
        <button onClick={() => onDelete(task.id)}>Eliminar</button>
      </div>
    </div>
  );
};

export default DraggableTask;
