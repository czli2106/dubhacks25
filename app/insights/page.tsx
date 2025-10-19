// File: app/insights/page.tsx
"use client";

import { useEffect, useState, ReactNode } from 'react';
import { useSearchParams } from 'next/navigation';

type SectionKey =
  | 'roadmap'
  | 'vulnerabilities'
  | 'teamAssignments'
  | 'newFeatures'
  | 'technicalDebt'
  | 'performance';

type SectionStatus = 'idle' | 'loading' | 'success' | 'error';

type ReferenceInfo = {
  title?: string;
  url?: string;
};

type RoadmapItem = {
  title: string;
  outcome: string;
  priority: string;
  estimatedEffort?: string;
  keyTasks?: string[];
  references?: ReferenceInfo[];
  reference?: ReferenceInfo;
};

type VulnerabilityItem = {
  title: string;
  description: string;
  severity: string;
  recommendation?: string;
  reference?: ReferenceInfo;
};

type AssignmentItem = {
  task: string;
  assignee: string;
  rationale: string;
  supportPlan?: string | null;
  reference?: ReferenceInfo;
};

type FeatureItem = {
  title: string;
  userValue: string;
  impact: string;
  complexity: string;
  successCriteria?: string[];
  reference?: ReferenceInfo;
};

type TechnicalDebtItem = {
  issue: string;
  impact: string;
  priority: string;
  recommendedActions?: string[];
  effortEstimate?: string;
  reference?: ReferenceInfo;
};

type PerformanceItem = {
  area: string;
  problemStatement: string;
  recommendation: string;
  expectedImpact: string;
  validationPlan?: string[];
  reference?: ReferenceInfo;
};

type SectionData = {
  roadmap: RoadmapItem[];
  vulnerabilities: VulnerabilityItem[];
  teamAssignments: AssignmentItem[];
  newFeatures: FeatureItem[];
  technicalDebt: TechnicalDebtItem[];
  performance: PerformanceItem[];
};

type SectionErrors = Record<SectionKey, string | null>;

type SectionStatusMap = Record<SectionKey, SectionStatus>;

type SectionNotes = Record<SectionKey, string | null>;

type AnalysisContext = {
  repository: {
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
  recentCommits: Array<{
    message: string;
    author: string | null;
    date: string;
    sha: string;
  }>;
  openIssues: Array<{
    title: string;
    body: string | null;
    labels: string[];
    assignees: string[];
    url: string;
  }>;
  openPullRequests: Array<{
    title: string;
    body: string | null;
    author: string | null;
    labels: string[];
    url: string;
  }>;
};

const SECTION_ORDER: SectionKey[] = [
  'roadmap',
  'vulnerabilities',
  'teamAssignments',
  'newFeatures',
  'technicalDebt',
  'performance'
];

const INITIAL_SECTION_DATA: SectionData = {
  roadmap: [],
  vulnerabilities: [],
  teamAssignments: [],
  newFeatures: [],
  technicalDebt: [],
  performance: []
};

const INITIAL_STATUS: SectionStatusMap = {
  roadmap: 'idle',
  vulnerabilities: 'idle',
  teamAssignments: 'idle',
  newFeatures: 'idle',
  technicalDebt: 'idle',
  performance: 'idle'
};

const INITIAL_ERRORS: SectionErrors = {
  roadmap: null,
  vulnerabilities: null,
  teamAssignments: null,
  newFeatures: null,
  technicalDebt: null,
  performance: null
};

type StoredContextPayload = {
  commits?: unknown;
  analysisContext?: AnalysisContext;
  timestamp?: number;
};

type SectionRenderConfig = {
  title: string;
  description: string;
  iconBg: string;
  icon: JSX.Element;
};

const SECTION_RENDER_CONFIG: Record<SectionKey, SectionRenderConfig> = {
  roadmap: {
    title: 'Product Roadmap',
    description: 'Strategic recommendations based on code analysis',
    iconBg: 'bg-gradient-to-r from-purple-500 to-blue-500',
    icon: (
      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
        />
      </svg>
    )
  },
  vulnerabilities: {
    title: 'Security & Vulnerabilities',
    description: 'Critical issues that need immediate attention',
    iconBg: 'bg-gradient-to-r from-red-500 to-orange-500',
    icon: (
      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
        />
      </svg>
    )
  },
  teamAssignments: {
    title: 'Team Assignments',
    description: 'Recommended task distribution based on expertise',
    iconBg: 'bg-gradient-to-r from-green-500 to-teal-500',
    icon: (
      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
        />
      </svg>
    )
  },
  newFeatures: {
    title: 'Suggested New Features',
    description: 'High-impact additions for user value',
    iconBg: 'bg-gradient-to-r from-blue-500 to-cyan-500',
    icon: (
      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 10V3L4 14h7v7l9-11h-7z"
        />
      </svg>
    )
  },
  technicalDebt: {
    title: 'Technical Debt',
    description: 'Code quality issues that need attention',
    iconBg: 'bg-gradient-to-r from-orange-500 to-yellow-500',
    icon: (
      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 7V3m8 4V3m-9 8h10m-11 5h12a2 2 0 002-2V7a2 2 0 00-2-2H6a2 2 0 00-2 2v7a2 2 0 002 2z"
        />
      </svg>
    )
  },
  performance: {
    title: 'Performance Opportunities',
    description: 'Optimization pathways for the stack',
    iconBg: 'bg-gradient-to-r from-indigo-500 to-purple-500',
    icon: (
      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 3v18h18M7 13l3 3 7-7"
        />
      </svg>
    )
  }
};

export default function InsightsPage() {
  const searchParams = useSearchParams();
  const repoUrl = searchParams.get('repo');
  const owner = searchParams.get('owner');
  const repoName = searchParams.get('repoName');

  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; size: number; speed: number }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analysisContext, setAnalysisContext] = useState<AnalysisContext | null>(null);
