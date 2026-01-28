'use client';

import { Column, Task } from '@/lib/types';
import { Loader2, Eye, CheckCircle, AlertTriangle, LayoutList } from 'lucide-react';
import TaskCard from './TaskCard';
import { Droppable } from '@hello-pangea/dnd';

interface KanbanColumnProps {
    column: Column;
    tasks: Task[];
    onAddTask: () => void;
    onTaskClick: (task: Task) => void;
    onStartTask: (taskId: string) => void;
    onDeleteTask: (taskId: string) => void;
}

const iconMap: Record<string, React.ReactNode> = {
    'plus': <LayoutList size={24} className="text-slate-600" />,
    'loader': <Loader2 size={24} className="text-slate-600" />,
    'eye': <Eye size={24} className="text-slate-600" />,
    'check': <CheckCircle size={24} className="text-slate-600" />,
    'check-circle': <CheckCircle size={24} className="text-slate-600" />,
    'alert': <AlertTriangle size={24} className="text-slate-600" />,
};

export default function KanbanColumn({
    column,
    tasks,
    onAddTask,
    onTaskClick,
    onStartTask,
    onDeleteTask
}: KanbanColumnProps) {
    return (
        <div className="flex flex-col min-w-[280px] max-w-[320px] flex-1 h-full min-h-0">
            {/* Header */}
            <div
                className="flex items-center justify-between mb-4 pb-2"
                style={{ borderBottom: `2px solid ${column.color}` }}
            >
                <div className="flex items-center gap-2">
                    <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: column.color }}
                    />
                    <h2 className="text-sm font-semibold text-slate-200">{column.title}</h2>
                    <span className="text-xs text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded">
                        {tasks.length}
                    </span>
                </div>
            </div>

            {/* Task List */}
            <Droppable droppableId={column.id}>
                {(provided, snapshot) => (
                    <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`
              flex-1 min-h-0 overflow-y-auto rounded-xl p-2 space-y-3 transition-colors
              ${snapshot.isDraggingOver ? 'bg-slate-800/50 border-2 border-dashed border-slate-600' : 'bg-slate-900/30 border border-slate-800'}
            `}
                    >
                        {tasks.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-32 text-center">
                                {iconMap[column.emptyIcon] || iconMap['plus']}
                                <p className="text-sm text-slate-500 mt-2">{column.emptyMessage}</p>
                                {column.id !== 'planning' && (
                                    <p className="text-xs text-slate-600 mt-1">
                                        {column.id === 'in-progress' ? 'Start a task from Backlog' :
                                            column.id === 'ai-review' ? 'AI will review completed tasks' :
                                                column.id === 'human-review' ? 'Tasks await your approval here' :
                                                    'Tasks will appear here'}
                                    </p>
                                )}
                            </div>
                        ) : (
                            tasks.map((task, index) => (
                                <TaskCard
                                    key={task.id}
                                    task={task}
                                    index={index}
                                    onClick={() => onTaskClick(task)}
                                    onStart={column.id === 'planning' ? () => onStartTask(task.id) : undefined}
                                    onDelete={() => onDeleteTask(task.id)}
                                />
                            ))
                        )}
                        {provided.placeholder}
                    </div>
                )}
            </Droppable>
        </div>
    );
}
