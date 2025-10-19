# AI PM - Product Management Analysis Tool

A comprehensive AI-powered product management analysis tool that analyzes GitHub repositories and provides actionable insights for product managers.

## 🚀 Features

### **Frontend (Next.js)**
- **Modern UI**: Beautiful, responsive interface with animations
- **Repository Analysis**: Enter any GitHub repository URL for analysis
- **Real-time Loading**: Shows recent commits while AI analyzes
- **Deep Insights**: Comprehensive product management analysis
- **GitHub Integration**: Direct links to original GitHub resources

### **Backend (FastAPI)**
- **Prompt Management**: Centralized AI prompt management system
- **Admin Interface**: Web-based interface for managing prompts
- **Database**: SQLite database with full CRUD operations
- **API Documentation**: Auto-generated OpenAPI/Swagger docs
- **Category Organization**: Organized prompts by analysis type

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
- Install all required packages
- Create environment template
- Start both backend and frontend
- Open the application

### **Option 2: Manual Setup**

#### **1. Install Dependencies**

**Frontend:**
```bash
npm install
```

**Backend:**
```bash
cd backend
pip install -r requirements.txt
cd ..
```

#### **2. Environment Setup**

Create `.env.local` in the root directory:

```bash
# GitHub Token for API access
GITHUB_TOKEN=your_github_token_here

# OpenAI API Key for AI analysis
OPENAI_API_KEY=your_openai_api_key_here

# FastAPI Backend URL (optional)
FASTAPI_BASE_URL=http://localhost:8000
```

**Get API Keys:**
- **GitHub Token**: [Create Personal Access Token](https://github.com/settings/tokens)
- **OpenAI API Key**: [Get API Key](https://platform.openai.com/api-keys)

#### **3. Start Services**

**Terminal 1 - Backend:**
```bash
cd backend
python start.py
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

## 🌐 Access Points

- **Main Application**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **Admin Interface**: http://localhost:8000/admin.html
- **API Documentation**: http://localhost:8000/docs

## 📊 How It Works

### **User Flow**
1. **Enter Repository**: User enters GitHub repository URL
2. **Loading Phase**: System fetches commits and shows recent activity
3. **AI Analysis**: AI analyzes repository data using customizable prompts
4. **Insights Display**: Comprehensive analysis with actionable recommendations

### **Technical Flow**
1. **Frontend** → Sends repository URL to Next.js API
2. **GitHub API** → Fetches repository data, commits, issues, PRs
3. **FastAPI Backend** → Provides customizable AI prompts
4. **OpenAI API** → Generates comprehensive analysis
5. **Results** → Formatted insights with GitHub links

## 🔧 Admin Features

### **Prompt Management**
- **View All Prompts**: See all analysis prompts with status
- **Edit Prompts**: Modify prompt titles and content
- **Activate/Deactivate**: Enable/disable prompts without deletion
- **Real-time Stats**: Monitor prompt usage and updates

### **Access Admin Interface**
1. Go to http://localhost:8000/admin.html
2. View all prompts organized by category
3. Edit prompts by clicking the edit button
4. Toggle prompt status (active/inactive)
5. Monitor system statistics

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Next.js       │    │   FastAPI       │    │   External      │
│   Frontend      │◄──►│   Backend       │◄──►│   APIs          │
│                 │    │                 │    │                 │
│ • React UI      │    │ • Prompt Mgmt   │    │ • GitHub API    │
│ • API Routes    │    │ • SQLite DB     │    │ • OpenAI API    │
│ • Animations    │    │ • Admin UI      │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📁 Project Structure

```
ai-pm/
├── app/                    # Next.js frontend
│   ├── api/               # API routes
│   ├── loading/           # Loading page
│   ├── insights/          # Insights page
│   └── page.tsx           # Main page
├── backend/               # FastAPI backend
│   ├── main.py           # Main FastAPI app
│   ├── start.py          # Startup script
│   ├── admin.html        # Admin interface
│   ├── requirements.txt  # Python dependencies
│   └── README.md         # Backend documentation
├── start-system.sh       # Automated startup script
└── README.md             # This file
```

## 🔒 Security

- **Environment Variables**: All API keys stored securely
- **Server-side Processing**: No tokens exposed to frontend
- **CORS Protection**: Configured for local development
- **Input Validation**: All inputs validated and sanitized

## 🚀 Production Deployment

### **Backend (FastAPI)**
```bash
# Use production database
export DATABASE_URL="postgresql://user:pass@host:port/db"

# Use production server
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

### **Frontend (Next.js)**
```bash
# Build for production
npm run build

# Start production server
npm start
```

## 🛠️ Development

### **Adding New Analysis Categories**
1. Add new prompt to FastAPI backend
2. Update frontend to display new category
3. Restart services

### **Customizing Prompts**
- Use admin interface at http://localhost:8000/admin.html
- No code changes required
- Changes take effect immediately

### **API Integration**
- Backend provides RESTful API
- Frontend consumes API via fetch
- OpenAPI documentation available

## 📝 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GITHUB_TOKEN` | GitHub Personal Access Token | Yes |
| `OPENAI_API_KEY` | OpenAI API Key | Yes |
| `FASTAPI_BASE_URL` | FastAPI Backend URL | No (defaults to localhost:8000) |
| `DATABASE_URL` | Database connection string | No (defaults to SQLite) |

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
4. Check that both services are running
5. Review the API documentation at http://localhost:8000/docs

## 🎯 Roadmap

- [ ] User authentication and authorization
- [ ] Multiple repository analysis
- [ ] Export insights to PDF/CSV
- [ ] Integration with project management tools
- [ ] Advanced analytics and reporting
- [ ] Team collaboration features