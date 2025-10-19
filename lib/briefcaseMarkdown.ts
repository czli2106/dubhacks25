const NEWLINE = '\n';

export type NormalizedReference = {
  title: string;
  url: string;
};

export type BriefcaseMetadata = {
  repoLabel?: string;
  repoUrl?: string;
  generatedAt: string;
  quarter: 'current' | 'next';
  filterSummary: string;
};

export type NormalizedRoadmapEpic = {
  title: string;
  outcome: string;
  priority: string;
  owners: string[];
  estimatedEffort: string;
  keyTasks: string[];
  successCriteria: string[];
  references: NormalizedReference[];
};

export type NormalizedFeatureSpec = {
  title: string;
  background: string;
  userValue: string;
  impact: string;
  complexity: string;
  owners: string[];
  technicalConsiderations: string[];
  successCriteria: string[];
  openQuestions: string[];
  references: NormalizedReference[];
};

export type NormalizedTechnicalDebtItem = {
  issue: string;
  impact: string;
  priority: string;
  owners: string[];
  recommendedActions: string[];
  effortEstimate: string;
  validationSteps: string[];
  references: NormalizedReference[];
};

export type NormalizedPerformanceItem = {
  area: string;
  problemStatement: string;
  recommendation: string;
  expectedImpact: string;
  owners: string[];
  effortEstimate: string;
  validationPlan: string[];
  references: NormalizedReference[];
};

export type NormalizedVulnerabilityItem = {
  title: string;
  description: string;
  severity: string;
  recommendation: string;
  owners: string[];
  effortEstimate: string;
  validationSteps: string[];
  references: NormalizedReference[];
};

export type ExecutionChecklistInput = {
  technicalDebt: NormalizedTechnicalDebtItem[];
  performance: NormalizedPerformanceItem[];
  vulnerabilities: NormalizedVulnerabilityItem[];
};

export function resolveQuarterLabel(quarter: 'current' | 'next', clock: Date = new Date()): string {
  const month = clock.getUTCMonth();
  const year = clock.getUTCFullYear();
  const currentQuarterIndex = Math.floor(month / 3) + 1;
  if (quarter === 'current') {
    return `Q${currentQuarterIndex} ${year}`;
  }
  const nextQuarterIndex = currentQuarterIndex === 4 ? 1 : currentQuarterIndex + 1;
  const nextQuarterYear = currentQuarterIndex === 4 ? year + 1 : year;
  return `Q${nextQuarterIndex} ${nextQuarterYear}`;
}

function formatMetadataLines(meta: BriefcaseMetadata, quarterLabel: string): string {
  const quarterDescriptor = meta.quarter === 'current' ? 'Current Quarter' : 'Next Quarter';
  const lines: string[] = [
    `_Generated: ${meta.generatedAt} (${quarterDescriptor} — ${quarterLabel})_`
  ];

  if (meta.repoLabel) {
    const repoLink = meta.repoUrl ? `[${meta.repoLabel}](${meta.repoUrl})` : meta.repoLabel;
    lines.push(`_Repository: ${repoLink}_`);
  }

  if (meta.filterSummary.trim().length > 0) {
    lines.push(`_Filters: ${meta.filterSummary}_`);
  }

  return lines.join(NEWLINE);
}

function renderReferenceList(references: NormalizedReference[]): string {
  if (!references.length) {
    return '_No verified references available._';
  }
  return references.map((ref) => `- [${ref.title}](${ref.url})`).join(NEWLINE);
}

export function renderRoadmapMarkdown(params: { epics: NormalizedRoadmapEpic[]; meta: BriefcaseMetadata }): string {
  const { epics, meta } = params;
  const quarterLabel = resolveQuarterLabel(meta.quarter);
  const header = [
    `# Quarterly Roadmap — ${quarterLabel}`,
    '',
    formatMetadataLines(meta, quarterLabel),
    '',
    'Each epic is scoped for a 6–12 week outcome with clear ownership and success criteria.',
    ''
  ].join(NEWLINE);

  if (!epics.length) {
    return `${header}_No roadmap epics were selected for this briefcase._`;
  }

  const body = epics
    .map((epic, index) => {
      const owners = epic.owners.length ? epic.owners.join(', ') : '_Unassigned_';
      const keyTasks = epic.keyTasks.length ? epic.keyTasks.map((task) => `  - ${task}`).join(NEWLINE) : '  - _To be detailed collaboratively_';
      const successCriteria = epic.successCriteria.length
        ? epic.successCriteria.map((criterion) => `  - ${criterion}`).join(NEWLINE)
        : '  - _Define success signals with maintainers_';
      const references = renderReferenceList(epic.references);

      return [
        `## ${index + 1}. ${epic.title}`,
        '',
        `**Desired Outcome:** ${epic.outcome}`,
        `**Priority:** ${epic.priority}`,
        `**Owners:** ${owners}`,
        `**Effort Estimate:** ${epic.estimatedEffort}`,
        '',
        '**Key Tasks**',
        keyTasks,
        '',
        '**Success Criteria**',
        successCriteria,
        '',
        '**References**',
        references,
        ''
      ].join(NEWLINE);
    })
    .join(NEWLINE);

  return `${header}${body}`;
}

