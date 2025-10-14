# API Endpoint Implementation Plan: Authentication (Login & Logout)

## 1. Przegląd punktów końcowych

### Login User (POST /api/auth/login)
Endpoint służy do uwierzytelnienia użytkownika poprzez weryfikację email i hasła. Po pomyślnym uwierzytelnieniu tworzona jest nowa sesja użytkownika, a identyfikator sesji zwracany jest w odpowiedzi oraz ustawiany jako HttpOnly cookie.

### Logout User (POST /api/auth/logout)
Endpoint służy do wylogowania użytkownika poprzez unieważnienie aktywnej sesji. Sesja jest identyfikowana na podstawie cookie.

## 2. Szczegóły żądań

### POST /api/auth/login

#### Metoda HTTP
POST

#### Struktura URL
`/api/auth/login`

#### Parametry
- **Wymagane**: brak parametrów URL/query
- **Opcjonalne**: brak

#### Request Body (JSON)
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Schemat walidacji Fastify:**
```javascript
{
  body: {
    type: 'object',
    required: ['email', 'password'],
    properties: {
      email: {
        type: 'string',
        format: 'email',
        description: 'User email address'
      },
      password: {
        type: 'string',
        minLength: 8,
        description: 'User password'
      }
    },
    additionalProperties: false
  }
}
```

#### Headers
- `Content-Type: application/json` (wymagane)
- `User-Agent` (opcjonalne, używane do logowania błędów)

---

### POST /api/auth/logout

#### Metoda HTTP
GET

#### Struktura URL
`/api/auth/logout`

#### Parametry
- **Wymagane**: brak parametrów URL/query
- **Opcjonalne**: brak

#### Request Body
Brak - endpoint nie przyjmuje body

#### Headers
- [cookies with sessionId] - withCredentials must be true on client side to send cookies

#### Uwierzytelnienie
Wymaga aktywnej sesji użytkownika (middleware: `authMiddleware`)

## 3. Wykorzystywane typy

### Import z types/ai-types.ts

```typescript
// Command Models
import type { LoginCommand } from '../types/ai-types';

// Response DTOs
import type { LoginResponseDTO, UserAuthDTO } from '../types/ai-types';

// Database Entity Types
import type { User, UserSession } from '../types/ai-types';
```

### Typy wykorzystywane w implementacji

#### LoginCommand
```typescript
{
  email: string;
  password: string;
}
```

#### LoginResponseDTO
```typescript
{
  sessionId: string;
  user: UserAuthDTO;
}
```

#### UserAuthDTO
```typescript
{
  id: number;
  email: string;
  role: 'user' | 'admin';
}
```

## 4. Szczegóły odpowiedzi

### POST /api/auth/login

#### Success Response (200 OK)
```json
{
  "user": {
    "id": 123,
    "email": "user@example.com",
    "role": "user"
  }
}
``` 

**Dodatkowe działania:**
- Ustawienie HttpOnly cookie: `Set-Cookie: sessionId=<uuid>; Path=/; HttpOnly; SameSite=Strict; Max-Age=28800`
- W środowisku production dodać flagę `Secure`

#### Error Responses

**400 Bad Request** - Nieprawidłowy format danych
```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "body must have required property 'email'"
}
```

**461 Unauthorized** - Nieprawidłowe credentials
```json
{
  "statusCode": 461,
  "error": "Unauthorized",
  "message": "Invalid email or password"
}
```

**463 Forbidden** - Konto zablokowane
```json
{
  "statusCode": 463,
  "error": "Forbidden",
  "message": "Account is blocked"
}
```

**500 Internal Server Error** - Błąd serwera
```json
{
  "statusCode": 500,
  "error": "Internal Server Error",
  "message": "Authentication failed"
}
```

---

### POST /api/auth/logout

#### Success Response (204 No Content)
Brak body w odpowiedzi.

**Dodatkowe działania:**
- Usunięcie cookie: `Set-Cookie: sessionId=; Path=/; HttpOnly; Max-Age=0`

#### Error Responses

**409 Unauthorized** - Brak lub nieprawidłowa sesja
```json
{
  "statusCode": 409,
  "error": "Unauthorized",
  "message": "Authentication required"
}
```

**500 Internal Server Error** - Błąd podczas usuwania sesji
```json
{
  "statusCode": 500,
  "error": "Internal Server Error",
  "message": "Logout failed"
}
```

## 5. Przepływ danych

