import React, { useState, useMemo, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Search, Plus, X } from 'lucide-react';
import { useKanbanStore } from '../stores/kanban-store';

interface HeaderProps {
  onCreateProject?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onCreateProject }) => {
  const {
    projects,
    selectedProject,
    searchTerm,
    setSearchTerm,
    loadProjectWithTasks,
    loadProjects,
  } = useKanbanStore();

  const [localSearch, setLocalSearch] = useState(searchTerm);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Фильтруем проекты по поисковому запросу
  const filteredProjects = useMemo(() => {
    if (!localSearch.trim()) {
      return projects;
    }

    const searchLower = localSearch.toLowerCase().trim();
    return projects.filter(
      (project) =>
        project.name.toLowerCase().includes(searchLower) ||
        project._id.toLowerCase().includes(searchLower) ||
        (project.description && project.description.toLowerCase().includes(searchLower)),
    );
  }, [projects, localSearch]);

  // Обработчик изменения поиска с debounce
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalSearch(value);
    setShowSearchResults(true);
  };

  // Обработчик выбора проекта из результатов поиска
  const handleSelectProject = (projectId: string) => {
    if (projectId) {
      loadProjectWithTasks(projectId);
      setShowSearchResults(false);
      setLocalSearch('');
      setSearchTerm('');
    }
  };

  // Обработчик сброса поиска
  const handleClearSearch = () => {
    setLocalSearch('');
    setSearchTerm('');
    setShowSearchResults(false);
    loadProjects(); // Загружаем все проекты заново
  };

  // Обработчик отправки поиска (при нажатии Enter)
  const handleSearchSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && localSearch.trim()) {
      setSearchTerm(localSearch.trim());
      loadProjects(); // Загружаем проекты с учетом поиска
      setShowSearchResults(true);
    }
  };

  // Обработчик выбора проекта из селекта
  const handleProjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const projectId = e.target.value;
    if (projectId) {
      loadProjectWithTasks(projectId);
      setLocalSearch('');
      setSearchTerm('');
      setShowSearchResults(false);
    }
  };

  // Закрываем результаты поиска при клике вне
  useEffect(() => {
    const handleClickOutside = () => {
      setShowSearchResults(false);
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold">Task Management Boards</h1>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
            <div className="relative w-full md:w-96">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search projects by name, ID or description..."
                  className="pl-10 pr-10"
                  value={localSearch}
                  onChange={handleSearchChange}
                  onKeyDown={handleSearchSubmit}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (filteredProjects.length > 0) {
                      setShowSearchResults(true);
                    }
                  }}
                />
                {localSearch && (
                  <button
                    onClick={handleClearSearch}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {showSearchResults && filteredProjects.length > 0 && (
                <div
                  className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-y-auto z-50"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="p-2 text-xs text-muted-foreground border-b">
                    Found {filteredProjects.length} project
                    {filteredProjects.length !== 1 ? 's' : ''}
                  </div>
                  {filteredProjects.map((project) => (
                    <button
                      key={project._id}
                      className="w-full text-left px-4 py-3 hover:bg-accent hover:text-accent-foreground transition-colors"
                      onClick={() => handleSelectProject(project._id)}
                    >
                      <div className="font-medium">{project.name}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        ID: {project._id}
                        {project.description && ` • ${project.description}`}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {showSearchResults && localSearch.trim() && filteredProjects.length === 0 && (
                <div
                  className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-md shadow-lg z-50 p-4"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="text-center text-muted-foreground">
                    No projects found matching "{localSearch}"
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={selectedProject?._id || ''}
                onChange={handleProjectChange}
              >
                <option value="">Select project...</option>
                {projects.map((project) => (
                  <option key={project._id} value={project._id}>
                    {project.name}
                  </option>
                ))}
              </select>

              <Button onClick={onCreateProject} className="whitespace-nowrap">
                <Plus className="h-4 w-4 mr-2" />
                New Project
              </Button>
            </div>
          </div>
        </div>

        {selectedProject && (
          <div className="mt-4 flex items-center gap-2 text-sm">
            <div className="px-3 py-1 bg-primary/10 text-primary rounded-full">
              Selected: {selectedProject.name}
            </div>
            <div className="text-xs text-muted-foreground">ID: {selectedProject._id}</div>
          </div>
        )}
      </div>
    </header>
  );
};
