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
    // Delete all tasks for this project first
    await supabase
      .from('tasks')
      .delete()
      .eq('project_id', projectId);

    // Insert all tasks
    if (tasks.length > 0) {
      const { error } = await supabase
        .from('tasks')
        .insert(
          tasks.map(task => ({
            id: task.id,
            title: task.title,
            description: task.description,
            priority: task.priority,
            tags: task.tags,
            prompt: task.prompt || null,
            attachments: task.attachments,
            status: task.status,
            order: task.order || null,
            project_id: task.projectId,
            created_at: task.createdAt,
          })) as any
        );

      if (error) throw error;
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
