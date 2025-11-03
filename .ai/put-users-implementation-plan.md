# API Endpoint Implementation Plan: Update/Create User (Admin)

## 1. Przegląd punktu końcowego

Endpoint służy do zarządzania użytkownikami przez administratorów aplikacji. Umożliwia:
- **Dodawanie nowego użytkownika** (jeśli userId nie istnieje w bazie)
- **Aktualizację danych istniejącego użytkownika** (jeśli userId istnieje)

Endpoint pozwala na modyfikację następujących danych użytkownika:
- Rola (user/admin)
- Status blokady konta (is_blocked)
- Adres email
- Hasło
- Motyw interfejsu (theme)

Jest to endpoint typu "upsert" - tworzy lub aktualizuje użytkownika w zależności od tego, czy istnieje w bazie danych.

**Wymagania funkcjonalne:**
- Tylko administratorzy mają dostęp do tego endpointu
- Email musi być unikalny w całym systemie
- Hasło musi mieć minimum 8 znaków
- **Dla tworzenia nowego użytkownika:** email i password są wymagane, pozostałe pola opcjonalne
- **Dla aktualizacji istniejącego użytkownika:** co najmniej jedno pole musi być podane (partial update)
- Hasło jest hashowane przed zapisem do bazy danych

## 2. Szczegóły żądania

### Metoda HTTP
`PUT`

### Struktura URL
```
/api/admin/users/{userId}
```

### Parametry URL (Path Parameters)

| Parametr | Typ     | Wymagany | Opis                                                      |
|----------|---------|----------|-----------------------------------------------------------|
| userId   | integer | Tak      | ID użytkownika do aktualizacji lub utworzenia            |

### Request Body (JSON)

Wszystkie pola są **opcjonalne** - endpoint obsługuje partial update.

```json
{
  "role": "admin" | "user",
  "is_blocked": true | false,
  "email": "string",
  "password": "string",
  "theme": "light" | "dark" | "system"
}
```

| Pole       | Typ     | Wymagany | Walidacja                                    | Opis                                    |
|------------|---------|----------|----------------------------------------------|-----------------------------------------|
| role       | string  | Nie      | enum: ['user', 'admin']                      | Rola użytkownika                        |
| is_blocked | boolean | Nie      | boolean                                      | Status blokady konta                    |
| email      | string  | Nie      | format: email, unique w bazie                | Adres email użytkownika                 |
| password   | string  | Nie      | minLength: 8                                 | Nowe hasło (będzie zahashowane)         |
| theme      | string  | Nie      | enum: ['light', 'dark', 'system']           | Motyw interfejsu (opcjonalnie)         |

### Headers

| Header        | Wymagany | Opis                                    |
|---------------|----------|-----------------------------------------|
| Cookie        | Tak      | Zawiera session ID dla autentykacji     |

### Przykłady żądań

**Utworzenie nowego użytkownika:**
```http
PUT /api/admin/users/999
Content-Type: application/json

{
  "email": "nowy.user@example.com",
  "password": "bezpieczne123",
  "role": "user",
  "is_blocked": false,
  "theme": "light"
}
```

**Zmiana roli użytkownika:**
```http
PUT /api/admin/users/5
Content-Type: application/json

{
  "role": "admin"
}
```

**Blokowanie użytkownika:**
```http
PUT /api/admin/users/10
Content-Type: application/json

{
  "is_blocked": true
}
```

**Zmiana hasła:**
```http
PUT /api/admin/users/7
Content-Type: application/json

{
  "password": "nowe_haslo_123"
}
```

## 3. Wykorzystywane typy

### Command Model - UpdateUserCommand

```typescript
interface UpdateUserCommand {
  role?: 'user' | 'admin';
  is_blocked?: boolean;
  email?: string; // format: email
  password?: string; // minLength: 8
  theme?: 'light' | 'dark' | 'system';
}
```

### DTO - UserResponseDTO

