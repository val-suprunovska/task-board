# Task Management Boards
## 🎯 Project Description
Task Board is a modern web application for task management using the Kanban methodology. The application allows you to create projects, add tasks, and drag them between columns (To Do, In Progress, Done) using an intuitive drag&drop interface.

## ✨ Features
- 📋 Project Management - create, edit, delete projects

- ✅ Kanban Board - three columns: To Do, In Progress, Done

- 🎯 Drag & Drop - drag tasks between columns

- 🔍 Project Search - by name, ID and description

- 📱 Responsive Design - works on any device

- ⚡ Instant Feedback - optimistic UI updates

- 🔐 Full Security - CORS, data validation, vulnerability protection

## 🛠️ Technology Stack
### Frontend
- React + TypeScript

- Vite - fast build tool

- Zustand - state management

- @dnd-kit - drag&drop library

- Tailwind CSS + shadcn/ui - styling

- Axios - HTTP client

### Backend
- Node.js + Express

- TypeScript

- MongoDB Atlas 

- CORS - secure requests

- dotenv - environment variables management

### DevOps
- Docker + Docker Compose

- GitHub Actions - CI/CD

- Vercel - frontend hosting

- Render - backend hosting

## 🚀 Quick Start
### 1. Clone the Repository
```bash
git clone https://github.com/val-suprunovska/task-board.git
cd task-board
```
### 2. Set Up Environment Variables
```bash
# Copy the template
cp .env.example .env

# Edit the .env file
# Add your MongoDB Atlas URI and other settings
```
### 3. Run with Docker (Recommended)
```bash
# Start all services
docker-compose up --build

# View logs
docker-compose logs

# Stop services
docker-compose down
```
### 4. Local Development without Docker
```bash
# Start backend
cd server
npm install
npm run dev

# Start frontend (in another terminal)
cd client
npm install
npm run dev
```
## 📁 Project Structure
```text
task-board/
├── client/                 # Frontend application
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── stores/       # Zustand stores
│   │   ├── api/          # API client
│   │   └── types/        # TypeScript types
│   ├── Dockerfile
│   └── package.json
├── server/                # Backend application
│   ├── src/
│   │   ├── controllers/  # Controllers
│   │   ├── routes/       # Routes
│   │   ├── models/       # MongoDB models
│   │   └── middleware/   # Middleware
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml     # Docker Compose configuration
├── .github/workflows/     # GitHub Actions
└── README.md
```
## 🌐 Deployment
### Frontend on Vercel
1. Import the client/ folder to Vercel

2. Set environment variable: VITE_API_URL

3. Automatic deployment on push to main branch

### Backend on Render
1. Create a new Web Service

2. Connect GitHub repository

3. Set environment variables:

    - `MONGODB_URI`

    - `PORT`

    - `NODE_ENV=production`

    - `CLIENT_URL` (your Vercel URL)

## 🔧 API Endpoints
### Projects
`GET /api/projects` - get all projects

`GET /api/projects/:id` - get project by ID

`GET /api/projects/:id/with-tasks` - project with tasks by status

`POST /api/projects` - create project

`DELETE /api/projects/:id` - delete project

### Tasks
`GET /api/tasks` - get all tasks

`POST /api/tasks` - create task

`PUT /api/tasks/:id` - update task

`PATCH /api/tasks/:id/move` - move task

`DELETE /api/tasks/:id` - delete task

## 🐳 Docker Commands
```bash
# Build and run
docker-compose up -d --build

# Stop services
docker-compose down

# Stop and remove volumes
docker-compose down -v

# View logs
docker-compose logs -f
docker-compose logs -f backend
docker-compose logs -f frontend

# Restart services
docker-compose restart

# Check status
docker-compose ps

# Execute commands in container
docker-compose exec backend sh
docker-compose exec frontend sh
```
## 📊 GitHub Actions
The project includes a CI/CD pipeline that:

- ✅ Checks TypeScript types

- ✅ Runs ESLint

- ✅ Builds the project

- ✅ Deploys to Vercel 

Build status is displayed on GitHub in the Actions section.

## 📝 Scripts
### Frontend
```bash
npm run dev      # Start dev server
npm run build    # Build for production
npm run lint     # Run ESLint
npm run preview  # Preview build
```
### Backend
```bash
npm run dev      # Start with nodemon (hot reload)
npm run build    # Build TypeScript
npm start        # Start production version
```