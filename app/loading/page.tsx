// File: app/loading/page.tsx
"use client";

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

type Commit = {
  sha: string;
  commit: {
    author: {
      name: string | null;
      date: string;
    };
    message: string;
  };
  html_url: string;
};

function LoadingContent() {
  const searchParams = useSearchParams();
  const [commits, setCommits] = useState<Commit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [particles, setParticles] = useState<Array<{id: number, x: number, y: number, size: number, speed: number}>>([]);

  const repoUrl = searchParams.get('repo');
  const owner = searchParams.get('owner');
  const repoName = searchParams.get('repoName');

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
      setParticles(prev => prev.map(particle => ({
        ...particle,
        y: (particle.y + particle.speed) % 100,
        x: particle.x + Math.sin(Date.now() * 0.001 + particle.id) * 0.1
      })));
    };

    const interval = setInterval(animateParticles, 50);
    return () => clearInterval(interval);
  }, []);

  // Load data and start analysis
  useEffect(() => {
    if (!repoUrl || !owner || !repoName) {
      setError('Missing repository information');
      setIsLoading(false);
      return;
    }

    const loadDataAndAnalyze = async () => {
      try {
        const contextResponse = await fetch('/api/analyze/context', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            repoUrl
          }),
        });

        if (!contextResponse.ok) {
          throw new Error('Failed to fetch repository context');
        }

        const contextData = await contextResponse.json();
        setCommits(contextData.commits);
        setIsLoading(false);
        setIsRedirecting(true);

        try {
          const storageKey = `analysis-context:${repoUrl}`;
          sessionStorage.setItem(storageKey, JSON.stringify({
            commits: contextData.commits,
            analysisContext: contextData.analysisContext,
            timestamp: Date.now()
          }));
        } catch (storageError) {
          console.warn('Unable to persist analysis context to sessionStorage:', storageError);
        }

        const params = new URLSearchParams({
          repo: repoUrl,
          owner: owner,
          repoName: repoName
        });

        window.location.href = `/insights?${params.toString()}`;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to analyze repository.';
        setError(message);
        setIsLoading(false);
        setIsRedirecting(false);
      }
    };

    loadDataAndAnalyze();
  }, [repoUrl, owner, repoName]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCommitType = (message: string) => {
    const firstLine = message.split('\n')[0].toLowerCase();
    if (firstLine.startsWith('feat')) return { type: 'feature', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' };
    if (firstLine.startsWith('fix')) return { type: 'fix', color: 'bg-red-500/20 text-red-400 border-red-500/30' };
    if (firstLine.startsWith('docs')) return { type: 'docs', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' };
    if (firstLine.startsWith('style')) return { type: 'style', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' };
    if (firstLine.startsWith('refactor')) return { type: 'refactor', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' };
    if (firstLine.startsWith('test')) return { type: 'test', color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' };
    return { type: 'other', color: 'bg-gray-500/20 text-gray-400 border-gray-500/30' };
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Error Loading Repository</h2>
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
        <div className="max-w-6xl mx-auto">
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
                Analyzing Repository
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

          {/* Loading Status */}
          <div className="text-center mb-8">
            {isLoading ? (
              <div className="inline-flex items-center space-x-3">
                <div className="w-8 h-8 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
                <span className="text-lg text-gray-300">Fetching repository data...</span>
              </div>
            ) : isRedirecting ? (
              <div className="inline-flex items-center space-x-3">
                <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
                <span className="text-lg text-gray-300">Preparing insights...</span>
              </div>
            ) : null}
          </div>

          {/* Recent Commits Display */}
          {commits.length > 0 && (
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Recent Commits</h2>
                  <p className="text-gray-400">Latest development activity while AI analyzes</p>
                </div>
              </div>
              <div className="grid gap-4 max-h-96 overflow-y-auto">
                {commits.slice(0, 50).map((commit) => {
                  const commitType = getCommitType(commit.commit.message);
                  return (
                    <div key={commit.sha} className="p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all duration-200">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-white font-medium mb-1 line-clamp-2">
                            {commit.commit.message.split('\n')[0]}
                          </h3>
                          <div className="flex items-center space-x-3 text-sm text-gray-400">
                            <span className="flex items-center space-x-1">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                              </svg>
                              <span>{commit.commit.author?.name || 'Unknown'}</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                              </svg>
                              <span>{formatDate(commit.commit.author.date)}</span>
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${commitType.color}`}>
                            {commitType.type}
                          </span>
                          <a
                            href={commit.html_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 bg-white/10 hover:bg-white/20 rounded transition-colors"
                            title="View on GitHub"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500 font-mono">
                          {commit.sha.substring(0, 7)}
                        </span>
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function LoadingPage() {
  return (
    <Suspense fallback={null}>
      <LoadingContent />
    </Suspense>
  );
}
