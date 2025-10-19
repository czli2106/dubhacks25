import { NextResponse } from 'next/server';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const PROMPTS_BASE_PATH = join(process.cwd(), 'prompts');

const SECTION_PROMPT_FILES = {
  roadmap: 'roadmap.txt',
  vulnerabilities: 'vulnerabilities.txt',
  teamAssignments: 'teamAssignments.txt',
  newFeatures: 'newFeatures.txt',
  technicalDebt: 'technicalDebt.txt',
  performance: 'performance.txt'
} as const;

type SectionKey = keyof typeof SECTION_PROMPT_FILES;

type SectionRequestBody = {
  repoUrl?: string;
  section?: SectionKey;
  analysisContext?: {
    repository?: {
      name: string;
      description: string | null;
      language: string | null;
      languages: Record<string, number>;
      stars: number;
      forks: number;
      openIssues: number;
      createdAt: string;
      updatedAt: string;
    };
    recentCommits?: Array<{
      message: string;
      author: string | null;
      date: string;
      sha: string;
      url?: string;
    }>;
    openIssues?: Array<{
      title: string;
      body: string | null;
      labels: string[];
      assignees: string[];
      url: string;
    }>;
    openPullRequests?: Array<{
      title: string;
      body: string | null;
      author: string | null;
      labels: string[];
      url: string;
    }>;
  };
};

type SectionResponse = {
  items: Array<{
    reference?: {
      title?: string;
      url?: string;
    } | null;
    [key: string]: unknown;
  }>;
  note?: string | null;
};

const SECTION_RESPONSE_SHAPES: Record<SectionKey, string> = {
  roadmap: `{
  "items": [
    {
      "title": string,
      "outcome": string,
      "priority": "High" | "Medium" | "Low",
      "owners": string[],
      "estimatedEffort": string,
      "keyTasks": string[],
      "successCriteria": string[],
      "references": Array<{
        "title": string,
        "url": string
      }>
    }
  ],
  "note": string | null
}`,
  vulnerabilities: `{
  "items": [
    {
      "title": string,
      "description": string,
      "severity": "Critical" | "High" | "Medium" | "Low",
      "recommendation": string,
      "owners": string[],
      "effortEstimate": string,
      "validationSteps": string[],
      "references": Array<{
        "title": string,
        "url": string
      }>
    }
  ],
  "note": string | null
}`,
  teamAssignments: `{
  "items": [
    {
      "task": string,
      "assignee": string,
      "rationale": string,
      "supportPlan": string | null,
      "reference": {
        "title": string,
        "url": string
      }
    }
  ],
  "note": string | null
}`,
  newFeatures: `{
  "items": [
    {
      "title": string,
      "background": string,
      "userValue": string,
      "impact": "High" | "Medium" | "Low",
      "complexity": "Simple" | "Medium" | "Complex",
      "owners": string[],
      "technicalConsiderations": string[],
      "successCriteria": string[],
      "openQuestions": string[],
      "references": Array<{
        "title": string,
        "url": string
      }>
    }
  ],
  "note": string | null
}`,
  technicalDebt: `{
  "items": [
    {
      "issue": string,
      "impact": string,
      "priority": "High" | "Medium" | "Low",
      "recommendedActions": string[],
      "effortEstimate": string,
      "owners": string[],
      "validationSteps": string[],
      "references": Array<{
        "title": string,
        "url": string
      }>
    }
  ],
  "note": string | null
}`,
  performance: `{
  "items": [
    {
      "area": string,
      "problemStatement": string,
      "recommendation": string,
      "expectedImpact": "High" | "Medium" | "Low",
      "owners": string[],
      "effortEstimate": string,
      "validationPlan": string[],
      "references": Array<{
        "title": string,
        "url": string
      }>
    }
  ],
  "note": string | null
}`
};

const OPENAI_ENDPOINT = 'https://api.openai.com/v1/responses';

