import { api } from '.';
import type { Task, CreateTaskData, UpdateTaskData, MoveTaskData } from '../types';

export const tasksApi = {
  getByProject: (projectId: string) =>
    api.get<{
      todo: Task[];
      inProgress: Task[];
      done: Task[];
    }>(`/tasks/project/${projectId}`),

  create: (data: CreateTaskData) => api.post<Task>('/tasks', data),

  update: (id: string, data: UpdateTaskData) => api.put<Task>(`/tasks/${id}`, data),

  move: (id: string, data: MoveTaskData) => api.put<Task>(`/tasks/${id}/move`, data),

  delete: (id: string) => api.delete(`/tasks/${id}`),
};
