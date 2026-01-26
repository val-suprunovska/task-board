import { Types, Document } from 'mongoose';

// Базовые интерфейсы без Document
export interface IProject {
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITask {
  title: string;
  description?: string;
  status: 'todo' | 'inProgress' | 'done';
  projectId: Types.ObjectId;
  position: number;
  createdAt: Date;
  updatedAt: Date;
}

// Интерфейсы для документов Mongoose (наследуем от Document)
export interface IProjectDocument extends IProject, Document {
  _id: Types.ObjectId;
}

export interface ITaskDocument extends ITask, Document {
  _id: Types.ObjectId;
}

// Для запросов от клиента
export interface CreateProjectRequest {
  name: string;
  description?: string;
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  status?: 'todo' | 'inProgress' | 'done';
  projectId: string;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  status?: 'todo' | 'inProgress' | 'done';
}

export interface MoveTaskRequest {
  status: 'todo' | 'inProgress' | 'done';
  position: number;
  projectId?: string;
}

// Для ответов сервера
export interface ProjectResponse {
  _id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskResponse {
  _id: string;
  title: string;
  description?: string;
  status: 'todo' | 'inProgress' | 'done';
  projectId: string;
  position: number;
  createdAt: Date;
  updatedAt: Date;
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