```typescript
interface UserResponseDTO {
  id: number;
  email: string;
  role: 'user' | 'admin';
  is_blocked: boolean;
  theme: 'light' | 'dark' | 'system' | null;
  created_at: string; // ISO 8601
  updated_at: string; // ISO 8601
}
```

### Internal Types

```typescript
interface UserDbRecord {
  id: number;
  email: string;
  password_hash: string;
  role: 'user' | 'admin';
  is_blocked: number; // SQLite boolean (0/1)
  theme: string | null;
  created_at: string;
  updated_at: string;
}
```

## 4. Szczegóły odpowiedzi

### Odpowiedź sukcesu - 200 OK

Zwraca pełny obiekt użytkownika (utworzonego lub zaktualizowanego).

```json
{
  "id": 5,
  "email": "user@example.com",
  "role": "admin",
  "is_blocked": false,
  "theme": "system",
  "created_at": "2025-10-17T10:30:00.000Z",
  "updated_at": "2025-10-17T14:22:15.000Z"
}
```

**Uwaga:** Pole `password_hash` nigdy nie jest zwracane w odpowiedzi.

### Odpowiedzi błędów

#### 400 Bad Request - Błędy walidacji

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Validation error: email already exists"
}
```

Możliwe komunikaty:
- `"Validation error: email already exists"`
- `"Validation error: password must be at least 8 characters"`
- `"Validation error: invalid email format"`
- `"Validation error: userId must be a positive integer"`
- `"Validation error: at least one field must be provided"`

#### 401 Unauthorized - Brak autentykacji

```json
{
  "statusCode": 401,
  "error": "Unauthorized",
  "message": "Authentication required"
}
```

#### 403 Forbidden - Brak uprawnień administratora

```json
{
  "statusCode": 403,
  "error": "Forbidden",
  "message": "Admin role required"
}
```

#### 500 Internal Server Error

```json
{
  "statusCode": 500,
  "error": "Internal Server Error",
  "message": "Failed to update user"
}
```

## 5. Przepływ danych

### Diagram przepływu

```
Client Request
    ↓
[authMiddleware] → weryfikacja sesji użytkownika
    ↓
[requireAdmin] → sprawdzenie roli admin
    ↓
[Route Handler] → walidacja schema Fastify
    ↓
Walidacja userId (czy jest liczbą całkowitą)
    ↓
Walidacja body (czy przynajmniej jedno pole jest podane)
    ↓
[UserService.getUserById(userId)]
    ↓
├─ Użytkownik istnieje → Tryb UPDATE
│   ↓
│   Walidacja email (czy nie jest zajęty przez innego użytkownika)
│   ↓
│   Hashowanie hasła (jeśli podane)
│   ↓
│   [UserService.updateUser(userId, data)]
│   ↓
│   UPDATE users SET ... WHERE id = ?
│   ↓
│   [UserService.getUserById(userId)] → pobierz zaktualizowane dane
│
└─ Użytkownik NIE istnieje → Tryb CREATE
    ↓
    Walidacja email (czy nie jest zajęty)
    ↓
    Walidacja wymaganych pól dla tworzenia (email + password)
    ↓
    Hashowanie hasła
    ↓
    [UserService.createUser(userId, data)]
    ↓
    INSERT INTO users (...) VALUES (...)
    ↓
    [UserService.getUserById(userId)] → pobierz utworzone dane
    ↓
Response (200 OK) → UserResponseDTO
```

### Interakcje z bazą danych

**Tabela:** `users`

**Operacje:**
1. `SELECT` - sprawdzenie czy użytkownik o danym ID istnieje
2. `SELECT` - sprawdzenie unikalności email (jeśli email jest zmieniany)
3. `INSERT` lub `UPDATE` - utworzenie/aktualizacja użytkownika
4. `SELECT` - pobranie pełnych danych użytkownika po operacji

**Trigger automatyczny:**
- `update_users_timestamp` - automatycznie ustawia `updated_at` przy UPDATE

### Logika w UserService

Nowe metody do dodania w `server/services/user.service.mjs`:

```javascript
/**
 * Get user by ID
 * @param {number} userId - User ID
 * @returns {Promise<Object|null>} User object or null
 */
