import { createClient } from '@supabase/supabase-js';
import { createHash } from 'crypto';

const BUCKET_NAME = 'backups';
const MAX_BACKUPS = 30;

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }

  return createClient(url, serviceKey);
}

const CHECKSUM_FILE = 'latest-checksum.txt';

export interface BackupMetadata {
  filename: string;
  size: number;
  createdAt: string;
  projectCount: number;
  taskCount: number;
  skipped?: boolean;
  reason?: string;
}

function computeDataHash(projects: any[], tasks: any[]): string {
  const data = JSON.stringify({ projects, tasks }, Object.keys({ projects, tasks }).sort());
  return createHash('sha256').update(data).digest('hex');
}

export async function createServerBackup({ skipIfUnchanged = true } = {}): Promise<BackupMetadata> {
  const supabase = getServiceClient();

  // Export all data
  const { data: projects, error: projErr } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false });

  if (projErr) throw new Error(`Failed to load projects: ${projErr.message}`);

  const allTasks: any[] = [];
  for (const project of projects || []) {
    const { data: tasks, error: taskErr } = await supabase
      .from('tasks')
      .select('*')
      .eq('project_id', project.id)
      .order('order', { ascending: true, nullsFirst: false });

    if (taskErr) throw new Error(`Failed to load tasks for project ${project.id}: ${taskErr.message}`);
    if (tasks) allTasks.push(...tasks);
  }

  const dataHash = computeDataHash(projects || [], allTasks);

  // Check if data has changed since last backup
  if (skipIfUnchanged) {
    const { data: checksumData } = await supabase.storage
      .from(BUCKET_NAME)
      .download(CHECKSUM_FILE);

    if (checksumData) {
      const previousHash = (await checksumData.text()).trim();
      if (dataHash === previousHash) {
        return {
          filename: '',
          size: 0,
          createdAt: new Date().toISOString(),
          projectCount: (projects || []).length,
          taskCount: allTasks.length,
          skipped: true,
          reason: 'no changes',
        };
      }
    }
  }

  const backupData = {
    exportDate: new Date().toISOString(),
    projects: projects || [],
    tasks: allTasks,
  };

  const json = JSON.stringify(backupData, null, 2);
  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const filename = `backup-${timestamp}.json`;

  // Upload backup to Supabase Storage
  const { error: uploadErr } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filename, json, {
      contentType: 'application/json',
      upsert: false,
    });

  if (uploadErr) throw new Error(`Failed to upload backup: ${uploadErr.message}`);

  // Update checksum file
  await supabase.storage
    .from(BUCKET_NAME)
    .upload(CHECKSUM_FILE, dataHash, {
      contentType: 'text/plain',
      upsert: true,
    });

  // Clean up old backups
  await pruneOldBackups(supabase);

  return {
    filename,
    size: new Blob([json]).size,
    createdAt: now.toISOString(),
    projectCount: (projects || []).length,
    taskCount: allTasks.length,
  };
}

async function pruneOldBackups(supabase: ReturnType<typeof createClient>) {
  const { data: files, error } = await supabase.storage
    .from(BUCKET_NAME)
    .list('', { sortBy: { column: 'created_at', order: 'asc' } });

  if (error || !files) return;

  const backupFiles = files.filter(f => f.name.startsWith('backup-') && f.name.endsWith('.json') && f.name !== CHECKSUM_FILE);

  if (backupFiles.length <= MAX_BACKUPS) return;

  const toDelete = backupFiles.slice(0, backupFiles.length - MAX_BACKUPS);
  const paths = toDelete.map(f => f.name);

  await supabase.storage.from(BUCKET_NAME).remove(paths);
}

export async function listBackups(): Promise<BackupMetadata[]> {
  const supabase = getServiceClient();

  const { data: files, error } = await supabase.storage
    .from(BUCKET_NAME)
    .list('', { sortBy: { column: 'created_at', order: 'desc' } });

  if (error) throw new Error(`Failed to list backups: ${error.message}`);
  if (!files) return [];

  return files
    .filter(f => f.name.startsWith('backup-') && f.name.endsWith('.json'))
    .map(f => ({
      filename: f.name,
      size: f.metadata?.size ?? 0,
      createdAt: f.created_at || '',
      projectCount: -1, // Not available from listing
      taskCount: -1,
    }));
}
