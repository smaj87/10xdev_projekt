# API Endpoint Implementation Plan: Tasks Management

## 1. Przegląd punktu końcowego

Implementacja endpointów REST API do zarządzania zadaniami (tasks) w aplikacji Tasks Manager. System umożliwia:
- Tworzenie lub aktualizację zadań (upsert) w ramach list
- Usuwanie zadań
- Hurtową zmianę kolejności zadań w liście

Każde zadanie jest powiązane z konkretną listą i może być modyfikowane tylko przez właściciela listy lub jej współpracowników.

**Endpoint PUT** działa jako upsert:
- Bez `taskId` - tworzy nowe zadanie (201)
- Z `taskId` - aktualizuje istniejące zadanie (200)

## 2. Szczegóły żądania

### 2.1 Upsert Task - PUT /api/lists/{listId}/tasks

**Metoda HTTP:** PUT  
**Struktura URL:** `/api/lists/:listId/tasks`

Ten endpoint obsługuje zarówno tworzenie nowych zadań, jak i aktualizację istniejących (upsert pattern).

**Parametry:**
- **Wymagane:**
  - `listId` (path parameter) - ID listy, integer > 0
  - `title` (body) - tytuł zadania, string, 1-500 znaków
- **Opcjonalne:**
  - `taskId` (body) - ID zadania, integer > 0 (jeśli podane = aktualizacja, jeśli brak = utworzenie)
  - `status` (body) - status zadania, enum: 'todo' | 'in_progress' | 'done'
  - `sort_order` (body) - kolejność sortowania, integer >= 0

**Request Body (tworzenie - bez taskId):**
```json
{
  "title": "Nowe zadanie"
}
```

**Request Body (aktualizacja - z taskId):**
```json
{
  "taskId": 15,
  "title": "Zaktualizowany tytuł",
  "status": "in_progress",
  "sort_order": 5
}
```

**Walidacja:**
- `listId` musi być liczbą całkowitą dodatnią
- `title` jest wymagany i musi zawierać 1-500 znaków
- `taskId` - jeśli podany, musi być liczbą całkowitą dodatnią
- `status` - jeśli podany, musi być jedną z wartości: 'todo', 'in_progress', 'done'
- `sort_order` - jeśli podany, musi być >= 0
- Lista o podanym `listId` musi istnieć
- Użytkownik musi mieć dostęp do listy (owner lub collaborator)
- **Jeśli `taskId` podane:**
  - Zadanie musi istnieć
  - Zadanie musi należeć do podanej listy
  - Użytkownik musi mieć dostęp do zadania

---

### 2.2 Delete Task - DELETE /api/tasks/{taskId}

**Metoda HTTP:** DELETE  
**Struktura URL:** `/api/tasks/:taskId`

**Parametry:**
- **Wymagane:**
  - `taskId` (path parameter) - ID zadania, integer > 0
- **Opcjonalne:** brak

**Request Body:** brak

**Walidacja:**
- `taskId` musi być liczbą całkowitą dodatnią
- Zadanie musi istnieć
- Użytkownik musi mieć dostęp do listy zawierającej zadanie

---

### 2.3 Reorder Tasks - PUT /api/lists/{listId}/tasks/reorder

**Metoda HTTP:** PUT  
**Struktura URL:** `/api/lists/:listId/tasks/reorder`

**Parametry:**
- **Wymagane:**
  - `listId` (path parameter) - ID listy, integer > 0
  - `order` (body) - tablica obiektów określających nową kolejność

**Request Body:**
```json
{
  "order": [
    { "id": 1, "position": 0 },
    { "id": 3, "position": 1 },
    { "id": 2, "position": 2 }
  ]
}
```

**Walidacja:**
- `listId` musi być liczbą całkowitą dodatnią
- `order` musi być niepustą tablicą
- Każdy element tablicy musi zawierać:
  - `id` - integer > 0 (ID zadania)
  - `position` - integer >= 0 (nowa pozycja)
- Wszystkie zadania muszą należeć do podanej listy
- Lista musi istnieć
- Użytkownik musi mieć dostęp do listy
- Pozycje muszą być unikalne w ramach jednego requestu

## 3. Wykorzystywane typy

### 3.1 DTOs (Data Transfer Objects)