async getUserById(userId)

/**
 * Check if email exists (excluding specific user ID)
 * @param {string} email - Email to check
 * @param {number} [excludeUserId] - User ID to exclude from check
 * @returns {Promise<boolean>} True if email exists
 */
async emailExists(email, excludeUserId)

/**
 * Create new user
 * @param {number} userId - User ID
 * @param {Object} data - User data
 * @returns {Promise<Object>} Created user
 */
async createUser(userId, data)

/**
 * Update existing user
 * @param {number} userId - User ID
 * @param {Object} data - Partial user data
 * @returns {Promise<Object>} Updated user
 */
async updateUser(userId, data)

/**
 * Hash password using bcrypt
 * @param {string} password - Plain text password
 * @returns {Promise<string>} Hashed password
 */
async hashPassword(password)
```

## 6. Względy bezpieczeństwa

### Autentykacja i autoryzacja

1. **Middleware autentykacji** (`authMiddleware`)
   - Weryfikuje session ID z cookie
   - Sprawdza czy sesja nie wygasła
   - Dodaje `request.user` z danymi użytkownika

2. **Middleware autoryzacji** (`requireAdmin`)
   - Sprawdza czy `request.user.role === 'admin'`
   - Blokuje dostęp dla zwykłych użytkowników
   - Loguje próby nieautoryzowanego dostępu

### Bezpieczeństwo haseł

1. **Hashowanie bcrypt**
   - Używamy biblioteki `bcrypt` (już zainstalowana w projekcie)
   - Salt rounds: 10 (zalecane)
   - Hasła nigdy nie są przechowywane w plain text

2. **Walidacja długości hasła**
   - Minimum 8 znaków (zgodnie ze specyfikacją)
   - Walidacja na poziomie schema Fastify

### Ochrona danych

1. **Nie zwracamy password_hash**
   - UserResponseDTO nie zawiera hasła
   - Wszystkie zapytania SELECT wykluczają password_hash z odpowiedzi API

2. **Walidacja danych wejściowych**
   - Schema Fastify waliduje typy i formaty
   - Email: walidacja formatu email
   - Role: enum ['user', 'admin']
   - is_blocked: strict boolean

### Ochrona przed atakami

1. **SQL Injection**
   - Używamy prepared statements (better-sqlite3)
   - Parametryzowane zapytania SQL

2. **Email enumeration**
   - Ogólny komunikat błędu przy próbie użycia zajętego email
   - Nie ujawniamy czy email istnieje w systemie

3. **Rate limiting**
   - Zalecenie: dodać rate limiting dla endpointów admin
   - Nie zaimplementowane w tym endpointcie (do rozważenia)

### Logowanie operacji

1. **Error logs**
   - Wszystkie błędy 400, 500 logowane w `error_logs`
   - Przechowywanie request/response dla debugowania

2. **Audit log**
   - Zalecenie: logować wszystkie zmiany użytkowników przez adminów
   - Nie zaimplementowane w schemacie bazy (możliwe rozszerzenie)

## 7. Obsługa błędów

### 400 Bad Request

**Przypadek 1: Nieprawidłowy format email**
```javascript
{
  statusCode: 400,
  error: "Bad Request",
  message: "body/email must match format \"email\""
}
```
**Przyczyna:** Email nie spełnia walidacji formatu  
**Akcja:** Walidacja schema Fastify

**Przypadek 2: Hasło za krótkie**
```javascript
{
  statusCode: 400,
  error: "Bad Request",
  message: "Validation error: password must be at least 8 characters"
}
```
**Przyczyna:** `password.length < 8`  
**Akcja:** Custom walidacja w route handler

**Przypadek 3: Email już istnieje**
```javascript
{
  statusCode: 400,
  error: "Bad Request",
  message: "Validation error: email already exists"
}
```
**Przyczyna:** Email jest już używany przez innego użytkownika  
**Akcja:** Sprawdzenie w bazie danych przed INSERT/UPDATE

**Przypadek 4: Nieprawidłowy userId**
```javascript
{
  statusCode: 400,
  error: "Bad Request",
  message: "Validation error: userId must be a positive integer"
}
```
**Przyczyna:** userId nie jest liczbą całkowitą lub jest <= 0  
**Akcja:** Walidacja params w schema Fastify

**Przypadek 5: Brak pól do aktualizacji**
```javascript
{
  statusCode: 400,
  error: "Bad Request",
  message: "Validation error: at least one field must be provided"
}
```
**Przyczyna:** Body jest puste lub nie zawiera żadnych dozwolonych pól  
**Akcja:** Custom walidacja w route handler

**Przypadek 6: Nieprawidłowa rola**
```javascript
{
  statusCode: 400,
  error: "Bad Request",
  message: "body/role must be equal to one of the allowed values"
}
```
**Przyczyna:** Role nie jest 'user' ani 'admin'  
**Akcja:** Walidacja schema Fastify (enum)

**Logowanie:**
- Status: 400
- Endpoint: `/api/admin/users/{userId}`
- User ID: `request.user.id`
- Request data: `JSON.stringify(request.body)`
- Error message: odpowiedni komunikat

### 401 Unauthorized

**Przypadek: Brak sesji lub sesja wygasła**
```javascript
{
  statusCode: 401,
  error: "Unauthorized",
  message: "Authentication required"
}
```
**Przyczyna:** Brak cookie z sessionId lub sesja nie istnieje/wygasła  
**Akcja:** Middleware `authMiddleware` zwraca 401

**Logowanie:** Nie logujemy (brak request.user)

### 403 Forbidden

**Przypadek: Użytkownik nie jest adminem**
```javascript
{
  statusCode: 403,
  error: "Forbidden",
  message: "Admin role required"
}
```
**Przyczyna:** `request.user.role !== 'admin'`  
**Akcja:** Middleware `requireAdmin` zwraca 403

**Logowanie:**
- Status: 403
- Endpoint: `/api/admin/users/{userId}`
- User ID: `request.user.id`
- Error message: "Attempted access to admin endpoint without admin role"

### 500 Internal Server Error

**Przypadek 1: Błąd bazy danych**
```javascript
{
  statusCode: 500,
  error: "Internal Server Error",
  message: "Failed to update user"
}
```
**Przyczyna:** Błąd podczas operacji INSERT/UPDATE/SELECT  
**Akcja:** Catch block w UserService lub route handler

**Przypadek 2: Błąd hashowania hasła**
```javascript
{
  statusCode: 500,
  error: "Internal Server Error",
  message: "Failed to hash password"
}
```
**Przyczyna:** Błąd w bcrypt.hash()  
**Akcja:** Catch block w UserService.hashPassword()

**Logowanie:**
- Status: 500
- Endpoint: `/api/admin/users/{userId}`
- User ID: `request.user.id`
- Request data: `JSON.stringify(request.body)`
- Error message: `error.message`
- Stack trace w console.error

### Strategia obsługi błędów

```javascript
try {
  // Logika biznesowa
} catch (error) {
  // Log error
  await ErrorLogService.logError({
    user_id: request.user?.id,
    endpoint: request.url,
    method: request.method,
    status_code: 500,
    error_message: error.message,
    request_data: JSON.stringify(request.body),
    response_data: null,
    user_agent: request.headers['user-agent']
  });
  
  // Send error response
  return reply.status(500).send({
    statusCode: 500,
    error: 'Internal Server Error',
    message: 'Failed to update user'
  });
}
```

## 8. Rozważania dotyczące wydajności

### Potencjalne wąskie gardła

1. **Sprawdzanie unikalności email**
   - Zapytanie SELECT przed każdym INSERT/UPDATE
   - **Optymalizacja:** Wykorzystać istniejący indeks `idx_users_email`
   - **Czas:** ~1-2ms dla małych tabel (<10k users)

2. **Hashowanie hasła (bcrypt)**
   - Operacja jest celowo wolna (bezpieczeństwo)
   - **Czas:** ~50-100ms dla salt rounds = 10
   - **Optymalizacja:** Nie zalecana - bezpieczeństwo > wydajność
   - **Mitygacja:** Hashowanie tylko gdy hasło jest zmieniane

3. **Podwójne SELECT (check + get after update)**
   - Zapytanie sprawdzające istnienie + zapytanie po aktualizacji
   - **Optymalizacja:** Można zredukować do jednego zapytania z RETURNING (ale SQLite3 nie wspiera RETURNING w pełni)

### Strategie optymalizacji

1. **Indeksy (już zaimplementowane)**
   - `idx_users_email` - dla unikalności email
   - `PRIMARY KEY` na id - dla getUserById()

2. **Prepared statements caching**
   - better-sqlite3 automatycznie cache'uje prepared statements
   - Reuse tego samego statement dla wielu wywołań

3. **Transakcje (opcjonalne)**
   - Dla operacji UPDATE+SELECT można użyć transakcji
   - Zapewnia atomowość i izolację

4. **Walidacja early return**
   - Szybka walidacja parametrów przed ciężkimi operacjami
   - Sprawdzenie czy body nie jest pusty przed hashowaniem

### Metryki wydajności (szacunkowe)

| Operacja                        | Czas      | Uwagi                              |
|---------------------------------|-----------|------------------------------------|
| Walidacja schema Fastify        | <1ms      | Bardzo szybka                      |
| Sprawdzenie sesji (middleware)  | 2-5ms     | SELECT z JOIN                      |
| Sprawdzenie unikalności email   | 1-2ms     | SELECT z indeksem                  |
| Hashowanie hasła (bcrypt)       | 50-100ms  | Celowo wolne (bezpieczeństwo)      |
| INSERT/UPDATE user              | 2-5ms     | Z triggerem updated_at             |
| SELECT user po operacji         | 1-2ms     | SELECT z PRIMARY KEY               |
| Logowanie błędu                 | 3-5ms     | INSERT do error_logs               |
| **TOTAL (bez hasła)**           | ~10-20ms  | Szybka aktualizacja                |
| **TOTAL (z hasłem)**            | ~60-120ms | Głównie hashowanie                 |

### Zalecenia

1. **Cache nie jest potrzebny**
   - Endpoint administracyjny (niski traffic)
   - Operacje WRITE (cache nie pomoże)

2. **Rate limiting**
   - Dodać limit: 100 requests/minute per admin user
   - Ochrona przed brute force i abuse

3. **Monitorowanie**
   - Logować czas wykonania dla operacji >500ms
   - Alertować przy błędach 500

4. **Pagination nie dotyczy**
   - Endpoint zwraca pojedynczy obiekt użytkownika

## 9. Etapy wdrożenia

### Krok 1: Rozszerzenie UserService

**Plik:** `server/services/user.service.mjs`

**Zadania:**
- [ ] Dodać metodę `getUserById(userId)` - pobranie użytkownika po ID
- [ ] Dodać metodę `emailExists(email, excludeUserId)` - sprawdzenie unikalności email
- [ ] Dodać metodę `hashPassword(password)` - hashowanie hasła bcrypt
- [ ] Dodać metodę `createUser(userId, data)` - utworzenie nowego użytkownika
- [ ] Dodać metodę `updateUser(userId, data)` - aktualizacja istniejącego użytkownika

**Szczegóły implementacji:**
```javascript
// getUserById
const query = `
  SELECT id, email, role, is_blocked, theme, created_at, updated_at
  FROM users
  WHERE id = ?
`;
const user = db.prepare(query).get(userId);

