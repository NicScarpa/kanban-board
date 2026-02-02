import { NextRequest, NextResponse } from 'next/server';
import { createServerBackup, listBackups } from '@/lib/backup';

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.BACKUP_SECRET;
  if (!secret) return false;

  const token = request.nextUrl.searchParams.get('token');
  return token === secret;
}

// GET /api/backup?token=SECRET — trigger a backup
// GET /api/backup?token=SECRET&action=list — list backups
export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const action = request.nextUrl.searchParams.get('action');

  try {
    if (action === 'list') {
      const backups = await listBackups();
      return NextResponse.json({ backups, count: backups.length });
    }

    // Default: create backup
    const metadata = await createServerBackup();

    if (metadata.skipped) {
      return NextResponse.json({
        success: true,
        skipped: true,
        reason: metadata.reason,
      });
    }

    return NextResponse.json({
      success: true,
      backup: metadata,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Backup failed';
    console.error('Backup error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