```typescript
// TaskDTO - reprezentacja zadania w odpowiedzi API
interface TaskDTO {
  id: number;
  list_id: number;
  title: string;
  status: 'todo' | 'in_progress' | 'done';
  sort_order: number;
  created_at: string; // ISO 8601 format
  updated_at: string; // ISO 8601 format
}

// TaskListItemDTO - uproszczona reprezentacja (jeśli potrzebna)
interface TaskListItemDTO {
  id: number;
  title: string;
  status: 'todo' | 'in_progress' | 'done';
  sort_order: number;
}
```

### 3.2 Command Models

```typescript
// UpsertTaskCommand - dane do utworzenia lub aktualizacji zadania
interface UpsertTaskCommand {
  taskId?: number; // jeśli podane = aktualizacja, jeśli brak = utworzenie
  title: string; // 1-500 znaków
  status?: 'todo' | 'in_progress' | 'done';
  sort_order?: number; // >= 0
}

// ReorderTaskItemCommand - pojedynczy element przy zmianie kolejności
interface ReorderTaskItemCommand {
  id: number; // ID zadania
  position: number; // nowa pozycja >= 0
}

// ReorderTasksCommand - dane do hurtowej zmiany kolejności
interface ReorderTasksCommand {
  order: ReorderTaskItemCommand[];
}
```

### 3.3 Schematy walidacji Fastify

```javascript
// Schema dla PUT /api/lists/{listId}/tasks (upsert)
const upsertTaskSchema = {
  params: {
    type: 'object',
    required: ['listId'],
    properties: {
      listId: { type: 'integer', minimum: 1 }
    }
  },
  body: {
    type: 'object',
    required: ['title'],
    properties: {
      taskId: { type: 'integer', minimum: 1 }, // opcjonalne - jeśli podane = update
      title: { type: 'string', minLength: 1, maxLength: 500 },
      status: { type: 'string', enum: ['todo', 'in_progress', 'done'] },
      sort_order: { type: 'integer', minimum: 0 }
    }
  }
};

// Schema dla DELETE /api/tasks/{taskId}
const deleteTaskSchema = {
  params: {
    type: 'object',
    required: ['taskId'],
    properties: {
      taskId: { type: 'integer', minimum: 1 }
    }
  }
};

// Schema dla PUT /api/lists/{listId}/tasks/reorder
const reorderTasksSchema = {
  params: {
    type: 'object',
    required: ['listId'],
    properties: {
      listId: { type: 'integer', minimum: 1 }
    }
  },
  body: {
    type: 'object',
    required: ['order'],
    properties: {
      order: {
        type: 'array',
        minItems: 1,
        items: {
          type: 'object',
          required: ['id', 'position'],
          properties: {
            id: { type: 'integer', minimum: 1 },
            position: { type: 'integer', minimum: 0 }
          }
        }
      }
    }
  }
};
```

## 4. Szczegóły odpowiedzi

### 4.1 PUT /api/lists/{listId}/tasks (upsert)

**Sukces - Utworzenie (201 Created):**
Gdy `taskId` nie jest podane w body - tworzone jest nowe zadanie.

```json
{
  "id": 15,
  "list_id": 5,
  "title": "Nowe zadanie",
  "status": "todo",
  "sort_order": 3,
  "created_at": "2025-10-30T10:30:00.000Z",
  "updated_at": "2025-10-30T10:30:00.000Z"
}
```

**Sukces - Aktualizacja (200 OK):**
Gdy `taskId` jest podane w body - aktualizowane jest istniejące zadanie.

```json
{
  "id": 15,
  "list_id": 5,
  "title": "Zaktualizowany tytuł",
  "status": "in_progress",
  "sort_order": 5,
  "created_at": "2025-10-30T10:30:00.000Z",
  "updated_at": "2025-10-30T11:45:00.000Z"
}
```

**Błędy:**
- 400 Bad Request - nieprawidłowe dane (np. pusty tytuł, nieprawidłowy status)
- 401 Unauthorized - brak uwierzytelnienia
- 403 Forbidden - brak dostępu do listy/zadania
- 404 Not Found - lista nie istnieje lub zadanie nie istnieje (przy aktualizacji)
- 409 Conflict - zadanie o podanym taskId nie należy do podanej listy
- 500 Internal Server Error - błąd serwera/bazy danych

---

### 4.2 DELETE /api/tasks/{taskId}

