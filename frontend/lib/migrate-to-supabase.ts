import { supabase } from './supabase';

/**
 * Migration script to import data from localStorage to Supabase
 * Run this in browser console on localhost:3000
 */

export async function migrateLocalStorageToSupabase() {
  console.log('🚀 Starting migration from localStorage to Supabase...');

  try {
    // Load data from localStorage
    const projectsRaw = localStorage.getItem('kanban-projects');
    const tasksRaw = localStorage.getItem('kanban-tasks');

    if (!projectsRaw || !tasksRaw) {
      console.log('⚠️ No data found in localStorage');
      return { success: false, message: 'No data found' };
    }

    const projects = JSON.parse(projectsRaw);
    const tasks = JSON.parse(tasksRaw);

    console.log(`📦 Found ${projects.length} projects and ${tasks.length} tasks`);

    let projectsSuccess = 0;
    let projectsFailed = 0;
    let tasksSuccess = 0;
    let tasksFailed = 0;

    // Insert projects
    for (const project of projects) {
      const { error } = await supabase
        .from('projects')
        .insert({
          id: project.id,
          name: project.name,
          created_at: project.createdAt,
          updated_at: project.updatedAt,
        } as any);

      if (error) {
        console.error(`❌ Failed to migrate project ${project.name}:`, error);
        projectsFailed++;
      } else {
        console.log(`✅ Migrated project: ${project.name}`);
        projectsSuccess++;
      }
    }

    // Insert tasks
    for (const task of tasks) {
      const { error } = await supabase
        .from('tasks')
        .insert({
          id: task.id,
          title: task.title,
          description: task.description || '',
          priority: task.priority,
          tags: task.tags || [],
          prompt: task.prompt || null,
          attachments: task.attachments || [],
          status: task.status,
          order: task.order || null,
          project_id: task.projectId,
          created_at: task.createdAt,
        } as any);

      if (error) {
        console.error(`❌ Failed to migrate task ${task.title}:`, error);
        tasksFailed++;
      } else {
        console.log(`✅ Migrated task: ${task.title}`);
        tasksSuccess++;
      }
    }

    console.log('🎉 Migration completed!');
    console.log(`📊 Results:
  Projects: ${projectsSuccess} success, ${projectsFailed} failed
  Tasks: ${tasksSuccess} success, ${tasksFailed} failed
    `);
    console.log('💡 You can now safely clear localStorage if desired.');

    return {
      success: true,
      projectsSuccess,
      projectsFailed,
      tasksSuccess,
      tasksFailed
    };

  } catch (error) {
    console.error('💥 Migration failed:', error);
    return { success: false, error };
  }
}

// Helper function to verify migration
export async function verifyMigration() {
  console.log('🔍 Verifying migration...');

  try {
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('*');

    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('*');

    if (projectsError || tasksError) {
      console.error('❌ Verification failed:', projectsError || tasksError);
      return false;
    }

    console.log(`✅ Verification successful!`);
    console.log(`📊 Database contains:
  Projects: ${projects?.length || 0}
  Tasks: ${tasks?.length || 0}
    `);

    return true;
  } catch (error) {
    console.error('❌ Verification error:', error);
    return false;
  }
}

// To run in browser console:
// Open http://localhost:3000
// Open browser console (F12)
// Paste this entire file content, then run:
// await migrateLocalStorageToSupabase()
// await verifyMigration()
