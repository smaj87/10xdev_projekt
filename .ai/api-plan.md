# REST API Plan

## 1. Resources
- User (`users` table)
- Category (`categories` table)
- List (`lists` table)
- Task (`tasks` table)
- List Collaborator (`list_collaborators` table)
- Error Log (`error_logs` table)
- User Session (`user_sessions` table)

## 2. Endpoints

### Authentication

#### Login User
- Method: POST
- URL: /api/auth/login
- Description: Authenticate and create a session
- Request Body:
  ```json
  { "email": "user@example.com", "password": "string" }
  ```
- Response (200):
  ```json
  { "sessionId": "uuid", "user": { "id": 123, "email": "...", "role": "user" } }
  ```
- Errors:
  - 401: Invalid credentials

#### Logout User
- Method: POST
- URL: /api/auth/logout
- Description: Invalidate current session
- Headers: Cookie: `sessionId=...` or Authorization: Bearer token
- Response (204)

### Users (Admin)

#### List Users (admin only)
- Method: GET
- URL: /api/admin/users
- Description: Retrieve all users with optional filters
- Query Params:
  - `role` (optional)
  - `is_blocked` (optional)
  - `page`, `limit` (pagination)
- Response (200):
  ```json
  { "users": [ { "id":...,"email":"...","role":"user","is_blocked":false } ], "page":1, "total":100 }
  ```

#### Update User Role / Blocking (admin only)
- Method: PATCH
- URL: /api/admin/users/{userId}
- Description: Change user role or block/unblock user
- Request Body (partial):
  ```json
  { "role": "admin" | "user", "is_blocked": true | false }
  ```
- Response (200): updated user object

### Categories

#### List Categories
- GET /api/categories
- Description: Retrieve all categories
- Response: 200, array of `{ id, name, color }`

#### Create Category (admin only)
- POST /api/categories
- Body: `{ "name": "Work", "color": "#3B82F6" }`
- Response: 201, created category
- Validation: name unique

#### Update Category (admin only)
- PATCH /api/categories/{id}
- Body: `{ "name"?, "color"? }`
- Response: 200

#### Delete Category (admin only)
- DELETE /api/categories/{id}
- Response: 204

### Lists

#### List User's Lists
- GET /api/lists
- Description: Retrieve active and/or archived lists for the current user
- Query Params:
  - `archived` (true|false)
  - `category_id`, `priority`, `due_date` (filters)
  - `sort_by` (title|due_date|priority|created_at), `order` (asc|desc)
  - `page`, `limit`
- Response: 200, paginated lists

#### Create List
- POST /api/lists
- Body:
  ```json
  {
    "title": "My List",
    "category_id": 1,
    "priority": "normal", // optional, default "normal"
    "due_date": "YYYY-MM-DD" // optional
  }
  ```
- Response: 201, created list
- Validation: title required, priority in [low,normal,high]

#### Get Single List
- GET /api/lists/{listId}
- Response: 200, list with tasks and collaborators

#### Update List
- PATCH /api/lists/{listId}
- Body: partial list fields including `is_archived`
- Response: 200
- Trigger: if `is_archived` changed to true, `archived_at` set by DB

#### Delete List (admin only, archived only)
- DELETE /api/lists/{listId}
- Response: 204

### Tasks

#### List Tasks in a List
- GET /api/lists/{listId}/tasks
- Query Params:
  - `status` filter
  - `sort_by` (sort_order|created_at), `order`
- Response: 200, array of tasks

#### Create Task
- POST /api/lists/{listId}/tasks
- Body: `{ "title":"Task title" }`
- Response: 201, created task (sort_order auto-assigned)

#### Update Task
- PATCH /api/tasks/{taskId}
- Body: `{ "title"?, "status"?, "sort_order"? }`
- Response: 200

#### Delete Task
- DELETE /api/tasks/{taskId}
- Response: 204

#### Reorder Tasks (Batch)
- PUT /api/lists/{listId}/tasks/reorder
- Body: `{ "order": [ { "id": 1, "position": 2 }, ... ] }`
- Response: 200

### Collaborators

#### Add Collaborator (admin only, owner only)
- POST /api/lists/{listId}/collaborators
- Body: `{ "user_id": 456 }`
- Response: 201
- Validation: user exists, not already collaborator
- 409 if already collaborator

#### Remove Collaborator (admin only, owner only)
- DELETE /api/lists/{listId}/collaborators/{collabId}
- Response: 204

#### List Collaborators
- GET /api/lists/{listId}/collaborators
- Response: array of `{ id, user_id, role, added_at }`

### Error Logs

#### Get Error Logs (Admin)
- GET /api/admin/error-logs
- Query Params: `user_id`, `status_code`, `endpoint`, `page`, `limit`
- Response: paginated logs

### Sessions

#### Refresh Session / Check
- GET /api/auth/session
- Response: 200, session info

## 3. Authentication and Authorization
- Mechanism: HTTP-only cookie `sessionId` on login, backed by `user_sessions` table
- Alternatively JWT Bearer token in Authorization header
- Middleware to load session and user
- Role-based access: Admin endpoints require `role == "admin"`.

## 4. Validation and Business Logic

### Validation
- `email`: valid format, unique
- `password`: min length 8
- `role`: must be `user` or `admin`
- `priority`: one of `[low, normal, high]`
- `status` for tasks: one of `[todo, in_progress, done]`
- `theme`: one of `[light, dark, system]`
- Date formats: ISO `YYYY-MM-DD` for due_date

### Business Logic
- Archiving list sets `is_archived` and database trigger sets `archived_at`
- Task sort order auto-assigned on insert; manual reordering via batch endpoint
- Collaborator cannot archive or delete list; enforced in authorization middleware
- Real-time updates via WebSocket channel per list using Sockette
- Error logging middleware captures non-2xx responses and writes to `error_logs`.
- Validation via native Fastify schema validation

---

*Assumptions:*
- Authentication via session cookies; alternative JWT support possible
- Real-time endpoints invoked separately via WebSocket service