**Sukces (204 No Content):**
Brak treści odpowiedzi

**Błędy:**
- 401 Unauthorized - brak uwierzytelnienia
- 403 Forbidden - brak dostępu do zadania
- 404 Not Found - zadanie nie istnieje
- 500 Internal Server Error - błąd serwera/bazy danych

---

### 4.3 PUT /api/lists/{listId}/tasks/reorder

**Sukces (200 OK):**
```json
{
  "success": true,
  "updated": 3
}
```

**Błędy:**
- 400 Bad Request - nieprawidłowe dane (np. pusta tablica, duplikaty pozycji)
- 401 Unauthorized - brak uwierzytelnienia
- 403 Forbidden - brak dostępu do listy
- 404 Not Found - lista nie istnieje lub któreś z zadań nie należy do listy
- 500 Internal Server Error - błąd serwera/bazy danych

## 5. Przepływ danych

### 5.1 Upsert Task (PUT)

#### Scenariusz A: Utworzenie zadania (bez taskId)

```
1. Request → Fastify → Walidacja schematu
2. Middleware uwierzytelniania → pobranie user_id
3. Sprawdzenie czy taskId w body → NIE
4. Task Service → weryfikacja dostępu do listy
   - Sprawdzenie czy lista istnieje
   - Sprawdzenie czy user jest owner lub collaborator
5. Task Service → utworzenie zadania w bazie
   - INSERT INTO tasks (list_id, title, status, sort_order)
   - sort_order ustawiany automatycznie (lub z body jeśli podany)
6. Task Service → pobranie utworzonego zadania
7. Response → 201 + TaskDTO
```

**Interakcje z bazą danych:**
```sql
-- Weryfikacja dostępu do listy
SELECT l.id, l.owner_id 
FROM lists l 
LEFT JOIN list_collaborators lc ON l.id = lc.list_id 
WHERE l.id = ? AND (l.owner_id = ? OR lc.user_id = ?)

-- Utworzenie zadania
INSERT INTO tasks (list_id, title, status, sort_order) 
VALUES (?, ?, COALESCE(?, 'todo'), COALESCE(?, 0))

-- Pobranie utworzonego zadania
SELECT * FROM tasks WHERE id = ?
```

#### Scenariusz B: Aktualizacja zadania (z taskId)

```
1. Request → Fastify → Walidacja schematu
2. Middleware uwierzytelniania → pobranie user_id
3. Sprawdzenie czy taskId w body → TAK
4. Task Service → weryfikacja zadania
   - Sprawdzenie czy zadanie istnieje
   - Sprawdzenie czy zadanie należy do podanej listy
   - Sprawdzenie czy user ma dostęp do listy
5. Task Service → aktualizacja zadania
   - UPDATE przesłanych pól
   - Trigger automatycznie aktualizuje updated_at
6. Task Service → pobranie zaktualizowanego zadania
7. Response → 200 + TaskDTO
```

**Interakcje z bazą danych:**
```sql
-- Pobranie zadania z weryfikacją dostępu
SELECT t.*, l.owner_id 
FROM tasks t 
JOIN lists l ON t.list_id = l.id 
LEFT JOIN list_collaborators lc ON l.id = lc.list_id 
WHERE t.id = ? AND t.list_id = ? AND (l.owner_id = ? OR lc.user_id = ?)

-- Aktualizacja zadania
UPDATE tasks 
SET title = ?, 
    status = COALESCE(?, status), 
    sort_order = COALESCE(?, sort_order) 
WHERE id = ?

-- Pobranie zaktualizowanego zadania
SELECT * FROM tasks WHERE id = ?
```

---

### 5.2 Delete Task (DELETE)

```
1. Request → Fastify → Walidacja schematu
2. Middleware uwierzytelniania → pobranie user_id
3. Task Service → weryfikacja dostępu do zadania
   - Pobranie zadania wraz z list_id
   - Sprawdzenie czy user ma dostęp do listy
4. Task Service → usunięcie zadania
   - DELETE FROM tasks WHERE id = ?
5. Response → 204 No Content
```

**Interakcje z bazą danych:**
```sql
-- Weryfikacja dostępu (jak w UPDATE)
SELECT t.*, l.owner_id 
FROM tasks t 
JOIN lists l ON t.list_id = l.id 
LEFT JOIN list_collaborators lc ON l.id = lc.list_id 
WHERE t.id = ? AND (l.owner_id = ? OR lc.user_id = ?)

-- Usunięcie zadania
DELETE FROM tasks WHERE id = ?
```

