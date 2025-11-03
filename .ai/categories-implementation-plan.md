# API Endpoint Implementation Plan: Categories Management

## 1. Przegląd punktu końcowego

Endpoint Categories zarządza kategoriami list zadań w aplikacji. Umożliwia:
- Pobieranie wszystkich kategorii (dostępne dla wszystkich użytkowników)
- Tworzenie lub aktualizację kategorii przez PUT (tylko administratorzy)
- Usuwanie kategorii (tylko administratorzy)

Kategorie są wykorzystywane do organizacji list zadań i posiadają nazwę oraz kolor wyświetlania.

## 2. Szczegóły żądania

### GET /api/categories
- **Metoda HTTP:** GET
- **Struktura URL:** `/api/categories`
- **Parametry:**
  - Wymagane: brak
  - Opcjonalne: brak
- **Request Body:** brak
- **Uwierzytelnienie:** nie wymagane

### PUT /api/categories/{id}
- **Metoda HTTP:** PUT
- **Struktura URL:** `/api/categories/{id}`
- **Parametry:**
  - Wymagane: `id` (integer) - ID kategorii do utworzenia/aktualizacji
  - Opcjonalne: brak
- **Request Body:**
  - **Jeśli kategoria NIE ISTNIEJE (tworzenie):**
    ```json
    {
      "name": "Work",
      "color": "#3B82F6"
    }
    ```
    - `name` (string, **wymagane**): Unikalna nazwa kategorii, 1-50 znaków
    - `color` (string, **wymagane**): Kolor w formacie hex (#RRGGBB)
    
  - **Jeśli kategoria ISTNIEJE (aktualizacja):**
    ```json
    {
      "name": "Updated Work",
      "color": "#FF5733"
    }
    ```
    - `name` (string, opcjonalne): Nowa nazwa kategorii, 1-50 znaków
    - `color` (string, opcjonalne): Nowy kolor w formacie hex
    - **Przynajmniej jedno pole musi być dostarczone**
    
- **Uwierzytelnienie:** wymagane (admin)
- **Logika:**
  1. Sprawdź czy kategoria o podanym ID istnieje
  2. Jeśli NIE istnieje → Waliduj wszystkie wymagane pola (name, color) → Utwórz nową kategorię z podanym ID → Zwróć 201
  3. Jeśli istnieje → Waliduj że podano minimum jedno pole → Zaktualizuj kategorię → Zwróć 200

### DELETE /api/categories/{id}
- **Metoda HTTP:** DELETE
- **Struktura URL:** `/api/categories/{id}`
- **Parametry:**
  - Wymagane: `id` (integer) - ID kategorii do usunięcia
  - Opcjonalne: brak
- **Request Body:** brak
- **Uwierzytelnienie:** wymagane (admin)

## 3. Wykorzystywane typy

### DTOs (Data Transfer Objects)

```typescript
// CategoryDTO - reprezentacja kategorii zwracanej przez API
interface CategoryDTO {
  id: number;
  name: string;
  color: string;
  created_at: string; // ISO 8601 format
}

// CategoryListDTO - odpowiedź dla GET /api/categories
type CategoryListDTO = CategoryDTO[];
```

### Command Models

```typescript
// UpsertCategoryCommand - dane wejściowe dla PUT
interface UpsertCategoryCommand {
  id: number;          // required from params
  name?: string;       // required for create, optional for update, 1-50 chars
  color?: string;      // required for create, optional for update, hex format (#RRGGBB)
}

// Walidacja w runtime:
// - Create mode (category not exists): name AND color required
// - Update mode (category exists): at least one of name OR color required
```

### Validation Schemas

```javascript
// Fastify JSON Schema dla walidacji PUT
const upsertCategorySchema = {
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'integer', minimum: 1 }
    }
  },
  body: {
    type: 'object',
    properties: {
      name: { 
        type: 'string', 
        minLength: 1, 
        maxLength: 50 
      },
      color: { 
        type: 'string', 
        pattern: '^#[0-9A-Fa-f]{6}$' 
      }
    },
    additionalProperties: false
  }
};

const deleteCategorySchema = {
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'integer', minimum: 1 }
    }
  }
};
```

## 4. Szczegóły odpowiedzi

### GET /api/categories
- **200 OK:**
  ```json
  [
    {
      "id": 1,
      "name": "Praca",
      "color": "#3B82F6",
      "created_at": "2025-01-15T10:30:00.000Z"
    },
    {
      "id": 2,
      "name": "Dom",
      "color": "#10B981",
      "created_at": "2025-01-15T10:30:00.000Z"
    }
  ]
  ```
- **500 Internal Server Error:** Błąd bazy danych

### PUT /api/categories/{id}
- **201 Created** (kategoria nie istniała i została utworzona):
  ```json
  {
    "id": 7,
    "name": "Work",
    "color": "#3B82F6",
    "created_at": "2025-01-17T14:22:00.000Z"
  }
  ```
- **200 OK** (kategoria istniała i została zaktualizowana):
  ```json
  {
    "id": 7,
    "name": "Updated Work",
    "color": "#FF5733",
    "created_at": "2025-01-17T14:22:00.000Z"
  }
  ```
- **400 Bad Request:** 
  - Nieprawidłowe dane wejściowe
  - Brak wymaganych pól przy tworzeniu (name lub color)
  - Brak jakichkolwiek pól przy aktualizacji
  - Nieprawidłowy format color
- **401 Unauthorized:** Brak tokenu uwierzytelnienia
- **403 Forbidden:** Użytkownik nie jest administratorem
- **409 Conflict:** Kategoria o tej nazwie już istnieje (inny rekord)
- **500 Internal Server Error:** Błąd bazy danych

### DELETE /api/categories/{id}
- **204 No Content:** Kategoria usunięta pomyślnie
- **401 Unauthorized:** Brak tokenu uwierzytelnienia
- **403 Forbidden:** Użytkownik nie jest administratorem
- **404 Not Found:** Kategoria nie istnieje
- **500 Internal Server Error:** Błąd bazy danych

## 5. Przepływ danych

### GET /api/categories - Pobieranie wszystkich kategorii
```
1. Request → Fastify Route Handler
2. Route Handler → Category Service (getAllCategories)
3. Service → SQLite Database (SELECT * FROM categories ORDER BY name)
4. Database → Service (category rows)
5. Service → Route Handler (CategoryDTO[])
6. Route Handler → Response (200 + JSON)
```

### PUT /api/categories/{id} - Upsert kategorii (Create or Update)
```
1. Request → Fastify Route Handler
2. Route Handler → Auth Middleware (verify admin role)
3. Middleware → Route Handler (user data)
4. Route Handler → Schema Validation (params + body format)
5. Route Handler → Category Service (upsertCategory)
6. Service → Database (SELECT * FROM categories WHERE id = ?)
7. Service → Determine mode (CREATE or UPDATE):

   A) CREATE MODE (category not found):
      8a. Validate: name AND color must be present → 400 if missing
      9a. Database → Check name uniqueness → 409 if exists
      10a. Database → INSERT INTO categories (id, name, color, created_at)
      11a. Database → Service (new category row)
      12a. Service → Route Handler (CategoryDTO)
      13a. Route Handler → Response (201 Created + JSON)
   
   B) UPDATE MODE (category exists):
      8b. Validate: at least one field (name OR color) → 400 if empty
      9b. Database → Check name uniqueness if name changed → 409 if exists
      10b. Database → UPDATE categories SET ... WHERE id = ?
      11b. Database → Service (updated category row)
      12b. Service → Route Handler (CategoryDTO)
      13b. Route Handler → Response (200 OK + JSON)

Error paths:
- Auth failure → 401/403 response
- Schema validation failure → 400 response
- Business validation failure → 400 response
- Duplicate name → 409 response
- Database error → log error + 500 response
```

### DELETE /api/categories/{id} - Usuwanie kategorii
```
1. Request → Fastify Route Handler
2. Route Handler → Auth Middleware (verify admin role)
3. Middleware → Route Handler (user data)
4. Route Handler → Schema Validation (params)
5. Route Handler → Category Service (deleteCategory)
6. Service → Database (check if category exists)
7. Service → Database (DELETE FROM categories WHERE id = ?)
8. Database → Service (affected rows)
9. Service → Route Handler (success)
10. Route Handler → Response (204 No Content)

Notes:
- Foreign key CASCADE: Lists z tą kategorią dostaną category_id = NULL (ON DELETE SET NULL)
- Category not found → 404 response
- Database error → log error + 500 response
```

## 6. Względy bezpieczeństwa

### Uwierzytelnienie i Autoryzacja
- **GET /api/categories:** Publiczny dostęp (nie wymaga uwierzytelnienia)
- **PUT, DELETE:** Wymagane uwierzytelnienie i rola `admin`
  - Użyć middleware `requireAdmin.middleware.mjs`
  - Middleware sprawdza token sesji i rolę użytkownika
  - Zwraca 401 dla braku tokenu, 403 dla braku uprawnień

### Walidacja danych
- **Walidacja schematu Fastify:**
  - Automatyczna walidacja JSON Schema
  - Odrzucenie dodatkowych właściwości (`additionalProperties: false`)
  - Walidacja formatu koloru (regex dla hex)
  - Limity długości dla name (1-50 znaków)
  
- **Walidacja biznesowa (PUT):**
  - **Create mode:** Sprawdzenie czy name AND color są obecne
  - **Update mode:** Sprawdzenie czy podano minimum jedno pole
  - Unikalność nazwy kategorii (sprawdzenie w bazie, z wykluczeniem aktualnego ID)
  - Walidacja ID (integer > 0)

### Ochrona przed atakami
- **SQL Injection:** Używanie prepared statements (parametryzowane zapytania)
- **XSS Prevention:** Walidacja formatu koloru (tylko hex), escape HTML w name
- **CSRF Protection:** Wymagane przez Fastify (jeśli skonfigurowane)
- **Rate Limiting:** Rozważyć limitowanie żądań dla POST/PATCH/DELETE

### Polityka CORS
- Skonfigurować odpowiednie nagłówki CORS w Fastify
- Ograniczyć dozwolone pochodzenia w produkcji

## 7. Obsługa błędów

### Rodzaje błędów i odpowiedzi

| Kod | Sytuacja | Response Body | Logowanie |
|-----|----------|---------------|-----------|
| 400 | Nieprawidłowe dane wejściowe | `{ "error": "Invalid input", "details": [...] }` | Nie |
| 400 | Brak wymaganych pól (create) | `{ "error": "Name and color are required for creating category" }` | Nie |
| 400 | Brak jakichkolwiek pól (update) | `{ "error": "At least one field (name or color) must be provided for update" }` | Nie |
| 401 | Brak tokenu uwierzytelnienia | `{ "error": "Unauthorized" }` | Nie |
| 403 | Brak uprawnień admin | `{ "error": "Forbidden: Admin access required" }` | Tak |
| 404 | Kategoria nie znaleziona | `{ "error": "Category not found" }` | Nie |
| 409 | Duplikat nazwy | `{ "error": "Category with this name already exists" }` | Nie |
| 500 | Błąd bazy danych | `{ "error": "Internal server error" }` | Tak |

### Implementacja obsługi błędów

```javascript
// W route handler
try {
  // business logic
} catch (error) {
  // Logowanie do error_logs dla 500 i 403
  if (error.statusCode >= 500 || error.statusCode === 403) {
    await errorLogService.log({
      user_id: request.user?.id,
      endpoint: request.url,
      method: request.method,
      status_code: error.statusCode || 500,
      error_message: error.message,
      request_data: JSON.stringify(request.body),
      user_agent: request.headers['user-agent']
    });
  }
  
  // Zwróć odpowiedni błąd
  reply.code(error.statusCode || 500).send({
    error: error.message || 'Internal server error'
  });
}
```

### Szczegółowa obsługa scenariuszy

**PUT /api/categories/{id}:**
- Nieprawidłowy ID (non-integer) → 400
- Nieprawidłowy format color → 400
- Name za długie/za krótkie → 400
- Brak uprawnień admin → 401/403
- **CREATE MODE:**
  - Brak name → 400 "Name and color are required"
  - Brak color → 400 "Name and color are required"
  - Duplikat nazwy → 409
  - Błąd INSERT → 500
- **UPDATE MODE:**
  - Puste body (brak name i color) → 400 "At least one field must be provided"
  - Duplikat nazwy → 409
  - Błąd UPDATE → 500

**DELETE /api/categories/{id}:**
- Nieprawidłowy ID → 400
- Brak uprawnień admin → 401/403
- Kategoria nie istnieje → 404
- Błąd DELETE → 500

## 8. Rozważania dotyczące wydajności

### Optymalizacje bazy danych
- **Indeksy:**
  - Index na `categories.name` (dla UNIQUE constraint i wyszukiwania)
  - Index już zdefiniowany w schema: brak dodatkowych potrzeb
  
- **Zapytania:**
  - GET: `SELECT * FROM categories ORDER BY name` - bardzo szybkie, mała tabela
  - PUT: 
    - SELECT dla sprawdzenia istnienia (1 query)
    - INSERT lub UPDATE (1 query)
    - Razem: 2 queries per request
  - DELETE: Single DELETE z WHERE id = ?

### Cachowanie
- **GET /api/categories:**
  - Rozważyć cache in-memory (Redis/Node-cache) na 5-10 minut
  - Invalidacja cache po PUT/DELETE
  - Kategorie rzadko się zmieniają - idealne do cachowania
  
- **Implementacja:**
  ```javascript
  // W service
  let categoriesCache = null;
  let cacheTimestamp = 0;
  const CACHE_TTL = 5 * 60 * 1000; // 5 minut
  
  async function getAllCategories() {
    const now = Date.now();
    if (categoriesCache && (now - cacheTimestamp) < CACHE_TTL) {
      return categoriesCache;
    }
    
    const categories = await db.query('SELECT * FROM categories ORDER BY name');
    categoriesCache = categories;
    cacheTimestamp = now;
    return categories;
  }
  
  function invalidateCache() {
    categoriesCache = null;
  }
  ```

### Limitowanie
- **Rate limiting:**
  - GET: 100 requests/minute per IP
  - PUT/DELETE: 20 requests/minute per user
  - Używać `@fastify/rate-limit` plugin

### Monitoring
- Logować czasy odpowiedzi dla każdego endpointu
- Monitorować częstotliwość błędów 500
- Alert przy >1% błędów lub >500ms średni czas odpowiedzi

### Potencjalne wąskie gardła
1. **Duplikat check (PUT):** Minimalne - używa indeksu UNIQUE
2. **Concurrent writes:** SQLite ma blokadę na zapis - nie problem dla małej liczby adminów
3. **GET performance:** Doskonała - mała tabela, prosty SELECT
4. **PUT performance:** 2 queries - bardzo szybkie dla małej tabeli

## 9. Etapy wdrożenia

### Krok 1: Utworzenie Category Service
**Plik:** `server/services/category.service.mjs`

**Zadania:**
- Zaimportować instancję bazy danych
- Zaimplementować `getAllCategories()` - SELECT wszystkich kategorii z sortowaniem po nazwie
- Zaimplementować `getCategoryById(id)` - SELECT pojedynczej kategorii
- Zaimplementować `upsertCategory(id, data)` - Logika CREATE lub UPDATE:
  - Sprawdzić czy kategoria istnieje
  - Jeśli NIE: walidacja pełnych danych + INSERT z określonym ID
  - Jeśli TAK: walidacja minimum jednego pola + UPDATE
  - Obsługa UNIQUE constraint dla name
- Zaimplementować `deleteCategory(id)` - DELETE z sprawdzeniem istnienia
- Dodać pomocnicze metody: `categoryExists(id)`, `categoryNameExists(name, excludeId)`
- Obsługa błędów bazy danych z odpowiednimi komunikatami

**Oczekiwany wynik:** Kompletny service z metodami CRUD dla kategorii

### Krok 2: Utworzenie pliku routes
**Plik:** `server/routes/categories.routes.mjs`

**Zadania:**
- Utworzyć plik zgodnie z konwencją nazewnictwa
- Zaimportować category service
- Zaimportować middleware `requireAdmin`
- Zdefiniować export default function(fastify)

**Oczekiwany wynik:** Szkielet pliku routes gotowy do implementacji endpointów

### Krok 3: Implementacja GET /api/categories
**W pliku:** `server/routes/categories.routes.mjs`

**Zadania:**
- Zarejestrować route: `fastify.get('/api/categories', handler)`
- Brak wymagań uwierzytelnienia
- Brak walidacji (brak parametrów)
- Handler:
  - Wywołać `categoryService.getAllCategories()`
  - Zwrócić 200 z tablicą kategorii
  - Obsłużyć błędy bazy danych → 500
- Przetestować endpoint ręcznie (curl/Postman)

**Oczekiwany wynik:** Działający endpoint GET zwracający wszystkie kategorie

### Krok 4: Implementacja PUT /api/categories/{id}
**W pliku:** `server/routes/categories.routes.mjs`

**Zadania:**
- Zarejestrować route: `fastify.put('/api/categories/:id', { preHandler: requireAdmin, schema: upsertCategorySchema }, handler)`
- Zdefiniować `upsertCategorySchema` (params.id, body z optional name/color)
- Handler:
  - Ekstrakcja `id` z `request.params`
  - Ekstrakcja `{ name, color }` z `request.body`
  - Wywołać `categoryService.upsertCategory(id, { name, color })`
  - Service zwraca: `{ category: CategoryDTO, isNew: boolean }`
  - Jeśli `isNew === true` → Zwrócić 201 Created
  - Jeśli `isNew === false` → Zwrócić 200 OK
  - Obsłużyć błędy:
    - 400: Brak wymaganych pól (create) lub brak jakichkolwiek pól (update)
    - 400: Nieprawidłowy format danych
    - 401/403: Auth errors
    - 409: Duplikat nazwy
    - 500: Database errors
  - Logować błędy 403 i 500
- Przetestować:
  - Tworzenie nowej kategorii z wszystkimi polami
  - Próba tworzenia bez name lub color → 400
  - Aktualizacja istniejącej z jednym polem
  - Próba aktualizacji bez pól → 400
  - Duplikat nazwy → 409

**Oczekiwany wynik:** Działający endpoint PUT obsługujący create i update (tylko admin)

### Krok 5: Implementacja DELETE /api/categories/{id}
**W pliku:** `server/routes/categories.routes.mjs`

**Zadania:**
- Zarejestrować route: `fastify.delete('/api/categories/:id', { preHandler: requireAdmin, schema: deleteCategorySchema }, handler)`
- Zdefiniować `deleteCategorySchema` (params.id required)
- Handler:
  - Ekstrakcja `id` z `request.params`
  - Sprawdzić czy kategoria istnieje → 404 jeśli nie
  - Wywołać `categoryService.deleteCategory(id)`
  - Zwrócić 204 No Content
  - Obsłużyć błędy: 400, 401/403, 404, 500
  - Logować błędy 403 i 500
- Przetestować usuwanie istniejącej i nieistniejącej kategorii

**Oczekiwany wynik:** Działający endpoint DELETE usuwający kategorie (tylko admin)

### Krok 6: Integracja z logowaniem błędów
**W plikach:** `server/routes/categories.routes.mjs`

**Zadania:**
- Zaimportować `errorLogService`
- Dodać do catch blocków wszystkich handlerów
- Logować:
  - user_id z `request.user?.id`
  - endpoint z `request.url`
  - method z `request.method`
  - status_code
  - error_message
  - request_data (JSON.stringify body/params)
  - user_agent z headers
- Logować tylko błędy 403 i 5xx
- Upewnić się, że logowanie nie blokuje odpowiedzi

**Oczekiwany wynik:** Wszystkie istotne błędy są logowane do tabeli error_logs

### Krok 7: Testy manualne
**Narzędzia:** Postman/Insomnia/curl

**Scenariusze testowe:**

1. **GET /api/categories**
   - Wywołanie bez autoryzacji → 200 + lista kategorii
   - Pusta baza → 200 + []

2. **PUT /api/categories/{id} - CREATE MODE (kategoria nie istnieje)**
   - Bez tokenu → 401
   - Token user (nie admin) → 403
   - Token admin + prawidłowe dane (name + color) → 201 Created
   - Token admin + brak name → 400 "Name and color are required"
   - Token admin + brak color → 400 "Name and color are required"
   - Token admin + nieprawidłowy color → 400
   - Token admin + duplikat name → 409

3. **PUT /api/categories/{id} - UPDATE MODE (kategoria istnieje)**
   - Bez tokenu → 401
   - Token user → 403
   - Token admin + tylko name → 200 OK
   - Token admin + tylko color → 200 OK
   - Token admin + name i color → 200 OK
   - Token admin + puste body → 400 "At least one field must be provided"
   - Token admin + duplikat name → 409

4. **DELETE /api/categories/{id}**
   - Bez tokenu → 401
   - Token user → 403
   - Token admin + nieistniejące id → 404
   - Token admin + istniejące id → 204
   - Sprawdzić czy lists z tą kategorią mają category_id = NULL

**Oczekiwany wynik:** Wszystkie scenariusze działają zgodnie z oczekiwaniami

### Krok 8: Optymalizacja i dokumentacja
**Zadania:**
- Przejrzeć kod pod kątem optymalizacji
- Dodać komentarze JSDoc do wszystkich funkcji service
- Dodać przykłady użycia w komentarzach
- Rozważyć implementację cachowania dla GET
- Zmierzyć czasy odpowiedzi i zoptymalizować jeśli >100ms
- Zaktualizować dokumentację API (jeśli istnieje)
- Dodać przykłady curl do README:
  ```bash
  # Create new category
  curl -X PUT http://localhost:3000/api/categories/10 \
    -H "Authorization: Bearer <admin-token>" \
    -H "Content-Type: application/json" \
    -d '{"name":"Work","color":"#3B82F6"}'
  
  # Update existing category
  curl -X PUT http://localhost:3000/api/categories/10 \
    -H "Authorization: Bearer <admin-token>" \
    -H "Content-Type: application/json" \
    -d '{"color":"#FF5733"}'
  ```

**Oczekiwany wynik:** Zoptymalizowany, udokumentowany kod gotowy do produkcji

### Krok 9: Code review i merge
**Zadania:**
- Utworzyć Pull Request
- Zaprosić do code review
- Poprawić zgłoszone uwagi
- Upewnić się, że kod spełnia standardy projektu
- Merge do głównej gałęzi
- Deploy do środowiska staging/produkcji

**Oczekiwany wynik:** Endpoint Categories w pełni wdrożony i dostępny w produkcji

---

## Podsumowanie

Ten plan implementacji zapewnia kompleksowy przewodnik dla zespołu deweloperskiego do wdrożenia endpointu Categories API z użyciem semantyki PUT do upsert (create or update). Kluczowe punkty:

- **Semantyka PUT:** Jeden endpoint do tworzenia i aktualizacji kategorii
- **Walidacja dynamiczna:** 
  - Create: wymagane name AND color
  - Update: wymagane minimum jedno pole (name OR color)
- **Bezpieczeństwo:** Operacje modyfikujące wymagają roli admin
- **Wydajność:** Optymalne zapytania z możliwością cachowania
- **Obsługa błędów:** Pełne pokrycie wszystkich scenariuszy błędów
- **Logowanie:** Systematyczne logowanie istotnych błędów
- **Testowanie:** Szczegółowe scenariusze testowe dla obu trybów (create/update)

Implementacja powinna przebiegać sekwencyjnie według kroków 1-9, z testowaniem po każdym kroku.
