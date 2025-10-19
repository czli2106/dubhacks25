// File: app/page.tsx
"use client";

import { useState } from 'react';

// Define a type for the commit data we expect
type Commit = {
  sha: string;
  commit: {
    author: {
      name: string | null;
    };
    message: string;
  };
};

export default function HomePage() {
  const [repoUrl, setRepoUrl] = useState('');
  const [token, setToken] = useState('');
  const [commits, setCommits] = useState<Commit[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    setCommits([]);

    try {
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
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-12 bg-gray-900 text-white">
      <div className="z-10 w-full max-w-2xl items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold mb-8 text-center">Project Analyzer</h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="text"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            placeholder="Enter GitHub Repository URL (e.g., https://github.com/vercel/next.js)"
            className="w-full p-3 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Enter your GitHub Personal Access Token"
            className="w-full p-3 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="w-full p-3 bg-blue-600 rounded-md font-bold hover:bg-blue-700 disabled:bg-gray-500"
          >
            {isLoading ? 'Analyzing...' : 'Analyze Project'}
          </button>
        </form>

        {error && <p className="mt-4 text-red-400">Error: {error}</p>}

        <div className="mt-8 w-full">
          {commits.length > 0 && (
            <div className="bg-gray-800 rounded-md p-4">
              <h2 className="text-2xl font-bold mb-4">Recent Commits</h2>
              <ul className="flex flex-col gap-3">
                {commits.map((commit) => (
                  <li key={commit.sha} className="p-3 bg-gray-700 rounded-md text-sm">
                    <p className="font-bold text-gray-300 truncate">{commit.commit.message.split('\n')[0]}</p>
                    <p className="text-gray-400">by {commit.commit.author?.name || 'Unknown'}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}