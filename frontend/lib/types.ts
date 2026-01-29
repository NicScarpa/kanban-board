export interface Attachment {
  id: string;
  name: string;
  type: 'file' | 'image';
  url: string;
}

export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export type ColumnId = 'planning' | 'error' | 'in-progress' | 'human-review' | 'ai-review' | 'to-verify' | 'done';

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
  projectId: string;
  order?: number; // Used to preserve manual ordering after drag & drop
}

export interface Project {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
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
  { id: 'error', title: 'To Be Planned', color: '#EF4444', emptyMessage: 'No tasks to plan', emptyIcon: 'clipboard' },
  { id: 'in-progress', title: 'Prompt to be Generated', color: '#3B82F6', emptyMessage: 'No prompts pending', emptyIcon: 'loader' },
  { id: 'human-review', title: 'Prompt Generated', color: '#EC4899', emptyMessage: 'No prompts ready', emptyIcon: 'file-text' },
  { id: 'ai-review', title: 'AI Review', color: '#F59E0B', emptyMessage: 'No tasks in review', emptyIcon: 'eye' },
  { id: 'to-verify', title: 'To Verify', color: '#06B6D4', emptyMessage: 'No tasks to verify', emptyIcon: 'check-square' },
  { id: 'done', title: 'Implemented', color: '#22C55E', emptyMessage: 'No implemented tasks', emptyIcon: 'check-circle' },
];

export interface PromptGenerationParams {
  planMode: boolean;
  taskBreakdown: boolean;
  codeOrganization: boolean;
  testCoverage: boolean;
}

export interface ClarifyingQuestion {
  id: string;
  question: string;
  answer: string;
}

export const PRIORITY_COLORS: Record<Priority, { bg: string; text: string }> = {
  low: { bg: 'bg-slate-700', text: 'text-slate-300' },
  medium: { bg: 'bg-blue-900/50', text: 'text-blue-300' },
  high: { bg: 'bg-orange-900/50', text: 'text-orange-300' },
  urgent: { bg: 'bg-red-900/50', text: 'text-red-300' },
};