// emailExists
const query = `
  SELECT COUNT(*) as count
  FROM users
  WHERE email = ? AND id != ?
`;
const result = db.prepare(query).get(email, excludeUserId || 0);
return result.count > 0;

// hashPassword
const saltRounds = 10;
return await bcrypt.hash(password, saltRounds);

// createUser
const query = `
  INSERT INTO users (id, email, password_hash, role, is_blocked)
  VALUES (?, ?, ?, ?, ?)
`;
// Po INSERT wykonać getUserById()

// updateUser
// Dynamiczne budowanie SET clause tylko dla podanych pól
const updates = [];
const params = [];
if (data.email) { updates.push('email = ?'); params.push(data.email); }
if (data.password_hash) { updates.push('password_hash = ?'); params.push(data.password_hash); }
// ... itd.
```

**Walidacja:**
- Testy jednostkowe dla każdej metody
- Sprawdzenie formatowania dat (ISO 8601)
- Sprawdzenie konwersji boolean (SQLite 0/1 → JS true/false)

### Krok 2: Utworzenie pliku routes

**Plik:** `server/routes/admin-users.routes.mjs` (może już istnieć - sprawdzić)

**Zadania:**
- [ ] Sprawdzić czy plik istnieje (obecnie ma GET /admin/users)
- [ ] Dodać nową trasę `PUT /admin/users/:userId`
- [ ] Zdefiniować schema Fastify dla params i body
- [ ] Dodać preHandler: `[authMiddleware, requireAdmin]`

**Schema Fastify:**
```javascript
schema: {
  params: {
    type: 'object',
    required: ['userId'],
    properties: {
      userId: {
        type: 'integer',
        minimum: 1,
        description: 'User ID'
      }
    }
  },
  body: {
    type: 'object',
    properties: {
      role: {
        type: 'string',
        enum: ['user', 'admin']
      },
      is_blocked: {
        type: 'boolean'
      },
      email: {
        type: 'string',
        format: 'email'
      },
      password: {
        type: 'string',
        minLength: 8
      },
      theme: {
        type: 'string',
        enum: ['light', 'dark', 'system']
      }
    },
    additionalProperties: false
  },
  response: {
    200: {
      type: 'object',
      properties: {
        id: { type: 'integer' },
        email: { type: 'string' },
        role: { type: 'string', enum: ['user', 'admin'] },
        is_blocked: { type: 'boolean' },
        theme: { type: 'string', enum: ['light', 'dark', 'system'], nullable: true },
        created_at: { type: 'string' },
        updated_at: { type: 'string' }
      }
    }
  }
}
```

### Krok 3: Implementacja logiki route handler

**Plik:** `server/routes/admin-users.routes.mjs`

**Zadania:**
- [ ] Walidacja wstępna (czy body nie jest pusty)
- [ ] Sprawdzenie czy użytkownik istnieje (getUserById)
- [ ] Rozgałęzienie logiki: CREATE vs UPDATE
- [ ] Walidacja email (emailExists)
- [ ] Hashowanie hasła (jeśli podane)
- [ ] Wywołanie UserService.createUser() lub updateUser()
- [ ] Zwrócenie odpowiedzi 200 z UserResponseDTO
- [ ] Obsługa błędów z logowaniem

**Pseudokod logiki:**
```javascript
// 1. Walidacja podstawowa
const { userId } = request.params;
const { role, is_blocked, email, password, theme } = request.body;

