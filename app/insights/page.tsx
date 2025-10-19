// File: app/insights/page.tsx
"use client";

import { useEffect, useState, ReactNode } from 'react';
import { useSearchParams } from 'next/navigation';

declare global {
  interface Window {
    JSZip?: JSZipFactory;
  }
}

type JSZipInstance = {
  file: (name: string, data: string) => void;
  folder: (name: string) => JSZipInstance;
  generateAsync: (options: { type: 'blob' }) => Promise<Blob>;
};

type JSZipFactory = {
  new (): JSZipInstance;
};

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
  owners?: string[];
  estimatedEffort?: string;
  keyTasks?: string[];
  successCriteria?: string[];
  references?: ReferenceInfo[];
  reference?: ReferenceInfo;
};

type VulnerabilityItem = {
  title: string;
  description: string;
  severity: string;
  recommendation?: string;
  owners?: string[];
  effortEstimate?: string;
  validationSteps?: string[];
  references?: ReferenceInfo[];
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
  background?: string;
  userValue: string;
  impact: string;
  complexity: string;
  owners?: string[];
  successCriteria?: string[];
  technicalConsiderations?: string[];
  openQuestions?: string[];
  references?: ReferenceInfo[];
  reference?: ReferenceInfo;
};

type TechnicalDebtItem = {
  issue: string;
  impact: string;
  priority: string;
  recommendedActions?: string[];
  effortEstimate?: string;
  owners?: string[];
  validationSteps?: string[];
  references?: ReferenceInfo[];
  reference?: ReferenceInfo;
};

