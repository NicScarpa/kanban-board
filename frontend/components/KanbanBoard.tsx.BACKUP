'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { Task, COLUMNS, ColumnId } from '@/lib/types';
import { loadTasks, saveTasks } from '@/lib/storage';
import KanbanColumn from './KanbanColumn';
import TaskModal from './TaskModal';
import { RefreshCw, Plus, ArrowLeft } from 'lucide-react';
import { Priority } from '@/lib/types';

// Priority to order weight mapping
const PRIORITY_WEIGHT: Record<Priority, number> = {
  urgent: 0,   // Highest priority
  high: 100,
  medium: 200,
  low: 300,    // Lowest priority
};

/**
 * Calculates the order value for a new task based on its priority.
 * Tasks with higher priority get lower order values (appear first).
 * Inserts new task between existing tasks of same priority.
 */
const calculateTaskOrder = (
  newTask: Task,
  existingTasksInColumn: Task[]
): number => {
  const priorityBase = PRIORITY_WEIGHT[newTask.priority];

  // Filter tasks with same or adjacent priority that have order values
  const relevantTasks = existingTasksInColumn.filter(
    t => t.order !== undefined &&
         Math.abs(PRIORITY_WEIGHT[t.priority] - priorityBase) < 200
  );

  if (relevantTasks.length === 0) {
    // No existing tasks with order, use priority base + small offset
    return priorityBase + 50;
  }

  // Find tasks of same priority
  const samePriorityTasks = relevantTasks.filter(
    t => t.priority === newTask.priority
  );

  if (samePriorityTasks.length === 0) {
    // No tasks of same priority, place at priority boundary
    return priorityBase + 50;
  }

  // Insert at end of same-priority group
  const maxOrder = Math.max(...samePriorityTasks.map(t => t.order!));
  return maxOrder + 1;
};

interface KanbanBoardProps {
    projectId: string;
    projectName: string;
}

export default function KanbanBoard({ projectId, projectName }: KanbanBoardProps) {
    const router = useRouter();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load tasks from localStorage on mount
    useEffect(() => {
        const storedTasks = loadTasks(projectId);
        setTasks(storedTasks);
        setIsLoaded(true);
    }, [projectId]);

    // Save tasks to localStorage whenever they change
    useEffect(() => {
        if (isLoaded) {
            saveTasks(tasks, projectId);
        }
    }, [tasks, isLoaded, projectId]);

    const onDragEnd = (result: DropResult) => {
        const { destination, source, draggableId } = result;

        if (!destination) return;
        if (
            destination.droppableId === source.droppableId &&
            destination.index === source.index
        ) return;

        const newTasks = [...tasks];
        const taskIndex = newTasks.findIndex((t) => t.id === draggableId);
        if (taskIndex === -1) return;

        const [movedTask] = newTasks.splice(taskIndex, 1);
        movedTask.status = destination.droppableId as ColumnId;

        // Find the right position to insert
        let actualIndex = 0;
        let columnCount = 0;
        for (let i = 0; i < newTasks.length; i++) {
            if (newTasks[i].status === destination.droppableId) {
                if (columnCount === destination.index) {
                    actualIndex = i;
                    break;
                }
                columnCount++;
            }
            actualIndex = i + 1;
        }

        newTasks.splice(actualIndex, 0, movedTask);

        // Recalculate order values for tasks in both source and destination columns
        const sourceColumnTasks = newTasks
            .filter(t => t.status === source.droppableId)
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

        const destColumnTasks = newTasks
            .filter(t => t.status === destination.droppableId)
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

        // Reassign sequential order values
        sourceColumnTasks.forEach((task, index) => {
            task.order = index * 10;  // Use increments of 10 for future insertions
        });

        destColumnTasks.forEach((task, index) => {
            task.order = index * 10;
        });

        // Update the main array with new order values
        const updatedTasks = newTasks.map(task => {
            const sourceTask = sourceColumnTasks.find(t => t.id === task.id);
            const destTask = destColumnTasks.find(t => t.id === task.id);
            return sourceTask || destTask || task;
        });

        setTasks(updatedTasks);
    };

    const handleAddTask = () => {
        setEditingTask(null);
        setIsModalOpen(true);
    };

    const handleTaskClick = (task: Task) => {
        setEditingTask(task);
        setIsModalOpen(true);
    };

    const handleSaveTask = (task: Task) => {
        setTasks((prev) => {
            const existingIndex = prev.findIndex((t) => t.id === task.id);
            if (existingIndex >= 0) {
                // Editing existing task - preserve its order
                const newTasks = [...prev];
                newTasks[existingIndex] = { ...task, order: prev[existingIndex].order };
                return newTasks;
            }

            // New task - calculate order based on priority
            const tasksInSameColumn = prev.filter(t => t.status === task.status);
            const order = calculateTaskOrder(task, tasksInSameColumn);

            return [...prev, { ...task, order }];
        });
    };

    const handleStartTask = (taskId: string) => {
        setTasks((prev) =>
            prev.map((t) =>
                t.id === taskId ? { ...t, status: 'in-progress' as ColumnId } : t
            )
        );
    };

    const handleDeleteTask = (taskId: string) => {
        setTasks((prev) => prev.filter((t) => t.id !== taskId));
    };

    const getTasksForColumn = (columnId: ColumnId) => {
        const columnTasks = tasks.filter((t) => t.status === columnId);

        // Sort by order field (lower values first)
        // Tasks without order field appear at the end
        return columnTasks.sort((a, b) => {
            const orderA = a.order ?? Number.MAX_SAFE_INTEGER;
            const orderB = b.order ?? Number.MAX_SAFE_INTEGER;
            return orderA - orderB;
        });
    };

    if (!isLoaded) {
        return (
            <div className="flex items-center justify-center h-screen bg-slate-950">
                <RefreshCw className="w-8 h-8 text-slate-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col bg-slate-950">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-lg border-b border-slate-800">
                <div className="max-w-full mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => router.push('/')}
                            className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200 transition-colors"
                        >
                            <ArrowLeft size={16} />
                            Projects
                        </button>
                        <span className="text-slate-600">/</span>
                        <h1 className="text-xl font-bold text-slate-100">{projectName}</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={handleAddTask}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                            <Plus size={16} />
                            Add task
                        </button>
                        <button
                            onClick={() => window.location.reload()}
                            className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
                        >
                            <RefreshCw size={14} />
                            Refresh Tasks
                        </button>
                    </div>
                </div>
            </header>
            {/* Board */}
            <main className="flex-1 min-h-0 p-6 overflow-x-auto overflow-y-hidden">
                <DragDropContext onDragEnd={onDragEnd}>
                    <div className="flex gap-4 min-w-max h-full">
                        {COLUMNS.map((column) => (
                            <KanbanColumn
                                key={column.id}
                                column={column}
                                tasks={getTasksForColumn(column.id)}
                                onAddTask={handleAddTask}
                                onTaskClick={handleTaskClick}
                                onStartTask={handleStartTask}
                                onDeleteTask={handleDeleteTask}
                            />
                        ))}
                    </div>
                </DragDropContext>
            </main>

            {/* Modal */}
            <TaskModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setEditingTask(null);
                }}
                onSave={handleSaveTask}
                task={editingTask}
                projectId={projectId}
            />
        </div>
    );
}