if (!role && is_blocked === undefined && !email && !password && !theme) {
  return reply.status(400).send({ message: 'At least one field required' });
}

// 2. Sprawdzenie czy user istnieje
const existingUser = await UserService.getUserById(userId);

if (existingUser) {
  // UPDATE MODE
  
  // 2a. Walidacja email uniqueness
  if (email && await UserService.emailExists(email, userId)) {
    return reply.status(400).send({ message: 'Email already exists' });
  }
  
  // 2b. Hash password if provided
  const updateData = { role, is_blocked, email, theme };
  if (password) {
    updateData.password_hash = await UserService.hashPassword(password);
  }
  
  // 2c. Update user
  await UserService.updateUser(userId, updateData);
  
} else {
  // CREATE MODE
  
  // 3a. Walidacja email uniqueness
  if (email && await UserService.emailExists(email)) {
    return reply.status(400).send({ message: 'Email already exists' });
  }
  
  // 3b. Wymagane pola dla create
  if (!email || !password) {
    return reply.status(400).send({ message: 'Email and password required for new user' });
  }
  
  // 3c. Hash password
  const password_hash = await UserService.hashPassword(password);
  
  // 3d. Create user
  await UserService.createUser(userId, {
    email,
    password_hash,
    role: role || 'user',
    is_blocked: is_blocked || false,
    theme: theme || null
  });
}