### Login Flow (POST /api/auth/login)

```
1. Request -> Fastify Route Handler
   ↓
2. Walidacja schematu (Fastify)
   - Sprawdzenie formatu email
   - Sprawdzenie obecności password
   ↓
3. UserService.getUserByEmail(email)
   - Query: SELECT * FROM users WHERE email = ?
   - Zwraca: User object z password_hash lub null
   ↓
4. Sprawdzenie czy user istnieje
   - Jeśli nie: return 401 (nie ujawniaj czy email istnieje)
   ↓
5. Sprawdzenie czy konto nie jest zablokowane
   - Jeśli is_blocked = true: return 403
   ↓
6. UserService.verifyPassword(password, user.password_hash)
   - Użycie bcrypt.compare()
   - Jeśli false: return 401
   ↓
7. UserService.createSession(user.id)
   - Generowanie UUID dla session
   - Obliczenie expires_at (now + 7 dni)
   - INSERT INTO user_sessions (id, user_id, expires_at)
   - Zwraca: sessionId
   ↓
8. Formatowanie odpowiedzi
   - Tworzenie UserAuthDTO z user
   - Tworzenie LoginResponseDTO
   ↓
9. Ustawienie cookie
   - reply.setCookie('sessionId', sessionId, options)
   ↓
10. Response 200 + LoginResponseDTO
```

### Logout Flow (POST /api/auth/logout)

```
1. Request -> Fastify Route Handler
   ↓
2. authMiddleware (preHandler)
   - Odczyt sessionId z cookie
   - UserService.getUserBySession(sessionId)
   - Weryfikacja czy sesja jest ważna
   - Dołączenie user do request.user
   ↓
3. UserService.deleteSession(sessionId)
   - DELETE FROM user_sessions WHERE id = ?
   ↓
4. Usunięcie cookie
   - reply.clearCookie('sessionId')
   ↓
5. Response 204 No Content
```

### Interakcje z bazą danych

#### Login - Query 1: Pobranie użytkownika
```sql
SELECT id, email, password_hash, role, is_blocked
FROM users
WHERE email = ?
LIMIT 1
```

#### Login - Query 2: Utworzenie sesji
```sql
INSERT INTO user_sessions (id, user_id, expires_at, created_at)
VALUES (?, ?, ?, datetime('now'))
```

#### Logout - Query: Usunięcie sesji
```sql
DELETE FROM user_sessions
WHERE id = ?
```

## 6. Względy bezpieczeństwa

### Uwierzytelnianie
- **Hash hasła**: Użycie bcrypt z salt rounds = 10-12 do bezpiecznego przechowywania haseł
- **Timing attacks**: bcrypt.compare() jest odporne na timing attacks
- **Weryfikacja email**: Nie ujawniać czy email istnieje w bazie (zawsze zwracać 401 "Invalid email or password")

### Sesje
- **Session ID**: Użycie UUID v4 dla nieprzewidywalnych identyfikatorów sesji
- **Expiry**: Sesje wygasają po 7 dniach (604800 sekund)
- **Cleanup**: Opcjonalnie: automatyczne usuwanie wygasłych sesji (cron job)

