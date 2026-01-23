import { Task } from './types';

const STORAGE_KEY = 'kanban-tasks';

export function loadTasks(): Task[] {
    if (typeof window === 'undefined') return [];

    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return [];
        return JSON.parse(stored);
    } catch {
        console.error('Failed to load tasks from localStorage');
        return [];
    }
}

export function saveTasks(tasks: Task[]): void {
    if (typeof window === 'undefined') return;

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch {
        console.error('Failed to save tasks to localStorage');
    }
}
