export interface Attachment {
  id: string;
  name: string;
  type: 'file' | 'image';
  url: string;
}

export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export type ColumnId = 'planning' | 'error' | 'in-progress' | 'human-review' | 'ai-review' | 'done';

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  tags: string[];
  prompt?: string;
  attachments: Attachment[];
  status: ColumnId;
  createdAt: string;
}

export interface Column {
  id: ColumnId;
  title: string;
  color: string;
  emptyMessage: string;
  emptyIcon: string;
}

export const COLUMNS: Column[] = [
  { id: 'planning', title: 'Planning', color: '#6B7280', emptyMessage: 'Add tasks to plan', emptyIcon: 'plus' },
  { id: 'error', title: 'Error to Fix', color: '#EF4444', emptyMessage: 'No errors to fix', emptyIcon: 'check' },
  { id: 'in-progress', title: 'In Progress', color: '#3B82F6', emptyMessage: 'Nothing running', emptyIcon: 'loader' },
  { id: 'human-review', title: 'Human Review', color: '#EC4899', emptyMessage: 'Nothing to review', emptyIcon: 'eye' },
  { id: 'ai-review', title: 'AI Review', color: '#F59E0B', emptyMessage: 'No tasks in review', emptyIcon: 'eye' },
  { id: 'done', title: 'Done', color: '#22C55E', emptyMessage: 'No completed tasks', emptyIcon: 'check-circle' },
];

export const PRIORITY_COLORS: Record<Priority, { bg: string; text: string }> = {
  low: { bg: 'bg-slate-700', text: 'text-slate-300' },
  medium: { bg: 'bg-blue-900/50', text: 'text-blue-300' },
  high: { bg: 'bg-orange-900/50', text: 'text-orange-300' },
  urgent: { bg: 'bg-red-900/50', text: 'text-red-300' },
};