### Cookies
- **HttpOnly**: Zapobiega dostępowi JavaScript do cookie (XSS protection)
- **SameSite=Strict**: Zapobiega CSRF attacks
- **Secure flag**: Tylko HTTPS w production (NODE_ENV=production)
- **Path=/**: Cookie dostępne dla całej aplikacji

### Walidacja danych
- **Email format**: Fastify schema validation z formatem 'email'
- **Password**: Minimum 1 znak (walidacja złożoności powinna być po stronie rejestracji)
- **SQL Injection**: Użycie prepared statements (już zaimplementowane w database.mjs)

### Rate Limiting
- **Opcjonalne**: Implementacja rate limiting dla endpointu login (np. 5 prób/minutę)
- **Wdrożenie**: Fastify plugin @fastify/rate-limit (poza zakresem tego planu)

### Logowanie błędów
- **NIE logować**: Haseł w request_data
- **Logować**: Failed login attempts z endpoint, method, status_code, user_agent
- **Privacy**: Nie logować email w error_message (dla GDPR)

### Blocked Accounts
- **Sprawdzenie**: Po znalezieniu użytkownika, przed weryfikacją hasła
- **Response**: 403 Forbidden z jasnym komunikatem
- **Middleware**: authMiddleware już sprawdza is_blocked dla chronionych endpointów

## 7. Obsługa błędów

### Login (POST /api/auth/login)

| Scenariusz | Status Code | Error Message | Logowanie |
|------------|-------------|---------------|-----------|
| Brak email w body | 400 | "body must have required property 'email'" | Nie (Fastify) |
| Nieprawidłowy format email | 400 | "body.email must match format 'email'" | Nie (Fastify) |
| Brak password w body | 400 | "body must have required property 'password'" | Nie (Fastify) |
| User nie istnieje | 401 | "Invalid email or password" | Opcjonalnie |
| Nieprawidłowe hasło | 401 | "Invalid email or password" | Opcjonalnie |
| Konto zablokowane | 403 | "Account is blocked" | Tak |
| Błąd bazy danych | 500 | "Authentication failed" | Tak (ErrorLogService) |
| Błąd bcrypt | 500 | "Authentication failed" | Tak (ErrorLogService) |

### Logout (POST /api/auth/logout)

| Scenariusz | Status Code | Error Message | Logowanie |
|------------|-------------|---------------|-----------|
| Brak sessionId cookie | 401 | "Authentication required" | Nie |
| Sesja wygasła | 401 | "Invalid or expired session" | Nie |
| Sesja nie istnieje | 401 | "Invalid or expired session" | Nie |
| Konto zablokowane | 403 | "Account is blocked" | Nie (middleware) |
| Błąd bazy danych | 500 | "Logout failed" | Tak (ErrorLogService) |

### Error Handling Strategy

#### Try-Catch Blocks
Wszystkie operacje bazodanowe i bcrypt wrapped w try-catch:
```javascript
try {
  // database/bcrypt operations
} catch (error) {
  console.error('Error context:', error);
  // Log to error_logs via ErrorLogService
  // Return 500 response
}
```

#### Error Logging
Użycie `ErrorLogService.logError()` dla:
- Błędów 500 (internal server errors)
- Opcjonalnie: Failed login attempts (do analizy bezpieczeństwa)

**NIE logować:**
- Haseł użytkownika
- Pełnego request body zawierającego hasła

## 8. Rozważania dotyczące wydajności

### Potencjalne wąskie gardła

#### 1. Bcrypt hashing
- **Problem**: bcrypt.compare() jest celowo wolny (CPU-intensive)
- **Wpływ**: ~100-200ms per request
- **Mitygacja**: Akceptowalne dla endpointu login (security > speed)

#### 2. Database queries
- **Problem**: 2 queries per login (getUserByEmail + createSession)
- **Wpływ**: ~5-10ms per query
- **Mitygacja**: 
  - Indeksy już utworzone: `idx_users_email`
  - Connection pooling (better-sqlite3 single connection, wystarczające dla SQLite)

#### 3. Session lookup
- **Problem**: getUserBySession JOIN query per authenticated request
- **Wpływ**: ~5ms per request
- **Mitygacja**:
  - Indeksy: `idx_sessions_user_id`, `idx_sessions_expires_at`
  - Opcjonalnie: Redis cache dla aktywnych sesji (overkill dla małych aplikacji)

### Strategie optymalizacji

#### Immediate (w ramach implementacji)
1. **Prepared statements**: Reuse prepared statements w UserService
2. **Indexes**: Wykorzystanie istniejących indeksów
3. **Early returns**: Sprawdzenie is_blocked przed bcrypt.compare()

#### Future (poza zakresem)
1. **Rate limiting**: Zapobiega brute-force, oszczędza zasoby
2. **Session cleanup**: Cron job usuwający wygasłe sesje (zmniejsza rozmiar tabeli)
3. **Monitoring**: Logowanie czasu wykonania endpointów

### Benchmarki (szacunkowe)
- Login endpoint: ~150-250ms (głównie bcrypt)
- Logout endpoint: ~10-20ms
- authMiddleware: ~5-10ms per request

## 9. Etapy wdrożenia

### Krok 1: Instalacja zależności
**Czas: 2 min**

Zainstalować bcrypt do hashowania haseł:
```bash
npm install bcrypt
npm install --save-dev @types/bcrypt
```

**Alternatywa**: `bcryptjs` (pure JS, wolniejszy ale bez kompilacji natywnej)

---

### Krok 2: Rozszerzenie UserService
**Czas: 30-45 min**  
**Plik**: `server/services/user.service.mjs`

Dodać do klasy `UserService` następujące metody:

#### 2.1 getUserByEmail(email)
```javascript
/**
 * Get user by email
 * @param {string} email - User email
 * @returns {Promise<Object|null>} User with password_hash or null
 */
