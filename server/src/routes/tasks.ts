import { Router } from 'express';
import { TaskController } from '../controllers/tasks';

const router = Router();

router.get('/project/:projectId', TaskController.getProjectTasks);
router.post('/', TaskController.createTask);
router.get('/:id', TaskController.getTaskById);
router.put('/:id', TaskController.updateTask);
router.put('/:id/move', TaskController.moveTask);
router.delete('/:id', TaskController.deleteTask);

export default router;
