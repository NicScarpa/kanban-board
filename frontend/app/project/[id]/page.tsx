'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getProject } from '@/lib/storage';
import KanbanBoard from '@/components/KanbanBoard';
import type { Project } from '@/lib/types';

export default function ProjectPage() {
  const params = useParams();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const projectId = params.id as string;
    const loadedProject = getProject(projectId);

    if (!loadedProject) {
      // Progetto non trovato, redirect alla dashboard
      router.push('/');
      return;
    }

    setProject(loadedProject);
    setLoading(false);
  }, [params.id, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-950">
        <div className="text-slate-400">Caricamento progetto...</div>
      </div>
    );
  }

  if (!project) {
    return null; // Reindirizzamento in corso
  }

  return (
    <KanbanBoard
      projectId={project.id}
      projectName={project.name}
    />
  );
}