// 4. Pobierz i zwróć użytkownika
const user = await UserService.getUserById(userId);
return reply.status(200).send(user);
```

### Krok 4: Obsługa błędów i logowanie

**Zadania:**
- [ ] Dodać try-catch w route handler
- [ ] Logować błędy 400 i 500 w ErrorLogService
- [ ] Zwracać odpowiednie kody statusu i komunikaty
- [ ] Dodać console.error dla błędów serwera

**Implementacja:**
```javascript
try {
  // ... logika biznesowa ...
} catch (error) {
  console.error('Error updating user:', error);
  
  await ErrorLogService.logError({
    user_id: request.user.id,
    endpoint: request.url,
    method: request.method,
    status_code: 500,
    error_message: error.message,
    request_data: JSON.stringify({
      params: request.params,
      body: request.body
    }),
    response_data: null,
    user_agent: request.headers['user-agent']
  });
  
  return reply.status(500).send({
    statusCode: 500,
    error: 'Internal Server Error',
    message: 'Failed to update user'
  });
}
```

### Krok 5: Testy manualne

**Scenariusze testowe:**

1. **Test tworzenia nowego użytkownika**
   ```bash
   curl -X PUT http://localhost:3000/api/admin/users/999 \
     -H "Cookie: sessionId=admin_session" \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"password123","role":"user","theme":"dark"}'
   ```
   Oczekiwany wynik: 200, zwrócony obiekt użytkownika

2. **Test aktualizacji roli**
   ```bash
   curl -X PUT http://localhost:3000/api/admin/users/999 \
     -H "Cookie: sessionId=admin_session" \
     -H "Content-Type: application/json" \
     -d '{"role":"admin"}'
   ```
   Oczekiwany wynik: 200, role zmieniona na admin

3. **Test blokowania użytkownika**
   ```bash
   curl -X PUT http://localhost:3000/api/admin/users/999 \
     -H "Cookie: sessionId=admin_session" \
     -H "Content-Type: application/json" \
     -d '{"is_blocked":true}'
   ```
   Oczekiwany wynik: 200, is_blocked = true

4. **Test duplikatu email**
   ```bash
   curl -X PUT http://localhost:3000/api/admin/users/888 \
     -H "Cookie: sessionId=admin_session" \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"password123"}'
   ```
   Oczekiwany wynik: 400, "email already exists"

5. **Test hasła za krótkiego**
   ```bash
   curl -X PUT http://localhost:3000/api/admin/users/999 \
     -H "Cookie: sessionId=admin_session" \
     -H "Content-Type: application/json" \
     -d '{"password":"short"}'
   ```
   Oczekiwany wynik: 400, walidacja minLength

6. **Test braku uprawnień admin**
   ```bash
   curl -X PUT http://localhost:3000/api/admin/users/999 \
     -H "Cookie: sessionId=user_session" \
     -H "Content-Type: application/json" \
     -d '{"role":"admin"}'
   ```
   Oczekiwany wynik: 403, "Admin role required"

7. **Test pustego body**
   ```bash
   curl -X PUT http://localhost:3000/api/admin/users/999 \
     -H "Cookie: sessionId=admin_session" \
     -H "Content-Type: application/json" \
     -d '{}'
   ```
   Oczekiwany wynik: 400, "at least one field required"

### Krok 6: Testy jednostkowe (opcjonalne, ale zalecane)

**Plik:** `server/routes/tests/admin-users.routes.test.mjs`

**Zadania:**
- [ ] Test sukcesu tworzenia użytkownika
- [ ] Test sukcesu aktualizacji użytkownika
- [ ] Test błędu duplikatu email
- [ ] Test błędu hasła za krótkiego
- [ ] Test błędu braku uprawnień
- [ ] Test błędu pustego body

**Framework:** Można użyć Jest lub Node's built-in test runner

### Krok 7: Dokumentacja

**Zadania:**
- [ ] Dodać endpoint do dokumentacji API (jeśli istnieje Swagger/OpenAPI)
- [ ] Zaktualizować README.md z przykładami użycia
- [ ] Dodać komentarze JSDoc w kodzie

**Przykład JSDoc:**
```javascript
/**
 * PUT /admin/users/:userId
 * Create or update user (admin only)
 * 
 * @route PUT /admin/users/:userId
 * @param {number} userId - User ID to create or update
 * @param {Object} body - User data
 * @param {string} [body.role] - User role (user|admin)
 * @param {boolean} [body.is_blocked] - Block status
 * @param {string} [body.email] - Email address (must be unique)
 * @param {string} [body.password] - Password (min 8 chars)
 * @param {string} [body.theme] - Interface theme (light|dark|system)
 * @returns {Object} 200 - User object
 * @returns {Object} 400 - Validation error
 * @returns {Object} 401 - Unauthorized
 * @returns {Object} 403 - Forbidden (not admin)
 * @returns {Object} 500 - Server error
 * @security sessionAuth
 */