---

### 5.3 Reorder Tasks (PUT)

```
1. Request → Fastify → Walidacja schematu
2. Middleware uwierzytelniania → pobranie user_id
3. Task Service → weryfikacja dostępu do listy
4. Task Service → weryfikacja czy wszystkie zadania należą do listy
5. Task Service → transakcja bazodanowa
   - BEGIN TRANSACTION
   - UPDATE tasks SET sort_order = ? WHERE id = ? (dla każdego zadania)
   - COMMIT
6. Response → 200 + { success: true, updated: count }
```

**Interakcje z bazą danych:**
```sql
-- Weryfikacja dostępu do listy
SELECT l.id, l.owner_id 
FROM lists l 
LEFT JOIN list_collaborators lc ON l.id = lc.list_id 
WHERE l.id = ? AND (l.owner_id = ? OR lc.user_id = ?)

-- Weryfikacja że wszystkie zadania należą do listy
SELECT id FROM tasks WHERE id IN (?, ?, ...) AND list_id = ?

-- Transakcja aktualizacji (w pętli)
BEGIN TRANSACTION;
UPDATE tasks SET sort_order = ? WHERE id = ?;
UPDATE tasks SET sort_order = ? WHERE id = ?;
...
COMMIT;
```

## 6. Względy bezpieczeństwa

### 6.1 Uwierzytelnianie
- **Wymagane dla wszystkich endpointów**
- Middleware `auth.middleware.mjs` weryfikuje sesję użytkownika
- Brak tokenu → 401 Unauthorized
- Nieważny/wygasły token → 401 Unauthorized

### 6.2 Autoryzacja
- **Dostęp do operacji na zadaniach:**
  - Użytkownik musi być właścicielem listy (owner_id) LUB
  - Użytkownik musi być współpracownikiem (list_collaborators)
- **Weryfikacja na poziomie service:**
  ```javascript
  async verifyListAccess(listId, userId) {
    const list = await db.get(`
      SELECT l.id, l.owner_id 
      FROM lists l 
      LEFT JOIN list_collaborators lc ON l.id = lc.list_id 
      WHERE l.id = ? AND (l.owner_id = ? OR lc.user_id = ?)
    `, [listId, userId, userId]);
    
    if (!list) {
      throw new Error('Access denied');
    }
    return list;
  }
  ```
- Brak dostępu → 403 Forbidden

### 6.3 Walidacja danych wejściowych
- **Fastify Schema Validation** - automatyczna walidacja na poziomie routingu
- **Parametry URL** - tylko integer > 0
- **Title** - sanityzacja XSS, max 500 znaków
- **Status** - enum validation ('todo', 'in_progress', 'done')
- **Sort order** - integer >= 0
- **Reorder array** - walidacja unikalności pozycji

### 6.4 SQL Injection
- **Prepared statements** - wszystkie zapytania używają parametryzowanych query
- Brak konkatenacji stringów w SQL
- Biblioteka `better-sqlite3` automatycznie escapuje parametry

### 6.5 XSS Protection
- Sanityzacja `title` przed zapisem do bazy
- Escape HTML entities w treści zadania
- Content-Type: application/json dla wszystkich odpowiedzi

### 6.6 Rate Limiting
- Implementacja na poziomie middleware Fastify
- Limit requestów per użytkownik/IP
- Szczególnie ważne dla POST/PUT/PATCH

### 6.7 CORS
- Konfiguracja CORS na poziomie Fastify
- Whitelist dozwolonych origin
- Credentials: true dla sesji

### 6.8 Blocked Users
- Sprawdzenie czy użytkownik nie jest zablokowany (is_blocked)
- Middleware powinien weryfikować status użytkownika przy każdym requeście
- Zablokowany użytkownik → 403 Forbidden

## 7. Obsługa błędów

### 7.1 Kody błędów i scenariusze

#### 400 Bad Request
**Scenariusze:**
- Pusty tytuł zadania
- Tytuł dłuższy niż 500 znaków
- Nieprawidłowy format status ('completed' zamiast 'done')
- Ujemny sort_order
- Pusta tablica order przy reorder
- Duplikaty pozycji przy reorder
- Nieprawidłowy format danych (np. string zamiast integer)

