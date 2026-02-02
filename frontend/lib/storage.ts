import { Task, Project, Attachment } from './types';
import { supabase } from './supabase';

// ============================================
// Projects CRUD
// ============================================

export async function loadProjects(): Promise<Project[]> {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    if (!data) return [];

    return data.map((row: any) => ({
      id: row.id,
      name: row.name,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  } catch (error) {
    console.error('Failed to load projects:', error);
    return [];
  }
}

export async function saveProjects(projects: Project[]): Promise<void> {
  // Not needed for Supabase - use createProject/updateProject instead
  console.warn('saveProjects() is deprecated with Supabase. Use createProject/renameProject instead.');
}

export async function getProject(id: string): Promise<Project | undefined> {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) return undefined;

    return {
      id: (data as any).id,
      name: (data as any).name,
      createdAt: (data as any).created_at,
      updatedAt: (data as any).updated_at,
    };
  } catch (error) {
    console.error('Failed to get project:', error);
    return undefined;
  }
}

export async function createProject(name: string): Promise<Project> {
  const { data, error } = await supabase
    .from('projects')
    .insert({ name } as any)
    .select()
    .single();

  if (error) throw new Error(`Failed to create project: ${error.message}`);
  if (!data) throw new Error('No data returned from create project');

  return {
      id: (data as any).id,
      name: (data as any).name,
      createdAt: (data as any).created_at,
      updatedAt: (data as any).updated_at,
    };
}

export async function renameProject(id: string, newName: string): Promise<void> {
  const { error } = await supabase
    .from('projects')
    .update({ name: newName } as any)
    .eq('id', id);

  if (error) throw new Error(`Failed to rename project: ${error.message}`);
}

export async function deleteProject(id: string): Promise<void> {
  // Cascade delete handled by database ON DELETE CASCADE
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', id);

  if (error) throw new Error(`Failed to delete project: ${error.message}`);
}

// ============================================
// Tasks CRUD (scoped by project)
// ============================================

export async function loadTasks(projectId: string): Promise<Task[]> {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('project_id', projectId)
      .order('order', { ascending: true, nullsFirst: false });

    if (error) throw error;
    if (!data) return [];

    return data.map((row: any) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      priority: row.priority as Task['priority'],
      tags: row.tags || [],
      prompt: row.prompt || undefined,
      attachments: (row.attachments as Attachment[]) || [],
      status: row.status as Task['status'],
      order: row.order || undefined,
      projectId: row.project_id,
      createdAt: row.created_at,
    }));
  } catch (error) {
    console.error('Failed to load tasks:', error);
    return [];
  }
}

export async function saveTasks(tasks: Task[], projectId: string): Promise<void> {
  try {
    // Safety check: refuse to wipe all tasks if DB has data
    if (tasks.length === 0) {
      const { count } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', projectId);

      if (count && count > 0) {
        console.warn(`saveTasks() called with empty array but DB has ${count} tasks — skipping to prevent data loss`);
        return;
      }
    }

    // Step 1: Upsert all tasks (insert or update)
    if (tasks.length > 0) {
      const { error: upsertError } = await supabase
        .from('tasks')
        .upsert(
          tasks.map(task => ({
            id: task.id,
            title: task.title,
            description: task.description,
            priority: task.priority,
            tags: task.tags,
            prompt: task.prompt || null,
            attachments: task.attachments,
            status: task.status,
            order: task.order ?? null,
            project_id: task.projectId,
            created_at: task.createdAt,
          })) as any,
          { onConflict: 'id' }
        );

      if (upsertError) throw upsertError;
    }

    // Step 2: Delete tasks that are no longer in the array (targeted delete)
    const currentIds = tasks.map(t => t.id);
    const { data: dbTasks } = await supabase
      .from('tasks')
      .select('id')
      .eq('project_id', projectId);

    if (dbTasks && dbTasks.length > 0) {
      const idsToDelete = dbTasks
        .map((t: any) => t.id)
        .filter((id: string) => !currentIds.includes(id));

      if (idsToDelete.length > 0) {
        const { error: deleteError } = await supabase
          .from('tasks')
          .delete()
          .in('id', idsToDelete);

        if (deleteError) throw deleteError;
      }
    }
  } catch (error) {
    console.error('Failed to save tasks:', error);
    throw error;
  }
}

// ============================================
// Helpers
// ============================================

export async function getTaskCountsByProject(
  projectId: string
): Promise<{ total: number; planning: number; inProgress: number; toVerify: number; done: number }> {
  const tasks = await loadTasks(projectId);
  return {
    total: tasks.length,
    planning: tasks.filter(t => t.status === 'planning').length,
    inProgress: tasks.filter(t => t.status === 'in-progress').length,
    toVerify: tasks.filter(t => t.status === 'to-verify').length,
    done: tasks.filter(t => t.status === 'done').length,
  };
}

// ============================================
// Backup
// ============================================

export async function exportAllData(): Promise<{ exportDate: string; projects: Project[]; tasks: Task[] }> {
  const projects = await loadProjects();
  const allTasks: Task[] = [];

  for (const project of projects) {
    const tasks = await loadTasks(project.id);
    allTasks.push(...tasks);
  }

  return {
    exportDate: new Date().toISOString(),
    projects,
    tasks: allTasks,
  };
}

export async function downloadBackup(): Promise<void> {
  const data = await exportAllData();
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `kanban-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function saveLocalBackup(tasks: Task[], projectId: string): void {
  try {
    const key = `kanban-backup-${projectId}`;
    const data = {
      savedAt: new Date().toISOString(),
      projectId,
      tasks,
    };
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.warn('Failed to save local backup:', error);
  }
}

export function loadLocalBackup(projectId: string): Task[] | null {
  try {
    const key = `kanban-backup-${projectId}`;
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const data = JSON.parse(raw);
    return data.tasks || null;
  } catch {
    return null;
  }
}
