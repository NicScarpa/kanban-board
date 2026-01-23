'use client';

import { Task, PRIORITY_COLORS } from '@/lib/types';
import { Calendar, Paperclip, MoreVertical, Play, Tag } from 'lucide-react';
import { Draggable } from '@hello-pangea/dnd';

interface TaskCardProps {
    task: Task;
    index: number;
    onClick: () => void;
    onStart?: () => void;
    onDelete: () => void;
}

export default function TaskCard({ task, index, onClick, onStart, onDelete }: TaskCardProps) {
    const priorityStyle = PRIORITY_COLORS[task.priority];

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return '1d ago';
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString('en-US', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    return (
        <Draggable draggableId={task.id} index={index}>
            {(provided, snapshot) => (
                <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    onClick={onClick}
                    className={`
            bg-slate-800/80 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4
            cursor-pointer transition-all duration-200 group
            hover:border-slate-600 hover:bg-slate-800
            ${snapshot.isDragging ? 'shadow-2xl shadow-black/50 rotate-2 scale-105' : ''}
          `}
                >
                    {/* Title */}
                    <h3 className="text-sm font-semibold text-slate-100 uppercase tracking-wide mb-2 line-clamp-2">
                        {task.title}
                    </h3>

                    {/* Description */}
                    {task.description && (
                        <p className="text-xs text-slate-400 line-clamp-2 mb-3">
                            {task.description}
                        </p>
                    )}

                    {/* Priority Badge */}
                    <div className="mb-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${priorityStyle.bg} ${priorityStyle.text}`}>
                            {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                        </span>
                    </div>

                    {/* Tags */}
                    {task.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                            {task.tags.slice(0, 3).map((tag, i) => (
                                <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-700/50 rounded text-xs text-slate-400">
                                    <Tag size={10} />
                                    {tag}
                                </span>
                            ))}
                            {task.tags.length > 3 && (
                                <span className="text-xs text-slate-500">+{task.tags.length - 3}</span>
                            )}
                        </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-700/50">
                        <div className="flex items-center gap-2 text-slate-500 text-xs">
                            <Calendar size={12} />
                            <span>{formatDate(task.createdAt)}</span>
                            {task.attachments.length > 0 && (
                                <>
                                    <Paperclip size={12} />
                                    <span>{task.attachments.length}</span>
                                </>
                            )}
                        </div>

                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            {onStart && task.status === 'planning' && (
                                <button
                                    onClick={onStart}
                                    className="flex items-center gap-1 px-2 py-1 bg-yellow-500 hover:bg-yellow-400 text-slate-900 rounded text-xs font-medium transition-colors"
                                >
                                    <Play size={10} fill="currentColor" />
                                    Start
                                </button>
                            )}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (confirm('Delete this task?')) onDelete();
                                }}
                                className="p-1 text-slate-500 hover:text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <MoreVertical size={14} />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Draggable>
    );
}
