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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [typingText, setTypingText] = useState('');
  const [particles, setParticles] = useState<Array<{id: number, x: number, y: number, size: number, speed: number}>>([]);

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
    setError(null);

    try {
      // Navigate to loading page immediately
      const urlParts = repoUrl.split('/');
      const owner = urlParts[3];
      const repoName = urlParts[4];
      
      window.location.href = `/loading?repo=${encodeURIComponent(repoUrl)}&owner=${encodeURIComponent(owner)}&repoName=${encodeURIComponent(repoName)}`;
    } catch (err: any) {
      setError(err.message);
      setIsLoading(false);
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
                OpenCompass
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
              </h1>
              <div className="absolute -top-2 -right-2 w-4 h-4 bg-purple-400 rounded-full animate-ping"></div>
            </div>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
              Find direction in community projects with AI-powered analysis of GitHub repositories.
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
              </div>
              
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full py-4 px-6 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl font-semibold text-white hover:from-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-purple-500/25 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-2 relative z-10">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Starting Analysis...</span>
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
