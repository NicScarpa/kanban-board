'use client';

import { useState } from 'react';
import { Folder, MoreVertical, Edit2, Trash2 } from 'lucide-react';
import type { Project } from '@/lib/types';

interface ProjectCardProps {
  project: Project;
  taskCounts: {
    total: number;
    planning: number;
    inProgress: number;
    done: number;
  };
  onOpen: (projectId: string) => void;
  onRename: (projectId: string) => void;
  onDelete: (projectId: string) => void;
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  if (diffMinutes < 1) return 'Adesso';
  if (diffMinutes < 60) return `${diffMinutes} minut${diffMinutes === 1 ? 'o' : 'i'} fa`;
  if (diffHours < 24) return `${diffHours} or${diffHours === 1 ? 'a' : 'e'} fa`;
  if (diffDays === 0) return 'Oggi';
  if (diffDays === 1) return 'Ieri';
  if (diffDays < 7) return `${diffDays} giorni fa`;
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} settiman${weeks === 1 ? 'a' : 'e'} fa`;
  }
  const months = Math.floor(diffDays / 30);
  return `${months} mes${months === 1 ? 'e' : 'i'} fa`;
}

export default function ProjectCard({
  project,
  taskCounts,
  onOpen,
  onRename,
  onDelete
}: ProjectCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const handleCardClick = () => {
    onOpen(project.id);
  };

  const handleMenuToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen(!menuOpen);
  };

  const handleRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen(false);
    onRename(project.id);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen(false);

    if (window.confirm(`Eliminare il progetto "${project.name}" e tutte le sue task?`)) {
      onDelete(project.id);
    }
  };

  // Chiudi menu se si clicca fuori
  const handleClickOutside = () => {
    if (menuOpen) setMenuOpen(false);
  };

  return (
    <>
      {menuOpen && (
        <div
          className="fixed inset-0 z-10"
          onClick={handleClickOutside}
        />
      )}

      <div
        onClick={handleCardClick}
        className="relative bg-slate-800 border border-slate-700 hover:border-slate-600 rounded-2xl p-6 transition-all cursor-pointer hover:shadow-lg hover:shadow-slate-900/50 group"
      >
        {/* Header con icona e menu */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Folder className="text-blue-400" size={24} />
            </div>
            <h3 className="text-lg font-semibold text-slate-100 line-clamp-1">
              {project.name}
            </h3>
          </div>

          {/* Menu contestuale */}
          <div className="relative">
            <button
              onClick={handleMenuToggle}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-700 transition-all opacity-0 group-hover:opacity-100"
            >
              <MoreVertical size={18} />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-20 py-1">
                <button
                  onClick={handleRename}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-200 hover:bg-slate-700 transition-colors"
                >
                  <Edit2 size={16} />
                  Rinomina
                </button>
                <div className="border-t border-slate-700 my-1" />
                <button
                  onClick={handleDelete}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-slate-700 transition-colors"
                >
                  <Trash2 size={16} />
                  Elimina
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Task counters */}
        <div className="space-y-3">
          <div className="text-slate-300 font-medium">
            {taskCounts.total} task {taskCounts.total === 1 ? 'totale' : 'totali'}
          </div>

          <div className="flex flex-wrap gap-2">
            {taskCounts.planning > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-500/20 text-yellow-400 rounded-lg text-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
                {taskCounts.planning} Planning
              </div>
            )}
            {taskCounts.inProgress > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/20 text-blue-400 rounded-lg text-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                {taskCounts.inProgress} In Progress
              </div>
            )}
            {taskCounts.done > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/20 text-green-400 rounded-lg text-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                {taskCounts.done} Done
              </div>
            )}
          </div>
        </div>

        {/* Footer con data aggiornamento */}
        <div className="mt-4 pt-4 border-t border-slate-700/50">
          <div className="text-xs text-slate-500">
            Aggiornato: {formatRelativeTime(project.updatedAt)}
          </div>
        </div>
      </div>
    </>
  );
}
