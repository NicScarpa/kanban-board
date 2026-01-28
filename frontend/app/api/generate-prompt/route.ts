import { NextRequest, NextResponse } from 'next/server';
import { generateQuestions, generatePrompt } from '@/lib/prompt-generator';
import { PromptGenerationParams, ClarifyingQuestion, Attachment } from '@/lib/types';

interface RequestBody {
  mode: 'questions' | 'generate';
  title: string;
  description: string;
  parameters: PromptGenerationParams;
  attachments: Attachment[];
  questions?: ClarifyingQuestion[];
}

export async function POST(request: NextRequest) {
  try {
    const body: RequestBody = await request.json();
    const { mode, title, description, parameters, attachments, questions } = body;

    if (!title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    if (mode === 'questions') {
      const result = await generateQuestions(title, description, attachments);
      return NextResponse.json({ questions: result });
    }

    if (mode === 'generate') {
      const result = await generatePrompt(title, description, attachments, parameters, questions);
      return NextResponse.json({ prompt: result });
    }

    return NextResponse.json({ error: 'Invalid mode' }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to generate prompt';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