function summariseContext(context: SectionRequestBody['analysisContext']) {
  if (!context) {
    return 'No additional repository context was provided.';
  }

  const parts: string[] = [];
  const repo = context.repository;
  if (repo) {
    parts.push(`Repository Data:\n- Name: ${repo.name}`);
    parts.push(`- Description: ${repo.description ?? 'No description provided'}`);
    parts.push(`- Primary Language: ${repo.language ?? 'Unknown'}`);
    parts.push(`- Languages: ${Object.entries(repo.languages || {})
      .map(([language, bytes]) => `${language} (${bytes})`)
      .join(', ') || 'Not available'}`);
    parts.push(`- Stars: ${repo.stars}`);
    parts.push(`- Forks: ${repo.forks}`);
    parts.push(`- Open Issues: ${repo.openIssues}`);
    parts.push(`- Created: ${repo.createdAt}`);
    parts.push(`- Last Updated: ${repo.updatedAt}`);
  }

  const recentCommits = context.recentCommits ?? [];
  if (recentCommits.length) {
    parts.push(`\nRecent Commits (${recentCommits.length}):`);
    for (const commit of recentCommits) {
      parts.push(`- ${commit.message.split('\n')[0]} (${commit.author ?? 'Unknown'}, ${commit.date}) [${commit.sha}]`);
    }
  }

  const issues = context.openIssues ?? [];
  if (issues.length) {
    parts.push(`\nOpen Issues (${issues.length}):`);
    for (const issue of issues) {
      parts.push(`- ${issue.title} (Labels: ${issue.labels.join(', ') || 'None'})`);
    }
  }

  const pullRequests = context.openPullRequests ?? [];
  if (pullRequests.length) {
    parts.push(`\nOpen Pull Requests (${pullRequests.length}):`);
    for (const pr of pullRequests) {
      parts.push(`- ${pr.title} (Author: ${pr.author ?? 'Unknown'})`);
    }
  }

  return parts.join('\n');
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SectionRequestBody;
    const { repoUrl, section, analysisContext } = body;

    if (!repoUrl) {
      return NextResponse.json(
        { error: 'Repository URL is required.' },
        { status: 400 }
      );
    }

    if (!section || !(section in SECTION_PROMPT_FILES)) {
      return NextResponse.json(
        { error: 'Valid section is required.' },
        { status: 400 }
      );
    }

    if (!analysisContext) {
      return NextResponse.json(
        { error: 'Analysis context is required.' },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured.' },
        { status: 500 }
      );
    }

    const contextSummary = summariseContext(analysisContext);
    const promptPath = SECTION_PROMPT_FILES[section];

    let promptInstructions: string;

    try {
      promptInstructions = await readFile(join(PROMPTS_BASE_PATH, promptPath), 'utf-8');
    } catch (readError) {
      console.error(`Failed to read prompt for section ${section}:`, readError);
      return NextResponse.json(
        { error: `Prompt template for ${section} not found.` },
        { status: 500 }
      );
    }
    const expectedShape = SECTION_RESPONSE_SHAPES[section];

    const referenceIndex = new Map<string, { title: string; url: string }>();
    const referenceIndexLower = new Map<string, { title: string; url: string }>();

    const registerReference = (title: string | null | undefined, url: string | null | undefined) => {
      const trimmed = title?.trim();
      if (!trimmed || !url) {
        return;
      }
      const entry = { title: trimmed, url };
      referenceIndex.set(trimmed, entry);
      referenceIndexLower.set(trimmed.toLowerCase(), entry);
    };

    analysisContext.recentCommits?.forEach((commit) => {
      const firstLine = commit.message?.split('\n')[0];
      registerReference(firstLine, commit.url);
    });

    analysisContext.openIssues?.forEach((issue) => {
      registerReference(issue.title, issue.url);
    });

    analysisContext.openPullRequests?.forEach((pr) => {
      registerReference(pr.title, pr.url);
    });

    const strictRules = `
STRICT RULES
- Base every insight on the commits, issues, or pull requests contained in the context summary. Never invent artifacts.
- Populate reference metadata with the exact GitHub title (issue, PR, or commit message first line) and its canonical URL.
- Use the \`references\` array when the schema expects multiple supporting artifacts (e.g., roadmap); use the single \`reference\` object for sections that expect only one.
- If you cannot justify an item with real evidence, omit it.
- When there are no valid recommendations, return "items": [] and set "note" to a short sentence explaining why no action is needed.
- Fields such as keyTasks, successCriteria, technicalConsiderations, openQuestions, recommendedActions, validationPlan, validationSteps, and owners must be arrays of strings (use [] when not applicable). Set supportPlan to null when no onboarding help is required.
- Owners must reference real commit authors, issue assignees, or maintainer roles found in the context summary. If none apply, use an empty array.
- Output JSON only. Do not include prose outside the JSON object.
- Match the following TypeScript shape exactly:
${expectedShape}`;

    const userMessage = [
      `You are the lead product strategist responsible for the ${section} chapter of the OpenCompass insight report for ${repoUrl}.`,
      'This report is read by core maintainers and external contributors, so every recommendation must cite real evidence.',
      'If the context does not prove an idea, omit it rather than fabricating links. Precision beats volume.',
      '',
      'SECTION OBJECTIVE:',
      promptInstructions.trim(),
      '',
      'REPOSITORY CONTEXT SNAPSHOT:',
      contextSummary,
      '',
      'DELIVERABLE REQUIREMENTS:',
      strictRules
    ].join('\n');

    const response = await fetch(OPENAI_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        input: [
          {
            role: 'system',
            content: 'You are an expert product strategist and technical lead for open-source projects. Always respond with valid JSON only.'
          },
          {
            role: 'user',
            content: userMessage
          }
        ],
        text: {
          format: {
            type: 'json_object'
          }
        },
        max_output_tokens: 1500,
        temperature: 0
      })
    });

    if (!response.ok) {
      const errorPayload = await response.text();
      console.error('OpenAI responses API error:', errorPayload);
      return NextResponse.json(
        { error: 'OpenAI API request failed.' },
        { status: 502 }
      );
    }

    const data = await response.json();
    const outputText = data.output_text ??
      data.output?.[0]?.content?.[0]?.text ??
      data.output?.[0]?.content?.map((item: any) => item?.text ?? '').join('').trim();

    if (!outputText) {
      return NextResponse.json(
        { error: 'Received empty response from OpenAI.' },
        { status: 502 }
      );
    }

    let parsed: SectionResponse;
    try {
      parsed = JSON.parse(outputText) as SectionResponse;
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', parseError, outputText);
      return NextResponse.json(
        { error: 'Failed to parse AI response.' },
        { status: 502 }
      );
    }

    const normalizeReference = (ref: any) => {
      if (!ref) {
        return null;
      }

      const rawTitle = typeof ref === 'string' ? ref : ref.title;
      const title = rawTitle?.trim();
      if (!title) {
        return null;
      }

      const canonical = referenceIndex.get(title) ?? referenceIndexLower.get(title.toLowerCase());
      if (canonical) {
        return { title: canonical.title, url: canonical.url };
      }

      const url = typeof ref === 'string' ? undefined : ref.url;
      if (!url) {
        return null;
      }

      return { title, url };
    };

    const ensureStringArray = (value: unknown): string[] => {
      if (!Array.isArray(value)) {
        if (typeof value === 'string' && value.trim().length > 0) {
          return [value.trim()];
        }
        return [];
      }
      return value
        .map((entry) => (typeof entry === 'string' ? entry.trim() : null))
        .filter((entry): entry is string => Boolean(entry && entry.length));
    };

    if (Array.isArray(parsed.items)) {
      parsed.items = parsed.items.map((item: any) => {
        if (item && typeof item === 'object') {
          if (Array.isArray(item.references)) {
            const normalizedRefs = item.references
              .map((ref: any) => normalizeReference(ref))
              .filter((ref): ref is { title: string; url: string } => Boolean(ref && ref.url));
            item.references = normalizedRefs;
          }

          if (item.reference) {
            const normalized = normalizeReference(item.reference);
            if (normalized) {
              item.reference = normalized;
            } else {
              delete item.reference;
            }
          }

          item.keyTasks = ensureStringArray(item.keyTasks);
          item.successCriteria = ensureStringArray(item.successCriteria);
          item.technicalConsiderations = ensureStringArray(item.technicalConsiderations);
          item.openQuestions = ensureStringArray(item.openQuestions);
          item.recommendedActions = ensureStringArray(item.recommendedActions);
          item.validationPlan = ensureStringArray(item.validationPlan);
          item.validationSteps = ensureStringArray(item.validationSteps);
          item.owners = ensureStringArray(item.owners);
        }
        return item;
      });
    }

    return NextResponse.json({
      section,
      items: parsed.items ?? [],
      note: typeof parsed.note === 'string' ? parsed.note : null
    });
  } catch (error) {
    console.error('Section analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze repository section.' },
      { status: 500 }
    );
  }
}
