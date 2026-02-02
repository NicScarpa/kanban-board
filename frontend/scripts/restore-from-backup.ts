import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface BackupProject {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

interface BackupAttachment {
  id: string;
  name: string;
  type: string;
  url: string;
}

interface BackupTask {
  id: string;
  title: string;
  description: string;
  priority: string;
  tags: string[];
  prompt?: string;
  attachments: BackupAttachment[];
  status: string;
  createdAt: string;
  projectId: string;
  order?: number;
}

interface BackupData {
  exportDate: string;
  projects: BackupProject[];
  tasks: BackupTask[];
}

async function restore() {
  const backupPath = path.resolve(__dirname, '../../kanban-backup.json');

  if (!fs.existsSync(backupPath)) {
    console.error(`Backup file not found: ${backupPath}`);
    process.exit(1);
  }

  console.log(`Reading backup from: ${backupPath}`);
  const raw = fs.readFileSync(backupPath, 'utf-8');
  const backup: BackupData = JSON.parse(raw);

  console.log(`Backup date: ${backup.exportDate}`);
  console.log(`Projects: ${backup.projects.length}`);
  console.log(`Tasks: ${backup.tasks.length}`);

  // 1. Upsert projects
  for (const project of backup.projects) {
    console.log(`\nUpserting project: "${project.name}" (${project.id})`);
    const { error } = await supabase
      .from('projects')
      .upsert({
        id: project.id,
        name: project.name,
        created_at: project.createdAt,
        updated_at: project.updatedAt,
      } as any, { onConflict: 'id' });

    if (error) {
      console.error(`  Failed to upsert project: ${error.message}`);
    } else {
      console.log(`  OK`);
    }
  }

  // 2. Upsert tasks one at a time (some have large base64 attachments)
  let successCount = 0;
  let errorCount = 0;

  for (const task of backup.tasks) {
    console.log(`\nUpserting task: "${task.title}" (${task.id})`);
    const { error } = await supabase
      .from('tasks')
      .upsert({
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
      } as any, { onConflict: 'id' });

    if (error) {
      console.error(`  Failed: ${error.message}`);
      errorCount++;
    } else {
      console.log(`  OK`);
      successCount++;
    }
  }

  // 3. Verify
  console.log('\n--- Verification ---');
  const { count: taskCount, error: countError } = await supabase
    .from('tasks')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    console.error(`Failed to count tasks: ${countError.message}`);
  } else {
    console.log(`Tasks in DB: ${taskCount}`);
  }

  console.log(`\nRestore complete: ${successCount} succeeded, ${errorCount} failed`);
}

restore().catch((err) => {
  console.error('Restore failed:', err);
  process.exit(1);
});
