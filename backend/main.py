# File: backend/main.py
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional
import os

# Database setup
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./prompts.db")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Database Models
class Prompt(Base):
    __tablename__ = "prompts"
    
    id = Column(Integer, primary_key=True, index=True)
    category = Column(String, unique=True, index=True)
    title = Column(String)
    prompt = Column(Text)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# Pydantic Models
class PromptBase(BaseModel):
    category: str
    title: str
    prompt: str
    is_active: bool = True

class PromptCreate(PromptBase):
    pass

class PromptUpdate(BaseModel):
    title: Optional[str] = None
    prompt: Optional[str] = None
    is_active: Optional[bool] = None

class PromptResponse(PromptBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class PromptListResponse(BaseModel):
    prompts: dict

# FastAPI app
app = FastAPI(
    title="AI PM Prompt Management API",
    description="Backend API for managing AI prompts used in product management analysis",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Create tables
Base.metadata.create_all(bind=engine)

# Initialize default prompts
def init_default_prompts():
    db = SessionLocal()
    try:
        # Check if prompts already exist
        if db.query(Prompt).count() > 0:
            return
        
        default_prompts = [
            {
                "category": "roadmap",
                "title": "Product Roadmap Analysis",
                "prompt": """Analyze the repository data and provide strategic roadmap recommendations. Focus on:
1. Feature gaps based on commit patterns
2. Technical debt that should be prioritized
3. Performance improvements needed
4. User experience enhancements
5. Scalability considerations

Provide 3-5 roadmap items with titles, descriptions, priority levels (High/Medium/Low), and estimated effort."""
            },
            {
                "category": "vulnerabilities",
                "title": "Security & Vulnerability Assessment",
                "prompt": """Analyze the repository for potential security issues and vulnerabilities. Look for:
1. Security anti-patterns in commit messages
2. Dependencies that might have known vulnerabilities
3. Code patterns that could lead to security issues
4. Missing security best practices
5. Authentication and authorization concerns

Provide 3-5 security items with titles, descriptions, severity levels (Critical/High/Medium/Low), and specific recommendations."""
            },
            {
                "category": "teamAssignments",
                "title": "Team Assignment Recommendations",
                "prompt": """Based on the repository structure and commit patterns, recommend team assignments. Consider:
1. Code ownership patterns from commit history
2. Technology stack expertise requirements
3. Feature areas that need dedicated ownership
4. Cross-functional collaboration opportunities
5. Skill development needs

Provide 3-5 assignment recommendations with specific tasks, suggested team member roles, and reasoning."""
            },
            {
                "category": "newFeatures",
                "title": "New Feature Suggestions",
                "prompt": """Analyze the current functionality and suggest valuable new features. Consider:
1. User pain points that could be addressed
2. Market opportunities based on the tech stack
3. Integration possibilities with other tools
4. Performance and scalability improvements
5. User experience enhancements

Provide 3-5 feature suggestions with titles, descriptions, impact assessment (High/Medium/Low), and implementation complexity."""
            },
            {
                "category": "technicalDebt",
                "title": "Technical Debt Analysis",
                "prompt": """Identify technical debt and code quality issues. Look for:
1. Code duplication patterns
2. Outdated dependencies or patterns
3. Performance bottlenecks
4. Maintainability issues
5. Testing gaps

Provide 3-5 technical debt items with specific issues, descriptions, priority levels, and effort estimates."""
            },
            {
                "category": "performance",
                "title": "Performance Optimization",
                "prompt": """Analyze potential performance issues and optimization opportunities. Consider:
1. Database query optimization needs
2. Caching opportunities
3. Frontend performance improvements
4. API optimization potential
5. Resource usage optimization

Provide 3-5 performance recommendations with specific areas, descriptions, and optimization strategies."""
            }
        ]
        
        for prompt_data in default_prompts:
            prompt = Prompt(**prompt_data)
            db.add(prompt)
        
        db.commit()
        print("Default prompts initialized successfully!")
    except Exception as e:
        print(f"Error initializing default prompts: {e}")
        db.rollback()
    finally:
        db.close()

# Initialize prompts on startup
@app.on_event("startup")
async def startup_event():
    init_default_prompts()

# API Routes
@app.get("/")
async def root():
    return {"message": "AI PM Prompt Management API", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow()}

@app.get("/prompts", response_model=PromptListResponse)
async def get_prompts(db: Session = Depends(get_db)):
    """Get all active prompts organized by category"""
    prompts = db.query(Prompt).filter(Prompt.is_active == True).all()
    
    prompt_dict = {}
    for prompt in prompts:
        prompt_dict[prompt.category] = {
            "title": prompt.title,
            "prompt": prompt.prompt
        }
    
    return PromptListResponse(prompts=prompt_dict)

@app.get("/prompts/all", response_model=List[PromptResponse])
async def get_all_prompts(db: Session = Depends(get_db)):
    """Get all prompts (including inactive) for admin management"""
    return db.query(Prompt).all()

@app.get("/prompts/{category}", response_model=PromptResponse)
async def get_prompt_by_category(category: str, db: Session = Depends(get_db)):
    """Get a specific prompt by category"""
    prompt = db.query(Prompt).filter(Prompt.category == category).first()
    if not prompt:
        raise HTTPException(status_code=404, detail="Prompt not found")
    return prompt

@app.post("/prompts", response_model=PromptResponse)
async def create_prompt(prompt: PromptCreate, db: Session = Depends(get_db)):
    """Create a new prompt"""
    # Check if category already exists
    existing = db.query(Prompt).filter(Prompt.category == prompt.category).first()
    if existing:
        raise HTTPException(status_code=400, detail="Category already exists")
    
    db_prompt = Prompt(**prompt.dict())
    db.add(db_prompt)
    db.commit()
    db.refresh(db_prompt)
    return db_prompt

@app.put("/prompts/{category}", response_model=PromptResponse)
async def update_prompt(category: str, prompt_update: PromptUpdate, db: Session = Depends(get_db)):
    """Update an existing prompt"""
    prompt = db.query(Prompt).filter(Prompt.category == category).first()
    if not prompt:
        raise HTTPException(status_code=404, detail="Prompt not found")
    
    update_data = prompt_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(prompt, field, value)
    
    prompt.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(prompt)
    return prompt

@app.delete("/prompts/{category}")
async def delete_prompt(category: str, db: Session = Depends(get_db)):
    """Delete a prompt (soft delete by setting is_active to False)"""
    prompt = db.query(Prompt).filter(Prompt.category == category).first()
    if not prompt:
        raise HTTPException(status_code=404, detail="Prompt not found")
    
    prompt.is_active = False
    prompt.updated_at = datetime.utcnow()
    db.commit()
    return {"message": "Prompt deactivated successfully"}

@app.post("/prompts/{category}/activate")
async def activate_prompt(category: str, db: Session = Depends(get_db)):
    """Reactivate a deactivated prompt"""
    prompt = db.query(Prompt).filter(Prompt.category == category).first()
    if not prompt:
        raise HTTPException(status_code=404, detail="Prompt not found")
    
    prompt.is_active = True
    prompt.updated_at = datetime.utcnow()
    db.commit()
    return {"message": "Prompt activated successfully"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
