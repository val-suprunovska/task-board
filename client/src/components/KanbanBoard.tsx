import { useState } from 'react';
import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  type DragOverEvent,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { Task, TaskStatus } from '../types';
import { KanbanColumn } from './KanbanColumn';
import { KanbanTask } from './KanbanTask';
import { TaskModal } from './TaskModal';
import { useKanbanStore } from '../stores/kanban-store';

export const KanbanBoard = () => {
  const { selectedProject, createTask, updateTask, moveTask, deleteTask, isMovingTask } =
    useKanbanStore();

  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [selectedColumn, setSelectedColumn] = useState<TaskStatus>('todo');
  const [isDragging, setIsDragging] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    if (active.data.current?.type === 'task') {
      setActiveTask(active.data.current.task);
      setIsDragging(true);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;

    if (over && ['todo', 'inProgress', 'done'].includes(over.id as string)) {
      //TODO добавить визуальную обратную связь
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);
    setIsDragging(false);

    if (!over || !selectedProject) {
      console.log('No valid drop target or no project selected');
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;

    // Находим задачу
    const allTasks = [
      ...selectedProject.tasks.todo,
      ...selectedProject.tasks.inProgress,
      ...selectedProject.tasks.done,
    ];
    const taskToMove = allTasks.find((task) => task._id === activeId);

    if (!taskToMove) {
      console.log('Task not found:', activeId);
      return;
    }

    try {
      // Если задача перетаскивается в колонку (включая пустые)
      if (['todo', 'inProgress', 'done'].includes(overId)) {
        const newStatus = overId as TaskStatus;
        console.log(`Moving task to column: ${newStatus}`);

        // Определяем позицию
        let position = 0;

        // Если задача уже в этой колонке, оставляем её на текущей позиции
        if (taskToMove.status === newStatus) {
          const currentTasks = selectedProject.tasks[newStatus];
          const currentIndex = currentTasks.findIndex((t) => t._id === activeId);
          position = currentIndex >= 0 ? currentIndex : currentTasks.length;
        } else {
          // Если перетаскиваем в новую колонку, добавляем в начало
          position = 0;
        }

        await moveTask(activeId, {
          status: newStatus,
          position,
        });
        return;
      }

      // Если задача перетаскивается на другую задачу
      const overTask = allTasks.find((task) => task._id === overId);

      if (!overTask) {
        console.log('Over task not found, trying to drop on empty column');
        return;
      }

      // Если задачи в разных колонках
      if (taskToMove.status !== overTask.status) {
        const tasksInNewColumn = selectedProject.tasks[overTask.status];
        const targetIndex = tasksInNewColumn.findIndex((task) => task._id === overId);

        // Определяем позицию: если задача найдена, ставим перед ней, иначе в конец
        const position = targetIndex >= 0 ? targetIndex : tasksInNewColumn.length;

        await moveTask(activeId, {
          status: overTask.status,
          position,
        });
        return;
      }

      // Если задача перемещается в той же колонке
      const oldIndex = selectedProject.tasks[taskToMove.status].findIndex(
        (task) => task._id === activeId,
      );
      const newIndex = selectedProject.tasks[overTask.status].findIndex(
        (task) => task._id === overId,
      );

      if (oldIndex !== newIndex) {
        await moveTask(activeId, {
          status: taskToMove.status,
          position: newIndex,
        });
      }
    } catch (error) {
      console.error('Failed to move task:', error);
      alert(`Failed to move task: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleAddTask = (status: TaskStatus) => {
    setSelectedColumn(status);
    setEditingTask(null);
    setIsTaskModalOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsTaskModalOpen(true);
  };

  const handleSaveTask = async (data: {
    title: string;
    description?: string;
    status?: TaskStatus;
  }) => {
    if (!selectedProject) return;

    try {
      if (editingTask) {
        await updateTask(editingTask._id, data);
      } else {
        await createTask({
          ...data,
          status: data.status || selectedColumn,
          projectId: selectedProject._id,
        });
      }
    } catch (error) {
      console.error('Error saving task:', error);
      alert(`Failed to save task: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsTaskModalOpen(false);
      setEditingTask(null);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (confirm('Are you sure you want to delete this task?')) {
      try {
        await deleteTask(taskId);
      } catch (error) {
        console.error('Error deleting task:', error);
        alert(`Failed to delete task: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  };

  if (!selectedProject) {
    return null;
  }

  const columns = [
    {
      id: 'todo' as const,
      title: 'To Do',
      tasks: selectedProject.tasks.todo || [],
      count: selectedProject.tasks.todo?.length || 0,
    },
    {
      id: 'inProgress' as const,
      title: 'In Progress',
      tasks: selectedProject.tasks.inProgress || [],
      count: selectedProject.tasks.inProgress?.length || 0,
    },
    {
      id: 'done' as const,
      title: 'Done',
      tasks: selectedProject.tasks.done || [],
      count: selectedProject.tasks.done?.length || 0,
    },
  ];

  return (
    <>
      <div className="container mx-auto px-4 pt-6">
        <div className="mb-6">
          <h2 className="text-3xl font-bold">{selectedProject.name}</h2>
          {selectedProject.description && (
            <p className="text-muted-foreground mt-2">{selectedProject.description}</p>
          )}
          <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
            <span>Created: {new Date(selectedProject.createdAt).toLocaleDateString()}</span>
            <span>•</span>
            <span>Tasks: {columns.reduce((total, col) => total + col.count, 0)}</span>
            {isMovingTask && (
              <span className="text-blue-500 flex items-center gap-1">
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-500"></div>
                Moving...
              </span>
            )}
          </div>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="container mx-auto px-4 pb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {columns.map((column) => (
              <KanbanColumn
                key={column.id}
                id={column.id}
                title={column.title}
                tasks={column.tasks}
                count={column.count}
                onAddTask={() => handleAddTask(column.id)}
                onEditTask={handleEditTask}
                onDeleteTask={handleDeleteTask}
                isDragging={isDragging}
              />
            ))}
          </div>
        </div>

        <DragOverlay dropAnimation={null}>
          {activeTask && (
            <div style={{ transform: 'rotate(5deg)' }}>
              <KanbanTask task={activeTask} onEdit={() => {}} onDelete={() => {}} />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setEditingTask(null);
        }}
        onSubmit={handleSaveTask}
        task={editingTask}
        defaultStatus={selectedColumn}
      />
    </>
  );
};
