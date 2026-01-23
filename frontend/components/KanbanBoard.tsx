'use client';

import { useState, useEffect } from 'react';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { Task, COLUMNS, ColumnId } from '@/lib/types';
import { loadTasks, saveTasks } from '@/lib/storage';
import KanbanColumn from './KanbanColumn';
import TaskModal from './TaskModal';
import { RefreshCw, Plus } from 'lucide-react';

export default function KanbanBoard() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load tasks from localStorage on mount
    useEffect(() => {
        const storedTasks = loadTasks();
        setTasks(storedTasks);
        setIsLoaded(true);
    }, []);

    // Save tasks to localStorage whenever they change
    useEffect(() => {
        if (isLoaded) {
            saveTasks(tasks);
        }
    }, [tasks, isLoaded]);

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
        const destinationTasks = newTasks.filter((t) => t.status === destination.droppableId);
        const insertIndex = destination.index;

        // Calculate the actual index in the full array
        let actualIndex = 0;
        let columnCount = 0;
        for (let i = 0; i < newTasks.length; i++) {
            if (newTasks[i].status === destination.droppableId) {
                if (columnCount === insertIndex) {
                    actualIndex = i;
                    break;
                }
                columnCount++;
            }
            actualIndex = i + 1;
        }

        newTasks.splice(actualIndex, 0, movedTask);
        setTasks(newTasks);
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
                const newTasks = [...prev];
                newTasks[existingIndex] = task;
                return newTasks;
            }
            return [...prev, task];
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
        return tasks.filter((t) => t.status === columnId);
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
                    <h1 className="text-xl font-bold text-slate-100">Kanban Board</h1>
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
            <main className="flex-1 p-6 overflow-x-auto overflow-y-hidden">
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
            />
        </div>
    );
}
