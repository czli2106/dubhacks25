# AI PM Prompt Management Backend

FastAPI backend for managing AI prompts used in product management analysis.

## Features

- **Prompt Management**: Create, read, update, and delete AI prompts
- **Category Organization**: Organize prompts by analysis categories (roadmap, vulnerabilities, etc.)
- **Active/Inactive Status**: Enable/disable prompts without deletion
- **Admin Interface**: Web-based interface for prompt management
- **API Documentation**: Auto-generated OpenAPI/Swagger docs
- **Database**: SQLite database with SQLAlchemy ORM

## Setup

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Environment Variables

Create a `.env` file in the backend directory:

```bash
# Database
DATABASE_URL=sqlite:///./prompts.db

# Server Configuration
HOST=0.0.0.0
PORT=8000
RELOAD=true
```

### 3. Start the Server

```bash
python start.py
```

Or directly with uvicorn:

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

## Usage

### API Endpoints

- **GET** `/` - API information
- **GET** `/health` - Health check
- **GET** `/prompts` - Get all active prompts (used by Next.js app)
- **GET** `/prompts/all` - Get all prompts (including inactive)
- **GET** `/prompts/{category}` - Get specific prompt by category
- **POST** `/prompts` - Create new prompt
- **PUT** `/prompts/{category}` - Update existing prompt
- **DELETE** `/prompts/{category}` - Deactivate prompt
- **POST** `/prompts/{category}/activate` - Reactivate prompt

### Admin Interface

Access the admin interface at: `http://localhost:8000/admin.html`

Features:
- View all prompts with status
- Edit prompt titles and content
- Activate/deactivate prompts
- Real-time statistics

### API Documentation

Interactive API documentation available at: `http://localhost:8000/docs`

## Default Prompts

The system initializes with 6 default prompt categories:

1. **roadmap** - Product roadmap analysis
2. **vulnerabilities** - Security and vulnerability assessment
3. **teamAssignments** - Team assignment recommendations
4. **newFeatures** - New feature suggestions
5. **technicalDebt** - Technical debt analysis
6. **performance** - Performance optimization

## Database Schema

```sql
CREATE TABLE prompts (
    id INTEGER PRIMARY KEY,
    category VARCHAR UNIQUE,
    title VARCHAR,
    prompt TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME,
    updated_at DATETIME
);
```

## Integration with Next.js

The Next.js application fetches prompts from this backend using the `/prompts` endpoint, which returns only active prompts organized by category.

Example response:
```json
{
  "prompts": {
    "roadmap": {
      "title": "Product Roadmap Analysis",
      "prompt": "Analyze the repository data..."
    },
    "vulnerabilities": {
      "title": "Security & Vulnerability Assessment", 
      "prompt": "Analyze the repository for potential security issues..."
    }
  }
}
```

## Development

### Adding New Prompt Categories

1. Add the new category to the default prompts in `main.py`
2. Update the Next.js frontend to handle the new category
3. Restart the backend to initialize the new prompt

### Customizing Prompts

Use the admin interface or API to modify existing prompts without code changes.

## Production Deployment

For production deployment:

1. Use a production database (PostgreSQL, MySQL)
2. Set `RELOAD=false` in environment variables
3. Use a production ASGI server like Gunicorn
4. Set up proper CORS origins
5. Add authentication/authorization if needed

Example production command:
```bash
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```