**Odpowiedź:**
```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Validation failed: title must be between 1 and 500 characters"
}
```

---

#### 401 Unauthorized
**Scenariusze:**
- Brak tokenu sesji
- Nieprawidłowy token sesji
- Wygasła sesja
- Token nienależący do żadnego użytkownika

**Odpowiedź:**
```json
{
  "statusCode": 401,
  "error": "Unauthorized",
  "message": "Authentication required"
}
```

---

#### 403 Forbidden
**Scenariusze:**
- Użytkownik nie jest właścicielem ani współpracownikiem listy
- Próba modyfikacji zadania z listy innego użytkownika
- Użytkownik jest zablokowany (is_blocked = true)

**Odpowiedź:**
```json
{
  "statusCode": 403,
  "error": "Forbidden",
  "message": "You don't have access to this resource"
}
```

---

#### 404 Not Found
**Scenariusze:**
- Lista o podanym ID nie istnieje
- Zadanie o podanym ID nie istnieje
- Jedno z zadań w reorder nie należy do podanej listy

**Odpowiedź:**
```json
{
  "statusCode": 404,
  "error": "Not Found",
  "message": "Task not found"
}
```

---

#### 409 Conflict
**Scenariusze:**
- Zadanie o podanym taskId nie należy do podanej listy (przy aktualizacji)
- Konflikt przy reorder - pozycje się nakładają
- Próba ustawienia tego samego sort_order dla wielu zadań jednocześnie

**Odpowiedź:**
```json
{
  "statusCode": 409,
  "error": "Conflict",
  "message": "Task does not belong to the specified list"
}
```

---

#### 500 Internal Server Error
**Scenariusze:**
- Błąd bazy danych (np. connection timeout)
- Nieobsłużony wyjątek w kodzie
- Błąd transakcji przy reorder
- Błąd triggera SQLite

**Odpowiedź:**
```json
{
  "statusCode": 500,
  "error": "Internal Server Error",
  "message": "An unexpected error occurred"
}
```

### 7.2 Logowanie błędów

Wszystkie błędy powinny być logowane do tabeli `error_logs`:

```javascript
async logError(userId, endpoint, method, statusCode, errorMessage, requestData) {
  await db.run(`
    INSERT INTO error_logs 
    (user_id, endpoint, method, status_code, error_message, request_data, user_agent) 
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `, [
    userId || null,
    endpoint,
    method,
    statusCode,
    errorMessage,
    JSON.stringify(requestData),
    request.headers['user-agent']
  ]);
}
```

**Logować należy:**
- Wszystkie błędy 4xx (oprócz 401 - ze względu na prywatność)
- Wszystkie błędy 5xx
- Request body (z pominięciem wrażliwych danych)
- User agent
- Timestamp (automatycznie przez created_at)

### 7.3 Error Handler Middleware

Globalny error handler powinien:
1. Przechwytywać wszystkie nieobsłużone błędy
2. Logować do error_logs
3. Zwracać odpowiedni format odpowiedzi
4. Nie ujawniać szczegółów implementacji w production
5. W development - zwracać stack trace

## 8. Rozważania dotyczące wydajności

### 8.1 Indeksowanie bazy danych

**Istniejące indeksy (z db-plan.md):**
```sql
CREATE INDEX idx_tasks_list_id ON tasks(list_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_sort_order ON tasks(sort_order);
CREATE INDEX idx_tasks_created_at ON tasks(created_at);
```

**Dodatkowe indeksy do rozważenia:**
```sql
-- Composite index dla częstych zapytań list + sort_order
CREATE INDEX idx_tasks_list_sort ON tasks(list_id, sort_order);
```

### 8.2 Query Optimization

**Optymalizacje:**
- Używać `SELECT *` tylko gdy potrzebne wszystkie kolumny
- Joinować list_collaborators tylko raz przy weryfikacji dostępu
- Cache'ować wynik weryfikacji dostępu w trakcie jednego requesta
- Limit + offset przy pobieraniu dużych list zadań (jeśli będzie endpoint GET)

**Przykład zoptymalizowanego query:**
```sql
-- Zamiast dwóch osobnych zapytań, jedno z LEFT JOIN
SELECT t.* 
FROM tasks t 
JOIN lists l ON t.list_id = l.id 
LEFT JOIN list_collaborators lc ON l.id = lc.list_id AND lc.user_id = ?
WHERE t.id = ? AND (l.owner_id = ? OR lc.user_id IS NOT NULL)
```

