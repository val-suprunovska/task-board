import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { Task } from '../types';
import { KanbanTask } from './KanbanTask';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Plus } from 'lucide-react';

interface KanbanColumnProps {
  id: string;
  title: string;
  tasks: Task[];
  count: number;
  onAddTask: () => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  isDragging?: boolean;
}

export const KanbanColumn = ({
  id,
  title,
  tasks,
  count,
  onAddTask,
  onEditTask,
  onDeleteTask,
  isDragging = false,
}: KanbanColumnProps) => {
  const { setNodeRef, isOver } = useDroppable({
    id,
    data: {
      type: 'column',
      accepts: ['task'],
    },
  });

  const getColumnColor = () => {
    switch (id) {
      case 'todo':
        return 'border-gray-200 bg-gray-50/50';
      case 'inProgress':
        return 'border-blue-200 bg-blue-50/50';
      case 'done':
        return 'border-green-200 bg-green-50/50';
      default:
        return 'border-gray-200 bg-gray-50/50';
    }
  };

  const getTitleColor = () => {
    switch (id) {
      case 'todo':
        return 'text-gray-700';
      case 'inProgress':
        return 'text-blue-700';
      case 'done':
        return 'text-green-700';
      default:
        return 'text-gray-700';
    }
  };

  const getCountColor = () => {
    switch (id) {
      case 'todo':
        return 'bg-gray-200 text-gray-800';
      case 'inProgress':
        return 'bg-blue-200 text-blue-800';
      case 'done':
        return 'bg-green-200 text-green-800';
      default:
        return 'bg-gray-200 text-gray-800';
    }
  };

  const getDropIndicatorClass = () => {
    if (!isOver || !isDragging) return '';

    switch (id) {
      case 'todo':
        return 'bg-gray-100/50 ring-2 ring-gray-300';
      case 'inProgress':
        return 'bg-blue-100/50 ring-2 ring-blue-300';
      case 'done':
        return 'bg-green-100/50 ring-2 ring-green-300';
      default:
        return 'bg-gray-100/50 ring-2 ring-gray-300';
    }
  };

  return (
    <Card
      className={`p-4 h-full border-2 ${getColumnColor()} ${getDropIndicatorClass()} transition-all duration-200`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className={`text-lg font-semibold ${getTitleColor()}`}>{title}</h2>
          <span
            className={`rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium ${getCountColor()}`}
          >
            {count}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onAddTask}
          className="h-8 w-8 p-0 hover:bg-primary/10"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div ref={setNodeRef} className="min-h-125 transition-all duration-200">
        <SortableContext
          items={tasks.map((task) => task._id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {tasks.map((task) => (
              <KanbanTask key={task._id} task={task} onEdit={onEditTask} onDelete={onDeleteTask} />
            ))}
          </div>
        </SortableContext>

        {tasks.length === 0 && (
          <div
            className={`flex flex-col items-center justify-center h-50 text-center text-muted-foreground border-2 border-dashed rounded-lg p-6 transition-all duration-200 ${
              isOver ? 'border-primary/70 bg-primary/5' : 'border-gray-300'
            } hover:border-primary/50 cursor-pointer`}
            onClick={onAddTask}
            ref={tasks.length === 0 ? setNodeRef : undefined}
          >
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-all duration-200 ${
                isOver ? 'bg-primary/10' : 'bg-gray-100'
              }`}
            >
              <Plus
                className={`h-6 w-6 transition-all duration-200 ${
                  isOver ? 'text-primary' : 'text-gray-400'
                }`}
              />
            </div>
            <p className="font-medium mb-1">No tasks yet</p>
            <p className="text-sm">Click + to add a new task</p>
            {isOver && isDragging && (
              <p className="text-xs text-primary mt-2">Drop here to add task</p>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};
