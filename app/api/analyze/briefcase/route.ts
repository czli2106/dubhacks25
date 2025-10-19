import { NextResponse } from 'next/server';

import {
  BriefcaseMetadata,
  NormalizedFeatureSpec,
  NormalizedPerformanceItem,
  NormalizedRoadmapEpic,
  NormalizedTechnicalDebtItem,
  NormalizedVulnerabilityItem,
  NormalizedReference,
  renderExecutionChecklistMarkdown,
  renderFeatureSpecsMarkdown,
  renderRoadmapMarkdown
} from '@/lib/briefcaseMarkdown';

type SectionKey =
  | 'roadmap'
  | 'vulnerabilities'
  | 'teamAssignments'
  | 'newFeatures'
  | 'technicalDebt'
  | 'performance';

type ReferenceInfo = {
  title?: string | null;
  url?: string | null;
};

type RoadmapItemPayload = {
  title?: string;
  outcome?: string;
  priority?: string;
  owners?: string[] | string;
  estimatedEffort?: string;
  keyTasks?: string[] | string;
  successCriteria?: string[] | string;
  references?: ReferenceInfo[];
  reference?: ReferenceInfo | null;
};

type FeatureItemPayload = {
  title?: string;
  background?: string;
  userValue?: string;
  impact?: string;
  complexity?: string;
  owners?: string[] | string;
  technicalConsiderations?: string[] | string;
  successCriteria?: string[] | string;
  openQuestions?: string[] | string;
  references?: ReferenceInfo[];
  reference?: ReferenceInfo | null;
};

type TechnicalDebtItemPayload = {
  issue?: string;
  impact?: string;
  priority?: string;
  owners?: string[] | string;
  recommendedActions?: string[] | string;
  effortEstimate?: string;
  validationSteps?: string[] | string;
  references?: ReferenceInfo[];
  reference?: ReferenceInfo | null;
};

type PerformanceItemPayload = {
  area?: string;
  problemStatement?: string;
  recommendation?: string;
  expectedImpact?: string;
  owners?: string[] | string;
  effortEstimate?: string;
  validationPlan?: string[] | string;
  references?: ReferenceInfo[];
  reference?: ReferenceInfo | null;
};

type VulnerabilityItemPayload = {
  title?: string;
  description?: string;
  severity?: string;
  recommendation?: string;
  owners?: string[] | string;
  effortEstimate?: string;
  validationSteps?: string[] | string;
  references?: ReferenceInfo[];
  reference?: ReferenceInfo | null;
};

type AssignmentItemPayload = {
  task?: string;
  assignee?: string;
  rationale?: string;
  supportPlan?: string | null;
  owners?: string[] | string;
  references?: ReferenceInfo[];
  reference?: ReferenceInfo | null;
};

type BriefcaseSectionsPayload = {
  roadmap?: RoadmapItemPayload[];
  newFeatures?: FeatureItemPayload[];
  technicalDebt?: TechnicalDebtItemPayload[];
  performance?: PerformanceItemPayload[];
  vulnerabilities?: VulnerabilityItemPayload[];
  teamAssignments?: AssignmentItemPayload[];
};

type BriefcaseSelections = Partial<Record<SectionKey, number[]>>;

type AnalysisContext = {
  repository?: {
    name?: string;
    description?: string | null;
    language?: string | null;
    stars?: number;
    forks?: number;
    openIssues?: number;
  } | null;
};

type BriefcaseRequestBody = {
  repoUrl?: string;
  repoOwner?: string | null;
  repoName?: string | null;
  quarter?: 'current' | 'next';
  analysisContext?: AnalysisContext;
  sections?: BriefcaseSectionsPayload;
  selections?: BriefcaseSelections;
};

type BriefcaseResponseFile = {
  name: string;
  content: string;
};

const SECTION_KEYS: SectionKey[] = [
  'roadmap',
  'newFeatures',
  'technicalDebt',
  'performance',
  'vulnerabilities',
  'teamAssignments'
];

const DEFAULT_STRING = 'Not specified';

const ensureString = (value: unknown, fallback = DEFAULT_STRING) =>
  typeof value === 'string' && value.trim().length > 0 ? value.trim() : fallback;

const ensureStringArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value
      .map((entry) => (typeof entry === 'string' ? entry.trim() : null))
      .filter((entry): entry is string => Boolean(entry && entry.length));
  }
  if (typeof value === 'string' && value.trim().length > 0) {
    return [value.trim()];
  }
  return [];
};

const normalizeReferences = (
  references?: unknown,
  fallback?: ReferenceInfo | null
): NormalizedReference[] => {
  const collected: NormalizedReference[] = [];

  const addReference = (candidate: ReferenceInfo | string | null | undefined) => {
    if (!candidate) {
      return;
    }
    if (typeof candidate === 'string') {
      return;
    }
    const title = typeof candidate.title === 'string' ? candidate.title.trim() : '';
    const url = typeof candidate.url === 'string' ? candidate.url.trim() : '';
    if (!title || !url) {
      return;
    }
    collected.push({ title, url });
  };

  if (Array.isArray(references)) {
    references.forEach((ref) => addReference(ref as ReferenceInfo));
  } else if (references) {
    addReference(references as ReferenceInfo);
  }

  if (!collected.length && fallback) {
    addReference(fallback);
  }

  const unique = new Map<string, NormalizedReference>();
  collected.forEach((ref) => {
    if (!unique.has(ref.url)) {
      unique.set(ref.url, ref);
    }
  });

  return Array.from(unique.values());
};

const filterBySelection = <T>(items: T[] | undefined, indices: number[] | undefined): T[] => {
  if (!Array.isArray(items) || !items.length) {
    return [];
  }
  if (!Array.isArray(indices) || indices.length === 0) {
    return items;
  }
  const allowed = new Set(indices.filter((index) => Number.isInteger(index) && index >= 0));
  return items.filter((_, index) => allowed.has(index));
};

const normalizeRoadmap = (item: RoadmapItemPayload): NormalizedRoadmapEpic => ({
  title: ensureString(item.title, 'Untitled Epic'),
  outcome: ensureString(item.outcome, 'Outcome to be defined'),
  priority: ensureString(item.priority, 'Unprioritized'),
  owners: ensureStringArray(item.owners),
  estimatedEffort: ensureString(item.estimatedEffort),
  keyTasks: ensureStringArray(item.keyTasks),
  successCriteria: ensureStringArray(item.successCriteria),
  references: normalizeReferences(item.references, item.reference)
});

const normalizeFeature = (item: FeatureItemPayload): NormalizedFeatureSpec => ({
  title: ensureString(item.title, 'Untitled Feature'),
  background: ensureString(item.background, 'Provide background context during refinement.'),
  userValue: ensureString(item.userValue, 'Clarify the user value with stakeholders.'),
  impact: ensureString(item.impact, 'Unscored'),
  complexity: ensureString(item.complexity, 'Unknown'),
  owners: ensureStringArray(item.owners),
  technicalConsiderations: ensureStringArray(item.technicalConsiderations),
  successCriteria: ensureStringArray(item.successCriteria),
  openQuestions: ensureStringArray(item.openQuestions),
  references: normalizeReferences(item.references, item.reference)
});

const normalizeTechnicalDebt = (item: TechnicalDebtItemPayload): NormalizedTechnicalDebtItem => ({
  issue: ensureString(item.issue, 'Technical debt item'),
  impact: ensureString(item.impact, 'Impact not documented'),
  priority: ensureString(item.priority, 'Unprioritized'),
  owners: ensureStringArray(item.owners),
  recommendedActions: ensureStringArray(item.recommendedActions),
  effortEstimate: ensureString(item.effortEstimate),
  validationSteps: ensureStringArray(item.validationSteps),
  references: normalizeReferences(item.references, item.reference)
});

const normalizePerformance = (item: PerformanceItemPayload): NormalizedPerformanceItem => ({
  area: ensureString(item.area, 'Performance area'),
  problemStatement: ensureString(item.problemStatement, 'Define the performance problem statement.'),
  recommendation: ensureString(item.recommendation, 'Recommendation pending detail'),
  expectedImpact: ensureString(item.expectedImpact, 'Unscored'),
  owners: ensureStringArray(item.owners),
  effortEstimate: ensureString(item.effortEstimate),
  validationPlan: ensureStringArray(item.validationPlan),
  references: normalizeReferences(item.references, item.reference)
});