### 8.3 Transakcje

**Reorder tasks - transakcja:**
```javascript
// Użyć transakcji dla spójności danych
db.transaction(() => {
  for (const item of order) {
    db.run('UPDATE tasks SET sort_order = ? WHERE id = ?', 
      [item.position, item.id]);
  }
})();
```

**Korzyści:**
- Atomowość - albo wszystkie updates się wykonają, albo żaden
- Izolacja - inne requesty nie widzą częściowych zmian
- Spójność - dane zawsze w prawidłowym stanie

### 8.4 N+1 Query Problem

**Unikać:**
```javascript
// ŹLE - N+1 queries
for (const taskId of taskIds) {
  await db.get('SELECT * FROM tasks WHERE id = ?', taskId);
}

// DOBRZE - jeden query
await db.all('SELECT * FROM tasks WHERE id IN (?, ?, ?)', taskIds);
```

### 8.5 Connection Pooling

- Better-sqlite3 używa synchronicznych operacji
- Każdy request używa tej samej instancji DB
- Rozważyć connection pooling jeśli będzie dużo concurrent requestów
- Monitoring czasu odpowiedzi query

### 8.6 Caching

**Co można cache'ować:**
- Wynik weryfikacji dostępu do listy (na czas trwania requesta)
- Metadane użytkownika (role, is_blocked) - krótki TTL

**Nie cache'ować:**
- Samych zadań (często się zmieniają)
- Sort order (zmienia się przy każdym reorder)

### 8.7 Pagination

Jeśli lista będzie miała endpoint GET dla wszystkich zadań:
```javascript
// Implementować pagination
fastify.get('/api/lists/:listId/tasks', {
  schema: {
    querystring: {
      limit: { type: 'integer', default: 50, maximum: 100 },
      offset: { type: 'integer', default: 0, minimum: 0 }
    }
  }
}, async (request, reply) => {
  const { limit, offset } = request.query;
  // SELECT * FROM tasks WHERE list_id = ? LIMIT ? OFFSET ?
});
```

### 8.8 Monitoring

**Metryki do monitorowania:**
- Średni czas odpowiedzi per endpoint
- Liczba requestów per endpoint
- Częstotliwość błędów 5xx
- Rozmiar request/response payload
- Czas wykonania SQL queries

## 9. Etapy wdrożenia

### Krok 1: Utworzenie Task Service

**Plik:** `server/services/task.service.mjs`

**Zadania:**
1. Utworzyć nowy plik service
2. Zaimportować instancję bazy danych
3. Zaimplementować metody:
   - `verifyListAccess(listId, userId)` - weryfikacja dostępu do listy
   - `verifyTaskAccess(taskId, userId)` - weryfikacja dostępu do zadania
   - `upsertTask(listId, userId, data)` - utworzenie lub aktualizacja zadania (upsert)
   - `deleteTask(taskId, userId)` - usunięcie zadania
   - `reorderTasks(listId, userId, order)` - zmiana kolejności zadań
   - `getTaskById(taskId)` - pobranie zadania po ID

**Przykładowa struktura:**
```javascript
import db from '../db/database.mjs';

class TaskService {
  async verifyListAccess(listId, userId) {
    // Implementacja weryfikacji dostępu
  }
  
  async upsertTask(listId, userId, { taskId, title, status, sort_order }) {
    // Weryfikacja dostępu do listy
    
    if (taskId) {
      // AKTUALIZACJA - sprawdź czy zadanie należy do listy
      // UPDATE tasks SET ... WHERE id = ?
      // Zwróć zaktualizowane zadanie
    } else {
      // UTWORZENIE
      // INSERT zadania
      // Zwróć utworzone zadanie
    }
  }
  
  // ... pozostałe metody
}

export default new TaskService();
```

---

### Krok 2: Utworzenie schematów walidacji

**Plik:** `server/routes/tasks.routes.mjs` (na początku pliku)

**Zadania:**
1. Zdefiniować schemat dla PUT /api/lists/{listId}/tasks (upsert)
2. Zdefiniować schemat dla DELETE /api/tasks/{taskId}
3. Zdefiniować schemat dla PUT /api/lists/{listId}/tasks/reorder

