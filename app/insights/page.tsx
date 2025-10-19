// File: app/insights/page.tsx
"use client";

import { useState, useEffect } from 'react';
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

export default function InsightsPage() {
  const searchParams = useSearchParams();
  const [insights, setInsights] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [particles, setParticles] = useState<Array<{id: number, x: number, y: number, size: number, speed: number}>>([]);

  const repoUrl = searchParams.get('repo');
  const owner = searchParams.get('owner');
  const repoName = searchParams.get('repoName');
  const insightsParam = searchParams.get('insights');

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

  // Load insights data from URL params
  useEffect(() => {
    if (!repoUrl || !owner || !repoName) {
      setError('Missing repository information');
      setIsLoading(false);
      return;
    }

    if (insightsParam) {
      try {
        const parsedInsights = JSON.parse(insightsParam);
        setInsights(parsedInsights);
      } catch (err) {
        setError('Failed to parse insights data');
      }
    } else {
      setError('No insights data found');
    }
    
    setIsLoading(false);
  }, [repoUrl, owner, repoName, insightsParam]);

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-white mb-2">Loading Insights</h2>
          <p className="text-gray-400">Analyzing repository data...</p>
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
                AI Product Insights
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

          {/* Insights Grid */}
          {insights && (
            <div className="grid gap-8 mb-12">
              {/* Roadmap Section */}
              {insights.roadmap && (
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
                  <div className="flex items-center space-x-4 mb-6">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">Product Roadmap</h2>
                      <p className="text-gray-400">Strategic recommendations based on code analysis</p>
                    </div>
                  </div>
                  <div className="grid gap-4">
                    {insights.roadmap.map((item: any, index: number) => (
                      <div key={index} className="p-6 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all duration-200">
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${item.priority === 'High' ? 'bg-red-500/20 text-red-400 border-red-500/30' : item.priority === 'Medium' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' : 'bg-green-500/20 text-green-400 border-green-500/30'}`}>
                            {item.priority}
                          </span>
                        </div>
                        <p className="text-gray-300 mb-3">{item.description}</p>
                        {item.estimatedEffort && (
                          <div className="flex items-center space-x-2 text-sm text-gray-400">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>Estimated effort: {item.estimatedEffort}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Vulnerabilities Section */}
              {insights.vulnerabilities && (
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
                  <div className="flex items-center space-x-4 mb-6">
                    <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-orange-500 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">Security & Vulnerabilities</h2>
                      <p className="text-gray-400">Critical issues that need immediate attention</p>
                    </div>
                  </div>
                  <div className="grid gap-4">
                    {insights.vulnerabilities.map((vuln: any, index: number) => (
                      <div key={index} className="p-6 bg-red-500/10 border border-red-500/20 rounded-xl">
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="text-lg font-semibold text-white">{vuln.title}</h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${vuln.severity === 'Critical' ? 'bg-red-500/20 text-red-400 border-red-500/30' : vuln.severity === 'High' ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'}`}>
                            {vuln.severity}
                          </span>
                        </div>
                        <p className="text-gray-300 mb-3">{vuln.description}</p>
                        {vuln.recommendation && (
                          <div className="p-3 bg-white/5 rounded-lg">
                            <p className="text-sm text-gray-300"><strong>Recommendation:</strong> {vuln.recommendation}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Team Assignments Section */}
              {insights.teamAssignments && (
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
                  <div className="flex items-center space-x-4 mb-6">
                    <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-teal-500 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">Team Assignments</h2>
                      <p className="text-gray-400">Recommended task distribution based on expertise</p>
                    </div>
                  </div>
                  <div className="grid gap-4">
                    {insights.teamAssignments.map((assignment: any, index: number) => (
                      <div key={index} className="p-6 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all duration-200">
                        <h3 className="text-lg font-semibold text-white mb-2">{assignment.task}</h3>
                        <div className="flex items-center space-x-2 mb-3">
                          <span className="text-gray-400">Assigned to:</span>
                          <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-medium">
                            {assignment.assignee}
                          </span>
                        </div>
                        <p className="text-gray-300">{assignment.reason}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* New Features Section */}
              {insights.newFeatures && (
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
                  <div className="flex items-center space-x-4 mb-6">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">Suggested New Features</h2>
                      <p className="text-gray-400">Innovative features to enhance your product</p>
                    </div>
                  </div>
                  <div className="grid gap-4">
                    {insights.newFeatures.map((feature: any, index: number) => (
                      <div key={index} className="p-6 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all duration-200">
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="text-lg font-semibold text-white">{feature.title}</h3>
                          <div className="flex space-x-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${feature.impact === 'High' ? 'bg-green-500/20 text-green-400 border-green-500/30' : feature.impact === 'Medium' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' : 'bg-gray-500/20 text-gray-400 border-gray-500/30'}`}>
                              {feature.impact} Impact
                            </span>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${feature.complexity === 'Simple' ? 'bg-green-500/20 text-green-400 border-green-500/30' : feature.complexity === 'Medium' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}`}>
                              {feature.complexity}
                            </span>
                          </div>
                        </div>
                        <p className="text-gray-300">{feature.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
