'use client';

import { useState, useEffect } from 'react';
import { getTaskCountsByProject } from '@/lib/storage';
import ProjectCard from './ProjectCard';
import type { Project } from '@/lib/types';

interface ProjectCardWrapperProps {
  project: Project;
  onOpen: (projectId: string) => void;
  onRename: (projectId: string) => void;
  onDelete: (projectId: string) => void;
}

export default function ProjectCardWrapper({
  project,
  onOpen,
  onRename,
  onDelete
}: ProjectCardWrapperProps) {
  const [taskCounts, setTaskCounts] = useState({
    total: 0,
    planning: 0,
    inProgress: 0,
    done: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTaskCounts = async () => {
      setLoading(true);
      try {
        const counts = await getTaskCountsByProject(project.id);
        setTaskCounts(counts);
      } catch (error) {
        console.error('Failed to load task counts:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchTaskCounts();
  }, [project.id]);

  if (loading) {
    return (
      <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700 animate-pulse">
        <div className="h-6 bg-slate-700 rounded mb-4"></div>
        <div className="h-4 bg-slate-700 rounded w-1/2"></div>
      </div>
    );
  }

  return (
    <ProjectCard
      project={project}
      taskCounts={taskCounts}
      onOpen={onOpen}
      onRename={onRename}
      onDelete={onDelete}
    />
  );
}
