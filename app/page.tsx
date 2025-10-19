// File: app/page.tsx
"use client";

import { useState, useEffect } from 'react';

// Define a type for the commit data we expect
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

export default function HomePage() {
  const [repoUrl, setRepoUrl] = useState('');
  const [token, setToken] = useState('');
  const [commits, setCommits] = useState<Commit[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [typingText, setTypingText] = useState('');
  const [tokenTypingText, setTokenTypingText] = useState('');
  const [particles, setParticles] = useState<Array<{id: number, x: number, y: number, size: number, speed: number}>>([]);
  const [activeTab, setActiveTab] = useState<'commits' | 'insights'>('commits');
  const [aiInsights, setAiInsights] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Typing animation for repository URL placeholder
  useEffect(() => {
    const examples = [
      'https://github.com/vercel/next.js',
      'https://github.com/facebook/react',
      'https://github.com/microsoft/vscode',
      'https://github.com/tailwindlabs/tailwindcss',
      'https://github.com/nodejs/node'
    ];
    
    let currentExample = 0;
    let currentChar = 0;
    let isDeleting = false;
    
    const typeInterval = setInterval(() => {
      const current = examples[currentExample];
      
      if (isDeleting) {
        setTypingText(current.substring(0, currentChar - 1));
        currentChar--;
        
        if (currentChar === 0) {
          isDeleting = false;
          currentExample = (currentExample + 1) % examples.length;
        }
      } else {
        setTypingText(current.substring(0, currentChar + 1));
        currentChar++;
        
        if (currentChar === current.length) {
          setTimeout(() => {
            isDeleting = true;
          }, 2000);
        }
      }
    }, isDeleting ? 50 : 100);
    
    return () => clearInterval(typeInterval);
  }, []);

  // Typing animation for token placeholder
  useEffect(() => {
    const tokenExamples = [
      'ghp_xxxxxxxxxxxxxxxxxxxx',
      'gho_xxxxxxxxxxxxxxxxxxxx',
      'ghu_xxxxxxxxxxxxxxxxxxxx',
      'ghs_xxxxxxxxxxxxxxxxxxxx',
      'ghr_xxxxxxxxxxxxxxxxxxxx'
    ];
    
    let currentExample = 0;
    let currentChar = 0;
    let isDeleting = false;
    
    const typeInterval = setInterval(() => {
      const current = tokenExamples[currentExample];
      
      if (isDeleting) {
        setTokenTypingText(current.substring(0, currentChar - 1));
        currentChar--;
        
        if (currentChar === 0) {
          isDeleting = false;
          currentExample = (currentExample + 1) % tokenExamples.length;
        }
      } else {
        setTokenTypingText(current.substring(0, currentChar + 1));
        currentChar++;
        
        if (currentChar === current.length) {
          setTimeout(() => {
            isDeleting = true;
          }, 2500);
        }
      }
    }, isDeleting ? 30 : 80);
    
    return () => clearInterval(typeInterval);
  }, []);

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

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setIsAnalyzing(true);
    setError(null);
    setCommits([]);
    setAiInsights(null);

    try {
      // First, get the commits
      const response = await fetch('/api/github', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoUrl, token }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Something went wrong');
      }

      const data = await response.json();
      setCommits(data.commits);
      setIsLoading(false);

      // Then, analyze with AI
      const aiResponse = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          repoUrl, 
          commits: data.commits,
          token 
        }),
      });

      if (!aiResponse.ok) {
        const errorData = await aiResponse.json();
        throw new Error(errorData.error || 'AI analysis failed');
      }

      const aiData = await aiResponse.json();
      setAiInsights(aiData.insights);
      setActiveTab('insights'); // Switch to insights tab
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
      setIsAnalyzing(false);
    }
  };

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Animated Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Gradient Orbs */}
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
        
        {/* Subtle Grid Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px'
          }}></div>
        </div>
      </div>

      <main className="relative z-10 flex flex-col items-center px-4 py-12">
        <div className="w-full max-w-4xl">
          {/* Header */}
          <div className="text-center mb-12 animate-fade-in-up">
            <div className="relative inline-block mb-6">
              <h1 className="text-6xl font-bold bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent mb-4 relative">
                GitFlow
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
              </h1>
              <div className="absolute -top-2 -right-2 w-4 h-4 bg-purple-400 rounded-full animate-ping"></div>
            </div>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
              Discover the pulse of any GitHub repository through its most recent commits
            </p>
            <div className="flex items-center justify-center mt-6 space-x-2 text-sm text-gray-400">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>Live</span>
              </div>
              <span>•</span>
              <span>Powered by GitHub API</span>
            </div>
          </div>

          {/* Input Form */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 mb-8 shadow-2xl hover:shadow-purple-500/10 transition-all duration-300 animate-slide-in">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center space-x-2">
                    <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    <span>Repository URL</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={repoUrl}
                      onChange={(e) => setRepoUrl(e.target.value)}
                      placeholder=""
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 hover:bg-white/15"
                    />
                    {!repoUrl && (
                      <div className="absolute inset-0 flex items-center px-4 pointer-events-none">
                        <span className="text-gray-400 text-sm">
                          {typingText}
                          <span className="animate-pulse">|</span>
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center space-x-2">
                    <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                    <span>GitHub Token</span>
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                      placeholder=""
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 hover:bg-white/15"
                    />
                    {!token && (
                      <div className="absolute inset-0 flex items-center px-4 pointer-events-none">
                        <span className="text-gray-400 text-sm">
                          {tokenTypingText}
                          <span className="animate-pulse">|</span>
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <button
                type="submit"
                disabled={isLoading || isAnalyzing}
                className="group relative w-full py-4 px-6 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl font-semibold text-white hover:from-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-purple-500/25 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-2 relative z-10">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Fetching Commits...</span>
                  </div>
                ) : isAnalyzing ? (
                  <div className="flex items-center justify-center space-x-2 relative z-10">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>AI Analyzing Repository...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2 relative z-10">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    <span>Analyze with AI</span>
                  </div>
                )}
              </button>
            </form>

            {error && (
              <div className="mt-6 p-4 bg-red-500/20 border border-red-500/30 rounded-xl">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}
          </div>

          {/* Results Display */}
          {(commits.length > 0 || aiInsights) && (
            <div className="space-y-6 animate-fade-in-up">
              {/* Tab Navigation */}
              <div className="flex justify-center">
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-1">
                  <button
                    onClick={() => setActiveTab('commits')}
                    className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                      activeTab === 'commits'
                        ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>Commits ({commits.length})</span>
                    </div>
                  </button>
                  <button
                    onClick={() => setActiveTab('insights')}
                    className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                      activeTab === 'insights'
                        ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      <span>AI Insights</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Tab Content */}
              {activeTab === 'commits' && (
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="relative inline-block">
                      <h2 className="text-3xl font-bold text-white mb-2 relative">
                        Recent Commits
                        <div className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"></div>
                      </h2>
                    </div>
                    <div className="flex items-center justify-center space-x-4 mt-4">
                      <div className="flex items-center space-x-2 text-sm text-gray-400">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        <span>{commits.length} commits found</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Updated just now</span>
                      </div>
                    </div>
                  </div>
              
              <div className="grid gap-4">
                {commits.map((commit, index) => {
                  const commitType = getCommitType(commit.commit.message);
                  return (
                    <div
                      key={commit.sha}
                      className="group bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6 hover:bg-white/10 hover:border-white/20 transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-purple-500/10 relative overflow-hidden"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      {/* Subtle gradient overlay on hover */}
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-blue-500/0 to-purple-500/0 group-hover:from-purple-500/5 group-hover:via-blue-500/5 group-hover:to-purple-500/5 transition-all duration-500"></div>
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-white font-medium text-lg mb-2 line-clamp-2 group-hover:text-purple-200 transition-colors">
                            {commit.commit.message.split('\n')[0]}
                          </h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-400">
                            <span className="flex items-center space-x-1">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                              </svg>
                              <span>{commit.commit.author?.name || 'Unknown'}</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                              </svg>
                              <span>{formatDate(commit.commit.author.date)}</span>
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3 ml-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${commitType.color}`}>
                            {commitType.type}
                          </span>
                          <a
                            href={commit.html_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        </div>
                      </div>
                      
                      {commit.commit.message.includes('\n') && (
                        <div className="mt-3 p-3 bg-white/5 rounded-lg border border-white/10">
                          <p className="text-gray-300 text-sm whitespace-pre-wrap">
                            {commit.commit.message.split('\n').slice(1).join('\n').trim()}
                          </p>
                        </div>
                      )}
                      
                      <div className="mt-3 flex items-center justify-between relative z-10">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-500 font-mono bg-gray-800/50 px-2 py-1 rounded">
                            {commit.sha.substring(0, 7)}
                          </span>
                          <div className="flex items-center space-x-1 text-xs text-gray-400">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span>Verified</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                          <span className="text-xs text-gray-400">Active</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
                </div>
              )}

              {/* AI Insights Tab */}
              {activeTab === 'insights' && (
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="relative inline-block">
                      <h2 className="text-3xl font-bold text-white mb-2 relative">
                        AI Product Insights
                        <div className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"></div>
                      </h2>
                    </div>
                    <p className="text-gray-400 mt-2">Intelligent analysis powered by AI</p>
                  </div>

                  {isAnalyzing ? (
                    <div className="text-center py-12">
                      <div className="inline-flex items-center space-x-3">
                        <div className="w-8 h-8 border-3 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
                        <span className="text-lg text-gray-300">AI is analyzing your repository...</span>
                      </div>
                    </div>
                  ) : aiInsights ? (
                    <div className="grid gap-6">
                      {/* Roadmap Section */}
                      {aiInsights.roadmap && (
                        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
                          <div className="flex items-center space-x-3 mb-4">
                            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                              </svg>
                            </div>
                            <h3 className="text-xl font-bold text-white">Product Roadmap</h3>
                          </div>
                          <div className="space-y-3">
                            {aiInsights.roadmap.map((item: any, index: number) => (
                              <div key={index} className="flex items-start space-x-3 p-3 bg-white/5 rounded-lg">
                                <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0"></div>
                                <div>
                                  <h4 className="font-medium text-white">{item.title}</h4>
                                  <p className="text-gray-400 text-sm">{item.description}</p>
                                  <span className="inline-block mt-1 px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded">
                                    {item.priority}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Vulnerabilities Section */}
                      {aiInsights.vulnerabilities && (
                        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
                          <div className="flex items-center space-x-3 mb-4">
                            <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-orange-500 rounded-lg flex items-center justify-center">
                              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                              </svg>
                            </div>
                            <h3 className="text-xl font-bold text-white">Security & Vulnerabilities</h3>
                          </div>
                          <div className="space-y-3">
                            {aiInsights.vulnerabilities.map((vuln: any, index: number) => (
                              <div key={index} className="flex items-start space-x-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                                <div className="w-2 h-2 bg-red-400 rounded-full mt-2 flex-shrink-0"></div>
                                <div>
                                  <h4 className="font-medium text-white">{vuln.title}</h4>
                                  <p className="text-gray-400 text-sm">{vuln.description}</p>
                                  <span className="inline-block mt-1 px-2 py-1 bg-red-500/20 text-red-300 text-xs rounded">
                                    {vuln.severity}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Team Assignments Section */}
                      {aiInsights.teamAssignments && (
                        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
                          <div className="flex items-center space-x-3 mb-4">
                            <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-teal-500 rounded-lg flex items-center justify-center">
                              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                              </svg>
                            </div>
                            <h3 className="text-xl font-bold text-white">Team Assignments</h3>
                          </div>
                          <div className="space-y-3">
                            {aiInsights.teamAssignments.map((assignment: any, index: number) => (
                              <div key={index} className="flex items-start space-x-3 p-3 bg-white/5 rounded-lg">
                                <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                                <div>
                                  <h4 className="font-medium text-white">{assignment.task}</h4>
                                  <p className="text-gray-400 text-sm">Assigned to: <span className="text-green-400">{assignment.assignee}</span></p>
                                  <p className="text-gray-400 text-sm">{assignment.reason}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* New Features Section */}
                      {aiInsights.newFeatures && (
                        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
                          <div className="flex items-center space-x-3 mb-4">
                            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                              </svg>
                            </div>
                            <h3 className="text-xl font-bold text-white">Suggested New Features</h3>
                          </div>
                          <div className="space-y-3">
                            {aiInsights.newFeatures.map((feature: any, index: number) => (
                              <div key={index} className="flex items-start space-x-3 p-3 bg-white/5 rounded-lg">
                                <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                                <div>
                                  <h4 className="font-medium text-white">{feature.title}</h4>
                                  <p className="text-gray-400 text-sm">{feature.description}</p>
                                  <span className="inline-block mt-1 px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded">
                                    {feature.impact}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-medium text-white mb-2">No AI insights yet</h3>
                      <p className="text-gray-400">Analyze a repository to get intelligent product management insights</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          
          {/* Footer */}
          <div className="mt-16 text-center animate-fade-in-up">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <div className="flex items-center justify-center space-x-6 text-sm text-gray-400">
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Secure & Private</span>
                </div>
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                  <span>Real-time Data</span>
                </div>
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
                  </svg>
                  <span>Always Updated</span>
                </div>
              </div>
              <p className="mt-4 text-xs text-gray-500">
                Built with Next.js, Tailwind CSS, and GitHub API
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}