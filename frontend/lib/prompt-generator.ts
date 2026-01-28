import { execFile } from 'child_process';
import { promisify } from 'util';
import { writeFile, unlink } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import Anthropic from '@anthropic-ai/sdk';
import { PromptGenerationParams, ClarifyingQuestion, Attachment } from './types';

const execFileAsync = promisify(execFile);

const MODEL = 'claude-sonnet-4-20250514';
const MAX_TOKENS = 2048;
const CLI_TIMEOUT = 30000;

// --- System Prompts ---

const QUESTIONS_SYSTEM_PROMPT = `You are a prompt architect specialized in Claude Code CLI prompts.

You are analyzing a task to determine if clarifying questions are needed before generating an optimized prompt.

Analyze the provided task title, description, and any visual attachments.
Generate 2-5 targeted clarifying questions ONLY if there are genuine ambiguities or missing critical information.

Focus your questions on:
- Ambiguous or contradictory requirements
- Missing technical context (framework, language, architecture)
- Unclear expected behavior or acceptance criteria
- Important edge cases the user may not have considered
- Files, directories, or modules that should be the focus

DO NOT ask obvious questions or questions whose answers are clearly implied by the description. If the task is sufficiently clear and specific, return an empty array.

Return ONLY a valid JSON array in this format:
[{"id": "q1", "question": "Your question here?"}, ...]

If no questions are needed, return: []`;

function buildGenerateSystemPrompt(params: PromptGenerationParams): string {
  let prompt = `You are a meta-prompt engineer specialized in creating prompts optimized for Claude Code CLI. Your job is to transform task descriptions into comprehensive, structured prompts that maximize Claude Code's problem-solving capabilities.

Apply these techniques:
1. **Structured Context**: Frame the task with explicit scope, relevant files/directories, and existing patterns to follow.
2. **Specificity Enhancement**: Convert vague descriptions into detailed, actionable instructions with clear acceptance criteria.
3. **Self-Verification**: Include steps for Claude Code to verify its own work (run tests, check types, review output).
4. **Constraint Definition**: Specify what NOT to do - preserve backward compatibility, don't over-engineer, maintain existing patterns.

If visual attachments were provided (screenshots, diagrams, mockups), incorporate the visual context into the prompt - describe what the image shows and how it relates to the task requirements.

If the user answered clarifying questions, integrate those answers naturally into the requirements.

Output format rules:
- Start with the most important action (implement, fix, refactor, add)
- Use markdown headers (##) to organize sections
- Keep the prompt under 400 words - concise prompts work better
- Include specific file paths when they can be inferred
- End with constraints or things to avoid
- Do NOT add preamble ("Here is your prompt:") or meta-commentary
- Output ONLY the ready-to-use prompt text`;

  if (params.planMode) {
    prompt += `

CRITICAL: The generated prompt MUST begin with an explicit instruction to enter plan mode: "Before writing any code, enter plan mode to analyze the requirements and outline your approach."

Structure the prompt to leverage the explore-plan-code-commit workflow:
1. First explore and understand the relevant code
2. Create a detailed implementation plan
3. Switch to normal mode and implement
4. Verify with tests and commit`;
  }

  if (params.taskBreakdown) {
    prompt += `

TASK BREAKDOWN: The generated prompt MUST organize the work into numbered sequential steps. Each step should:
- Start with a bold action verb (Investigate, Implement, Test, Verify)
- Have a clear, measurable deliverable
- Follow logical dependency order (analysis before implementation, implementation before testing)
- Typically include: investigate/explore, plan, implement, test, verify`;
  }

  if (params.codeOrganization) {
    prompt += `

CODE ORGANIZATION: The generated prompt MUST include a section on code quality expectations:
- Follow existing project conventions and patterns
- Keep functions single-purpose (SRP)
- Use meaningful, descriptive names
- Organize imports properly
- Separate concerns (logic vs. presentation, data vs. UI)
- Add comments only where logic is non-obvious
- Prefer composition over inheritance`;
  }

  if (params.testCoverage) {
    prompt += `

TEST COVERAGE: The generated prompt MUST include a dedicated "Testing Requirements" section that specifies:
- Write tests BEFORE implementing when possible (TDD approach)
- Include edge cases: empty inputs, null values, error states
- Test both positive (happy path) and negative (error) scenarios
- Run existing tests after changes to verify no regressions
- Write a test that reproduces the issue before fixing it (for bugs)`;
  }

  return prompt;
}

// --- User Message Builder ---

interface ContentBlock {
  type: 'text';
  text: string;
}

