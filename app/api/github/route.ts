// File: app/api/github/route.ts

import { NextResponse } from 'next/server';
import { Octokit } from '@octokit/rest';

export async function POST(request: Request) {
  try {
    const { repoUrl } = await request.json();

    if (!repoUrl) {
      return NextResponse.json(
        { error: 'Repository URL is required.' },
        { status: 400 }
      );
    }

    // Use environment variable for GitHub token
    const token = process.env.GITHUB_TOKEN;
    if (!token) {
      return NextResponse.json(
        { error: 'GitHub token not configured.' },
        { status: 500 }
      );
    }

    // Extract "owner/repo" from the URL, e.g., "https://github.com/vercel/next.js" -> "vercel/next.js"
    const urlParts = new URL(repoUrl).pathname.substring(1).split('/');
    const owner = urlParts[0];
    const repo = urlParts[1];

    if (!owner || !repo) {
        return NextResponse.json({ error: 'Invalid GitHub repository URL.' }, { status: 400 });
    }

    // Initialize Octokit with the user's token
    const octokit = new Octokit({ auth: token });

    const [commitsResponse, issues] = await Promise.all([
      octokit.rest.pulls.list({
        owner,
        repo,
        per_page: 50,
        state: 'open',
      }),
      octokit.paginate(octokit.rest.issues.listForRepo, {
        owner,
        repo,
        per_page: 100,
        state: 'open',
      }),
    ]);

    const commits = commitsResponse.data;

    return NextResponse.json({ commits, issues });

  } catch (error) {
    console.error(error);
    return NextResponse.json(
        { error: 'Failed to fetch commits from GitHub.' }, 
        { status: 500 }
    );
  }
}
