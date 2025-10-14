# API Endpoint Implementation Plan: List Users (Admin)

## 1. Przegląd punktu końcowego

Endpoint `GET /api/admin/users` służy do pobierania listy wszystkich użytkowników systemu z możliwością filtrowania i paginacji. Jest to endpoint administracyjny, dostępny wyłącznie dla użytkowników z rolą `admin`. Umożliwia administratorom zarządzanie użytkownikami poprzez przeglądanie, filtrowanie po roli i statusie blokady oraz efektywne przewijanie wyników dzięki paginacji.

**Kluczowe funkcjonalności:**
- Pobieranie wszystkich użytkowników systemu
- Filtrowanie po roli (user/admin)
- Filtrowanie po statusie blokady (is_blocked)
- Paginacja wyników (page, limit)
- Ochrona dostępu - tylko administratorzy

## 2. Szczegóły żądania

- **Metoda HTTP:** GET
- **Struktura URL:** `/api/admin/users`
- **Nagłówki wymagane:**
  - `Cookie: sessionId=<uuid>`

### Parametry zapytania (Query Params):

#### Wymagane:
- Brak (wszystkie parametry są opcjonalne)

#### Opcjonalne:
- `role` (string): Filtruj użytkowników po roli
  - Możliwe wartości: `'user'`, `'admin'`
  - Przykład: `?role=admin`
  
- `is_blocked` (boolean): Filtruj użytkowników po statusie blokady
  - Możliwe wartości: `true`, `false`
  - Przykład: `?is_blocked=true`
  
- `page` (integer): Numer strony
  - Domyślna wartość: `1`
  - Minimalna wartość: `1`
  - Przykład: `?page=2`
  
- `limit` (integer): Liczba rekordów na stronę
  - Domyślna wartość: `20`
  - Minimalna wartość: `1`
  - Maksymalna wartość: brak limitu
  - Przykład: `?limit=50`

### Przykładowe zapytania:
```
GET /api/admin/users
GET /api/admin/users?role=admin
GET /api/admin/users?is_blocked=true&page=1&limit=10
GET /api/admin/users?role=user&page=2&limit=25
```

### Request Body:
Brak (metoda GET nie przyjmuje body)

## 3. Wykorzystywane typy

### GetUsersQueryDto
```typescript
interface GetUsersQueryDto {
  role?: 'user' | 'admin';
  is_blocked?: boolean;
  page?: number;
  limit?: number;
}
```

### UserResponseDto
```typescript
interface UserResponseDto {
  id: number;
  email: string;
  role: 'user' | 'admin';
  is_blocked: boolean;
  theme?: 'light' | 'dark' | 'system';
  created_at: string; // ISO 8601 datetime
  updated_at: string; // ISO 8601 datetime
}
```

**UWAGA:** Pole `password_hash` NIE jest zwracane w odpowiedzi ze względów bezpieczeństwa.

### PaginatedUsersResponseDto
```typescript
interface PaginatedUsersResponseDto {
  users: UserResponseDto[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
```

## 4. Szczegóły odpowiedzi

### Sukces (200 OK)
```json
{
  "users": [
    {
      "id": 1,
      "email": "admin@example.com",
      "role": "admin",
      "is_blocked": false,
      "theme": "dark",
      "created_at": "2025-01-01T10:00:00.000Z",
      "updated_at": "2025-01-15T14:30:00.000Z"
    },
    {
      "id": 2,
      "email": "user@example.com",
      "role": "user",
      "is_blocked": false,
      "theme": "light",
      "created_at": "2025-01-02T11:00:00.000Z",
      "updated_at": "2025-01-02T11:00:00.000Z"
    }
  ],
  "page": 1,
  "limit": 20,
  "total": 100,
  "totalPages": 5
}
```

### Błąd walidacji (400 Bad Request)
```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Invalid query parameters: page must be >= 1"
}
```

### Brak autoryzacji (401 Unauthorized)
```json
{
  "statusCode": 401,
  "error": "Unauthorized",
  "message": "Authentication required"
}
```

### Brak uprawnień (403 Forbidden)
```json
{
  "statusCode": 403,
  "error": "Forbidden",
  "message": "Admin role required"
}
```

### Błąd serwera (500 Internal Server Error)
```json
{
  "statusCode": 500,
  "error": "Internal Server Error",
  "message": "An error occurred while retrieving users"
}
```

## 5. Przepływ danych

### Sekwencja operacji:

1. **Odbiór żądania**
   - Fastify odbiera żądanie GET /api/admin/users
   - Parsowanie query params przez Fastify