interface ImageContentBlock {
  type: 'image';
  source: {
    type: 'base64';
    media_type: string;
    data: string;
  };
}

type MessageContent = ContentBlock | ImageContentBlock;

export function buildUserMessage(
  title: string,
  description: string,
  attachments: Attachment[],
  questions?: ClarifyingQuestion[]
): MessageContent[] {
  const content: MessageContent[] = [];

  let text = `**Task Title:** ${title}`;
  if (description) {
    text += `\n\n**Description:** ${description}`;
  }

  const nonImageFiles = attachments.filter(a => a.type !== 'image');
  if (nonImageFiles.length > 0) {
    text += `\n\n**Attached files:** ${nonImageFiles.map(f => f.name).join(', ')}`;
  }

  if (questions && questions.length > 0) {
    const answered = questions.filter(q => q.answer.trim());
    if (answered.length > 0) {
      text += '\n\n**Clarification answers:**';
      answered.forEach(q => {
        text += `\n- Q: ${q.question}\n  A: ${q.answer}`;
      });
    }
  }

  content.push({ type: 'text', text });

  // Add image attachments as base64 content blocks
  const imageAttachments = attachments.filter(a => a.type === 'image');
  for (const img of imageAttachments) {
    const match = img.url.match(/^data:(image\/[^;]+);base64,(.+)$/);
    if (match) {
      content.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: match[1],
          data: match[2],
        },
      });
    }
  }

  return content;
}

// --- Claude Calling (Dual Auth) ---

async function callViaCli(system: string, content: MessageContent[]): Promise<string> {
  // Build a text-only prompt for CLI (images are described textually)
  let prompt = system + '\n\n---\n\n';
  for (const block of content) {
    if (block.type === 'text') {
      prompt += block.text;
    } else if (block.type === 'image') {
      prompt += '\n[Image attachment provided - see description above]';
    }
  }

  // Write prompt to temp file to avoid shell escaping issues
  const tmpFile = join(tmpdir(), `prompt-${Date.now()}.txt`);
  await writeFile(tmpFile, prompt, 'utf-8');

  try {
    // Try common CLI locations
    const cliPaths = [
      join(process.env.HOME || '~', '.claude', 'local', 'claude'),
      '/usr/local/bin/claude',
      'claude',
    ];

    let lastError: Error | null = null;
    for (const cliPath of cliPaths) {
      try {
        const { stdout } = await execFileAsync(cliPath, [
          '-p', prompt,
          '--output-format', 'text',
          '--model', MODEL,
        ], { timeout: CLI_TIMEOUT, maxBuffer: 1024 * 1024 });
        return stdout.trim();
      } catch (err) {
        lastError = err as Error;
        continue;
      }
    }
    throw lastError || new Error('Claude CLI not found');
  } finally {
    try { await unlink(tmpFile); } catch { /* ignore cleanup errors */ }
  }
}

async function callViaApi(
  system: string,
  content: MessageContent[],
  apiKey: string
): Promise<string> {
  const client = new Anthropic({ apiKey });

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system,
    messages: [{
      role: 'user',
      content: content as Anthropic.MessageCreateParams['messages'][0]['content'],
    }],
  });

  const textBlock = response.content.find(b => b.type === 'text');
  return textBlock ? textBlock.text : '';
}

export async function callClaude(system: string, content: MessageContent[]): Promise<string> {
  // 1. Try CLI proxy (uses Max credits)
  try {
    return await callViaCli(system, content);
  } catch {
    // 2. Fallback: API key
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (apiKey) {
      return await callViaApi(system, content, apiKey);
    }
    throw new Error('Claude CLI not available and no API key configured. Install Claude CLI or set ANTHROPIC_API_KEY in .env.local');
  }
}

// --- Public API ---

export async function generateQuestions(
  title: string,
  description: string,
  attachments: Attachment[]
): Promise<ClarifyingQuestion[]> {
  const content = buildUserMessage(title, description, attachments);
  const response = await callClaude(QUESTIONS_SYSTEM_PROMPT, content);

  try {
    // Extract JSON array from response (handle potential markdown wrapping)
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];
    const parsed = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((q: { id: string; question: string }) => ({
      id: q.id,
      question: q.question,
      answer: '',
    }));
  } catch {
    return [];
  }
}

export async function generatePrompt(
  title: string,
  description: string,
  attachments: Attachment[],
  params: PromptGenerationParams,
  questions?: ClarifyingQuestion[]
): Promise<string> {
  const system = buildGenerateSystemPrompt(params);
  const content = buildUserMessage(title, description, attachments, questions);
  return callClaude(system, content);
}