async getUserByEmail(email) {
  // SELECT id, email, password_hash, role, is_blocked FROM users WHERE email = ? LIMIT 1
  // Return user object or null
  // Convert is_blocked to boolean
}
```

#### 2.2 verifyPassword(password, hash)
```javascript
/**
 * Verify password against hash
 * @param {string} password - Plain text password
 * @param {string} hash - Bcrypt hash
 * @returns {Promise<boolean>} True if password matches
 */
async verifyPassword(password, hash) {
  // return bcrypt.compare(password, hash)
}
```

#### 2.3 createSession(userId)
```javascript
/**
 * Create new session for user
 * @param {number} userId - User ID
 * @returns {Promise<string>} Session ID (UUID)
 */
async createSession(userId) {
  // Generate UUID (crypto.randomUUID())
  // Calculate expiresAt (new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))
  // INSERT INTO user_sessions (id, user_id, expires_at)
  // Return sessionId
}
```

#### 2.4 deleteSession(sessionId)
```javascript
/**
 * Delete session by ID
 * @param {string} sessionId - Session ID
 * @returns {Promise<boolean>} True if session was deleted
 */
async deleteSession(sessionId) {
  // DELETE FROM user_sessions WHERE id = ?
  // Return true if changes > 0
}
```

**Test**: Napisać unit testy dla nowych metod (opcjonalnie)

---

### Krok 3: Utworzenie route handler
**Czas: 45-60 min**  
**Plik**: `server/routes/auth.routes.mjs`

#### 3.1 Struktura pliku
```javascript
/**
 * Authentication API Routes
 * Endpoints: POST /api/auth/login, POST /api/auth/logout
 */
import { authMiddleware } from '../middlewares/auth.middleware.mjs';
import ErrorLogService from '../services/errorLog.service.mjs';
import UserService from '../services/user.service.mjs';

export default async function (fastify) {
  // POST /auth/login implementation
  // POST /auth/logout implementation
}
```

#### 3.2 POST /auth/login handler
- Definicja schema walidacji (body: email, password)
- Response schema (200, 401, 403, 500)
- Logika:
  1. Destructure email, password z request.body
  2. getUserByEmail(email)
  3. Check if user exists → 401
  4. Check is_blocked → 403
  5. verifyPassword(password, user.password_hash)
  6. Check password valid → 401
  7. createSession(user.id)
  8. Set cookie: reply.setCookie('sessionId', sessionId, { httpOnly: true, path: '/', sameSite: 'strict', maxAge: 604800 })
  9. Return 200 + LoginResponseDTO

#### 3.3 POST /auth/logout handler
- PreHandler: authMiddleware
- Logika:
  1. Get sessionId z request.cookies.sessionId
  2. deleteSession(sessionId)
  3. Clear cookie: reply.clearCookie('sessionId', { path: '/' })
  4. Return 204

#### 3.4 Error handling
- Try-catch dla wszystkich operacji DB/bcrypt
- ErrorLogService.logError() dla 500 errors
- Nie logować haseł w request_data

**Test**: Manualnie przetestować z curl/Postman

---

### Krok 4: Testowanie endpointów
**Czas: 20-30 min**

#### 4.1 Test LOGIN - Success
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"correctPassword"}' \
  -v
```
Oczekiwane: 200 + sessionId w body i Set-Cookie header

#### 4.2 Test LOGIN - Invalid credentials
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"wrongPassword"}'
```
Oczekiwane: 401 + "Invalid email or password"

#### 4.3 Test LOGIN - Blocked account
Zablokować użytkownika w DB, następnie:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"blocked@example.com","password":"correctPassword"}'
```
Oczekiwane: 403 + "Account is blocked"

#### 4.4 Test LOGIN - Invalid email format
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"notanemail","password":"password"}'
```
Oczekiwane: 400 + validation error

#### 4.5 Test LOGOUT - Success
```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Cookie: sessionId=<session_from_login>" \
  -v