const normalizeVulnerability = (item: VulnerabilityItemPayload): NormalizedVulnerabilityItem => ({
  title: ensureString(item.title, 'Security issue'),
  description: ensureString(item.description, 'Describe the vulnerability details.'),
  severity: ensureString(item.severity, 'Unscored'),
  recommendation: ensureString(item.recommendation, 'Outline a mitigation plan.'),
  owners: ensureStringArray(item.owners),
  effortEstimate: ensureString(item.effortEstimate),
  validationSteps: ensureStringArray(item.validationSteps),
  references: normalizeReferences(item.references, item.reference)
});

const appendTrailingNewline = (content: string) => (content.endsWith('\n') ? content : `${content}\n`);

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as BriefcaseRequestBody;
    const { repoUrl, repoOwner, repoName, analysisContext, sections, selections, quarter } = body;

    if (!repoUrl) {
      return NextResponse.json({ error: 'Repository URL is required.' }, { status: 400 });
    }

    if (!analysisContext || !analysisContext.repository) {
      return NextResponse.json({ error: 'Analysis context is required.' }, { status: 400 });
    }

    if (!sections) {
      return NextResponse.json({ error: 'Section data is required.' }, { status: 400 });
    }

    const selectedQuarter: 'current' | 'next' = quarter === 'next' ? 'next' : 'current';
    const generatedAt = new Date().toISOString();

    const roadmapItems = filterBySelection(sections.roadmap, selections?.roadmap).map(normalizeRoadmap);
    const featureItems = filterBySelection(sections.newFeatures, selections?.newFeatures).map(normalizeFeature);
    const technicalDebtItems = filterBySelection(sections.technicalDebt, selections?.technicalDebt).map(normalizeTechnicalDebt);
    const performanceItems = filterBySelection(sections.performance, selections?.performance).map(normalizePerformance);
    const vulnerabilityItems = filterBySelection(sections.vulnerabilities, selections?.vulnerabilities).map(normalizeVulnerability);
    const teamAssignmentItems = filterBySelection(sections.teamAssignments, selections?.teamAssignments);

    if (
      roadmapItems.length === 0 &&
      featureItems.length === 0 &&
      technicalDebtItems.length === 0 &&
      performanceItems.length === 0 &&
      vulnerabilityItems.length === 0
    ) {
      return NextResponse.json({ error: 'No briefcase content selected.' }, { status: 400 });
    }

    const counts = {
      roadmap: roadmapItems.length,
      newFeatures: featureItems.length,
      technicalDebt: technicalDebtItems.length,
      performance: performanceItems.length,
      vulnerabilities: vulnerabilityItems.length,
      teamAssignments: teamAssignmentItems.length
    };

    const filterSummaryParts: string[] = [`quarter=${selectedQuarter}`];
    const sectionSummary = SECTION_KEYS.map((key) => `${key}(${counts[key as keyof typeof counts] ?? 0})`).join(', ');
    filterSummaryParts.push(`sections=${sectionSummary}`);

    const repoLabel = repoOwner && repoName ? `${repoOwner}/${repoName}` : repoName ?? analysisContext.repository?.name ?? repoUrl;

    const meta: BriefcaseMetadata = {
      repoLabel,
      repoUrl,
      generatedAt,
      quarter: selectedQuarter,
      filterSummary: filterSummaryParts.join(' | ')
    };

    const roadmapMarkdown = appendTrailingNewline(renderRoadmapMarkdown({ epics: roadmapItems, meta }));
    const featureMarkdown = appendTrailingNewline(renderFeatureSpecsMarkdown({ features: featureItems, meta }));
    const executionMarkdown = appendTrailingNewline(
      renderExecutionChecklistMarkdown({ checklist: { technicalDebt: technicalDebtItems, performance: performanceItems, vulnerabilities: vulnerabilityItems }, meta })
    );

    const files: BriefcaseResponseFile[] = [
      { name: 'quarterly-roadmap.md', content: roadmapMarkdown },
      { name: 'feature-specs.md', content: featureMarkdown },
      { name: 'execution-checklist.md', content: executionMarkdown }
    ];

    return NextResponse.json({
      files,
      generatedAt,
      quarter: selectedQuarter,
      repo: { label: repoLabel, url: repoUrl },
      counts
    });
  } catch (error) {
    console.error('Briefcase generation error:', error);
    return NextResponse.json({ error: 'Failed to generate maintainer briefcase.' }, { status: 500 });
  }
}
