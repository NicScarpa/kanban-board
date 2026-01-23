'use client';

import { useState, useRef } from 'react';
import { Task, Priority, ColumnId, Attachment, COLUMNS, PRIORITY_COLORS } from '@/lib/types';
import { X, Upload, Trash2, FileText, Image as ImageIcon } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface TaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (task: Task) => void;
    task?: Task | null;
    defaultStatus?: ColumnId;
}

export default function TaskModal({ isOpen, onClose, onSave, task, defaultStatus = 'planning' }: TaskModalProps) {
    const [title, setTitle] = useState(task?.title || '');
    const [description, setDescription] = useState(task?.description || '');
    const [priority, setPriority] = useState<Priority>(task?.priority || 'medium');
    const [tags, setTags] = useState(task?.tags.join(', ') || '');
    const [prompt, setPrompt] = useState(task?.prompt || '');
    const [attachments, setAttachments] = useState<Attachment[]>(task?.attachments || []);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        Array.from(files).forEach((file) => {
            const reader = new FileReader();
            reader.onload = (event) => {
                const newAttachment: Attachment = {
                    id: uuidv4(),
                    name: file.name,
                    type: file.type.startsWith('image/') ? 'image' : 'file',
                    url: event.target?.result as string,
                };
                setAttachments((prev) => [...prev, newAttachment]);
            };
            reader.readAsDataURL(file);
        });
    };

    const removeAttachment = (id: string) => {
        setAttachments((prev) => prev.filter((a) => a.id !== id));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;

        const newTask: Task = {
            id: task?.id || uuidv4(),
            title: title.trim(),
            description: description.trim(),
            priority,
            tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
            prompt: prompt.trim() || undefined,
            attachments,
            status: task?.status || defaultStatus,
            createdAt: task?.createdAt || new Date().toISOString(),
        };

        onSave(newTask);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl">
                {/* Header */}
                <div className="sticky top-0 bg-slate-900 border-b border-slate-700 px-6 py-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-slate-100">
                        {task ? 'Edit Task' : 'New Task'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1 text-slate-400 hover:text-slate-200 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1.5">
                            Title *
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Task title..."
                            required
                            className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1.5">
                            Description
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Describe the task..."
                            rows={3}
                            className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        />
                    </div>

                    {/* Priority */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1.5">
                            Priority
                        </label>
                        <div className="flex gap-2">
                            {(['low', 'medium', 'high', 'urgent'] as Priority[]).map((p) => (
                                <button
                                    key={p}
                                    type="button"
                                    onClick={() => setPriority(p)}
                                    className={`
                    px-3 py-1.5 rounded-lg text-sm font-medium transition-all
                    ${priority === p
                                            ? `${PRIORITY_COLORS[p].bg} ${PRIORITY_COLORS[p].text} ring-2 ring-offset-2 ring-offset-slate-900 ring-slate-500`
                                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                                        }
                  `}
                                >
                                    {p.charAt(0).toUpperCase() + p.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Tags */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1.5">
                            Tags
                        </label>
                        <input
                            type="text"
                            value={tags}
                            onChange={(e) => setTags(e.target.value)}
                            placeholder="Enter tags separated by commas..."
                            className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* Prompt */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1.5">
                            Prompt
                        </label>
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="AI prompt or additional instructions..."
                            rows={2}
                            className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-sm"
                        />
                    </div>

                    {/* Attachments */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1.5">
                            Attachments
                        </label>

                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            onChange={handleFileUpload}
                            className="hidden"
                        />

                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-800 border border-dashed border-slate-600 rounded-lg text-slate-400 hover:text-slate-200 hover:border-slate-500 transition-colors"
                        >
                            <Upload size={16} />
                            Upload files
                        </button>

                        {attachments.length > 0 && (
                            <div className="mt-3 space-y-2">
                                {attachments.map((att) => (
                                    <div
                                        key={att.id}
                                        className="flex items-center gap-3 p-2 bg-slate-800 rounded-lg"
                                    >
                                        {att.type === 'image' ? (
                                            <div className="w-10 h-10 rounded overflow-hidden flex-shrink-0">
                                                <img src={att.url} alt={att.name} className="w-full h-full object-cover" />
                                            </div>
                                        ) : (
                                            <div className="w-10 h-10 rounded bg-slate-700 flex items-center justify-center flex-shrink-0">
                                                <FileText size={18} className="text-slate-400" />
                                            </div>
                                        )}
                                        <span className="flex-1 text-sm text-slate-300 truncate">{att.name}</span>
                                        <button
                                            type="button"
                                            onClick={() => removeAttachment(att.id)}
                                            className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Submit */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-slate-400 hover:text-slate-200 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition-colors"
                        >
                            {task ? 'Update' : 'Create'} Task
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
