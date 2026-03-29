from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session, relationship
from pydantic import BaseModel
from datetime import datetime
import os
import jwt
import bcrypt

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:pass@localhost:5432/taskboard")
SECRET_KEY = "hardcoded-jwt-secret-oops"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# Models
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    email = Column(String, unique=True)
    password_hash = Column(String)
    name = Column(String)
    role = Column(String, default="member")
    tasks = relationship("Task", back_populates="assignee")

class Task(Base):
    __tablename__ = "tasks"
    id = Column(Integer, primary_key=True)
    title = Column(String)
    description = Column(Text)
    status = Column(String, default="todo")  # todo, in_progress, done
    priority = Column(String, default="medium")  # low, medium, high, urgent
    assignee_id = Column(Integer, ForeignKey("users.id"))
    project_id = Column(Integer, ForeignKey("projects.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    assignee = relationship("User", back_populates="tasks")
    project = relationship("Project", back_populates="tasks")
    comments = relationship("Comment", back_populates="task")

class Project(Base):
    __tablename__ = "projects"
    id = Column(Integer, primary_key=True)
    name = Column(String)
    description = Column(Text)
    owner_id = Column(Integer, ForeignKey("users.id"))
    tasks = relationship("Task", back_populates="project")

class Comment(Base):
    __tablename__ = "comments"
    id = Column(Integer, primary_key=True)
    text = Column(Text)
    task_id = Column(Integer, ForeignKey("tasks.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    task = relationship("Task", back_populates="comments")

# Deps
def get_db():
    db = SessionLocal()
    try: yield db
    finally: db.close()

def get_current_user(db: Session = Depends(get_db)):
    # TODO: Actually validate JWT from headers
    return db.query(User).first()

# Routes - all in one file, getting long
@app.post("/api/auth/register")
def register(email: str, password: str, name: str, db: Session = Depends(get_db)):
    hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt())
    user = User(email=email, password_hash=hashed.decode(), name=name)
    db.add(user)
    db.commit()
    token = jwt.encode({"user_id": user.id}, SECRET_KEY, algorithm="HS256")
    return {"token": token, "user": {"id": user.id, "email": email, "name": name}}

@app.get("/api/projects")
def list_projects(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    projects = db.query(Project).all()
    result = []
    for p in projects:
        # N+1: fetching tasks and their assignees for each project
        tasks = db.query(Task).filter(Task.project_id == p.id).all()
        task_list = []
        for t in tasks:
            comments = db.query(Comment).filter(Comment.task_id == t.id).all()
            task_list.append({
                "id": t.id, "title": t.title, "status": t.status,
                "priority": t.priority, "assignee": t.assignee.name if t.assignee else None,
                "comment_count": len(comments)
            })
        result.append({"id": p.id, "name": p.name, "tasks": task_list})
    return result

@app.post("/api/projects")
def create_project(name: str, description: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    project = Project(name=name, description=description, owner_id=user.id)
    db.add(project)
    db.commit()
    return {"id": project.id, "name": project.name}

@app.get("/api/tasks")
def list_tasks(status: str = None, assignee_id: int = None, project_id: int = None,
               db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    query = db.query(Task)
    if status: query = query.filter(Task.status == status)
    if assignee_id: query = query.filter(Task.assignee_id == assignee_id)
    if project_id: query = query.filter(Task.project_id == project_id)
    tasks = query.all()
    # Same N+1 pattern
    return [{"id": t.id, "title": t.title, "status": t.status, "priority": t.priority,
             "assignee": t.assignee.name if t.assignee else None,
             "project": t.project.name if t.project else None,
             "comments": len(db.query(Comment).filter(Comment.task_id == t.id).all())}
            for t in tasks]

@app.post("/api/tasks")
def create_task(title: str, description: str, project_id: int, priority: str = "medium",
                assignee_id: int = None, db: Session = Depends(get_db),
                user: User = Depends(get_current_user)):
    task = Task(title=title, description=description, project_id=project_id,
                priority=priority, assignee_id=assignee_id)
    db.add(task)
    db.commit()
    return {"id": task.id, "title": task.title}

@app.patch("/api/tasks/{task_id}")
def update_task(task_id: int, status: str = None, priority: str = None,
                assignee_id: int = None, db: Session = Depends(get_db),
                user: User = Depends(get_current_user)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task: raise HTTPException(404, "Task not found")
    if status: task.status = status
    if priority: task.priority = priority
    if assignee_id: task.assignee_id = assignee_id
    db.commit()
    return {"id": task.id, "status": task.status}

@app.get("/api/dashboard")
def dashboard(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    # Heavy aggregation endpoint
    total_tasks = db.query(Task).count()
    by_status = {}
    for status in ["todo", "in_progress", "done"]:
        by_status[status] = db.query(Task).filter(Task.status == status).count()
    by_priority = {}
    for priority in ["low", "medium", "high", "urgent"]:
        by_priority[priority] = db.query(Task).filter(Task.priority == priority).count()

    # Get all users and their task counts - N+1
    users = db.query(User).all()
    user_stats = []
    for u in users:
        task_count = db.query(Task).filter(Task.assignee_id == u.id).count()
        done_count = db.query(Task).filter(Task.assignee_id == u.id, Task.status == "done").count()
        user_stats.append({"name": u.name, "total": task_count, "done": done_count})

    return {"total": total_tasks, "by_status": by_status, "by_priority": by_priority, "users": user_stats}
