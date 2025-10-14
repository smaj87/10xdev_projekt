# Proof of Concept Generator Prompt - Tasks Application

## Project Overview
Generate a proof of concept for a simple TODO task management web application called "Tasks". This PoC should demonstrate core task management functionality while excluding advanced features to validate the basic concept.

## Required Technology Stack
- **Frontend**: Preact 10, Redux 5, Redux-Thunk, TypeScript 5, TailwindCSS 4, Shadcn/ui components
- **Backend**: Node.js 20, Fastify 5, SQLite 3
- **Target**: Desktop browsers (>=1024px width)

## Core Features for PoC (Essential Only)
Focus ONLY on these fundamental features:

### 1. Basic Task Management
- Create new tasks with title/description
- Edit existing tasks
- Delete tasks
- Mark tasks as complete/incomplete
- View list of all tasks

### 2. Task Status Management
- Three statuses: Not Started, In Progress, Completed
- Visual status indicators
- Filter tasks by status

### 3. Simple UI
- Clean, responsive interface (desktop-focused)
- Basic light theme only (no dark mode for PoC)
- Task list view with add/edit/delete controls
- Status toggle buttons

### 4. Data Persistence
- No user authentication (single user for PoC)
- Date in localStorage

## Explicitly EXCLUDE from PoC
- User registration/authentication
- Multiple task lists
- Task categories, priorities, or due dates
- Real-time synchronization/WebSockets
- User collaboration/sharing
- Archive functionality
- Admin panel
- Dark mode theme
- Error logging to database
- Drag and drop reordering

## Technical Requirements
- Use TypeScript for type safety
- Implement Redux for state management
- Use Shadcn/ui components for consistent UI
- RESTful API with proper HTTP methods
- Simple SQLite schema (single tasks table)
- Responsive design for desktop screens

## Important Instructions
**BEFORE starting development, please:**
1. Create a detailed work plan breaking down the implementation into logical phases
2. Outline the database schema and API endpoints you plan to create
3. Describe the component structure and Redux store design
4. Estimate time for each phase
5. **Wait for my approval of the plan before proceeding with actual code generation**

This approach ensures we're aligned on the scope and implementation strategy before investing time in development. The PoC should be minimal but functional, proving that the core task management concept works effectively with our chosen technology stack.

Focus on simplicity and core functionality rather than completeness - this is about validating the basic concept, not building a production-ready application.