```

### Krok 8: Code review i deployment

**Zadania:**
- [ ] Code review przez innego developera
- [ ] Sprawdzenie czy wszystkie błędy są logowane
- [ ] Sprawdzenie czy hasła są prawidłowo hashowane
- [ ] Sprawdzenie czy password_hash nie jest zwracany w odpowiedzi
- [ ] Merge do main branch
- [ ] Deploy na serwer staging
- [ ] Testy E2E na stagingu
- [ ] Deploy na produkcję

### Checklist końcowy

**Funkcjonalność:**
- [ ] Endpoint tworzy nowego użytkownika gdy nie istnieje
- [ ] Endpoint aktualizuje użytkownika gdy istnieje
- [ ] Wszystkie pola są opcjonalne (partial update)
- [ ] Email jest walidowany i unikalny
- [ ] Hasło ma minimum 8 znaków i jest hashowane
- [ ] Role może być tylko 'user' lub 'admin'
- [ ] Motyw interfejsu jest opcjonalny i ma dozwolone wartości

**Bezpieczeństwo:**
- [ ] Tylko admini mają dostęp
- [ ] Hasła są hashowane bcryptem
- [ ] password_hash nie jest zwracany w response
- [ ] SQL injection jest niemożliwy (prepared statements)
- [ ] Błędy 403 są logowane

**Jakość kodu:**
- [ ] Kod jest czytelny i dobrze skomentowany
- [ ] Brak powtórzeń (DRY)
- [ ] Obsługa wszystkich przypadków błędów
- [ ] Błędy są logowane w error_logs
- [ ] Kod jest zgodny z zasadami projektu

**Testy:**
- [ ] Wszystkie scenariusze testowe przechodzą
- [ ] Testy jednostkowe (jeśli zaimplementowane)
- [ ] Testy E2E na stagingu

---

## Podsumowanie

Ten plan wdrożenia szczegółowo opisuje implementację endpointu `PUT /api/admin/users/{userId}` zgodnie z:
- Specyfikacją API (upsert użytkownika, walidacje)
- Schematem bazy danych (tabela users, triggery)
- Stackiem technologicznym (Fastify, SQLite3, bcrypt)
- Zasadami implementacji (routing, walidacja, middleware)

Kluczowe aspekty:
- **Upsert logic** - automatyczne rozpoznanie czy tworzyć czy aktualizować
- **Bezpieczeństwo** - hashowanie hasła, autoryzacja admin, walidacja danych
- **Jakość kodu** - obsługa błędów, logowanie, DRY principle
- **Wydajność** - wykorzystanie indeksów, optymalne zapytania SQL

Po wdrożeniu wszystkich kroków endpoint będzie w pełni funkcjonalny, bezpieczny i zgodny z najlepszymi praktykami.
