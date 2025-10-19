import { NextResponse } from 'next/server';
import { Octokit } from '@octokit/rest';

type ContextRequestBody = {
  repoUrl?: string;
};

type CommitSummary = {
  message: string;
  author: string | null;
  date: string;
  sha: string;
  url: string;
};

type IssueSummary = {
  title: string;
  body: string | null;
  labels: string[];
  assignees: string[];
  url: string;
};

type PullRequestSummary = {
  title: string;
  body: string | null;
  author: string | null;
  labels: string[];
  url: string;
};

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
  recentCommits: CommitSummary[];
  openIssues: IssueSummary[];
  openPullRequests: PullRequestSummary[];
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ContextRequestBody;
    const { repoUrl } = body;

    if (!repoUrl) {
      return NextResponse.json(
        { error: 'Repository URL is required.' },
        { status: 400 }
      );
    }

    const token = process.env.GITHUB_TOKEN;
    if (!token) {
      return NextResponse.json(
        { error: 'GitHub token not configured.' },
        { status: 500 }
      );
    }

    const { owner, repo } = (() => {
      try {
        const url = new URL(repoUrl);
        const segments = url.pathname.replace(/^\//, '').split('/');
        return { owner: segments[0], repo: segments[1] };
      } catch {
        return { owner: undefined, repo: undefined };
      }
    })();

    if (!owner || !repo) {
      return NextResponse.json(
        { error: 'Invalid GitHub repository URL.' },
        { status: 400 }
      );
    }

    const octokit = new Octokit({ auth: token });

    const [commitsResponse, repoInfoResponse, languagesResponse, issuesResponse, pullRequestsResponse] =
      await Promise.all([
        octokit.repos.listCommits({ owner, repo, per_page: 50 }),
        octokit.repos.get({ owner, repo }),
        octokit.repos.listLanguages({ owner, repo }),
        octokit.issues.listForRepo({ owner, repo, state: 'open', per_page: 10 }),
        octokit.pulls.list({ owner, repo, state: 'open', per_page: 10 })
      ]);

    const commits = commitsResponse.data;

    const analysisContext: AnalysisContext = {
      repository: {
        name: repoInfoResponse.data.name,
        description: repoInfoResponse.data.description,
        language: repoInfoResponse.data.language,
        languages: languagesResponse.data,
        stars: repoInfoResponse.data.stargazers_count,
        forks: repoInfoResponse.data.forks_count,
        openIssues: repoInfoResponse.data.open_issues_count,
        createdAt: repoInfoResponse.data.created_at,
        updatedAt: repoInfoResponse.data.updated_at
      },
      recentCommits: commits.slice(0, 20).map((commit) => ({
        message: commit.commit.message,
        author: commit.commit.author?.name ?? null,
        date: commit.commit.author?.date ?? commit.commit.committer?.date ?? '',
        sha: commit.sha.substring(0, 7),
        url: commit.html_url
      })),
      openIssues: issuesResponse.data.slice(0, 10).map((issue) => ({
        title: issue.title,
        body: issue.body,
        labels: issue.labels?.map((label: any) => label.name) ?? [],
        assignees: issue.assignees?.map((assignee: any) => assignee.login) ?? [],
        url: issue.html_url
      })),
      openPullRequests: pullRequestsResponse.data.slice(0, 10).map((pr) => ({
        title: pr.title,
        body: pr.body,
        author: pr.user?.login ?? null,
        labels: pr.labels?.map((label: any) => label.name) ?? [],
        url: pr.html_url
      }))
    };

    return NextResponse.json({
      commits,
      analysisContext
    });
  } catch (error) {
    console.error('Context generation error:', error);
    return NextResponse.json(
      { error: 'Failed to gather repository context.' },
      { status: 500 }
    );
  }
}
