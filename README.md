# OpenCompass - AI-Powered GitHub Repository Analysis & Maintainer Briefings [https://www.opencompass.us/]

A comprehensive AI-powered product management analysis tool that analyzes GitHub repositories, delivers evidence-backed insights, and compiles maintainer-ready briefing docs in seconds.

## 🚀 Features

### Insight Console
- **Repository deep dive**: Paste any public GitHub repo URL and receive roadmap, feature, debt, performance, team, and security insights.
- **Context caching**: Analysis context and AI sections persist in session storage so an interrupted session can be restored without re-fetching data.
- **Evidence-first cards**: Each recommendation cites verified commits, issues, or PRs with canonical links.

### Maintainer Briefcase
- **Quarter targeting**: Choose whether to assemble docs for the current or next quarter before generating outputs.
- **Per-card toggles**: Flip the briefcase icon on any roadmap/feature/debt/performance/vulnerability card to include or exclude it. Included cards receive a subtle highlight.
- **Deterministic docs**: A dedicated `/api/analyze/briefcase` endpoint normalizes selected items and renders three markdown files (quarterly roadmap, feature specs, execution checklist) using reusable templates.
- **Preview & export**: Open the preview modal to tab through each markdown file, copy to clipboard, or download a zipped folder ready for `/docs/insights/YYYY-MM-DD/`.

### Platform & Integrations
- **Next.js app router** frontend with animated loading states and responsive layouts.
- **API routes** for gathering GitHub context, orchestrating section-level AI calls, and generating markdown outputs.
- **Octokit + OpenAI** powered backend, with all tokens kept server-side.
- **Prompt templates** per insight category to keep OpenAI responses structured and reference-heavy.

## 🛠️ Quick Start

### **Option 1: Automated Setup (Recommended)**

```bash
# Clone and navigate to the project
cd dubhacks25

# Run the automated startup script
./start-system.sh
```

The script will:
- Check dependencies
- Install required packages
- Create an environment template
- Start the Next.js development server
- Open the application

### **Option 2: Manual Setup**

#### **1. Install Dependencies**

**Frontend:**
```bash
npm install
```

#### **2. Environment Setup**

Create `.env.local` in the root directory:

```bash
# GitHub Token for API access
GITHUB_TOKEN=your_github_token_here

# OpenAI API Key for AI analysis
OPENAI_API_KEY=your_openai_api_key_here
```

**Get API Keys:**
- **GitHub Token**: [Create Personal Access Token](https://github.com/settings/tokens)
- **OpenAI API Key**: [Get API Key](https://platform.openai.com/api-keys)

#### **3. Start the App**

```bash
npm run dev
```

## 🌐 Access Points

- **Main Application**: http://localhost:3000
- **API Routes**: http://localhost:3000/api/*

## 📊 How It Works

### **User Flow**
1. **Enter Repository**: Paste a GitHub URL from the landing page.
2. **Context Gathering**: The app pulls recent commits, issues, and PRs and stores the context client-side for reuse.
3. **Insight Generation**: Each section is requested sequentially, surfaces the AI response, and normalizes references/owners/success criteria.
4. **Curation**: Maintainers toggle the briefcase icon on the cards they want to export and choose the quarter.
5. **Briefcase Export**: With one click, the app compiles markdown docs, opens a preview modal, and offers copy/ZIP download options.

### **Technical Flow**
1. **Frontend ➜ `/api/analyze/context`** collects repository metadata plus up to 20 commits, 10 issues, and 10 PRs via Octokit.
2. **Client-side cache** stores the returned context in `sessionStorage` so a browser refresh can restore the analysis session.
3. **Frontend ➜ `/api/analyze/section`** posts the cached context alongside the requested section key. The route enforces strict JSON schemas, normalizes references, and coalesces string arrays.
4. **OpenAI Responses** are parsed, validated, and rehydrated with canonical GitHub links before being dispatched back to the UI.
5. **Frontend ➜ `/api/analyze/briefcase`** sends the aggregated section data, selected card indices, and quarter choice. The API normalizes items, renders markdown through `lib/briefcaseMarkdown.ts`, and returns the final files for preview/download.

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐
│   Next.js       │    │   External      │
│   App & API     │◄──►│   APIs          │
│                 │    │                 │
│ • React UI      │    │ • GitHub API    │
│ • API Routes    │    │ • OpenAI API    │
│ • Prompt files  │    │                 │
└─────────────────┘    └─────────────────┘
```

## 📁 Project Structure

```
dubhacks25/
├── app/                              # Next.js frontend + API routes
│   ├── api/
│   │   ├── analyze/
│   │   │   ├── context/             # GitHub context aggregation
│   │   │   ├── section/             # Section-level AI calls
│   │   │   └── briefcase/           # Markdown briefcase generator
│   │   └── briefcase/               # Legacy briefcase endpoint (unused in UI)
│   ├── insights/                    # Insights console UI
│   ├── loading/                     # Animated loading screen
│   └── page.tsx                     # Landing page
├── lib/
│   └── briefcaseMarkdown.ts         # Deterministic markdown render helpers
├── prompts/                         # Prompt templates per insight section
├── start-system.sh                  # Automated startup script
└── README.md                        # This file
```

## 🔒 Security

- **Environment Variables**: All API keys stored securely
- **Server-side Processing**: No tokens exposed to frontend
- **CORS Protection**: Configured for local development
- **Input Validation**: All inputs validated and sanitized

## 🚀 Production Deployment

```bash
# Build for production
npm run build

# Start production server
npm start
```

## 🛠️ Development

### **Adding New Analysis Categories**
1. Add a new prompt file in the `prompts/` directory
2. Register that file in `SECTION_PROMPT_FILES` inside `app/api/analyze/section/route.ts`
3. Adjust the insights rendering in `app/insights/page.tsx`
4. Restart the development server if it was already running

### **Customizing Prompts**
- Edit the corresponding text file in the `prompts/` directory
- Redeploy or restart to load the updated templates
- Ensure the JSON fields stay aligned with `SECTION_RESPONSE_SHAPES` (reference titles + URLs, optional notes, array fields, etc.)

### **API Integration**
- `/api/analyze/context` gathers GitHub repo context (commits/issues/PRs) via Octokit.
- `/api/analyze/section` prompts OpenAI for each insight category using strict JSON schemas and reference normalization.
- `/api/analyze/briefcase` turns selected insights into deterministic markdown files for export.
- Frontend calls each route with the native fetch API; all tokens remain server-side.

## 📝 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GITHUB_TOKEN` | GitHub Personal Access Token | Yes |
| `OPENAI_API_KEY` | OpenAI API Key | Yes |

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

If you encounter any issues:

1. Check the console logs for errors
2. Verify all environment variables are set
3. Ensure all dependencies are installed
4. Restart the development server if it crashed
5. Confirm your GitHub and OpenAI credentials are valid

## 🎯 Roadmap

- [x] Maintainer briefcase export (quarter picker, card-level selection, markdown preview & ZIP)
- [ ] User authentication and authorization
- [ ] Multiple repository analysis
- [ ] Export insights to PDF/CSV
- [ ] Integration with project management tools
- [ ] Advanced analytics and reporting
- [ ] Team collaboration features