2. **Walidacja zapytania**
   - Fastify schema validator sprawdza poprawność parametrów
   - Jeśli błąd: zwróć 400 Bad Request

3. **Uwierzytelnienie**
   - Middleware autoryzacyjny sprawdza sessionId z cookie lub token z Authorization
   - Pobiera dane użytkownika z `user_sessions` i `users`
   - Jeśli sesja nieważna: zwróć 401 Unauthorized

4. **Autoryzacja**
   - Middleware sprawdza czy `user.role === 'admin'`
   - Jeśli nie: zwróć 403 Forbidden

5. **Wywołanie serwisu**
   - Route handler wywołuje `UserService.getAllUsers(filters, pagination)`
   - Przekazuje query params jako filtry i paginację

6. **Zapytanie do bazy danych**
   - Service buduje zapytanie SQL z klauzulami WHERE dla filtrów
   - Wykonuje dwa zapytania:
     - `SELECT COUNT(*) FROM users WHERE ...` - dla total
     - `SELECT id, email, role, is_blocked, theme, created_at, updated_at FROM users WHERE ... LIMIT ? OFFSET ?` - dla danych
   - OFFSET = (page - 1) * limit

7. **Przetwarzanie wyników**
   - Service formatuje daty do ISO 8601
   - Oblicza totalPages = Math.ceil(total / limit)
   - Buduje obiekt PaginatedUsersResponseDto

8. **Zwrócenie odpowiedzi**
   - Route handler zwraca 200 OK z danymi
   - Fastify serializuje JSON i wysyła do klienta

9. **Logowanie (jeśli błąd)**
   - W przypadku błędu (5xx) middleware błędów loguje do `error_logs`
   - W przypadku błędu (4xx) middleware błędów loguje do `error_logs`

### Diagram przepływu:
```
Client → Fastify Router → Schema Validator → Auth Middleware → Admin Middleware
                                                                        ↓
Client ← JSON Response ← Format Response ← UserService.getAllUsers() ← SQLite DB
```

## 6. Względy bezpieczeństwa

### 6.1 Uwierzytelnienie
- **Wymóg:** Endpoint wymaga aktywnej sesji użytkownika
- **Mechanizm:** HTTP-only cookie `sessionId`
- **Implementacja:**
  - Middleware `authMiddleware` weryfikuje sesję przed dostępem do route
  - Sprawdza `user_sessions.expires_at > CURRENT_TIMESTAMP`
  - Ładuje dane użytkownika i dodaje do `request.user`

### 6.2 Autoryzacja
- **Wymóg:** Tylko użytkownicy z `role === 'admin'` mogą uzyskać dostęp
- **Implementacja:**
  - Middleware `requireAdmin` sprawdza `request.user.role`
  - Jeśli nie admin: zwraca 403 Forbidden i loguje próbę dostępu do `error_logs`

### 6.3 Ochrona danych wrażliwych
- **password_hash:** NIE MOŻE być zwracany w odpowiedzi
- **Implementacja:** Query SQL celowo pomija kolumnę `password_hash`
- Użyj `SELECT id, email, role, is_blocked, theme, created_at, updated_at` zamiast `SELECT *`

### 6.4 Walidacja danych wejściowych
- **Ochrona przed SQL injection:** Używaj parametryzowanych zapytań (prepared statements)
- **Walidacja typów:** Fastify schema validation dla wszystkich query params
- **Sanityzacja:** Wszystkie wartości są sprawdzane przed użyciem w zapytaniach

