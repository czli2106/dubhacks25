// File: app/api/analyze/route.ts

import { NextResponse } from 'next/server';
import { Octokit } from '@octokit/rest';

export async function POST(request: Request) {
  try {
    const { repoUrl, commits } = await request.json();

    if (!repoUrl || !commits) {
      return NextResponse.json(
        { error: 'Repository URL and commits data are required.' },
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

    // Fetch prompts from FastAPI backend
    let customPrompts;
    try {
      const promptsResponse = await fetch(`${process.env.FASTAPI_BASE_URL || 'http://localhost:8000'}/prompts`);
      if (!promptsResponse.ok) {
        throw new Error('Failed to fetch prompts from backend');
      }
      const promptsData = await promptsResponse.json();
      customPrompts = promptsData.prompts;
    } catch (error) {
      console.error('Error fetching prompts from backend:', error);
      // Fallback to default prompts if backend is unavailable
      customPrompts = {
        roadmap: `Analyze the repository data and provide strategic roadmap recommendations. Focus on:
1. Feature gaps based on commit patterns
2. Technical debt that should be prioritized
3. Performance improvements needed
4. User experience enhancements
5. Scalability considerations

Provide 3-5 roadmap items with titles, descriptions, priority levels (High/Medium/Low), and estimated effort.`,
        
        vulnerabilities: `Analyze the repository for potential security issues and vulnerabilities. Look for:
1. Security anti-patterns in commit messages
2. Dependencies that might have known vulnerabilities
3. Code patterns that could lead to security issues
4. Missing security best practices
5. Authentication and authorization concerns

Provide 3-5 security items with titles, descriptions, severity levels (Critical/High/Medium/Low), and specific recommendations.`,
        
        teamAssignments: `Based on the repository structure and commit patterns, recommend team assignments. Consider:
1. Code ownership patterns from commit history
2. Technology stack expertise requirements
3. Feature areas that need dedicated ownership
4. Cross-functional collaboration opportunities
5. Skill development needs

Provide 3-5 assignment recommendations with specific tasks, suggested team member roles, and reasoning.`,
        
        newFeatures: `Analyze the current functionality and suggest valuable new features. Consider:
1. User pain points that could be addressed
2. Market opportunities based on the tech stack
3. Integration possibilities with other tools
4. Performance and scalability improvements
5. User experience enhancements

Provide 3-5 feature suggestions with titles, descriptions, impact assessment (High/Medium/Low), and implementation complexity.`,
        
        technicalDebt: `Identify technical debt and code quality issues. Look for:
1. Code duplication patterns
2. Outdated dependencies or patterns
3. Performance bottlenecks
4. Maintainability issues
5. Testing gaps

Provide 3-5 technical debt items with specific issues, descriptions, priority levels, and effort estimates.`,
        
        performance: `Analyze potential performance issues and optimization opportunities. Consider:
1. Database query optimization needs
2. Caching opportunities
3. Frontend performance improvements
4. API optimization potential
5. Resource usage optimization

Provide 3-5 performance recommendations with specific areas, descriptions, and optimization strategies.`
      };
    }

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
${analysisData.recentCommits.map((commit: any) => `- ${commit.message.split('\n')[0]} (${commit.author}, ${commit.date})`).join('\n')}

Open Issues (${analysisData.openIssues.length}):
${analysisData.openIssues.map((issue: any) => `- ${issue.title} (Labels: ${issue.labels.join(', ')})`).join('\n')}

Open Pull Requests (${analysisData.openPullRequests.length}):
${analysisData.openPullRequests.map((pr: any) => `- ${pr.title} (Author: ${pr.author})`).join('\n')}

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

Analysis Guidelines:
${Object.entries(customPrompts).map(([category, promptData]) => 
  `${category.toUpperCase()}: ${typeof promptData === 'string' ? promptData : promptData.prompt}`
).join('\n\n')}

Be specific and actionable. Provide 3-5 items for each category. Include GitHub links where relevant (use format: [text](https://github.com/${owner}/${repo}/issues/123) for issues, [text](https://github.com/${owner}/${repo}/pull/456) for PRs, [text](https://github.com/${owner}/${repo}/commit/abc123) for commits).
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