export function renderFeatureSpecsMarkdown(params: { features: NormalizedFeatureSpec[]; meta: BriefcaseMetadata }): string {
  const { features, meta } = params;
  const quarterLabel = resolveQuarterLabel(meta.quarter);
  const header = [
    `# Feature Specs — ${quarterLabel}`,
    '',
    formatMetadataLines(meta, quarterLabel),
    '',
    'Convert each concept into an RFC or issue by expanding the background and technical notes below.',
    ''
  ].join(NEWLINE);

  if (!features.length) {
    return `${header}_No feature opportunities were selected for this briefcase._`;
  }

  const body = features
    .map((feature, index) => {
      const owners = feature.owners.length ? feature.owners.join(', ') : '_Unassigned_';
      const successCriteria = feature.successCriteria.length
        ? feature.successCriteria.map((criterion) => `  - ${criterion}`).join(NEWLINE)
        : '  - _Define measurable outcomes with stakeholders_';
      const technicalConsiderations = feature.technicalConsiderations.length
        ? feature.technicalConsiderations.map((consideration) => `  - ${consideration}`).join(NEWLINE)
        : '  - _Document implementation notes during refinement_';
      const openQuestions = feature.openQuestions.length
        ? feature.openQuestions.map((question) => `  - ${question}`).join(NEWLINE)
        : '  - _Capture open questions during planning_';
      const references = renderReferenceList(feature.references);

      return [
        `## Feature ${index + 1}: ${feature.title}`,
        '',
        `**Owners:** ${owners}`,
        `**Impact:** ${feature.impact}`,
        `**Complexity:** ${feature.complexity}`,
        '',
        '### Background',
        feature.background,
        '',
        '### User Value',
        feature.userValue,
        '',
        '### Technical Considerations',
        technicalConsiderations,
        '',
        '### Success Criteria',
        successCriteria,
        '',
        '### Open Questions',
        openQuestions,
        '',
        '### References',
        references,
        ''
      ].join(NEWLINE);
    })
    .join(NEWLINE);

  return `${header}${body}`;
}

export function renderExecutionChecklistMarkdown(params: { checklist: ExecutionChecklistInput; meta: BriefcaseMetadata }): string {
  const { checklist, meta } = params;
  const quarterLabel = resolveQuarterLabel(meta.quarter);
  const header = [
    `# Execution Checklist — ${quarterLabel}`,
    '',
    formatMetadataLines(meta, quarterLabel),
    '',
    'Track technical debt, performance, and vulnerability follow-ups with clear ownership and validation steps.',
    ''
  ].join(NEWLINE);

  const sections: string[] = [];

  if (checklist.technicalDebt.length) {
    const list = checklist.technicalDebt
      .map((item, index) => {
        const owners = item.owners.length ? item.owners.join(', ') : '_Unassigned_';
        const actions = item.recommendedActions.length
          ? item.recommendedActions.map((action) => `    - ${action}`).join(NEWLINE)
          : '    - _Refine remediation tasks with the maintainers_';
        const validation = item.validationSteps.length
          ? item.validationSteps.map((step) => `    - ${step}`).join(NEWLINE)
          : '    - _Decide how to validate completion_';
        const references = renderReferenceList(item.references);

        return [
          `### TD-${index + 1}: ${item.issue}`,
          '',
          `- **Impact:** ${item.impact}`,
          `- **Priority:** ${item.priority}`,
          `- **Owners:** ${owners}`,
          `- **Effort Estimate:** ${item.effortEstimate}`,
          '- **Recommended Actions:**',
          actions,
          '- **Validation Steps:**',
          validation,
          '- **References:**',
          references,
          ''
        ].join(NEWLINE);
      })
      .join(NEWLINE);

    sections.push('## Technical Debt Tasks', '', list);
  }

  if (checklist.performance.length) {
    const list = checklist.performance
      .map((item, index) => {
        const owners = item.owners.length ? item.owners.join(', ') : '_Unassigned_';
        const validation = item.validationPlan.length
          ? item.validationPlan.map((step) => `    - ${step}`).join(NEWLINE)
          : '    - _Define validation plan with the performance team_';
        const references = renderReferenceList(item.references);

        return [
          `### PERF-${index + 1}: ${item.area}`,
          '',
          `- **Problem Statement:** ${item.problemStatement}`,
          `- **Recommendation:** ${item.recommendation}`,
          `- **Expected Impact:** ${item.expectedImpact}`,
          `- **Owners:** ${owners}`,
          `- **Effort Estimate:** ${item.effortEstimate}`,
          '- **Validation Steps:**',
          validation,
          '- **References:**',
          references,
          ''
        ].join(NEWLINE);
      })
      .join(NEWLINE);

    sections.push('## Performance Follow-ups', '', list);
  }

  if (checklist.vulnerabilities.length) {
    const list = checklist.vulnerabilities
      .map((item, index) => {
        const owners = item.owners.length ? item.owners.join(', ') : '_Unassigned_';
        const validation = item.validationSteps.length
          ? item.validationSteps.map((step) => `    - ${step}`).join(NEWLINE)
          : '    - _Plan verification of the mitigation_';
        const references = renderReferenceList(item.references);

        return [
          `### SEC-${index + 1}: ${item.title}`,
          '',
          `- **Severity:** ${item.severity}`,
          `- **Description:** ${item.description}`,
          `- **Recommendation:** ${item.recommendation}`,
          `- **Owners:** ${owners}`,
          `- **Effort Estimate:** ${item.effortEstimate}`,
          '- **Validation Steps:**',
          validation,
          '- **References:**',
          references,
          ''
        ].join(NEWLINE);
      })
      .join(NEWLINE);

    sections.push('## Security & Reliability Risks', '', list);
  }

  if (!sections.length) {
    sections.push('_No execution follow-ups were selected for this briefcase._');
  }

  return [header, ...sections].join(NEWLINE);
}
