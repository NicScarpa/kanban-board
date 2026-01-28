import { Task, Project } from './types';
import { v4 as uuidv4 } from 'uuid';

const PROJECTS_KEY = 'kanban-projects';
const TASKS_KEY = 'kanban-tasks';
const MIGRATION_KEY = 'kanban-migrated-v2';

// --- Migration ---

function runMigrationIfNeeded(): void {
    if (typeof window === 'undefined') return;
    if (localStorage.getItem(MIGRATION_KEY)) return;

    try {
        const raw = localStorage.getItem(TASKS_KEY);
        if (!raw) {
            localStorage.setItem(MIGRATION_KEY, 'true');
            return;
        }

        const legacyTasks: (Task & { projectId?: string })[] = JSON.parse(raw);
        const needsMigration = legacyTasks.length > 0 && legacyTasks.some(t => !t.projectId);

        if (needsMigration) {
            const defaultProject: Project = {
                id: uuidv4(),
                name: 'Default',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            const migratedTasks = legacyTasks.map(t => ({
                ...t,
                projectId: t.projectId || defaultProject.id,
                tags: t.tags || [],
                attachments: t.attachments || [],
                createdAt: t.createdAt || new Date().toISOString(),
            }));

            localStorage.setItem(PROJECTS_KEY, JSON.stringify([defaultProject]));
            localStorage.setItem(TASKS_KEY, JSON.stringify(migratedTasks));
        }

        localStorage.setItem(MIGRATION_KEY, 'true');
    } catch {
        console.error('Migration failed');
    }
}

// --- Projects CRUD ---

export function loadProjects(): Project[] {
    if (typeof window === 'undefined') return [];
    runMigrationIfNeeded();

    try {
        const stored = localStorage.getItem(PROJECTS_KEY);
        if (!stored) return [];
        return JSON.parse(stored);
    } catch {
        console.error('Failed to load projects');
        return [];
    }
}

export function saveProjects(projects: Project[]): void {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
    } catch {
        console.error('Failed to save projects');
    }
}

export function getProject(id: string): Project | undefined {
    return loadProjects().find(p => p.id === id);
}

export function createProject(name: string): Project {
    const project: Project = {
        id: uuidv4(),
        name,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
    const projects = loadProjects();
    projects.push(project);
    saveProjects(projects);
    return project;
}

export function renameProject(id: string, newName: string): void {
    const projects = loadProjects();
    const project = projects.find(p => p.id === id);
    if (project) {
        project.name = newName;
        project.updatedAt = new Date().toISOString();
        saveProjects(projects);
    }
}

export function deleteProject(id: string): void {
    const projects = loadProjects().filter(p => p.id !== id);
    saveProjects(projects);
    // Also delete tasks belonging to this project
    const allTasks = loadAllTasks();
    const remaining = allTasks.filter(t => t.projectId !== id);
    saveAllTasks(remaining);
}

// --- Tasks (scoped by project) ---

function loadAllTasks(): Task[] {
    if (typeof window === 'undefined') return [];
    runMigrationIfNeeded();

    try {
        const stored = localStorage.getItem(TASKS_KEY);
        if (!stored) return [];
        return JSON.parse(stored);
    } catch {
        console.error('Failed to load tasks');
        return [];
    }
}

function saveAllTasks(tasks: Task[]): void {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
    } catch {
        console.error('Failed to save tasks');
    }
}

export function loadTasks(projectId: string): Task[] {
    return loadAllTasks().filter(t => t.projectId === projectId);
}

export function saveTasks(tasks: Task[], projectId: string): void {
    const allTasks = loadAllTasks();
    const otherTasks = allTasks.filter(t => t.projectId !== projectId);
    saveAllTasks([...otherTasks, ...tasks]);
}

// --- Helpers ---

export function getTaskCountsByProject(projectId: string): { total: number; planning: number; inProgress: number; done: number } {
    const tasks = loadTasks(projectId);
    return {
        total: tasks.length,
        planning: tasks.filter(t => t.status === 'planning').length,
        inProgress: tasks.filter(t => t.status === 'in-progress').length,
        done: tasks.filter(t => t.status === 'done').length,
    };
}
