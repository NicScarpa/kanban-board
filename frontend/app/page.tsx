'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Folder } from 'lucide-react';
import {
  loadProjects,
  createProject,
  renameProject,
  deleteProject,
  getTaskCountsByProject
} from '@/lib/storage';
import ProjectCard from '@/components/ProjectCard';
import ProjectModal from '@/components/ProjectModal';
import type { Project } from '@/lib/types';

export default function ProjectDashboard() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [renamingProject, setRenamingProject] = useState<Project | null>(null);

  // Carica progetti all'avvio
  useEffect(() => {
    const loadedProjects = loadProjects();
    setProjects(loadedProjects);
    setLoading(false);
  }, []);

  // Handler creazione progetto
  const handleCreateProject = (name: string) => {
    const project = createProject(name);
    setProjects([...projects, project]);
    setIsModalOpen(false);
  };

  // Handler rinomina progetto
  const handleRenameProject = (name: string) => {
    if (!renamingProject) return;

    renameProject(renamingProject.id, name);

    // Ricarica progetti per aggiornare la UI
    const updatedProjects = loadProjects();
    setProjects(updatedProjects);
    setRenamingProject(null);
  };

  // Handler eliminazione progetto
  const handleDeleteProject = (id: string) => {
    deleteProject(id);

    // Ricarica progetti per aggiornare la UI
    const updatedProjects = loadProjects();
    setProjects(updatedProjects);
  };

  // Handler apertura progetto
  const handleOpenProject = (id: string) => {
    router.push(`/project/${id}`);
  };

  // Handler apertura modal rinomina
  const handleStartRename = (id: string) => {
    const project = projects.find(p => p.id === id);
    if (project) {
      setRenamingProject(project);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-950">
        <div className="text-slate-400">Caricamento...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-100">Projects</h1>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors font-medium"
          >
            <Plus size={20} />
            New Project
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {projects.length === 0 ? (
          // Empty State
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="p-6 bg-slate-800/50 rounded-2xl mb-6">
              <Folder className="text-slate-600" size={64} />
            </div>
            <h2 className="text-2xl font-semibold text-slate-300 mb-2">
              Nessun progetto
            </h2>
            <p className="text-slate-500 mb-6 max-w-md">
              Crea il tuo primo progetto per iniziare a organizzare le tue task
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors font-medium"
            >
              <Plus size={20} />
              Crea Progetto
            </button>
          </div>
        ) : (
          // Projects Grid
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => {
              const taskCounts = getTaskCountsByProject(project.id);
              return (
                <ProjectCard
                  key={project.id}
                  project={project}
                  taskCounts={taskCounts}
                  onOpen={handleOpenProject}
                  onRename={handleStartRename}
                  onDelete={handleDeleteProject}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Creazione */}
      <ProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleCreateProject}
      />

      {/* Modal Rinomina */}
      {renamingProject && (
        <ProjectModal
          isOpen={true}
          onClose={() => setRenamingProject(null)}
          onSave={handleRenameProject}
          initialName={renamingProject.name}
        />
      )}
    </div>
  );
}