```
Oczekiwane: 204 + Set-Cookie z Max-Age=0

#### 4.6 Test LOGOUT - No session
```bash
curl -X POST http://localhost:3000/api/auth/logout
```
Oczekiwane: 401 + "Authentication required"

---

### Krok 5: Weryfikacja bezpieczeństwa
**Czas: 15-20 min**

#### 5.1 Checklist
- [ ] Hasła nie są logowane w error_logs.request_data
- [ ] Cookie ma flagi HttpOnly, SameSite=Strict
- [ ] Cookie ma flagę Secure w production (NODE_ENV check)
- [ ] Błędy 401 nie ujawniają czy email istnieje
- [ ] is_blocked sprawdzane przed bcrypt.compare (performance)
- [ ] Session expires_at ustawione na +7 dni
- [ ] SQL queries używają prepared statements
- [ ] Bcrypt salt rounds >= 10

#### 5.2 Code review
- Przejrzeć kod pod kątem hardcoded secrets
- Sprawdzić czy wszystkie błędy są obsłużone
- Zweryfikować czy response schemas są kompletne

---

### Krok 6: Dokumentacja
**Czas: 10-15 min**

#### 6.1 Utworzyć plik testowy
**Plik**: `server/routes/auth.routes.test.curl.md`

Zawartość:
- Przykłady curl dla wszystkich scenariuszy
- Oczekiwane response dla każdego przypadku
- Instrukcje przygotowania środowiska testowego (utworzenie test usera)

#### 6.2 Aktualizować README (jeśli istnieje)
Dodać sekcję "Authentication" z opisem:
- Jak działa system sesji
- Format cookie
- Czas wygaśnięcia sesji
- Przykłady użycia endpointów

---

### Krok 7: Opcjonalne ulepszenia (Future work)
**Czas: różnie**

#### 7.1 Rate limiting
- Zainstalować @fastify/rate-limit
- Dodać limit 5 prób/minutę dla /auth/login

#### 7.2 Session cleanup cron
- Utworzyć `server/utils/sessionCleanup.mjs`
- Usuwać wygasłe sesje co godzinę

#### 7.3 Login history
- Utworzyć tabelę login_attempts
- Logować wszystkie próby logowania (success + failed)

#### 7.4 Refresh token
- Implementować refresh token mechanism
- Krótsze access token (15 min), długi refresh token (30 dni)

#### 7.5 2FA (Two-Factor Authentication)
- Dodać kolumnę two_factor_enabled do users
- Implementować TOTP (Time-based One-Time Password)

---

## 10. Podsumowanie implementacji

### Pliki do utworzenia/modyfikacji

#### Nowe pliki:
1. `server/routes/auth.routes.mjs` - Route handler dla login/logout
2. `server/routes/auth.routes.test.curl.md` - Dokumentacja testowa

#### Modyfikowane pliki:
1. `server/services/user.service.mjs` - Dodanie 4 nowych metod
2. `package.json` - Dodanie bcrypt dependency (npm install)

#### Istniejące (używane bez zmian):
1. `server/middlewares/auth.middleware.mjs` - Używany w logout
2. `server/services/errorLog.service.mjs` - Używany do logowania błędów
3. `server/db/database.mjs` - Używany w UserService
4. `types/ai-types.ts` - Import typów DTO

### Szacowany czas implementacji
- **Minimum**: 2-3 godziny (bez testów)
- **Z testami**: 3-4 godziny
- **Z opcjonalnymi ulepszeniami**: 5-8 godzin

### Wymagane umiejętności
- JavaScript/Node.js
- Fastify framework
- SQLite/SQL
- Bcrypt password hashing
- HTTP cookies i session management
- REST API best practices

### Zależności
- bcrypt (nowa)
- better-sqlite3 (istniejąca)
- fastify (istniejąca)
- @fastify/cookie (zakładana istniejąca dla cookie support)

---

## 11. Checklisty walidacji

### Pre-deployment Checklist
- [ ] Wszystkie testy curl przechodzą pomyślnie
- [ ] Hasła nie są logowane
- [ ] Cookie ma właściwe flagi bezpieczeństwa
- [ ] Rate limiting rozważone (lub zaplanowane)
- [ ] Kod przeszedł code review
- [ ] Dokumentacja zaktualizowana
- [ ] Error handling kompletny
- [ ] SQL queries używają prepared statements

### Post-deployment Monitoring
- [ ] Monitorować liczbę failed login attempts
- [ ] Sprawdzić performance (czas response login endpoint)
- [ ] Monitorować rozmiar tabeli user_sessions
- [ ] Sprawdzić logi error_logs dla nowych błędów
- [ ] Zweryfikować że sessions wygasają poprawnie

---

**Koniec planu implementacji**

