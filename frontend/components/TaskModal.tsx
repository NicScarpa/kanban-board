'use client';

import { useState, useRef, useEffect } from 'react';
import { Task, Priority, ColumnId, Attachment, PromptGenerationParams, ClarifyingQuestion, COLUMNS, PRIORITY_COLORS } from '@/lib/types';
import { X, Upload, Trash2, FileText, Image as ImageIcon, Sparkles, Copy, Check, Loader2, MessageCircleQuestion, Download } from 'lucide-react';
import ImageLightbox from './ImageLightbox';
import { v4 as uuidv4 } from 'uuid';

interface TaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (task: Task) => void;
    task?: Task | null;
    defaultStatus?: ColumnId;
    projectId: string;
}

export default function TaskModal({ isOpen, onClose, onSave, task, defaultStatus = 'planning', projectId }: TaskModalProps) {
    const [title, setTitle] = useState(task?.title || '');
    const [description, setDescription] = useState(task?.description || '');
    const [priority, setPriority] = useState<Priority>(task?.priority || 'medium');
    const [tags, setTags] = useState(task?.tags.join(', ') || '');
    const [prompt, setPrompt] = useState(task?.prompt || '');
    const [attachments, setAttachments] = useState<Attachment[]>(task?.attachments || []);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [lightboxImage, setLightboxImage] = useState<Attachment | null>(null);

    // Prompt generation state
    const [isGenerating, setIsGenerating] = useState(false);
    const [generationError, setGenerationError] = useState<string | null>(null);
    const [copySuccess, setCopySuccess] = useState(false);
    const [promptParams, setPromptParams] = useState<PromptGenerationParams>({
        planMode: true,
        taskBreakdown: true,
        codeOrganization: false,
        testCoverage: false,
    });
    const [generationStep, setGenerationStep] = useState<'idle' | 'questions' | 'generating'>('idle');
    const [clarifyingQuestions, setClarifyingQuestions] = useState<ClarifyingQuestion[]>([]);

    // Reset form state when modal opens or task changes
    useEffect(() => {
        if (isOpen) {
            setTitle(task?.title || '');
            setDescription(task?.description || '');
            setPriority(task?.priority || 'medium');
            setTags(task?.tags.join(', ') || '');
            setPrompt(task?.prompt || '');
            setAttachments(task?.attachments || []);
            // Reset generation state
            setIsGenerating(false);
            setGenerationError(null);
            setCopySuccess(false);
            setPromptParams({
                planMode: true,
                taskBreakdown: true,
                codeOrganization: false,
                testCoverage: false,
            });
            setGenerationStep('idle');
            setClarifyingQuestions([]);
        }
    }, [isOpen, task]);

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

    const handleDownload = (attachment: Attachment) => {
        const link = document.createElement('a');
        link.href = attachment.url;
        link.download = attachment.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
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
            projectId: projectId,
        };

        onSave(newTask);
        onClose();
    };

    // --- Prompt Generation Handlers ---

    const toggleParam = (key: keyof PromptGenerationParams) => {
        setPromptParams(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const updateQuestionAnswer = (id: string, answer: string) => {
        setClarifyingQuestions(prev =>
            prev.map(q => q.id === id ? { ...q, answer } : q)
        );
    };

    const handleGeneratePrompt = async () => {
        if (!title.trim()) return;
        setIsGenerating(true);
        setGenerationError(null);

        try {
            const res = await fetch('/api/generate-prompt', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    mode: 'questions',
                    title,
                    description,
                    parameters: promptParams,
                    attachments,
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to generate questions');
            }

            const data = await res.json();
            if (data.questions && data.questions.length > 0) {
                setClarifyingQuestions(data.questions);
                setGenerationStep('questions');
            } else {
                // No questions needed, generate directly
                await handleConfirmAndGenerate();
            }
        } catch (err) {
            setGenerationError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleConfirmAndGenerate = async () => {
        setIsGenerating(true);
        setGenerationError(null);

        try {
            const res = await fetch('/api/generate-prompt', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    mode: 'generate',
                    title,
                    description,
                    parameters: promptParams,
                    attachments,
                    questions: clarifyingQuestions,
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to generate prompt');
            }

            const data = await res.json();
            setPrompt(data.prompt || '');
            setGenerationStep('idle');
            setClarifyingQuestions([]);
        } catch (err) {
            setGenerationError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleCopyPrompt = async () => {
        if (!prompt) return;
        try {
            await navigator.clipboard.writeText(prompt);
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
        } catch {
            // Fallback
            const textarea = document.createElement('textarea');
            textarea.value = prompt;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
        }
    };

    const PARAM_OPTIONS: { key: keyof PromptGenerationParams; label: string; desc: string }[] = [
        { key: 'planMode', label: 'Plan Mode', desc: 'Analizza prima di scrivere' },
        { key: 'taskBreakdown', label: 'Task Breakdown', desc: 'Step numerati' },
        { key: 'codeOrganization', label: 'Code Organization', desc: 'Codice pulito' },
        { key: 'testCoverage', label: 'Test Coverage', desc: 'Includi test' },
    ];

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

                    {/* Prompt Section */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1.5">
                            Prompt
                        </label>

                        {/* Parameter Toggles */}
                        <div className="grid grid-cols-2 gap-2 mb-3">
                            {PARAM_OPTIONS.map(({ key, label, desc }) => (
                                <button
                                    key={key}
                                    type="button"
                                    onClick={() => toggleParam(key)}
                                    className={`px-3 py-2 rounded-lg text-left text-sm transition-all border ${
                                        promptParams[key]
                                            ? 'bg-blue-900/30 border-blue-700/50 text-blue-300'
                                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-750'
                                    }`}
                                >
                                    <div className="font-medium">{label}</div>
                                    <div className="text-xs opacity-70">{desc}</div>
                                </button>
                            ))}
                        </div>

                        {/* Generate Button (visible when idle) */}
                        {generationStep === 'idle' && (
                            <button
                                type="button"
                                onClick={handleGeneratePrompt}
                                disabled={!title.trim() || isGenerating}
                                className="flex items-center gap-2 px-4 py-2 mb-3 bg-violet-600 hover:bg-violet-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-medium rounded-lg transition-colors text-sm"
                            >
                                {isGenerating ? (
                                    <Loader2 size={16} className="animate-spin" />
                                ) : (
                                    <Sparkles size={16} />
                                )}
                                {isGenerating ? 'Generating...' : 'Generate Prompt'}
                            </button>
                        )}

                        {/* Clarifying Questions Section */}
                        {generationStep === 'questions' && clarifyingQuestions.length > 0 && (
                            <div className="mb-3 p-4 bg-slate-800/50 border border-slate-700 rounded-lg space-y-3">
                                <div className="flex items-center gap-2 text-sm font-medium text-violet-300">
                                    <MessageCircleQuestion size={16} />
                                    Clarifying Questions
                                </div>
                                {clarifyingQuestions.map((q) => (
                                    <div key={q.id} className="space-y-1">
                                        <label className="block text-sm text-slate-300">
                                            {q.question}
                                        </label>
                                        <input
                                            type="text"
                                            value={q.answer}
                                            onChange={(e) => updateQuestionAnswer(q.id, e.target.value)}
                                            placeholder="Your answer..."
                                            className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm"
                                        />
                                    </div>
                                ))}
                                <div className="flex gap-2 pt-1">
                                    <button
                                        type="button"
                                        onClick={handleConfirmAndGenerate}
                                        disabled={isGenerating}
                                        className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-medium rounded-lg transition-colors text-sm"
                                    >
                                        {isGenerating ? (
                                            <Loader2 size={16} className="animate-spin" />
                                        ) : (
                                            <Sparkles size={16} />
                                        )}
                                        {isGenerating ? 'Generating...' : 'Confirm & Generate'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setClarifyingQuestions(prev => prev.map(q => ({ ...q, answer: '' })));
                                            handleConfirmAndGenerate();
                                        }}
                                        disabled={isGenerating}
                                        className="px-4 py-2 text-slate-400 hover:text-slate-200 text-sm transition-colors"
                                    >
                                        Skip
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Error Banner */}
                        {generationError && (
                            <div className="mb-3 px-4 py-2.5 bg-red-900/30 border border-red-700/50 rounded-lg text-red-300 text-sm">
                                {generationError}
                            </div>
                        )}

                        {/* Prompt Textarea with Copy Button */}
                        <div className="relative">
                            <textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="AI prompt or additional instructions..."
                                rows={6}
                                className="w-full px-4 py-2.5 pr-12 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-sm"
                            />
                            {prompt && (
                                <button
                                    type="button"
                                    onClick={handleCopyPrompt}
                                    className="absolute top-2 right-2 p-1.5 rounded-md bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
                                    title="Copy to clipboard"
                                >
                                    {copySuccess ? (
                                        <Check size={14} className="text-green-400" />
                                    ) : (
                                        <Copy size={14} />
                                    )}
                                </button>
                            )}
                        </div>
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
                                            <div
                                                className="w-10 h-10 rounded overflow-hidden flex-shrink-0 cursor-pointer hover:ring-2 hover:ring-blue-500"
                                                onClick={() => setLightboxImage(att)}
                                            >
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
                                            onClick={() => handleDownload(att)}
                                            className="p-1 text-slate-500 hover:text-blue-400 transition-colors"
                                            title="Download"
                                        >
                                            <Download size={14} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => removeAttachment(att.id)}
                                            className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                                            title="Remove"
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

            {/* Image Lightbox */}
            {lightboxImage && (
                <ImageLightbox
                    imageUrl={lightboxImage.url}
                    imageName={lightboxImage.name}
                    onClose={() => setLightboxImage(null)}
                />
            )}
        </div>
    );
}