**Przykład:**
```javascript
const upsertTaskSchema = {
  params: {
    type: 'object',
    required: ['listId'],
    properties: {
      listId: { type: 'integer', minimum: 1 }
    }
  },
  body: {
    type: 'object',
    required: ['title'],
    properties: {
      taskId: { type: 'integer', minimum: 1 }, // opcjonalne
      title: { type: 'string', minLength: 1, maxLength: 500 },
      status: { type: 'string', enum: ['todo', 'in_progress', 'done'] },
      sort_order: { type: 'integer', minimum: 0 }
    }
  }
};

// ... pozostałe schematy
```

---

### Krok 3: Implementacja endpointu PUT /api/lists/{listId}/tasks (upsert)

**Plik:** `server/routes/tasks.routes.mjs`

**Zadania:**
1. Zaimportować task service
2. Zaimportować middleware uwierzytelniania
3. Zarejestrować route PUT
4. Dodać schemat walidacji
5. Implementować handler:
   - Pobrać userId z request.user
   - Sprawdzić czy taskId jest w body
   - Wywołać taskService.upsertTask()
   - Obsłużyć błędy (try-catch)
   - Zwrócić 201 (create) lub 200 (update) + zadanie

**Przykład:**
```javascript
import taskService from '../services/task.service.mjs';

export default async function (fastify) {
  fastify.put('/api/lists/:listId/tasks', {
    schema: upsertTaskSchema,
    preHandler: fastify.auth
  }, async (request, reply) => {
    try {
      const { listId } = request.params;
      const { taskId, title, status, sort_order } = request.body;
      const userId = request.user.id;
      
      const task = await taskService.upsertTask(listId, userId, { 
        taskId, title, status, sort_order 
      });
      
      // Jeśli taskId był podany = update (200), jeśli nie = create (201)
      const statusCode = taskId ? 200 : 201;
      reply.code(statusCode).send(task);
    } catch (error) {
      // Error handling
    }
  });
}
```

---

### Krok 4: Implementacja endpointu DELETE /api/tasks/{taskId}

**Plik:** `server/routes/tasks.routes.mjs`

**Zadania:**
1. Zarejestrować route DELETE
2. Dodać schemat walidacji
3. Implementować handler:
   - Pobrać userId z request.user
   - Wywołać taskService.deleteTask()
   - Obsłużyć błędy
   - Zwrócić 204 No Content

---

### Krok 5: Implementacja endpointu PUT /api/lists/{listId}/tasks/reorder

**Plik:** `server/routes/tasks.routes.mjs`

**Zadania:**
1. Zarejestrować route PUT
2. Dodać schemat walidacji
3. Implementować handler:
   - Pobrać userId z request.user
   - Walidować unikalność pozycji
   - Wywołać taskService.reorderTasks()
   - Obsłużyć błędy
   - Zwrócić 200 + potwierdzenie

---

### Krok 6: Implementacja obsługi błędów

**Pliki:** 
- `server/routes/tasks.routes.mjs` (try-catch w handlerach)
- `server/services/task.service.mjs` (rzucanie odpowiednich błędów)

**Zadania:**
1. W service - rzucać błędy z odpowiednimi komunikatami:
   - `throw { statusCode: 404, message: 'List not found' }`
   - `throw { statusCode: 403, message: 'Access denied' }`
2. W routes - przechwytywać błędy i mapować na kody HTTP:
```javascript
try {
  // ... handler logic
} catch (error) {
  if (error.statusCode) {
    reply.code(error.statusCode).send({
      statusCode: error.statusCode,
      error: error.error || 'Error',
      message: error.message
    });
  } else {
    // Log do error_logs
    reply.code(500).send({
      statusCode: 500,
      error: 'Internal Server Error',
      message: 'An unexpected error occurred'
    });
  }
}
```

---

### Krok 8: Implementacja logowania błędów

**Plik:** `server/services/errorLog.service.mjs` (jeśli nie istnieje)

**Zadania:**
1. Utworzyć service do logowania błędów
2. Zaimplementować metodę `logError()`
3. Zintegrować z error handlerami w routes