### 6.5 Rate Limiting
- **Zalecenie:** Implementacja rate limitingu dla endpointów admin
- **Przykład:** Max 100 requestów / 15 minut dla endpointów /api/admin/*
- **Mechanizm:** Fastify plugin `@fastify/rate-limit`

### 6.6 Logowanie dostępu
- **Logowanie prób nieautoryzowanego dostępu:**
  - 401 errors → `error_logs` z user_id (jeśli dostępny)
  - 403 errors → `error_logs` z user_id i szczegółami próby
- **Privacy:** Nie loguj wrażliwych danych użytkowników

### 6.7 CORS i Headers
- Endpoint powinien mieć odpowiednie CORS headers jeśli frontend na innej domenie
- Security headers: X-Content-Type-Options, X-Frame-Options

## 7. Obsługa błędów

### 7.1 Scenariusze błędów i kody stanu

#### 400 Bad Request
**Przyczyny:**
- `role` nie jest jednym z ['user', 'admin']
- `is_blocked` nie jest boolean
- `page` < 1 lub nie jest liczbą całkowitą
- `limit` < 1 lub > 100 lub nie jest liczbą całkowitą

**Przykład:**
```javascript
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "querystring/limit must be <= 100"
}
```

**Obsługa:** Fastify automatycznie zwraca 400 gdy schema validation fails

#### 401 Unauthorized
**Przyczyny:**
- Brak cookie sessionId lub Authorization header
- SessionId nieważny lub wygasły
- Użytkownik usunięty lub sesja unieważniona

**Przykład:**
```javascript
{
  "statusCode": 401,
  "error": "Unauthorized",
  "message": "Authentication required"
}
```

**Obsługa:** 
- Auth middleware zwraca 401
- NIE loguj do error_logs (to normalny przypadek)

#### 403 Forbidden
**Przyczyny:**
- Użytkownik zalogowany ale role !== 'admin'
- Użytkownik zablokowany (is_blocked = true)

**Przykład:**
```javascript
{
  "statusCode": 403,
  "error": "Forbidden",
  "message": "Admin role required"
}
```

**Obsługa:**
- Admin middleware zwraca 403
- LOGUJ do `error_logs` z user_id, endpoint, metadanymi

#### 500 Internal Server Error
**Przyczyny:**
- Błąd połączenia z bazą danych
- Błąd wykonania zapytania SQL
- Nieoczekiwany wyjątek w kodzie

**Przykład:**
```javascript
{
  "statusCode": 500,
  "error": "Internal Server Error",
  "message": "An error occurred while retrieving users"
}
```

**Obsługa:**
- Złap wyjątki try/catch w service i route handler
- LOGUJ szczegółowo do `error_logs`: stack trace, query, parametry
- Zwróć generyczną wiadomość klientowi (nie ujawniaj szczegółów)
- Alert dla devops/monitoring

### 7.2 Strategia logowania błędów

**Do `error_logs` loguj:**
- 403: Próby dostępu bez uprawnień admin
- 500: Wszystkie błędy serwerowe z pełnym stack trace

**Format logu:**
```javascript
{
  user_id: request.user?.id || null,
  endpoint: '/api/admin/users',
  method: 'GET',
  status_code: 500,
  error_message: error.message,
  request_data: JSON.stringify(request.query),
  response_data: null,
  user_agent: request.headers['user-agent']
}
```

### 7.3 Monitoring i alerty
- Ustaw monitoring dla 5xx errors (Sentry, LogRocket, etc.)
- Alert gdy rate 500 errors > threshold
- Dashboard z metrykami: liczba requestów, średni czas odpowiedzi, error rate

## 8. Rozważania dotyczące wydajności

### 8.1 Optymalizacja zapytań SQL

**Indeksy wykorzystywane:**
- `idx_users_role` dla filtrowania po `role`
- `idx_users_is_blocked` dla filtrowania po `is_blocked`
- `idx_users_email` dla ewentualnego sortowania

**Zapytanie zoptymalizowane:**
```sql
-- Zapytanie count (dla total)
SELECT COUNT(*) as total FROM users 
WHERE (role = ? OR ? IS NULL)
  AND (is_blocked = ? OR ? IS NULL);

-- Zapytanie danych (dla users)
SELECT id, email, role, is_blocked, theme, created_at, updated_at 
FROM users
WHERE (role = ? OR ? IS NULL)
  AND (is_blocked = ? OR ? IS NULL)
ORDER BY created_at DESC
LIMIT ? OFFSET ?;
```

**Uwaga:** Użycie `OR ? IS NULL` pozwala na opcjonalne filtry bez budowania dynamicznych zapytań

### 8.2 Paginacja

**Domyślne wartości:**
- `page = 1`
- `limit = 20` (optymalny balans między liczbą requestów a rozmiarem odpowiedzi)

**Maksymalny limit:**
- `limit <= 100` (zapobiega przeciążeniu serwera/sieci)

**OFFSET calculation:**
```javascript
const offset = (page - 1) * limit;
```

**Potencjalny problem:** Dla bardzo dużych offsetów (page > 1000) query może być wolne
**Rozwiązanie:** Rozważ cursor-based pagination dla bardzo dużych zbiorów danych w przyszłości

### 8.3 Caching

**Strategia cachowania:**
- Lista użytkowników rzadko się zmienia
- Rozważ cachowanie z TTL 60 sekund dla zapytań bez filtrów
- Użyj Redis lub in-memory cache (np. `@fastify/caching`)

**Cache key:**
```javascript
const cacheKey = `users:${role || 'all'}:${is_blocked}:${page}:${limit}`;
```

**Invalidacja cache:**
- Po operacjach POST/PATCH/DELETE na users
- Po zmianie roli użytkownika
- Po zablokowaniu/odblokowaniu użytkownika

### 8.4 Connection pooling

- SQLite: Użyj `better-sqlite3` z connection pooling
- Limit równoczesnych połączeń: zgodnie z konfiguracją serwera
- Timeout dla długo trwających zapytań

### 8.5 Kompresja odpowiedzi

- Fastify compress plugin dla dużych odpowiedzi
- Gzip/Brotli compression dla JSON
- Szczególnie ważne gdy `limit = 100`

### 8.6 Monitoring wydajności

**Metryki do monitorowania:**
- Średni czas odpowiedzi endpointu
- P95/P99 latency
- Liczba requestów per second
- Rozmiar odpowiedzi (KB)
- Database query time

**Cele wydajnościowe:**
- Średni czas odpowiedzi: < 100ms
- P95 latency: < 200ms
- Database query time: < 50ms

## 9. Etapy wdrożenia

### Krok 1: Przygotowanie środowiska i zależności
- [ ] Sprawdź czy SQLite database jest skonfigurowana i dostępna
- [ ] Upewnij się że tabela `users` istnieje z odpowiednimi indeksami
- [ ] Sprawdź czy middleware `authMiddleware` jest dostępny
- [ ] Jeśli nie ma, zaplanuj implementację middleware autoryzacji

### Krok 2: Utworzenie struktury plików
- [ ] Utwórz `server/services/user.service.mjs` (jeśli nie istnieje)
- [ ] Utwórz `server/routes/admin-users.routes.mjs` (nowy plik)
- [ ] Utwórz `server/middlewares/requireAdmin.mjs` (middleware autoryzacji admin)

### Krok 3: Implementacja User Service
- [ ] W `server/services/user.service.mjs` utwórz klasę `UserService`
- [ ] Implementuj metodę `getAllUsers(filters, pagination)`:
  ```javascript
  async getAllUsers({ role, is_blocked, page = 1, limit = 20 }) {
    // Build WHERE clause
    // Execute COUNT query
    // Execute SELECT query with LIMIT/OFFSET
    // Return { users, total }
  }
  ```
- [ ] Użyj parametryzowanych zapytań dla bezpieczeństwa
- [ ] Formatuj daty do ISO 8601
- [ ] Obsłuż błędy bazy danych i rzuć czytelne wyjątki

### Krok 4: Implementacja Admin Middleware
- [ ] W `server/middlewares/requireAdmin.mjs` utwórz middleware
- [ ] Sprawdź czy `request.user` istnieje (wymaga wcześniejszego auth middleware)
- [ ] Sprawdź czy `request.user.role === 'admin'`
- [ ] Jeśli nie: zwróć 403 i loguj do `error_logs`
- [ ] Jeśli tak: wywołaj `next()`

### Krok 5: Implementacja Route
- [ ] W `server/routes/admin-users.routes.mjs` zdefiniuj route:
  ```javascript
  export default async function (fastify) {
    fastify.get('/admin/users', {
      preHandler: [fastify.authenticate, fastify.requireAdmin],
      schema: {
        querystring: { /* validation schema */ },
        response: { 200: { /* response schema */ } }
      }
    }, async (request, reply) => {
      // Extract query params
      // Call UserService.getAllUsers()
      // Calculate totalPages
      // Return formatted response
    });
  }
  ```

### Krok 6: Definiowanie Fastify Schema Validation
- [ ] Dodaj schema dla querystring:
  ```javascript
  querystring: {
    type: 'object',
    properties: {
      role: { type: 'string', enum: ['user', 'admin'] },
      is_blocked: { type: 'boolean' },
      page: { type: 'integer', minimum: 1, default: 1 },
      limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 }
    }
  }
  ```
- [ ] Dodaj schema dla response 200
- [ ] Dodaj schematy dla błędów (400, 401, 403, 500)

### Krok 7: Obsługa błędów
- [ ] Obuduj wywołanie service w try/catch
- [ ] Dla błędów bazy danych: zwróć 500 i loguj
- [ ] Dla błędów walidacji: Fastify obsługuje automatycznie
- [ ] Dodaj error handler middleware (jeśli nie istnieje) do logowania do `error_logs`

### Krok 8: Implementacja logowania błędów
- [ ] Utwórz `server/services/errorLog.service.mjs` (jeśli nie istnieje)
- [ ] Implementuj metodę `logError(errorData)`
- [ ] Zapisuje do tabeli `error_logs` z wszystkimi wymaganymi polami
- [ ] Wywołuj w middleware błędów i w przypadku 403

### Krok 9: Testowanie manualne
- [ ] Test 1: GET /api/admin/users (bez sesji) → oczekuj 401
- [ ] Test 2: GET /api/admin/users (jako user) → oczekuj 403
- [ ] Test 3: GET /api/admin/users (jako admin) → oczekuj 200 z listą
- [ ] Test 4: GET /api/admin/users?role=admin → oczekuj tylko adminów
- [ ] Test 5: GET /api/admin/users?is_blocked=true → oczekuj tylko zablokowanych
- [ ] Test 6: GET /api/admin/users?page=2&limit=5 → oczekuj drugą stronę
- [ ] Test 7: GET /api/admin/users?page=-1 → oczekuj 400
- [ ] Test 8: GET /api/admin/users?limit=200 → oczekuj 400
- [ ] Test 9: Sprawdź czy password_hash NIE jest w odpowiedzi

### Krok 10: Testy jednostkowe (opcjonalne ale zalecane)
- [ ] Test UserService.getAllUsers z różnymi filtrami
- [ ] Test paginacji (page, limit, offset calculation)
- [ ] Test requireAdmin middleware (admin pass, user blocked)
- [ ] Mock bazy danych do testów

### Krok 11: Testy integracyjne
- [ ] Utwórz test suite dla endpointu
- [ ] Test pełnego przepływu: login jako admin → call endpoint → verify response
- [ ] Test error cases: 401, 403, 400, 500
- [ ] Test wydajnościowy: wywołaj endpoint 100x i zmierz czas

### Krok 12: Optymalizacja i monitoring
- [ ] Dodaj logging czasu wykonania zapytań SQL
- [ ] Sprawdź plan wykonania zapytań (EXPLAIN QUERY PLAN)
- [ ] Dodaj monitoring metryki (response time, error rate)
- [ ] Rozważ dodanie cache (Redis) dla często używanych zapytań

### Krok 13: Dokumentacja
- [ ] Zaktualizuj API documentation (Swagger/OpenAPI jeśli używane)
- [ ] Dodaj komentarze JSDoc do funkcji service
- [ ] Dodaj przykłady użycia w README
- [ ] Dokumentuj wszelkie założenia i ograniczenia

### Krok 14: Code review i deployment
- [ ] Wykonaj self-review kodu
- [ ] Sprawdź zgodność z zasadami w `backend_rules.md`
- [ ] Prześlij pull request
- [ ] Po review i zatwierdzeniu: deploy do środowiska staging
- [ ] Wykonaj smoke tests na staging
- [ ] Deploy do produkcji

### Krok 15: Post-deployment monitoring
- [ ] Monitoruj error rate przez pierwsze 24h
- [ ] Sprawdź performance metrics
- [ ] Zbieraj feedback od użytkowników admin
- [ ] Optymalizuj jeśli potrzeba

---

## 10. Checklist przed uznaniem za ukończone

- [ ] Endpoint zwraca poprawne dane dla wszystkich kombinacji filtrów
- [ ] Paginacja działa poprawnie
- [ ] Walidacja query params działa (schema validation)
- [ ] Autoryzacja działa (tylko admin ma dostęp)
- [ ] password_hash NIE jest zwracany w odpowiedzi
- [ ] Błędy są prawidłowo obsługiwane i logowane
- [ ] Kod jest zgodny z `backend_rules.md`
- [ ] Performance jest akceptowalne (< 200ms P95)
- [ ] Testy manualne przeszły pomyślnie
- [ ] Dokumentacja jest kompletna
- [ ] Code review wykonany i zatwierdzony

---

## 11. Potencjalne rozszerzenia w przyszłości

1. **Sortowanie:** Dodaj query param `sort_by` (created_at, email, role)
2. **Wyszukiwanie:** Dodaj `search` param dla wyszukiwania po email
3. **Export:** Endpoint do exportu wszystkich użytkowników do CSV/Excel
4. **Bulk operations:** Endpoint do blokowania/odblokowywania wielu użytkowników
5. **User details:** Endpoint GET /api/admin/users/:id dla szczegółów pojedynczego użytkownika
6. **Activity logs:** Pokazuj ostatnią aktywność użytkownika
7. **Advanced filters:** Filtruj po dacie rejestracji, last login, etc.

---

**Data utworzenia planu:** 2025-10-13  
**Wersja:** 1.0  
**Status:** Ready for implementation

