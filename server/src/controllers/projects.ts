import { Request, Response } from 'express';
import { Project } from '../models/Project';
import { Task } from '../models/Task';
import { 
  CreateProjectRequest,
  UpdateProjectRequest,
  SearchQuery,
  ProjectResponse,
  ProjectWithTasksResponse,
  TaskResponse
} from '../types';

export class ProjectController {
  // Сделаем методы статическими, чтобы их можно было вызывать без экземпляра
  private static toProjectResponse(doc: any): ProjectResponse {
    return {
      _id: doc._id.toString(),
      name: doc.name,
      description: doc.description,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt
    };
  }

  private static toTaskResponse(doc: any): TaskResponse {
    return {
      _id: doc._id.toString(),
      title: doc.title,
      description: doc.description,
      status: doc.status,
      projectId: doc.projectId.toString(),
      position: doc.position,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt
    };
  }

  // Получить все проекты с поиском
  static async getProjects(req: Request<{}, {}, {}, SearchQuery>, res: Response): Promise<Response> {
    try {
      const { search } = req.query;
      let query = {};
      
      if (search && search.trim()) {
        query = {
          $or: [
            { name: { $regex: search.trim(), $options: 'i' } },
            { description: { $regex: search.trim(), $options: 'i' } }
          ]
        };
      }
      
      const projects = await Project.find(query).sort({ createdAt: -1 });
      const response = projects.map(ProjectController.toProjectResponse);
      
      return res.json(response);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  // Создать новый проект
  static async createProject(req: Request<{}, {}, CreateProjectRequest>, res: Response): Promise<Response> {
    try {
      const { name, description } = req.body;
      
      if (!name || name.trim().length === 0) {
        return res.status(400).json({ error: 'Project name is required' });
      }
      
      const project = new Project({
        name: name.trim(),
        description: description?.trim()
      });
      
      await project.save();
      return res.status(201).json(ProjectController.toProjectResponse(project));
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  // Получить проект по ID
  static async getProjectById(req: Request<{ id: string }>, res: Response): Promise<Response> {
    try {
      const project = await Project.findById(req.params.id);
      
      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }
      
      return res.json(ProjectController.toProjectResponse(project));
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  // Получить проект со всеми задачами
  static async getProjectWithTasks(req: Request<{ id: string }>, res: Response): Promise<Response> {
    try {
      const project = await Project.findById(req.params.id);
      
      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }
      
      const tasks = await Task.find({ projectId: req.params.id })
        .sort({ position: 1 });
      
      const projectWithTasks: ProjectWithTasksResponse = {
        ...ProjectController.toProjectResponse(project),
        tasks: {
          todo: tasks.filter(task => task.status === 'todo')
            .map(ProjectController.toTaskResponse),
          inProgress: tasks.filter(task => task.status === 'inProgress')
            .map(ProjectController.toTaskResponse),
          done: tasks.filter(task => task.status === 'done')
            .map(ProjectController.toTaskResponse)
        }
      };
      
      return res.json(projectWithTasks);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  // Обновить проект
  static async updateProject(
    req: Request<{ id: string }, {}, UpdateProjectRequest>, 
    res: Response
  ): Promise<Response> {
    try {
      const { name, description } = req.body;
      const updateData: any = {};
      
      if (name !== undefined) {
        if (name.trim().length === 0) {
          return res.status(400).json({ error: 'Project name cannot be empty' });
        }
        updateData.name = name.trim();
      }
      
      if (description !== undefined) {
        updateData.description = description.trim();
      }
      
      const project = await Project.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true, runValidators: true }
      );
      
      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }
      
      return res.json(ProjectController.toProjectResponse(project));
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  // Удалить проект с каскадным удалением задач
  static async deleteProject(req: Request<{ id: string }>, res: Response): Promise<Response> {
    try {
      const project = await Project.findById(req.params.id);
      
      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }
      
      // Удаляем все связанные задачи
      await Task.deleteMany({ projectId: req.params.id });
      
      // Удаляем проект
      await Project.findByIdAndDelete(req.params.id);
      
      return res.json({ 
        message: 'Project and all related tasks deleted successfully' 
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
}