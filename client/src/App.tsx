import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { KanbanBoard } from './components/KanbanBoard';
import { ProjectModal } from './components/ProjectModal';
import { useKanbanStore } from './stores/kanban-store';

function App() {
  const { projects, selectedProject, loading, loadProjects, loadProjectWithTasks, createProject } =
    useKanbanStore();

  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Инициализация приложения - загрузка проектов
  useEffect(() => {
    const init = async () => {
      await loadProjects();
      setIsInitialized(true);
    };

    init();
  }, [loadProjects]);

  // После инициализации и загрузки проектов, восстанавливаем выбранный проект
  useEffect(() => {
    if (isInitialized && projects.length > 0 && !selectedProject && !loading) {
      const savedProjectId = localStorage.getItem('selectedProjectId');
      if (savedProjectId) {
        const projectExists = projects.find((p) => p._id === savedProjectId);
        if (projectExists) {
          loadProjectWithTasks(savedProjectId);
        }
      }
    }
  }, [isInitialized, projects, selectedProject, loading, loadProjectWithTasks]);

  const handleCreateProject = async (data: { name: string; description?: string }) => {
    try {
      const newProject = await createProject(data);
      if (newProject) {
        await loadProjectWithTasks(newProject._id);
      }
    } catch (error) {
      console.error('Error creating project:', error);
    }
  };

  if (!isInitialized || (loading && projects.length === 0)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100">
      <Header onCreateProject={() => setIsProjectModalOpen(true)} />

      {!selectedProject ? (
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl font-semibold mb-4">Welcome to Kanban Board</h2>
            <p className="text-muted-foreground mb-6">
              {projects.length === 0
                ? 'No projects found. Create your first project to start organizing tasks.'
                : 'Select a project from the dropdown to view and manage tasks.'}
            </p>

            {projects.length === 0 ? (
              <button
                onClick={() => setIsProjectModalOpen(true)}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
              >
                Create First Project
              </button>
            ) : (
              <div className="mt-8">
                <p className="text-sm text-muted-foreground mb-4">
                  Or select from available projects:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {projects.map((project) => (
                    <div
                      key={project._id}
                      className="bg-white p-4 rounded-lg border shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => loadProjectWithTasks(project._id)}
                    >
                      <h3 className="font-medium text-lg mb-2">{project.name}</h3>
                      {project.description && (
                        <p className="text-sm text-muted-foreground">{project.description}</p>
                      )}
                      <div className="mt-4 text-right">
                        <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">
                          Select →
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <KanbanBoard />
      )}

      <ProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        onSubmit={handleCreateProject}
      />
    </div>
  );
}

export default App;
