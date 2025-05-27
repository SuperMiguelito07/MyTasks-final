import React, { useState } from 'react';
import { Task } from '../supabase';
import DraggableTask from './DraggableTask';

interface KanbanColumnProps {
  title: string;
  status: 'To Do' | 'Doing' | 'Done';
  tasks: Task[];
  onMoveTask: (taskId: string, newStatus: 'To Do' | 'Doing' | 'Done') => Promise<void>;
  onDeleteTask: (taskId: string) => Promise<void>;
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({ 
  title, 
  status, 
  tasks, 
  onMoveTask, 
  onDeleteTask 
}) => {
  const [isOver, setIsOver] = useState(false);

  // Manejadores para soltar
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsOver(true);
  };

  const handleDragLeave = () => {
    setIsOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsOver(false);
    
    const taskId = e.dataTransfer.getData('taskId');
    const currentStatus = e.dataTransfer.getData('currentStatus');
    
    // Solo mover si la tarea se arrastra a una columna diferente
    if (currentStatus !== status) {
      onMoveTask(taskId, status);
    }
  };

  // Determinar el color de fondo de la columna según el estado
  const getColumnColor = () => {
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
  };

  return (
    <div 
      className="kanban-column"
      style={getColumnColor()}
    >
      <h3>{title}</h3>
      <div 
        className={`tasks-container ${isOver ? 'drop-target' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {isOver && (
          <div className="drop-indicator">
            Soltar aquí
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
};

export default KanbanColumn;
