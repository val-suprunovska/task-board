import { api } from '.';
import type { Project, ProjectWithTasks, CreateProjectData } from '../types';

export const projectsApi = {
  getAll: (search?: string) => api.get<Project[]>('/projects', { params: { search } }),

  getById: (id: string) => api.get<Project>(`/projects/${id}`),

  getWithTasks: (id: string) => api.get<ProjectWithTasks>(`/projects/${id}/with-tasks`),

  create: (data: CreateProjectData) => api.post<Project>('/projects', data),

  update: (id: string, data: Partial<CreateProjectData>) =>
    api.put<Project>(`/projects/${id}`, data),

  delete: (id: string) => api.delete(`/projects/${id}`),
};
