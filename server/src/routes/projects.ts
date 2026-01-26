import { Router } from 'express';
import { ProjectController } from '../controllers/projects';

const router = Router();

router.get('/', ProjectController.getProjects);
router.post('/', ProjectController.createProject);
router.get('/:id', ProjectController.getProjectById);
router.get('/:id/with-tasks', ProjectController.getProjectWithTasks);
router.put('/:id', ProjectController.updateProject);
router.delete('/:id', ProjectController.deleteProject);

export default router;