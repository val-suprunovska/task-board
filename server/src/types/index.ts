// src/types/index.ts
import { Types } from 'mongoose';

export interface IProject {
  name: string;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ITask {
  title: string;
  description?: string;
  status: 'todo' | 'inProgress' | 'done';
  projectId: Types.ObjectId;
  position: number;
  createdAt?: Date;
  updatedAt?: Date;
}

// Для запросов от клиента (строковые ID)
export interface CreateTaskRequest {
  title: string;
  description?: string;
  status?: 'todo' | 'inProgress' | 'done';
  projectId: string;
}

export interface MoveTaskRequest {
  status: 'todo' | 'inProgress' | 'done';
  position: number;
  projectId?: string;
}

// Для ответов с преобразованными ID
export interface TaskResponse {
  _id: string;
  title: string;
  description?: string;
  status: 'todo' | 'inProgress' | 'done';
  projectId: string;
  position: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ProjectResponse {
  _id: string;
  name: string;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ProjectWithTasksResponse extends ProjectResponse {
  tasks: {
    todo: TaskResponse[];
    inProgress: TaskResponse[];
    done: TaskResponse[];
  };
}

export interface SearchQuery {
  search?: string;
}

export interface CreateProjectRequest {
  name: string;
  description?: string;
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  status?: 'todo' | 'inProgress' | 'done';
}