type PerformanceItem = {
  area: string;
  problemStatement: string;
  recommendation: string;
  expectedImpact: string;
  validationPlan?: string[];
  effortEstimate?: string;
  owners?: string[];
  references?: ReferenceInfo[];
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

const BRIEFCASE_SECTIONS: SectionKey[] = [
  'roadmap',
  'newFeatures',
  'technicalDebt',
  'performance',
  'vulnerabilities'
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
  const [isGeneratingBriefcase, setIsGeneratingBriefcase] = useState(false);
  const [briefcaseError, setBriefcaseError] = useState<string | null>(null);
  const [briefcaseSuccess, setBriefcaseSuccess] = useState<string | null>(null);
  const [briefcaseQuarter, setBriefcaseQuarter] = useState<'current' | 'next'>('current');
  const [briefcaseSelections, setBriefcaseSelections] = useState<Record<SectionKey, number[]>>({
    roadmap: [],
    vulnerabilities: [],
    teamAssignments: [],
    newFeatures: [],
    technicalDebt: [],
    performance: []
  });
  const [briefcaseFiles, setBriefcaseFiles] = useState<Array<{ name: string; content: string }>>([]);
  const [briefcaseMeta, setBriefcaseMeta] = useState<{ generatedAt: string; quarter: 'current' | 'next'; repoLabel?: string | null } | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [activePreviewFile, setActivePreviewFile] = useState<string | null>(null);

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

          const items = Array.isArray(data.items) ? data.items : [];
          setSectionData((prev) => ({
            ...prev,
            [section]: items
          }));
          setBriefcaseSelections((prev) => ({
            ...prev,
            [section]: items.map((_, index) => index)
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

  useEffect(() => {
    if (!repoUrl || typeof window === 'undefined') {
      return;
    }
    try {
      sessionStorage.setItem(
        `analysis-sections:${repoUrl}`,
        JSON.stringify({ sections: sectionData, updatedAt: Date.now() })
      );
    } catch (storageError) {
      console.error('Failed to cache section data:', storageError);
    }
  }, [repoUrl, sectionData]);

  const toggleSection = (key: SectionKey) => {
    setCollapsedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleBriefcaseItem = (section: SectionKey, index: number) => {
    if (!BRIEFCASE_SECTIONS.includes(section)) {
      return;
    }
    setBriefcaseSelections((prev) => {
      const current = new Set(prev[section] ?? []);
      if (current.has(index)) {
        current.delete(index);
      } else {
        current.add(index);
      }
      return {
        ...prev,
        [section]: Array.from(current).sort((a, b) => a - b)
      };
    });
  };

  const includeAllInSection = (section: SectionKey, total: number) => {
    setBriefcaseSelections((prev) => ({
      ...prev,
      [section]: Array.from({ length: total }, (_, index) => index)
    }));
  };

  const loadJSZip = () =>
    new Promise<JSZipFactory>((resolve, reject) => {
      if (typeof window === 'undefined') {
        reject(new Error('JSZip requires a browser environment'));
        return;
      }
      if (window.JSZip) {
        resolve(window.JSZip);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js';
      script.async = true;
      script.onload = () => {
        if (window.JSZip) {
          resolve(window.JSZip);
        } else {
          reject(new Error('Failed to load JSZip'));
        }
      };
      script.onerror = () => reject(new Error('Failed to load JSZip script'));
      document.body.appendChild(script);
    });

  const handleGenerateBriefcase = async () => {
    if (!repoUrl || !analysisContext) {
      setBriefcaseError('Missing repository context. Please re-run the analysis.');
      return;
    }

    const selectedCount = BRIEFCASE_SECTIONS.reduce((total, key) => {
      return total + (briefcaseSelections[key]?.length ?? 0);
    }, 0);

    if (selectedCount === 0) {
      setBriefcaseError('Select at least one insight to include in the briefcase.');
      return;
    }

    setIsGeneratingBriefcase(true);
    setBriefcaseError(null);
    setBriefcaseSuccess(null);
    setBriefcaseFiles([]);
    setActivePreviewFile(null);
    setIsPreviewOpen(false);
    setBriefcaseMeta(null);

    try {
      const response = await fetch('/api/analyze/briefcase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repoUrl,
          repoOwner: owner,
          repoName,
          quarter: briefcaseQuarter,
          analysisContext,
          sections: sectionData,
          selections: briefcaseSelections
        })
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || 'Failed to generate briefcase');
      }

      const payload = await response.json();
      const files = payload.files as Array<{ name: string; content: string }>;

      if (!Array.isArray(files) || files.length === 0) {
        throw new Error('Briefcase response did not include any files');
      }

      const fallbackRepoLabel = owner && repoName
        ? `${owner}/${repoName}`
        : analysisContext.repository?.name ?? repoUrl;

      setBriefcaseFiles(files);
      setActivePreviewFile(files[0]?.name ?? null);
      setBriefcaseMeta({
        generatedAt: typeof payload.generatedAt === 'string' ? payload.generatedAt : new Date().toISOString(),
        quarter: payload.quarter === 'next' ? 'next' : 'current',
        repoLabel: payload?.repo?.label ?? fallbackRepoLabel
      });
      setIsPreviewOpen(true);
      setBriefcaseSuccess('Maintainer briefcase ready. Preview the files below or download the zip.');
    } catch (err) {
      console.error('Briefcase generation failed:', err);
      setBriefcaseError(err instanceof Error ? err.message : 'Failed to generate briefcase');
    } finally {
      setIsGeneratingBriefcase(false);
    }
  };

  const handleDownloadBriefcaseZip = async () => {
    if (briefcaseFiles.length === 0) {
      setBriefcaseError('Generate the briefcase before downloading.');
      return;
    }

    try {
      const JSZipFactory = await loadJSZip();
      const zip = new JSZipFactory();
      const dateSlug = (briefcaseMeta?.generatedAt ?? new Date().toISOString()).slice(0, 10);
      const folderName = `maintainer-briefcase-${dateSlug}`;

      briefcaseFiles.forEach((file) => {
        if (file?.name && typeof file.content === 'string') {
          zip.file(`${folderName}/${file.name}`, file.content);
        }
      });

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `${folderName}.zip`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);

      setBriefcaseSuccess('Maintainer briefcase downloaded.');
    } catch (err) {
      console.error('Briefcase download failed:', err);
      setBriefcaseError(err instanceof Error ? err.message : 'Failed to download briefcase zip');
    }
  };

  const handleCopyMarkdown = async (file: { name: string; content: string }) => {
    if (!file?.content) {
      return;
    }
    if (!navigator?.clipboard) {
      setBriefcaseError('Clipboard access is not available in this browser.');
      return;
    }
    try {
      await navigator.clipboard.writeText(file.content);
      setBriefcaseSuccess(`${file.name} copied to clipboard.`);
    } catch (err) {
      console.error('Copy failed:', err);
      setBriefcaseError('Failed to copy markdown to clipboard.');
    }
  };

  const briefcaseSelectionCounts = BRIEFCASE_SECTIONS.map((key) => ({
    key,
    total: sectionData[key].length,
    selected: briefcaseSelections[key]?.length ?? 0
  }));

  const totalSelectedForBriefcase = briefcaseSelectionCounts.reduce((sum, entry) => sum + entry.selected, 0);

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

          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-12">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div>
                <h2 className="text-2xl font-semibold text-white mb-1">Maintainer Briefcase</h2>
                <p className="text-gray-300 text-sm">Compile roadmap, feature specs, and execution checklists into a ready-to-share folder.</p>
                <div className="mt-4 flex flex-wrap items-center gap-4">
                  <label className="flex items-center gap-2 text-sm text-gray-300">
                    Quarter
                    <select
                      value={briefcaseQuarter}
                      onChange={(event) => setBriefcaseQuarter(event.target.value === 'next' ? 'next' : 'current')}
                      className="bg-slate-900/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                    >
                      <option value="current">Current quarter</option>
                      <option value="next">Next quarter</option>
                    </select>
                  </label>
                  <span className="text-sm text-gray-400">
                    Selected insights: {totalSelectedForBriefcase}
                  </span>
                </div>
              </div>
              <button
                onClick={handleGenerateBriefcase}
                disabled={isGeneratingBriefcase}
                className={`px-6 py-3 rounded-xl text-white font-medium transition-all duration-200 ${
                  isGeneratingBriefcase
                    ? 'bg-white/10 cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700'
                }`}
              >
                {isGeneratingBriefcase ? 'Compiling docs…' : 'Generate Maintainer Briefcase'}
              </button>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              {briefcaseFiles.length > 0 && (
                <>
                  <button
                    onClick={handleDownloadBriefcaseZip}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm text-white transition-colors"
                  >
                    Download ZIP
                  </button>
                  <button
                    onClick={() => setIsPreviewOpen(true)}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm text-white transition-colors"
                  >
                    Preview Files
                  </button>
                </>
              )}
              {briefcaseError && (
                <div className="px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-300">
                  {briefcaseError}
                </div>
              )}
              {briefcaseSuccess && (
                <div className="px-3 py-2 bg-green-500/10 border border-green-500/30 rounded-lg text-sm text-green-300">
                  {briefcaseSuccess}
                </div>
              )}
            </div>

            <div className="mt-4 flex flex-wrap gap-3 text-xs text-gray-400">
              {briefcaseSelectionCounts.map(({ key, total, selected }) => {
                const title = SECTION_RENDER_CONFIG[key].title;
                const includeButton = total > 0 && selected < total;
                return (
                  <div key={key} className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-3 py-1">
                    <span>{title}: {selected}/{total}</span>
                    {includeButton && (
                      <button
                        type="button"
                        onClick={() => includeAllInSection(key, total)}
                        className="text-purple-300 hover:text-purple-200 transition-colors"
                      >
                        Include all
                      </button>
                    )}
                    {selected === 0 && total > 0 && (
                      <span className="text-red-300">Excluded</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

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
                    {renderSectionContent(
                      key,
                      sectionStatus,
                      sectionData,
                      sectionErrors,
                      sectionNotes,
                      briefcaseSelections,
                      toggleBriefcaseItem
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
      {isPreviewOpen && briefcaseFiles.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setIsPreviewOpen(false)}></div>
          <div className="relative z-10 w-full max-w-5xl bg-slate-900/95 border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <div>
                <h3 className="text-lg font-semibold text-white">Maintainer Briefcase Preview</h3>
                {briefcaseMeta && (
                  <p className="text-sm text-gray-400">
                    Quarter: {briefcaseMeta.quarter === 'current' ? 'Current' : 'Next'} • Generated {new Date(briefcaseMeta.generatedAt).toLocaleString()}
                  </p>
                )}
              </div>
              <button
                onClick={() => setIsPreviewOpen(false)}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
                aria-label="Close preview"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex flex-col md:flex-row flex-1 min-h-0">
              <div className="w-full md:w-60 border-b md:border-b-0 md:border-r border-white/10 bg-white/5 overflow-y-auto max-h-48 md:max-h-full">
                <ul className="divide-y divide-white/10">
                  {briefcaseFiles.map((file) => {
                    const isActive = file.name === activePreviewFile;
                    return (
                      <li key={file.name}>
                        <button
                          onClick={() => setActivePreviewFile(file.name)}
                          className={`w-full text-left px-4 py-3 text-sm transition-colors ${
                            isActive ? 'bg-purple-500/20 text-white' : 'text-gray-300 hover:bg-white/10'
                          }`}
                        >
                          {file.name}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
              <div className="flex-1 px-6 py-4 min-h-0">
                {(() => {
                  const active = briefcaseFiles.find((file) => file.name === activePreviewFile) ?? briefcaseFiles[0];
                  if (!active) {
                    return <p className="text-sm text-gray-300">Select a file to preview its markdown.</p>;
                  }
                  return (
                    <div className="flex flex-col h-full">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                        <div>
                          <p className="text-sm text-gray-400">{active.name}</p>
                          {briefcaseMeta?.repoLabel && (
                            <p className="text-xs text-gray-500">{briefcaseMeta.repoLabel}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleCopyMarkdown(active)}
                            className="px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm text-white transition-colors"
                          >
                            Copy Markdown
                          </button>
                          <button
                            onClick={handleDownloadBriefcaseZip}
                            className="px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm text-white transition-colors"
                          >
                            Download ZIP
                          </button>
                        </div>
                      </div>
                      <div className="flex-1 overflow-auto bg-black/40 border border-white/10 rounded-xl">
                        <pre className="p-4 text-sm text-gray-200 whitespace-pre-wrap font-mono">{active.content}</pre>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}
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
  SectionNotes,
  Record<SectionKey, number[]>,
  (section: SectionKey, index: number) => void
];

function renderSectionContent(
  section: RenderSectionContentProps[0],
  statusMap: RenderSectionContentProps[1],
  dataMap: RenderSectionContentProps[2],
  errorMap: RenderSectionContentProps[3],
  noteMap: RenderSectionContentProps[4],
  selectionMap: RenderSectionContentProps[5],
  toggleSelection: RenderSectionContentProps[6]
) {
  const status = statusMap[section];
  const error = errorMap[section];
  const items = dataMap[section] as unknown[];
  const note = noteMap[section];
  const selectedIndices = new Set(selectionMap[section] ?? []);
  const isBriefcaseSection = BRIEFCASE_SECTIONS.includes(section);

  const renderToggle = (index: number, selected: boolean) => {
    if (!isBriefcaseSection) {
      return null;
    }
    const title = selected ? 'Remove from Maintainer Briefcase' : 'Add to Maintainer Briefcase';
    return (
      <button
        type="button"
        onClick={() => toggleSelection(section, index)}
        className={`p-2 rounded-lg border transition-colors ${
          selected
            ? 'bg-purple-500/20 border-purple-400/60 text-purple-100'
            : 'bg-white/5 border-white/20 text-gray-300 hover:bg-white/10'
        }`}
        aria-pressed={selected}
        aria-label={title}
        title={title}
      >
        <BriefcaseIcon filled={selected} />
      </button>
    );
  };

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
      content = (items as RoadmapItem[]).map((item, index) => {
        const cardSelected = isBriefcaseSection && selectedIndices.has(index);
        const toggleControl = renderToggle(index, cardSelected);
        const cardClass = `p-6 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all duration-200 ${
          cardSelected ? 'border-purple-400/60 bg-purple-500/10 shadow-lg shadow-purple-900/30' : ''
        }`;
        return (
          <div key={index} className={cardClass}>
            {cardSelected && (
              <span className="inline-flex items-center gap-2 text-xs text-purple-100 bg-purple-500/20 border border-purple-400/40 px-3 py-1 rounded-full mb-3">
                <BriefcaseIcon filled />
                Included in Maintainer Briefcase
              </span>
            )}
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                <p className="text-sm text-gray-300">{item.outcome}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${badgeClass('priority', item.priority)}`}>
                  {item.priority}
                </span>
                {toggleControl}
              </div>
            </div>
            {item.owners && item.owners.length > 0 && (
              <div className="mb-3 text-sm text-gray-300">
                <strong className="text-gray-200">Owners:</strong> {item.owners.join(', ')}
              </div>
            )}
            <div className="grid gap-3">
              {item.keyTasks && item.keyTasks.length > 0 && (
                <div>
                  <p className="text-sm text-gray-400 mb-1">Key tasks:</p>
                  <ul className="list-disc list-inside text-sm text-gray-300 space-y-1">
                    {item.keyTasks.map((task, idx) => (
                      <li key={idx}>{task}</li>
                    ))}
                  </ul>
                </div>
              )}
              {item.successCriteria && item.successCriteria.length > 0 && (
                <div>
                  <p className="text-sm text-gray-400 mb-1">Success criteria:</p>
                  <ul className="list-disc list-inside text-sm text-gray-300 space-y-1">
                    {item.successCriteria.map((criterion, idx) => (
                      <li key={idx}>{criterion}</li>
                    ))}
                  </ul>
                </div>
              )}
              {item.estimatedEffort && (
                <div className="p-3 bg-white/5 rounded-lg text-sm text-gray-300">
                  <strong>Effort estimate:</strong> {item.estimatedEffort}
                </div>
              )}
            </div>
            <ReferencesBlock references={item.references} reference={item.reference} />
          </div>
        );
      });
      break;
    case 'vulnerabilities':
      content = (items as VulnerabilityItem[]).map((item, index) => {
        const cardSelected = isBriefcaseSection && selectedIndices.has(index);
        const toggleControl = renderToggle(index, cardSelected);
        const cardClass = `p-6 bg-red-500/10 border border-red-500/20 rounded-xl transition-all duration-200 ${
          cardSelected ? 'border-purple-400/60 bg-purple-500/15 shadow-lg shadow-purple-900/30' : ''
        }`;
        return (
          <div key={index} className={cardClass}>
            {cardSelected && (
              <span className="inline-flex items-center gap-2 text-xs text-purple-100 bg-purple-500/20 border border-purple-400/40 px-3 py-1 rounded-full mb-3">
                <BriefcaseIcon filled />
                Included in Maintainer Briefcase
              </span>
            )}
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                <p className="text-sm text-gray-300">{item.description}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${badgeClass('severity', item.severity)}`}>
                  {item.severity}
                </span>
                {toggleControl}
              </div>
            </div>
            {item.owners && item.owners.length > 0 && (
              <div className="mb-3 text-sm text-gray-300">
                <strong className="text-gray-200">Owners:</strong> {item.owners.join(', ')}
              </div>
            )}
            {item.recommendation && (
              <div className="p-3 bg-white/5 rounded-lg text-sm text-gray-300 mb-3">
                <strong>Recommendation:</strong> {item.recommendation}
              </div>
            )}
            <div className="grid gap-3">
              {item.effortEstimate && (
                <div className="p-3 bg-white/5 rounded-lg text-sm text-gray-300">
                  <strong>Effort estimate:</strong> {item.effortEstimate}
                </div>
              )}
              {item.validationSteps && item.validationSteps.length > 0 && (
                <div>
                  <p className="text-sm text-gray-400 mb-1">Validation steps:</p>
                  <ul className="list-disc list-inside text-sm text-gray-300 space-y-1">
                    {item.validationSteps.map((step, idx) => (
                      <li key={idx}>{step}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <ReferencesBlock references={item.references} reference={item.reference} />
          </div>
        );
      });
      break;
    case 'teamAssignments':
      content = (items as AssignmentItem[]).map((item, index) => {
        const cardClass = 'p-6 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all duration-200';
        return (
          <div key={index} className={cardClass}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-lg font-semibold text-white">{item.task}</h3>
                <div className="flex items-center space-x-2 text-sm text-gray-300">
                  <span className="text-gray-400">Suggested role:</span>
                  <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-medium">
                    {item.assignee}
                  </span>
                </div>
              </div>
            </div>
            <p className="text-gray-300 mb-3">{item.rationale}</p>
            {item.supportPlan && (
              <div className="p-3 bg-white/5 rounded-lg text-sm text-gray-300">
                <strong>Support plan:</strong> {item.supportPlan}
              </div>
            )}
            <ReferencesBlock references={undefined} reference={item.reference} />
          </div>
        );
      });
      break;
    case 'newFeatures':
      content = (items as FeatureItem[]).map((item, index) => {
        const cardSelected = isBriefcaseSection && selectedIndices.has(index);
        const toggleControl = renderToggle(index, cardSelected);
        const cardClass = `p-6 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all duration-200 ${
          cardSelected ? 'border-purple-400/60 bg-purple-500/10 shadow-lg shadow-purple-900/30' : ''
        }`;
        return (
          <div key={index} className={cardClass}>
            {cardSelected && (
              <span className="inline-flex items-center gap-2 text-xs text-purple-100 bg-purple-500/20 border border-purple-400/40 px-3 py-1 rounded-full mb-3">
                <BriefcaseIcon filled />
                Included in Maintainer Briefcase
              </span>
            )}
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-lg font-semibold text-white">{item.title}</h3>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="flex flex-wrap gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${badgeClass('impact', item.impact)}`}>
                    {item.impact} Impact
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${badgeClass('complexity', item.complexity)}`}>
                    {item.complexity}
                  </span>
                </div>
                {toggleControl}
              </div>
            </div>
            {item.owners && item.owners.length > 0 && (
              <div className="mb-3 text-sm text-gray-300">
                <strong className="text-gray-200">Owners:</strong> {item.owners.join(', ')}
              </div>
            )}
            {item.background && (
              <div className="mb-3">
                <p className="text-sm text-gray-400 mb-1">Background</p>
                <p className="text-sm text-gray-300">{item.background}</p>
              </div>
            )}
            <p className="text-gray-300 mb-3">{item.userValue}</p>
            <div className="grid gap-3">
              {item.technicalConsiderations && item.technicalConsiderations.length > 0 && (
                <div>
                  <p className="text-sm text-gray-400 mb-1">Technical considerations:</p>
                  <ul className="list-disc list-inside text-sm text-gray-300 space-y-1">
                    {item.technicalConsiderations.map((point, idx) => (
                      <li key={idx}>{point}</li>
                    ))}
                  </ul>
                </div>
              )}
              {item.successCriteria && item.successCriteria.length > 0 && (
                <div>
                  <p className="text-sm text-gray-400 mb-1">Success criteria:</p>
                  <ul className="list-disc list-inside text-sm text-gray-300 space-y-1">
                    {item.successCriteria.map((criterion, idx) => (
                      <li key={idx}>{criterion}</li>
                    ))}
                  </ul>
                </div>
              )}
              {item.openQuestions && item.openQuestions.length > 0 && (
                <div>
                  <p className="text-sm text-gray-400 mb-1">Open questions:</p>
                  <ul className="list-disc list-inside text-sm text-gray-300 space-y-1">
                    {item.openQuestions.map((question, idx) => (
                      <li key={idx}>{question}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <ReferencesBlock references={item.references} reference={item.reference} />
          </div>
        );
      });
      break;
    case 'technicalDebt':
      content = (items as TechnicalDebtItem[]).map((item, index) => {
        const cardSelected = isBriefcaseSection && selectedIndices.has(index);
        const toggleControl = renderToggle(index, cardSelected);
        const cardClass = `p-6 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all duration-200 ${
          cardSelected ? 'border-purple-400/60 bg-purple-500/10 shadow-lg shadow-purple-900/30' : ''
        }`;
        return (
          <div key={index} className={cardClass}>
            {cardSelected && (
              <span className="inline-flex items-center gap-2 text-xs text-purple-100 bg-purple-500/20 border border-purple-400/40 px-3 py-1 rounded-full mb-3">
                <BriefcaseIcon filled />
                Included in Maintainer Briefcase
              </span>
            )}
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-lg font-semibold text-white">{item.issue}</h3>
                <p className="text-sm text-gray-300">{item.impact}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${badgeClass('priority', item.priority)}`}>
                  {item.priority}
                </span>
                {toggleControl}
              </div>
            </div>
            {item.owners && item.owners.length > 0 && (
              <div className="mb-3 text-sm text-gray-300">
                <strong className="text-gray-200">Owners:</strong> {item.owners.join(', ')}
              </div>
            )}
            <div className="grid gap-3">
              {item.recommendedActions && item.recommendedActions.length > 0 && (
                <div>
                  <p className="text-sm text-gray-400 mb-1">Recommended actions:</p>
                  <ul className="list-disc list-inside text-sm text-gray-300 space-y-1">
                    {item.recommendedActions.map((action, idx) => (
                      <li key={idx}>{action}</li>
                    ))}
                  </ul>
                </div>
              )}
              {item.validationSteps && item.validationSteps.length > 0 && (
                <div>
                  <p className="text-sm text-gray-400 mb-1">Validation steps:</p>
                  <ul className="list-disc list-inside text-sm text-gray-300 space-y-1">
                    {item.validationSteps.map((step, idx) => (
                      <li key={idx}>{step}</li>
                    ))}
                  </ul>
                </div>
              )}
              {item.effortEstimate && (
                <div className="p-3 bg-white/5 rounded-lg text-sm text-gray-300">
                  <strong>Effort:</strong> {item.effortEstimate}
                </div>
              )}
            </div>
            <ReferencesBlock references={item.references} reference={item.reference} />
          </div>
        );
      });
      break;
    case 'performance':
      content = (items as PerformanceItem[]).map((item, index) => {
        const cardSelected = isBriefcaseSection && selectedIndices.has(index);
        const toggleControl = renderToggle(index, cardSelected);
        const cardClass = `p-6 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all duration-200 ${
          cardSelected ? 'border-purple-400/60 bg-purple-500/10 shadow-lg shadow-purple-900/30' : ''
        }`;
        return (
          <div key={index} className={cardClass}>
            {cardSelected && (
              <span className="inline-flex items-center gap-2 text-xs text-purple-100 bg-purple-500/20 border border-purple-400/40 px-3 py-1 rounded-full mb-3">
                <BriefcaseIcon filled />
                Included in Maintainer Briefcase
              </span>
            )}
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-lg font-semibold text-white">{item.area}</h3>
                <p className="text-sm text-gray-300">{item.problemStatement}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${badgeClass('impact', item.expectedImpact)}`}>
                  {item.expectedImpact} Impact
                </span>
                {toggleControl}
              </div>
            </div>
            {item.owners && item.owners.length > 0 && (
              <div className="mb-3 text-sm text-gray-300">
                <strong className="text-gray-200">Owners:</strong> {item.owners.join(', ')}
              </div>
            )}
            <div className="p-3 bg-white/5 rounded-lg text-sm text-gray-300 mb-3">
              <strong>Recommendation:</strong> {item.recommendation}
            </div>
            <div className="grid gap-3">
              {item.validationPlan && item.validationPlan.length > 0 && (
                <div>
                  <p className="text-sm text-gray-400 mb-1">Validation plan:</p>
                  <ul className="list-disc list-inside text-sm text-gray-300 space-y-1">
                    {item.validationPlan.map((step, idx) => (
                      <li key={idx}>{step}</li>
                    ))}
                  </ul>
                </div>
              )}
              {item.effortEstimate && (
                <div className="p-3 bg-white/5 rounded-lg text-sm text-gray-300">
                  <strong>Effort estimate:</strong> {item.effortEstimate}
                </div>
              )}
            </div>
            <ReferencesBlock references={item.references} reference={item.reference} />
          </div>
        );
      });
      break;
    default:
      content = null;
  }

  const showExclusionHint =
    isBriefcaseSection && items.length > 0 && selectedIndices.size === 0;

  return (
    <>
      {showExclusionHint && (
        <div className="mb-3 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-sm text-yellow-200">
          All items are currently excluded from the briefcase. Toggle any card to include it.
        </div>
      )}
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

function ReferencesBlock({
  references,
  reference,
  label
}: {
  references?: ReferenceInfo[];
  reference?: ReferenceInfo | null;
  label?: string;
}) {
  const entries: ReferenceInfo[] = [];

  const pushIfValid = (ref?: ReferenceInfo | null) => {
    if (ref?.url) {
      entries.push({ title: ref.title ?? '', url: ref.url });
    }
  };

  if (Array.isArray(references)) {
    references.forEach((ref) => pushIfValid(ref));
  }

  pushIfValid(reference);

  const uniqueByUrl = new Map<string, ReferenceInfo>();
  entries.forEach((ref) => {
    const url = ref.url.trim();
    if (!uniqueByUrl.has(url)) {
      uniqueByUrl.set(url, { title: ref.title, url });
    }
  });

  const uniqueEntries = Array.from(uniqueByUrl.values());

  if (uniqueEntries.length === 0) {
    return null;
  }

  const heading = label ?? 'References';

  return (
    <div className="mt-3">
      <p className="text-sm text-gray-400 mb-1">{heading}</p>
      <ul className="list-disc list-inside text-sm text-purple-200 space-y-1">
        {uniqueEntries.map((ref, index) => (
          <li key={ref.url ?? index}>
            <ReferenceAnchor reference={ref} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function BriefcaseIcon({ filled = false }: { filled?: boolean }) {
  return (
    <svg
      className="w-4 h-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {filled && (
        <path
          d="M4.8 7.2h14.4A1.8 1.8 0 0 1 21 9v7.2a2.4 2.4 0 0 1-2.4 2.4H5.4A2.4 2.4 0 0 1 3 16.2V9c0-.994.806-1.8 1.8-1.8z"
          fill="currentColor"
          opacity={0.28}
        />
      )}
      <path d="M8.4 7.2V5.7A1.2 1.2 0 0 1 9.6 4.5h4.8a1.2 1.2 0 0 1 1.2 1.2v1.5" />
      <path d="M4.8 7.2h14.4A1.8 1.8 0 0 1 21 9v7.2a2.4 2.4 0 0 1-2.4 2.4H5.4A2.4 2.4 0 0 1 3 16.2V9c0-.994.806-1.8 1.8-1.8z" />
      <path d="M9.6 12.6h4.8" />
    </svg>
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
