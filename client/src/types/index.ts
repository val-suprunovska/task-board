export interface Project {
  _id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Task {
  _id: string;
  title: string;
  description?: string;
  status: 'todo' | 'inProgress' | 'done';
  projectId: string;
  position: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectWithTasks extends Project {
  tasks: {
    todo: Task[];
    inProgress: Task[];
    done: Task[];
  };
}

export type TaskStatus = 'todo' | 'inProgress' | 'done';

export interface CreateProjectData {
  name: string;
  description?: string;
}

export interface CreateTaskData {
  title: string;
  description?: string;
  status?: TaskStatus;
  projectId: string;
}

export interface UpdateTaskData {
  title?: string;
  description?: string;
  status?: TaskStatus;
}

export interface MoveTaskData {
  status: TaskStatus;
  position: number;
  projectId?: string;
}
