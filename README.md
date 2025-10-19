# AI PM - Product Management Analysis Tool

A comprehensive AI-powered product management analysis tool that analyzes GitHub repositories and provides actionable insights for product managers.

## 🚀 Features

### **Frontend (Next.js)**
- **Modern UI**: Beautiful, responsive interface with animations
- **Repository Analysis**: Enter any GitHub repository URL for analysis
- **Real-time Loading**: Shows recent commits while AI analyzes
- **Deep Insights**: Comprehensive product management analysis
- **GitHub Integration**: Direct links to original GitHub resources

### **Server (Next.js API Routes)**
- **GitHub Aggregation**: Securely fetches commits, issues, PRs, and repo metadata via Octokit
- **AI Prompting**: Maintains structured prompt templates used to guide the OpenAI analysis
- **Secret Management**: Runs entirely server-side, so API keys stay off the client
- **Resilient Defaults**: Graceful fallbacks if the OpenAI response cannot be parsed

### **AI Analysis Categories**
1. **Product Roadmap** - Strategic roadmap recommendations
2. **Security & Vulnerabilities** - Security assessment and recommendations
3. **Team Assignments** - Team assignment recommendations
4. **New Features** - Feature suggestions based on analysis
5. **Technical Debt** - Technical debt identification and prioritization
6. **Performance** - Performance optimization opportunities

## 🛠️ Quick Start

### **Option 1: Automated Setup (Recommended)**

```bash
# Clone and navigate to the project
cd ai-pm

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
1. **Enter Repository**: User enters GitHub repository URL
2. **Loading Phase**: System fetches commits and shows recent activity
3. **AI Analysis**: AI analyzes repository data using customizable prompts
4. **Insights Display**: Comprehensive analysis with actionable recommendations

### **Technical Flow**
1. **Frontend** → Sends the repository URL to `/api/analyze/context` to gather commits/issues/PR data
2. **Next.js API** → Aggregates GitHub context, stores it client-side, and redirects to the insights view
3. **Frontend** → Sequentially calls `/api/analyze/section` for each insight category, streaming results into the UI
4. **OpenAI API** → Returns JSON for each section following the enforced schema (including references and optional notes)
5. **Frontend** → Renders each section as it arrives, showing notes when no recommendations are available

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
ai-pm/
├── app/                    # Next.js frontend
│   ├── api/               # API routes
│   ├── loading/           # Loading page
│   ├── insights/          # Insights page
│   └── page.tsx           # Main page
├── start-system.sh       # Automated startup script
└── README.md             # This file
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
- Next.js API routes expose the analysis endpoints
- Frontend consumes those routes via the built-in fetch API
- External integrations rely on GitHub and OpenAI services only

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

- [ ] User authentication and authorization
- [ ] Multiple repository analysis
- [ ] Export insights to PDF/CSV
- [ ] Integration with project management tools
- [ ] Advanced analytics and reporting
- [ ] Team collaboration features