const [sectionData, setSectionData] = useState<SectionData>(INITIAL_SECTION_DATA);
const [sectionStatus, setSectionStatus] = useState<SectionStatusMap>(INITIAL_STATUS);
const [sectionErrors, setSectionErrors] = useState<SectionErrors>(INITIAL_ERRORS);
const [sectionNotes, setSectionNotes] = useState<SectionNotes>({
  roadmap: null,
  vulnerabilities: null,
  teamAssignments: null,
  newFeatures: null,
  technicalDebt: null,
  performance: null
});
const [collapsedSections, setCollapsedSections] = useState<Record<SectionKey, boolean>>({
  roadmap: false,
  vulnerabilities: false,
  teamAssignments: false,
  newFeatures: false,
  technicalDebt: false,
  performance: false
});

  // Floating particles animation
  useEffect(() => {
    const generateParticles = () => {
      const newParticles = Array.from({ length: 20 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 4 + 1,
        speed: Math.random() * 0.5 + 0.1
      }));
      setParticles(newParticles);
    };

    generateParticles();

    const animateParticles = () => {
      setParticles((prev) =>
        prev.map((particle) => ({
          ...particle,
          y: (particle.y + particle.speed) % 100,
          x: particle.x + Math.sin(Date.now() * 0.001 + particle.id) * 0.1
        }))
      );
    };

    const interval = setInterval(animateParticles, 50);
    return () => clearInterval(interval);
  }, []);

  // Restore context and kick off per-section analysis
  useEffect(() => {
    if (!repoUrl || !owner || !repoName) {
      setError('Missing repository information');
      setIsLoading(false);
      return;
    }

    if (typeof window === 'undefined') {
      return;
    }

    setSectionStatus({
      roadmap: 'idle',
      vulnerabilities: 'idle',
      teamAssignments: 'idle',
      newFeatures: 'idle',
      technicalDebt: 'idle',
      performance: 'idle'
    });
    setSectionErrors({
      roadmap: null,
      vulnerabilities: null,
      teamAssignments: null,
      newFeatures: null,
      technicalDebt: null,
      performance: null
    });
    setSectionData({
      roadmap: [],
      vulnerabilities: [],
      teamAssignments: [],
      newFeatures: [],
      technicalDebt: [],
      performance: []
    });
    setSectionNotes({
      roadmap: null,
      vulnerabilities: null,
      teamAssignments: null,
      newFeatures: null,
      technicalDebt: null,
      performance: null
    });
    setCollapsedSections({
      roadmap: false,
      vulnerabilities: false,
      teamAssignments: false,
      newFeatures: false,
      technicalDebt: false,
      performance: false
    });

    const storageKey = `analysis-context:${repoUrl}`;
    const stored = sessionStorage.getItem(storageKey);

    if (!stored) {
      setError('No analysis session found. Please start a new analysis.');
      setIsLoading(false);
      return;
    }

    let payload: StoredContextPayload;
    try {
      payload = JSON.parse(stored) as StoredContextPayload;
    } catch (parseError) {
      console.error('Failed to parse stored analysis context:', parseError);
      setError('Failed to restore analysis session. Please try again.');
      setIsLoading(false);
      return;
    }

    sessionStorage.removeItem(storageKey);

    if (!payload.analysisContext) {
      setError('Stored analysis context was empty. Please restart the analysis.');
      setIsLoading(false);
      return;
    }

    setAnalysisContext(payload.analysisContext);
    setIsLoading(false);

    let isCancelled = false;

    const runSectionAnalysis = async () => {
      for (const section of SECTION_ORDER) {
        if (isCancelled) {
          break;
        }

        setSectionStatus((prev) => ({ ...prev, [section]: 'loading' }));
        setSectionErrors((prev) => ({ ...prev, [section]: null }));
        setSectionNotes((prev) => ({ ...prev, [section]: null }));

        try {
          const response = await fetch('/api/analyze/section', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              repoUrl,
              section,
              analysisContext: payload.analysisContext
            })
          });

          if (!response.ok) {
            const message = `Failed to fetch ${section} insights`;
            if (!isCancelled) {
              setSectionStatus((prev) => ({ ...prev, [section]: 'error' }));
              setSectionErrors((prev) => ({ ...prev, [section]: message }));
            }
            continue;
          }

          const data = await response.json();
          if (isCancelled) {
            break;
          }

          setSectionData((prev) => ({
            ...prev,
            [section]: Array.isArray(data.items) ? data.items : []
          }));
          setSectionStatus((prev) => ({ ...prev, [section]: 'success' }));
          setSectionNotes((prev) => ({
            ...prev,
            [section]: typeof data.note === 'string' && data.note.trim().length > 0 ? data.note.trim() : null
          }));
        } catch (err: unknown) {
          console.error(`Error fetching ${section}:`, err);
          if (!isCancelled) {
            setSectionStatus((prev) => ({ ...prev, [section]: 'error' }));
            setSectionErrors((prev) => ({
              ...prev,
              [section]: err instanceof Error ? err.message : 'Unexpected error while fetching insights.'
            }));
            setSectionNotes((prev) => ({ ...prev, [section]: null }));
          }
        }
      }
    };

    runSectionAnalysis();

    return () => {
      isCancelled = true;
    };
  }, [repoUrl, owner, repoName]);

  const toggleSection = (key: SectionKey) => {
    setCollapsedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-white mb-2">Restoring Analysis</h2>
          <p className="text-gray-400">Preparing insights for {owner}/{repoName}...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Error Loading Insights</h2>
          <p className="text-gray-400 mb-4">{error}</p>
          <button
            onClick={() => window.location.href = '/'}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl text-white hover:from-purple-700 hover:to-blue-700 transition-all duration-200"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Animated Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-float"></div>

        {/* Floating Particles */}
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="absolute w-1 h-1 bg-white/30 rounded-full animate-pulse"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              animationDelay: `${particle.id * 0.1}s`,
              animationDuration: `${2 + particle.speed}s`
            }}
          />
        ))}
      </div>

      <main className="relative z-10 px-4 py-8">
        <div className="max-w-screen-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-4 mb-4">
              <button
                onClick={() => window.location.href = '/'}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent">
                OpenCompass Insights
              </h1>
            </div>
            <div className="flex items-center justify-center space-x-2 text-gray-300">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              <a
                href={repoUrl || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-purple-300 transition-colors"
              >
                {owner}/{repoName}
              </a>
            </div>
          </div>

          {analysisContext?.repository && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-left">
                <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">Primary Language</p>
                <p className="text-lg font-semibold text-white">{analysisContext.repository.language ?? 'Unknown'}</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-left">
                <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">Stars</p>
                <p className="text-lg font-semibold text-white">{analysisContext.repository.stars.toLocaleString()}</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-left">
                <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">Open Issues</p>
                <p className="text-lg font-semibold text-white">{analysisContext.repository.openIssues.toLocaleString()}</p>
              </div>
            </div>
          )}

          <div className="space-y-8 md:space-y-0 md:columns-2 md:gap-8 mb-12">
            {SECTION_ORDER.map((key) => {
              const config = SECTION_RENDER_CONFIG[key];
              const collapsed = collapsedSections[key];
              return (
                <div
                  key={key}
                  className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 flex flex-col break-inside-avoid md:mb-8 shadow-sm transition-shadow hover:shadow-lg"
                >
                  <SectionHeader
                    config={config}
                    collapsed={collapsed}
                    onToggle={() => toggleSection(key)}
                  />
                  <div
                    className={`grid gap-4 overflow-hidden transition-all duration-300 ease-in-out ${
                      collapsed
                        ? 'max-h-0 opacity-0 -translate-y-2 pointer-events-none'
                        : 'max-h-[4000px] opacity-100 translate-y-0'
                    }`}
                  >
                    {renderSectionContent(key, sectionStatus, sectionData, sectionErrors, sectionNotes)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}

type SectionHeaderProps = {
  config: SectionRenderConfig;
  collapsed: boolean;
  onToggle: () => void;
};

function SectionHeader({ config, collapsed, onToggle }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center space-x-4">
        <div className={`w-12 h-12 ${config.iconBg} rounded-xl flex items-center justify-center`}>
          {config.icon}
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">{config.title}</h2>
          <p className="text-gray-400">{config.description}</p>
        </div>
      </div>
      <button
        onClick={onToggle}
        className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
        aria-expanded={!collapsed}
        aria-label={collapsed ? `Expand ${config.title}` : `Collapse ${config.title}`}
      >
        <svg
          className={`w-5 h-5 text-white transition-transform duration-200 ${collapsed ? '' : 'rotate-180'}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 9l7 7 7-7" />
        </svg>
      </button>
    </div>
  );
}

type RenderSectionContentProps = [
  SectionKey,
  SectionStatusMap,
  SectionData,
  SectionErrors,
  SectionNotes
];

function renderSectionContent(
  section: RenderSectionContentProps[0],
  statusMap: RenderSectionContentProps[1],
  dataMap: RenderSectionContentProps[2],
  errorMap: RenderSectionContentProps[3],
  noteMap: RenderSectionContentProps[4]
) {
  const status = statusMap[section];
  const error = errorMap[section];
  const items = dataMap[section] as unknown[];
  const note = noteMap[section];

  if (status === 'loading' || status === 'idle') {
    return (
      <div className="flex items-center space-x-3 text-gray-300">
        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
        <span>Generating {sectionLabel(section)} insights...</span>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-sm text-red-300">
        {error ?? 'Unable to load this section.'}
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <div className="p-4 bg-white/5 border border-white/10 rounded-xl text-sm text-gray-300">
        {note ?? `No ${sectionLabel(section)} recommendations at this time.`}
      </div>
    );
  }

  let content: ReactNode = null;

  switch (section) {
    case 'roadmap':
      content = (items as RoadmapItem[]).map((item, index) => (
        <div key={index} className="p-6 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all duration-200">
          <div className="flex items-start justify-between mb-3">
            <h3 className="text-lg font-semibold text-white">{item.title}</h3>
            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${badgeClass('priority', item.priority)}`}>
              {item.priority}
            </span>
          </div>
          <p className="text-gray-300 mb-3">{item.outcome}</p>
          {item.estimatedEffort && (
            <div className="flex items-center space-x-2 text-sm text-gray-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Estimated effort: {item.estimatedEffort}</span>
            </div>
          )}
          {item.keyTasks && item.keyTasks.length > 0 && (
            <div className="mt-3">
              <p className="text-sm text-gray-400 mb-1">Key tasks:</p>
              <ul className="list-disc list-inside text-sm text-gray-300 space-y-1">
                {item.keyTasks.map((task, idx) => (
                  <li key={idx}>{task}</li>
                ))}
              </ul>
            </div>
          )}
          {Array.isArray(item.references) && item.references.length > 0 ? (
            <div className="mt-3">
              <p className="text-sm text-gray-400 mb-1">Supporting references:</p>
              <ul className="space-y-1 text-sm">
                {item.references.map((ref, idx) => (
                  <li key={idx}>
                    <ReferenceAnchor reference={ref} />
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <ReferenceLink reference={item.reference} />
          )}
        </div>
      ));
      break;
    case 'vulnerabilities':
      content = (items as VulnerabilityItem[]).map((item, index) => (
        <div key={index} className="p-6 bg-red-500/10 border border-red-500/20 rounded-xl">
          <div className="flex items-start justify-between mb-3">
            <h3 className="text-lg font-semibold text-white">{item.title}</h3>
            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${badgeClass('severity', item.severity)}`}>
              {item.severity}
            </span>
          </div>
          <p className="text-gray-300 mb-3">{item.description}</p>
          {item.recommendation && (
            <div className="p-3 bg-white/5 rounded-lg">
              <p className="text-sm text-gray-300">
                <strong>Recommendation:</strong> {item.recommendation}
              </p>
            </div>
          )}
          <ReferenceLink reference={item.reference} />
        </div>
      ));
      break;
    case 'teamAssignments':
      content = (items as AssignmentItem[]).map((item, index) => (
        <div key={index} className="p-6 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all duration-200">
          <h3 className="text-lg font-semibold text-white mb-2">{item.task}</h3>
          <div className="flex items-center space-x-2 mb-3">
            <span className="text-gray-400">Suggested role:</span>
            <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-medium">
              {item.assignee}
            </span>
          </div>
          <p className="text-gray-300 mb-3">{item.rationale}</p>
          {item.supportPlan && (
            <div className="p-3 bg-white/5 rounded-lg text-sm text-gray-300">
              <strong>Support plan:</strong> {item.supportPlan}
            </div>
          )}
          <ReferenceLink reference={item.reference} />
        </div>
      ));
      break;
    case 'newFeatures':
      content = (items as FeatureItem[]).map((item, index) => (
        <div key={index} className="p-6 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all duration-200">
          <div className="flex items-start justify-between mb-3">
            <h3 className="text-lg font-semibold text-white">{item.title}</h3>
            <div className="flex space-x-2">
              <span className={`px-3 py-1 rounded-full text-xs font-medium border ${badgeClass('impact', item.impact)}`}>
                {item.impact} Impact
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-medium border ${badgeClass('complexity', item.complexity)}`}>
                {item.complexity}
              </span>
            </div>
          </div>
          <p className="text-gray-300 mb-3">{item.userValue}</p>
          {item.successCriteria && item.successCriteria.length > 0 && (
            <div className="mt-3">
              <p className="text-sm text-gray-400 mb-1">Success criteria:</p>
              <ul className="list-disc list-inside text-sm text-gray-300 space-y-1">
                {item.successCriteria.map((criterion, idx) => (
                  <li key={idx}>{criterion}</li>
                ))}
              </ul>
            </div>
          )}
          <ReferenceLink reference={item.reference} />
        </div>
      ));
      break;
    case 'technicalDebt':
      content = (items as TechnicalDebtItem[]).map((item, index) => (
        <div key={index} className="p-6 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all duration-200">
          <div className="flex items-start justify-between mb-3">
            <h3 className="text-lg font-semibold text-white">{item.issue}</h3>
            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${badgeClass('priority', item.priority)}`}>
              {item.priority}
            </span>
          </div>
          <p className="text-gray-300 mb-3">{item.impact}</p>
          {item.recommendedActions && item.recommendedActions.length > 0 && (
            <div className="mt-3">
              <p className="text-sm text-gray-400 mb-1">Recommended actions:</p>
              <ul className="list-disc list-inside text-sm text-gray-300 space-y-1">
                {item.recommendedActions.map((action, idx) => (
                  <li key={idx}>{action}</li>
                ))}
              </ul>
            </div>
          )}
          {item.effortEstimate && (
            <div className="p-3 bg-white/5 rounded-lg text-sm text-gray-300">
              <strong>Effort:</strong> {item.effortEstimate}
            </div>
          )}
          <ReferenceLink reference={item.reference} />
        </div>
      ));
      break;
    case 'performance':
      content = (items as PerformanceItem[]).map((item, index) => (
        <div key={index} className="p-6 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all duration-200">
          <div className="flex items-start justify-between mb-3">
            <h3 className="text-lg font-semibold text-white">{item.area}</h3>
            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${badgeClass('impact', item.expectedImpact)}`}>
              {item.expectedImpact} Impact
            </span>
          </div>
          <p className="text-gray-300 mb-3">{item.problemStatement}</p>
          <div className="p-3 bg-white/5 rounded-lg text-sm text-gray-300 mb-3">
            <strong>Recommendation:</strong> {item.recommendation}
          </div>
          {item.validationPlan && item.validationPlan.length > 0 && (
            <div className="mt-3">
              <p className="text-sm text-gray-400 mb-1">Validation plan:</p>
              <ul className="list-disc list-inside text-sm text-gray-300 space-y-1">
                {item.validationPlan.map((step, idx) => (
                  <li key={idx}>{step}</li>
                ))}
              </ul>
            </div>
          )}
          <ReferenceLink reference={item.reference} />
        </div>
      ));
      break;
    default:
      content = null;
  }

  return (
    <>
      {content}
      {note && (
        <div className="mt-3 p-3 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-300">
          {note}
        </div>
      )}
    </>
  );
}

function ReferenceAnchor({ reference, label }: { reference?: ReferenceInfo | null; label?: string }) {
  if (!reference?.url) {
    return null;
  }

  const displayLabel = label ?? (reference.title && reference.title.trim().length > 0 ? reference.title.trim() : 'View supporting context');

  return (
    <a
      href={reference.url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center space-x-2 text-sm text-purple-300 hover:text-purple-200 transition-colors"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
      </svg>
      <span>{displayLabel}</span>
    </a>
  );
}

function ReferenceLink({ reference, label }: { reference?: ReferenceInfo | null; label?: string }) {
  if (!reference?.url) {
    return null;
  }

  return (
    <div className="mt-3">
      <ReferenceAnchor reference={reference} label={label} />
    </div>
  );
}


function sectionLabel(section: SectionKey) {
  switch (section) {
    case 'roadmap':
      return 'roadmap initiatives';
    case 'vulnerabilities':
      return 'security findings';
    case 'teamAssignments':
      return 'assignment recommendations';
    case 'newFeatures':
      return 'feature suggestions';
    case 'technicalDebt':
      return 'technical debt items';
    case 'performance':
      return 'performance recommendations';
    default:
      return 'insight';
  }
}

function badgeClass(type: 'priority' | 'severity' | 'impact' | 'complexity', value: string) {
  const normalized = value.toLowerCase();

  if (type === 'severity') {
    if (normalized === 'critical' || normalized === 'high') {
      return 'bg-red-500/20 text-red-400 border-red-500/30';
    }
    if (normalized === 'medium') {
      return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    }
    return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
  }

  if (type === 'impact') {
    if (normalized === 'high') {
      return 'bg-green-500/20 text-green-400 border-green-500/30';
    }
    if (normalized === 'medium') {
      return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    }
    return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  }

  if (type === 'complexity') {
    if (normalized === 'simple' || normalized === 'low') {
      return 'bg-green-500/20 text-green-400 border-green-500/30';
    }
    if (normalized === 'medium') {
      return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    }
    return 'bg-red-500/20 text-red-400 border-red-500/30';
  }

  // Priority fallback
  if (normalized === 'high') {
    return 'bg-red-500/20 text-red-400 border-red-500/30';
  }
  if (normalized === 'medium') {
    return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
  }
  return 'bg-green-500/20 text-green-400 border-green-500/30';
}
