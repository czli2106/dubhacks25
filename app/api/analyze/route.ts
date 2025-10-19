// File: app/api/analyze/route.ts

import { NextResponse } from 'next/server';
import { Octokit } from '@octokit/rest';

export async function POST(request: Request) {
  try {
    const { repoUrl, commits, token } = await request.json();

    if (!repoUrl || !commits || !token) {
      return NextResponse.json(
        { error: 'Repository URL, commits data, and GitHub token are required.' },
        { status: 400 }
      );
    }

    // Extract "owner/repo" from the URL
    const urlParts = new URL(repoUrl).pathname.substring(1).split('/');
    const owner = urlParts[0];
    const repo = urlParts[1];

    if (!owner || !repo) {
      return NextResponse.json({ error: 'Invalid GitHub repository URL.' }, { status: 400 });
    }

    // Initialize Octokit
    const octokit = new Octokit({ auth: token });

    // Get additional repository information
    const [repoInfo, languages, issues, pullRequests] = await Promise.all([
      octokit.repos.get({ owner, repo }),
      octokit.repos.listLanguages({ owner, repo }),
      octokit.issues.listForRepo({ owner, repo, state: 'open', per_page: 10 }),
      octokit.pulls.list({ owner, repo, state: 'open', per_page: 10 })
    ]);

    // Prepare data for AI analysis
    const analysisData = {
      repository: {
        name: repoInfo.data.name,
        description: repoInfo.data.description,
        language: repoInfo.data.language,
        languages: languages.data,
        stars: repoInfo.data.stargazers_count,
        forks: repoInfo.data.forks_count,
        openIssues: repoInfo.data.open_issues_count,
        createdAt: repoInfo.data.created_at,
        updatedAt: repoInfo.data.updated_at
      },
      recentCommits: commits.slice(0, 20).map((commit: any) => ({
        message: commit.commit.message,
        author: commit.commit.author.name,
        date: commit.commit.author.date,
        sha: commit.sha.substring(0, 7)
      })),
      openIssues: issues.data.slice(0, 10).map((issue: any) => ({
        title: issue.title,
        body: issue.body,
        labels: issue.labels.map((label: any) => label.name),
        assignees: issue.assignees.map((assignee: any) => assignee.login)
      })),
      openPullRequests: pullRequests.data.slice(0, 10).map((pr: any) => ({
        title: pr.title,
        body: pr.body,
        author: pr.user.login,
        labels: pr.labels.map((label: any) => label.name)
      }))
    };

    // Create comprehensive AI prompt
    const prompt = `
You are an expert Product Manager analyzing a GitHub repository. Based on the following data, provide actionable insights in JSON format.

Repository Data:
- Name: ${analysisData.repository.name}
- Description: ${analysisData.repository.description || 'No description'}
- Primary Language: ${analysisData.repository.language}
- Languages: ${Object.keys(analysisData.repository.languages).join(', ')}
- Stars: ${analysisData.repository.stars}
- Forks: ${analysisData.repository.forks}
- Open Issues: ${analysisData.repository.openIssues}
- Created: ${analysisData.repository.createdAt}
- Last Updated: ${analysisData.repository.updatedAt}

Recent Commits (${analysisData.recentCommits.length}):
${analysisData.recentCommits.map(commit => `- ${commit.message.split('\n')[0]} (${commit.author}, ${commit.date})`).join('\n')}

Open Issues (${analysisData.openIssues.length}):
${analysisData.openIssues.map(issue => `- ${issue.title} (Labels: ${issue.labels.join(', ')})`).join('\n')}

Open Pull Requests (${analysisData.openPullRequests.length}):
${analysisData.openPullRequests.map(pr => `- ${pr.title} (Author: ${pr.author})`).join('\n')}

Please analyze this data and provide insights in the following JSON structure:

{
  "roadmap": [
    {
      "title": "Feature or improvement title",
      "description": "Detailed description of what needs to be done",
      "priority": "High/Medium/Low",
      "estimatedEffort": "1-2 weeks/1 month/etc"
    }
  ],
  "vulnerabilities": [
    {
      "title": "Security or technical issue",
      "description": "What the issue is and why it's concerning",
      "severity": "Critical/High/Medium/Low",
      "recommendation": "How to fix it"
    }
  ],
  "teamAssignments": [
    {
      "task": "Specific task or responsibility",
      "assignee": "Suggested team member role (e.g., 'Frontend Developer', 'Backend Engineer', 'DevOps Engineer')",
      "reason": "Why this person/role should handle this task"
    }
  ],
  "newFeatures": [
    {
      "title": "Suggested new feature",
      "description": "What this feature would do and why it's valuable",
      "impact": "High/Medium/Low impact on users",
      "complexity": "Simple/Medium/Complex to implement"
    }
  ],
  "technicalDebt": [
    {
      "issue": "Technical debt item",
      "description": "What needs to be refactored or improved",
      "priority": "High/Medium/Low",
      "effort": "Estimated effort to fix"
    }
  ],
  "performance": [
    {
      "area": "Performance concern area",
      "description": "What performance issues might exist",
      "recommendation": "How to improve performance"
    }
  ]
}

Focus on:
1. Product roadmap items based on commit patterns and issues
2. Security vulnerabilities from code patterns and dependencies
3. Team assignments based on code ownership and expertise areas
4. New features that would add value based on current functionality
5. Technical debt that should be addressed
6. Performance optimizations

Be specific and actionable. Provide 3-5 items for each category.
`;

    // Call OpenAI API
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert Product Manager and Technical Lead. Analyze GitHub repository data and provide actionable insights in valid JSON format only. Do not include any text outside the JSON response.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 3000
      })
    });

    if (!openaiResponse.ok) {
      throw new Error('OpenAI API request failed');
    }

    const openaiData = await openaiResponse.json();
    const aiResponse = openaiData.choices[0].message.content;

    // Parse the AI response
    let insights;
    try {
      insights = JSON.parse(aiResponse);
    } catch (parseError) {
      // Fallback if JSON parsing fails
      insights = {
        roadmap: [
          {
            title: "Code Quality Improvements",
            description: "Based on commit patterns, focus on improving code quality and reducing technical debt",
            priority: "Medium"
          }
        ],
        vulnerabilities: [
          {
            title: "Security Review Needed",
            description: "Regular security audits should be conducted based on the repository activity",
            severity: "Medium"
          }
        ],
        teamAssignments: [
          {
            task: "Code Review Process",
            assignee: "Senior Developer",
            reason: "Establish better code review practices based on commit patterns"
          }
        ],
        newFeatures: [
          {
            title: "Enhanced Documentation",
            description: "Improve project documentation based on current development activity",
            impact: "Medium"
          }
        ]
      };
    }

    return NextResponse.json({ insights });

  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze repository with AI.' },
      { status: 500 }
    );
  }
}
