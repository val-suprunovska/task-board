import { create } from 'zustand';
import { projectsApi } from '../api/projects';
import { tasksApi } from '../api/tasks';
import type { Project, ProjectWithTasks, Task, TaskStatus } from '../types';

interface KanbanStore {
  projects: Project[];
  selectedProject: ProjectWithTasks | null;
  searchTerm: string;
  loading: boolean;
  isMovingTask: boolean;

  setSearchTerm: (term: string) => void;
  loadProjects: () => Promise<void>;
  loadProjectWithTasks: (id: string) => Promise<void>;
  createProject: (data: { name: string; description?: string }) => Promise<Project>;
  createTask: (data: {
    title: string;
    description?: string;
    status?: TaskStatus;
    projectId: string;
  }) => Promise<Task>;
  updateTask: (
    id: string,
    data: {
      title?: string;
      description?: string;
      status?: TaskStatus;
    },
  ) => Promise<Task>;
  moveTask: (
    id: string,
    data: {
      status: TaskStatus;
      position: number;
      projectId?: string;
    },
  ) => Promise<Task>;
  deleteTask: (id: string) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
}

export const useKanbanStore = create<KanbanStore>((set, get) => ({
  projects: [],
  selectedProject: null,
  searchTerm: '',
  loading: false,
  isMovingTask: false,

  setSearchTerm: (term) => set({ searchTerm: term }),

  loadProjects: async () => {
    set({ loading: true });
    try {
      const { searchTerm } = get();
      const response = await projectsApi.getAll(searchTerm);
      set({ projects: response.data, loading: false });
    } catch (error) {
      console.error('Failed to load projects:', error);
      set({ loading: false });
    }
  },

  loadProjectWithTasks: async (id: string) => {
    set({ loading: true });
    try {
      const response = await projectsApi.getWithTasks(id);
      set({
        selectedProject: response.data,
        loading: false,
      });

      // Сохраняем ID проекта в localStorage
      localStorage.setItem('selectedProjectId', id);
    } catch (error) {
      console.error('Failed to load project:', error);
      set({ loading: false });
    }
  },

  createProject: async (data) => {
    try {
      const response = await projectsApi.create(data);
      const newProject = response.data;

      // Добавляем новый проект к существующим
      set((state) => ({
        projects: [...state.projects, newProject],
      }));

      return newProject;
    } catch (error) {
      console.error('Failed to create project:', error);
      throw error;
    }
  },

  createTask: async (data) => {
    try {
      const response = await tasksApi.create(data);
      const newTask = response.data;

      // Перезагружаем проект, если он выбран
      const { selectedProject } = get();
      if (selectedProject?._id === data.projectId) {
        await get().loadProjectWithTasks(data.projectId);
      }

      return newTask;
    } catch (error) {
      console.error('Failed to create task:', error);
      throw error;
    }
  },

  updateTask: async (id, data) => {
    try {
      const response = await tasksApi.update(id, data);
      const updatedTask = response.data;

      // Перезагружаем проект, если он выбран
      const { selectedProject } = get();
      if (selectedProject) {
        await get().loadProjectWithTasks(selectedProject._id);
      }

      return updatedTask;
    } catch (error) {
      console.error('Failed to update task:', error);
      throw error;
    }
  },

  moveTask: async (id, data) => {
    set({ isMovingTask: true });

    const { selectedProject } = get();
    if (!selectedProject) {
      set({ isMovingTask: false });
      throw new Error('No project selected');
    }

    // Сохраняем ссылку на оригинальный проект для возможного отката
    const originalProject = selectedProject;

    try {
      // Оптимистичное обновление для мгновенной обратной связи
      const allTasks = [
        ...selectedProject.tasks.todo,
        ...selectedProject.tasks.inProgress,
        ...selectedProject.tasks.done,
      ];
      const taskToMove = allTasks.find((task: Task) => task._id === id);

      if (taskToMove) {
        // Создаем глубокую копию проекта
        const optimisticProject: ProjectWithTasks = JSON.parse(JSON.stringify(selectedProject));

        // Удаляем задачу из старой колонки
        const oldStatus = taskToMove.status;
        optimisticProject.tasks[oldStatus] = optimisticProject.tasks[oldStatus].filter(
          (task: Task) => task._id !== id,
        );

        // Создаем обновленную задачу
        const updatedTask: Task = {
          ...taskToMove,
          status: data.status,
          position: data.position,
          updatedAt: new Date(),
        };

        // Вставляем задачу на указанную позицию
        const newColumnTasks = optimisticProject.tasks[data.status];
        optimisticProject.tasks[data.status] = [
          ...newColumnTasks.slice(0, data.position),
          updatedTask,
          ...newColumnTasks.slice(data.position),
        ];

        // Обновляем позиции остальных задач в новой колонке
        optimisticProject.tasks[data.status] = optimisticProject.tasks[data.status].map(
          (task: Task, index: number): Task => ({
            ...task,
            position: index,
            // Если это обновленная задача, используем новый updatedAt
            updatedAt:
              task._id === updatedTask._id ? updatedTask.updatedAt : new Date(task.updatedAt),
          }),
        );

        // Обновляем позиции в старой колонке
        optimisticProject.tasks[oldStatus] = optimisticProject.tasks[oldStatus].map(
          (task: Task, index: number): Task => ({
            ...task,
            position: index,
            updatedAt: new Date(task.updatedAt),
          }),
        );

        // Применяем оптимистичное обновление
        set({ selectedProject: optimisticProject });
      }

      // Отправляем запрос на сервер
      const response = await tasksApi.move(id, data);
      const movedTask = response.data;

      // После успешного ответа от сервера, загружаем актуальные данные
      await get().loadProjectWithTasks(selectedProject._id);

      set({ isMovingTask: false });
      return movedTask;
    } catch (error) {
      console.error('Failed to move task:', error);

      // Если произошла ошибка, откатываем оптимистичное обновление
      set({ selectedProject: originalProject });

      set({ isMovingTask: false });
      throw error;
    }
  },

  deleteTask: async (id) => {
    try {
      // Сначала удаляем задачу локально для мгновенной обратной связи
      const { selectedProject } = get();
      if (selectedProject) {
        const taskToDelete = [
          ...selectedProject.tasks.todo,
          ...selectedProject.tasks.inProgress,
          ...selectedProject.tasks.done,
        ].find((task: Task) => task._id === id);

        if (taskToDelete) {
          const status = taskToDelete.status;
          const optimisticProject: ProjectWithTasks = JSON.parse(JSON.stringify(selectedProject));

          // Удаляем задачу
          optimisticProject.tasks[status] = optimisticProject.tasks[status].filter(
            (task: Task) => task._id !== id,
          );

          // Обновляем позиции
          optimisticProject.tasks[status] = optimisticProject.tasks[status].map(
            (task: Task, index: number): Task => ({
              ...task,
              position: index,
            }),
          );

          set({ selectedProject: optimisticProject });
        }
      }

      await tasksApi.delete(id);

      // Перезагружаем проект для синхронизации
      const { selectedProject: currentProject } = get();
      if (currentProject) {
        await get().loadProjectWithTasks(currentProject._id);
      }
    } catch (error) {
      console.error('Failed to delete task:', error);
      throw error;
    }
  },

  deleteProject: async (id) => {
    try {
      await projectsApi.delete(id);

      // Обновляем список проектов
      await get().loadProjects();

      // Если удаляемый проект был выбран, сбрасываем выбор
      const { selectedProject } = get();
      if (selectedProject?._id === id) {
        set({ selectedProject: null });
        localStorage.removeItem('selectedProjectId');
      }
    } catch (error) {
      console.error('Failed to delete project:', error);
      throw error;
    }
  },
}));
