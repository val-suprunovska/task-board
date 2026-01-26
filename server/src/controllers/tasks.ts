import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Task, ITaskDocument } from '../models/Task';
import { Project } from '../models/Project';
import { CreateTaskRequest, UpdateTaskRequest, MoveTaskRequest, TaskResponse } from '../types';

export class TaskController {
  // Хелпер для преобразования
  private static toTaskResponse(doc: ITaskDocument): TaskResponse {
    return {
      _id: doc._id.toString(),
      title: doc.title,
      description: doc.description,
      status: doc.status,
      projectId: doc.projectId.toString(),
      position: doc.position,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }

  // Получить все задачи проекта
  static async getProjectTasks(
    req: Request<{ projectId: string }>,
    res: Response,
  ): Promise<Response> {
    try {
      // Проверяем существование проекта
      const project = await Project.findById(req.params.projectId);
      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      const tasks = await Task.find({ projectId: req.params.projectId }).sort({ position: 1 });

      // Группируем для Kanban
      const groupedTasks = {
        todo: tasks
          .filter((task: ITaskDocument) => task.status === 'todo')
          .map(TaskController.toTaskResponse),
        inProgress: tasks
          .filter((task: ITaskDocument) => task.status === 'inProgress')
          .map(TaskController.toTaskResponse),
        done: tasks
          .filter((task: ITaskDocument) => task.status === 'done')
          .map(TaskController.toTaskResponse),
      };

      return res.json(groupedTasks);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return res.status(500).json({ error: errorMessage });
    }
  }

  // Создать новую задачу
  static async createTask(
    req: Request<unknown, unknown, CreateTaskRequest>,
    res: Response,
  ): Promise<Response> {
    try {
      const { title, description, status = 'todo', projectId } = req.body;

      // Проверяем обязательные поля
      if (!title || title.trim().length === 0) {
        return res.status(400).json({ error: 'Task title is required' });
      }

      if (!projectId) {
        return res.status(400).json({ error: 'Project ID is required' });
      }

      // Проверяем существование проекта
      const project = await Project.findById(projectId);
      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      // Получаем максимальную позицию
      const maxPositionTask = await Task.findOne(
        {
          projectId,
          status,
        },
        { position: 1 },
      ).sort({ position: -1 });

      const position = maxPositionTask ? maxPositionTask.position + 1 : 0;

      // Создаём задачу
      const task = new Task({
        title: title.trim(),
        description: description?.trim(),
        status,
        projectId,
        position,
      });

      await task.save();
      return res.status(201).json(TaskController.toTaskResponse(task));
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return res.status(400).json({ error: errorMessage });
    }
  }

  // Получить задачу по ID
  static async getTaskById(req: Request<{ id: string }>, res: Response): Promise<Response> {
    try {
      const task = await Task.findById(req.params.id);

      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      }

      return res.json(TaskController.toTaskResponse(task));
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return res.status(500).json({ error: errorMessage });
    }
  }

  // Обновить задачу
  static async updateTask(
    req: Request<{ id: string }, unknown, UpdateTaskRequest>,
    res: Response,
  ): Promise<Response> {
    try {
      const task = await Task.findById(req.params.id);

      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      }

      // Обновляем только переданные поля
      const updateData: Partial<{
        title: string;
        description?: string;
        status: 'todo' | 'inProgress' | 'done';
      }> = {};

      if (req.body.title !== undefined) {
        if (req.body.title.trim().length === 0) {
          return res.status(400).json({ error: 'Task title cannot be empty' });
        }
        updateData.title = req.body.title.trim();
      }

      if (req.body.description !== undefined) {
        updateData.description = req.body.description.trim();
      }

      if (req.body.status !== undefined) {
        updateData.status = req.body.status;
      }

      const updatedTask = await Task.findByIdAndUpdate(req.params.id, updateData, {
        new: true,
        runValidators: true,
      });

      if (!updatedTask) {
        return res.status(404).json({ error: 'Task not found after update' });
      }

      return res.json(TaskController.toTaskResponse(updatedTask));
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return res.status(400).json({ error: errorMessage });
    }
  }

  // Переместить задачу
  static async moveTask(
    req: Request<{ id: string }, unknown, MoveTaskRequest>,
    res: Response,
  ): Promise<Response> {
    try {
      const { status, position, projectId } = req.body;

      // Валидация
      if (!status || position === undefined) {
        return res.status(400).json({
          error: 'Status and position are required',
        });
      }

      if (position < 0) {
        return res.status(400).json({
          error: 'Position must be a non-negative number',
        });
      }

      // Находим задачу
      const taskToMove = await Task.findById(req.params.id);
      if (!taskToMove) {
        return res.status(404).json({ error: 'Task not found' });
      }

      const targetProjectId = projectId || taskToMove.projectId.toString();

      // Если указан новый projectId, проверяем существование проекта
      if (projectId && projectId !== taskToMove.projectId.toString()) {
        const targetProject = await Project.findById(projectId);
        if (!targetProject) {
          return res.status(404).json({ error: 'Target project not found' });
        }
      }

      const oldStatus = taskToMove.status;
      const oldPosition = taskToMove.position;
      const oldProjectId = taskToMove.projectId.toString();

      // Если статус или проект изменились, обновляем позиции в старом месте
      if (oldStatus !== status || oldProjectId !== targetProjectId) {
        await Task.updateMany(
          {
            projectId: oldProjectId,
            status: oldStatus,
            position: { $gt: oldPosition },
          },
          { $inc: { position: -1 } },
        );
      }

      // Обновляем позиции в новом месте
      await Task.updateMany(
        {
          projectId: targetProjectId,
          status: status,
          position: { $gte: position },
        },
        { $inc: { position: 1 } },
      );

      // Обновляем саму задачу
      taskToMove.status = status;
      taskToMove.position = position;

      if (projectId) {
        taskToMove.projectId = new mongoose.Types.ObjectId(projectId);
      }

      await taskToMove.save();
      return res.json(TaskController.toTaskResponse(taskToMove));
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return res.status(500).json({ error: errorMessage });
    }
  }

  // Удалить задачу
  static async deleteTask(req: Request<{ id: string }>, res: Response): Promise<Response> {
    try {
      const task = await Task.findById(req.params.id);

      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      }

      // Обновляем позиции остальных задач
      await Task.updateMany(
        {
          projectId: task.projectId,
          status: task.status,
          position: { $gt: task.position },
        },
        { $inc: { position: -1 } },
      );

      await Task.findByIdAndDelete(req.params.id);

      return res.json({ message: 'Task deleted successfully' });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return res.status(500).json({ error: errorMessage });
    }
  }
}
