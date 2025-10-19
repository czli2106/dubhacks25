import { NextResponse } from 'next/server';

interface ReferenceInfo {
  title?: string;
  url?: string;
}

interface RoadmapItem {
  title: string;
  outcome: string;
  priority: string;
  estimatedEffort?: string;
  keyTasks?: string[];
  references?: ReferenceInfo[];
  reference?: ReferenceInfo;
}

interface FeatureItem {
  title: string;
  userValue: string;
  impact: string;
  complexity: string;
  successCriteria?: string[];
  references?: ReferenceInfo[];
  reference?: ReferenceInfo;
}

interface AssignmentItem {
  task: string;
  assignee: string;
  rationale: string;
  supportPlan?: string | null;
  reference?: ReferenceInfo;
}

interface TechnicalDebtItem {
  issue: string;
  impact: string;
  priority: string;
  recommendedActions?: string[];
  effortEstimate?: string;
  reference?: ReferenceInfo;
}

interface PerformanceItem {
  area: string;
  problemStatement: string;
  recommendation: string;
  expectedImpact: string;
  validationPlan?: string[];
  reference?: ReferenceInfo;
}

interface VulnerabilityItem {
  title: string;
  description: string;
  severity: string;
  recommendation?: string;
  reference?: ReferenceInfo;
}

interface BriefcaseRequest {
  repoUrl?: string;
  owner?: string | null;
  repoName?: string | null;
  analysisContext?: {
    repository?: {
      name?: string;
      description?: string | null;
      language?: string | null;
      stars?: number;
      forks?: number;
      openIssues?: number;
    };
  };
  sections?: {
    roadmap?: RoadmapItem[];
    newFeatures?: FeatureItem[];
    teamAssignments?: AssignmentItem[];
    technicalDebt?: TechnicalDebtItem[];
    performance?: PerformanceItem[];
    vulnerabilities?: VulnerabilityItem[];
  };
}

interface BriefcaseFile {
  name: string;
  content: string;
}

const NEWLINE = '\n';

function formatReferencesMarkdown(references?: ReferenceInfo[], fallback?: ReferenceInfo): string {
  const refs: ReferenceInfo[] = [];
  if (Array.isArray(references) && references.length > 0) {
    references.forEach((ref) => {
      if (ref?.title && ref.url) {
        refs.push({ title: ref.title, url: ref.url });
      }
    });
  } else if (fallback?.title && fallback.url) {
    refs.push({ title: fallback.title, url: fallback.url });
  }

  if (refs.length === 0) {
    return '_No direct references provided._';
  }

  return refs.map((ref) => `- [${ref.title}](${ref.url})`).join(NEWLINE);
}

function generateRoadmapMarkdown(items: RoadmapItem[] = [], repoUrl?: string) {
  const header = [
    '# Quarterly Roadmap',
    '',
    `Repository: ${repoUrl ?? 'Unknown repository'}`,
    `Generated: ${new Date().toISOString()}`,
    '',
    'Each initiative is scoped for roughly 6–12 weeks and references multiple supporting artifacts where possible.',
    ''
  ].join(NEWLINE);

  if (items.length === 0) {
    return `${header}_No roadmap initiatives were recommended for this cycle._${NEWLINE}`;
  }

  const body = items
    .map((item, index) => {
      const references = formatReferencesMarkdown(item.references, item.reference);
      const keyTasks = Array.isArray(item.keyTasks) && item.keyTasks.length > 0
        ? item.keyTasks.map((task) => `  - ${task}`).join(NEWLINE)
        : '  - _TBD based on maintainer discussion_';

      return [
        `## ${index + 1}. ${item.title}`,
        '',
        `**Desired Outcome:** ${item.outcome}`,
        `**Priority:** ${item.priority}`,
        item.estimatedEffort ? `**Estimated Effort:** ${item.estimatedEffort}` : '**Estimated Effort:** _Not specified_',
        '',
        '**Key Tasks**',
        keyTasks,
        '',
        '**Supporting References**',
        references,
        ''
      ].join(NEWLINE);
    })
    .join(NEWLINE);

  return `${header}${body}`;
}

function generateFeatureSpecsMarkdown(items: FeatureItem[] = [], repoUrl?: string) {
  const header = [
    '# Feature Specification Deck',
    '',
    `Repository: ${repoUrl ?? 'Unknown repository'}`,
    `Generated: ${new Date().toISOString()}`,
    '',
    'Each feature below is ready to evolve into an RFC or issue for execution.',
    ''
  ].join(NEWLINE);

  if (items.length === 0) {
    return `${header}_No new feature specifications were recommended._${NEWLINE}`;
  }

  const body = items
    .map((item, index) => {
      const references = formatReferencesMarkdown(item.references, item.reference);
      const successCriteria = Array.isArray(item.successCriteria) && item.successCriteria.length > 0
        ? item.successCriteria.map((criterion) => `  - ${criterion}`).join(NEWLINE)
        : '  - _Define success metrics with maintainers_';

      return [
        `## Feature ${index + 1}: ${item.title}`,
        '',
        `**User Value:** ${item.userValue}`,
        `**Impact:** ${item.impact}`,
        `**Implementation Complexity:** ${item.complexity}`,
        '',
        '**Success Criteria**',
        successCriteria,
        '',
        '**Supporting References**',
        references,
        ''
      ].join(NEWLINE);
    })
    .join(NEWLINE);

  return `${header}${body}`;
}