**Przykład:**
```javascript
// errorLog.service.mjs
import db from '../db/database.mjs';

class ErrorLogService {
  async logError(userId, endpoint, method, statusCode, errorMessage, requestData, userAgent) {
    await db.run(`
      INSERT INTO error_logs 
      (user_id, endpoint, method, status_code, error_message, request_data, user_agent) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      userId || null,
      endpoint,
      method,
      statusCode,
      errorMessage,
      JSON.stringify(requestData),
      userAgent
    ]);
  }
}

export default new ErrorLogService();
```

---

### Krok 9: Dodanie Method Not Allowed dla nieobsługiwanych metod

**Plik:** `server/routes/tasks.routes.mjs`

**Zadania:**
1. Zaimportować `methodNotAllowed` utility
2. Dodać obsługę dla każdego endpointu:

```javascript
import methodNotAllowed from '../utils/methodNotAllowed.mjs';

export default async function (fastify) {
  // ... rejestracja routes
  
  // Method not allowed handlers
  fastify.all('/api/lists/:listId/tasks', { 
    preHandler: methodNotAllowed(['POST']) 
  });
  
  fastify.all('/api/tasks/:taskId', { 
    preHandler: methodNotAllowed(['PATCH', 'DELETE']) 
  });
  
  fastify.all('/api/lists/:listId/tasks/reorder', { 
    preHandler: methodNotAllowed(['PUT']) 
  });
}
```

---

### Krok 10: Testy jednostkowe i integracyjne

**Plik:** `server/routes/tests/tasks.routes.test.mjs`

**Zadania:**
1. Utworzyć plik testowy
2. Testy dla każdego endpointu:
   - Sukces (201/200/204)
   - Błędy walidacji (400)
   - Brak uwierzytelnienia (401)
   - Brak dostępu (403)
   - Nie znaleziono (404)
3. Testy autoryzacji:
   - Owner może modyfikować
   - Collaborator może modyfikować
   - Obcy użytkownik nie może modyfikować
4. Testy edge cases:
   - Pusty title
   - Długi title (>500 znaków)
   - Nieprawidłowy status
   - Pusta tablica przy reorder
   - Duplikaty pozycji przy reorder

**Przykład struktury testu:**
```javascript
import { test } from 'tap';
import buildApp from '../../index.mjs';

test('POST /api/lists/:listId/tasks - success', async (t) => {
  const app = await buildApp();
  
  // Login jako użytkownik
  // Utworzenie listy
  // POST zadania
  // Sprawdzenie 201
  // Sprawdzenie zwróconego obiektu
  
  await app.close();
});

test('POST /api/lists/:listId/tasks - access denied', async (t) => {
  // Test braku dostępu
});

// ... pozostałe testy
```

---

### Krok 11: Dokumentacja API

**Plik:** `README.md` lub osobny plik dokumentacji

**Zadania:**
1. Dodać dokumentację endpointów Tasks
2. Przykłady requestów i responses
3. Kody błędów
4. Wymagania uwierzytelniania

---

### Krok 12: Code review i optymalizacja

**Zadania:**
1. Przejrzeć kod pod kątem:
   - Bezpieczeństwa (SQL injection, XSS)
   - Wydajności (N+1 queries, indeksy)
   - Czytelności (naming, komentarze)
   - DRY (powtarzający się kod)
2. Zmierzyć wydajność:
   - Czas odpowiedzi per endpoint
   - Czas wykonania SQL queries
3. Optymalizować wąskie gardła

---

### Krok 13: Deployment

**Zadania:**
1. Upewnić się że wszystkie testy przechodzą
2. Przetestować na środowisku staging
3. Zweryfikować integrację z frontendem
4. Zacommitować zmiany
5. Deploy na production
6. Monitoring po deployu:
   - Error rates
   - Response times
   - Database load

---

## Podsumowanie

Plan implementacji obejmuje pełny cykl tworzenia endpointów Tasks:
- **4 endpointy**: Create, Update, Delete, Reorder
- **Walidacja**: Fastify schema validation
- **Autoryzacja**: Owner + collaborators
- **Bezpieczeństwo**: Prepared statements, XSS protection
- **Wydajność**: Indeksy, transakcje, optymalizacja queries
- **Obsługa błędów**: Logowanie do error_logs, odpowiednie kody HTTP
- **Testy**: Jednostkowe i integracyjne

Implementacja powinna zająć około 2-3 dni roboczych przy założeniu, że infrastruktura (auth, database, middleware) jest już gotowa.