function generateExecutionChecklistMarkdown(
  technicalDebt: TechnicalDebtItem[] = [],
  performance: PerformanceItem[] = [],
  vulnerabilities: VulnerabilityItem[] = [],
  repoUrl?: string
) {
  const header = [
    '# Execution Checklist',
    '',
    `Repository: ${repoUrl ?? 'Unknown repository'}`,
    `Generated: ${new Date().toISOString()}`,
    '',
    'This checklist combines technical debt, performance follow-ups, and critical vulnerabilities that require attention.',
    ''
  ].join(NEWLINE);

  const sections: string[] = [];

  if (technicalDebt.length > 0) {
    const list = technicalDebt
      .map((item, index) => {
        const references = formatReferencesMarkdown(undefined, item.reference);
        const actions = Array.isArray(item.recommendedActions) && item.recommendedActions.length > 0
          ? item.recommendedActions.map((action) => `    - ${action}`).join(NEWLINE)
          : '    - _Clarify remediation steps with maintainers_';

        return [
          `### TD-${index + 1}: ${item.issue}`,
          '',
          `- **Impact:** ${item.impact}`,
          `- **Priority:** ${item.priority}`,
          `- **Effort Estimate:** ${item.effortEstimate ?? '_Not specified_'}`,
          '- **Recommended Actions:**',
          actions,
          '- **Reference:**',
          references,
          ''
        ].join(NEWLINE);
      })
      .join(NEWLINE);

    sections.push('## Technical Debt Tasks', '', list);
  }

  if (performance.length > 0) {
    const list = performance
      .map((item, index) => {
        const references = formatReferencesMarkdown(undefined, item.reference);
        const validation = Array.isArray(item.validationPlan) && item.validationPlan.length > 0
          ? item.validationPlan.map((step) => `    - ${step}`).join(NEWLINE)
          : '    - _Define validation plan with maintainers_';

        return [
          `### PERF-${index + 1}: ${item.area}`,
          '',
          `- **Problem Statement:** ${item.problemStatement}`,
          `- **Recommendation:** ${item.recommendation}`,
          `- **Expected Impact:** ${item.expectedImpact}`,
          '- **Validation Plan:**',
          validation,
          '- **Reference:**',
          references,
          ''
        ].join(NEWLINE);
      })
      .join(NEWLINE);

    sections.push('## Performance Follow-ups', '', list);
  }

  if (vulnerabilities.length > 0) {
    const list = vulnerabilities
      .map((item, index) => {
        const references = formatReferencesMarkdown(undefined, item.reference);
        return [
          `### SEC-${index + 1}: ${item.title}`,
          '',
          `- **Severity:** ${item.severity}`,
          `- **Description:** ${item.description}`,
          item.recommendation ? `- **Recommendation:** ${item.recommendation}` : '- **Recommendation:** _Determine mitigation_' ,
          '- **Reference:**',
          references,
          ''
        ].join(NEWLINE);
      })
      .join(NEWLINE);

    sections.push('## Security & Reliability Risks', '', list);
  }

  if (sections.length === 0) {
    sections.push('_No execution-related follow-ups were identified._');
  }

  return [header, ...sections].join(NEWLINE);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as BriefcaseRequest;
    const { repoUrl, owner, repoName, analysisContext, sections } = body;

    if (!repoUrl || !sections) {
      return NextResponse.json(
        { error: 'Missing repository URL or sections data.' },
        { status: 400 }
      );
    }

    const roadmapMarkdown = generateRoadmapMarkdown(sections.roadmap, repoUrl);
    const featureMarkdown = generateFeatureSpecsMarkdown(sections.newFeatures, repoUrl);
    const executionMarkdown = generateExecutionChecklistMarkdown(
      sections.technicalDebt,
      sections.performance,
      sections.vulnerabilities,
      repoUrl
    );

    const summaryLines = [
      '# Maintainer Briefcase Summary',
      '',
      `Repository: ${repoUrl}`,
      owner && repoName ? `Maintainers: ${owner}/${repoName}` : null,
      analysisContext?.repository?.description ? `Description: ${analysisContext.repository.description}` : null,
      '',
      '- `quarterly-roadmap.md`: Quarter-scale initiatives with multiple supporting references.',
      '- `feature-specs.md`: Expanded specs for feature opportunities.',
      '- `execution-checklist.md`: Combined technical debt, performance, and security follow-ups.',
      '',
      '> Generated by OpenCompass – feel free to commit these files to `/docs/insights/YYYY-MM-DD/`.'
    ].filter(Boolean).join(NEWLINE);

    const dateSlug = new Date().toISOString().slice(0, 10);
    const basePath = `maintainer-briefcase/${dateSlug}`;

    const files: BriefcaseFile[] = [
      { name: `${basePath}/SUMMARY.md`, content: summaryLines + NEWLINE },
      { name: `${basePath}/quarterly-roadmap.md`, content: roadmapMarkdown + NEWLINE },
      { name: `${basePath}/feature-specs.md`, content: featureMarkdown + NEWLINE },
      { name: `${basePath}/execution-checklist.md`, content: executionMarkdown + NEWLINE }
    ];

    return NextResponse.json({
      files,
      generatedAt: new Date().toISOString(),
      briefcaseName: `maintainer-briefcase-${dateSlug}.zip`
    });
  } catch (error) {
    console.error('Briefcase generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate maintainer briefcase.' },
      { status: 500 }
    );
  }
}
