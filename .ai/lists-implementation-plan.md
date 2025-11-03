# API Endpoint Implementation Plan: Lists Management

## 1. Przegląd punktu końcowego

Ten plan obejmuje implementację dwóch endpointów do zarządzania listami zadań:

1. **PUT /api/lists** - Endpoint do tworzenia nowej listy lub aktualizacji istniejącej (upsert operation). Jeśli w body znajduje się `id`, endpoint aktualizuje istniejącą listę (tylko jeśli użytkownik jest jej właścicielem). Jeśli `id` nie jest podane, tworzona jest nowa lista z aktualnym użytkownikiem jako właścicielem.

2. **DELETE /api/lists/{listId}** - Endpoint do usuwania listy wraz ze wszystkimi powiązanymi zadaniami i współpracownikami. Dostępny tylko dla administratorów i tylko dla list, które zostały wcześniej zarchiwizowane.

## 2. Szczegóły żądania

### PUT /api/lists

- **Metoda HTTP:** PUT
- **Struktura URL:** `/api/lists`
- **Uwierzytelnienie:** Wymagane (sessionId cookie lub JWT Bearer token)
- **Content-Type:** application/json

**Parametry body:**

*Wymagane (dla nowej listy):*
- `title` (string) - Tytuł listy, nie może być pusty

*Opcjonalne:*
- `id` (number) - ID listy do aktualizacji (jeśli podane, wykonywana jest aktualizacja)
- `category_id` (number) - ID kategorii z tabeli `categories`
- `priority` (string) - Priorytet: "low", "normal" (default), "high"
- `due_date` (string) - Termin wykonania w formacie ISO YYYY-MM-DD

**Przykładowe żądanie (nowa lista):**
```json
{
  "title": "Zakupy na weekend",
  "category_id": 3,
  "priority": "high",
  "due_date": "2025-10-20"
}
```

**Przykładowe żądanie (aktualizacja):**
```json
{
  "id": 5,
  "title": "Zakupy na weekend - zaktualizowane",
  "priority": "normal"
}
```

### DELETE /api/lists/{listId}

- **Metoda HTTP:** DELETE
- **Struktura URL:** `/api/lists/{listId}`
- **Uwierzytelnienie:** Wymagane (sessionId cookie lub JWT Bearer token)
- **Autoryzacja:** Tylko administratorzy (role === "admin")

**Parametry URL:**
- `listId` (number, required) - ID listy do usunięcia

**Walidacja biznesowa:**
- Lista musi być zarchiwizowana (is_archived = true)

## 3. Wykorzystywane typy

### DTOs (Data Transfer Objects)

**CreateListDto:**
```typescript
interface CreateListDto {
  title: string;          // required, min 1 char
  category_id?: number;   // optional, positive integer
  priority?: 'low' | 'normal' | 'high';  // optional, default 'normal'
  due_date?: string;      // optional, format YYYY-MM-DD
}
```

**UpdateListDto:**
```typescript
interface UpdateListDto {
  id: number;             // required, positive integer
  title?: string;         // optional, min 1 char if provided
  category_id?: number;   // optional, positive integer, null to unset
  priority?: 'low' | 'normal' | 'high';  // optional
  due_date?: string;      // optional, format YYYY-MM-DD, null to unset
}
```

**ListResponseDto:**
```typescript
interface ListResponseDto {
  id: number;
  title: string;
  owner_id: number;
  category_id: number | null;
  priority: 'low' | 'normal' | 'high';
  due_date: string | null;
  is_archived: boolean;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
}
```

**DeleteListParamsDto:**
```typescript
interface DeleteListParamsDto {
  listId: number;  // positive integer
}
```

### Command Models

Nie są wymagane osobne modele Command - DTOs są wystarczające dla tego endpointu.

## 4. Szczegóły odpowiedzi

### PUT /api/lists

**Sukces (201 Created):**
```json
{
  "id": 15,
  "title": "Zakupy na weekend",
  "owner_id": 42,
  "category_id": 3,
  "priority": "high",
  "due_date": "2025-10-20",
  "is_archived": false,
  "archived_at": null,
  "created_at": "2025-10-17T10:30:00.000Z",
  "updated_at": "2025-10-17T10:30:00.000Z"
}
```

**Sukces aktualizacji (200 OK):**
```json
{
  "id": 5,
  "title": "Zakupy na weekend - zaktualizowane",
  "owner_id": 42,
  "category_id": 3,
  "priority": "normal",
  "due_date": "2025-10-20",
  "is_archived": false,
  "archived_at": null,
  "created_at": "2025-10-15T08:20:00.000Z",
  "updated_at": "2025-10-17T10:35:00.000Z"
}
```

**Błędy:**
- **400 Bad Request:** Brak wymaganego pola, nieprawidłowy format danych
  ```json
  {
    "statusCode": 400,
    "error": "Bad Request",
    "message": "body must have required property 'title'"
  }
  ```
- **401 Unauthorized:** Brak uwierzytelnienia
- **403 Forbidden:** Próba aktualizacji listy nie będąc jej właścicielem
  ```json
  {
    "statusCode": 403,
    "error": "Forbidden",
    "message": "You are not the owner of this list"
  }
  ```
- **404 Not Found:** Lista o podanym id nie istnieje
- **500 Internal Server Error:** Błąd serwera

### DELETE /api/lists/{listId}

**Sukces (204 No Content):**
- Brak body w odpowiedzi

**Błędy:**
- **400 Bad Request:** Lista nie jest zarchiwizowana
  ```json
  {
    "statusCode": 400,
    "error": "Bad Request",
    "message": "Only archived lists can be deleted"
  }
  ```
- **401 Unauthorized:** Brak uwierzytelnienia
- **403 Forbidden:** Użytkownik nie jest administratorem
  ```json
  {
    "statusCode": 403,
    "error": "Forbidden",
    "message": "Admin role required"
  }
  ```
- **404 Not Found:** Lista nie istnieje
- **500 Internal Server Error:** Błąd serwera

## 5. Przepływ danych

### PUT /api/lists

1. **Walidacja żądania (Fastify schema)**
   - Sprawdzenie formatu body
   - Walidacja typów danych
   - Walidacja enuma priority
   - Walidacja formatu daty

2. **Middleware uwierzytelniania**
   - Weryfikacja sessionId lub JWT
   - Pobranie danych użytkownika z `user_sessions` i `users`
   - Sprawdzenie czy użytkownik nie jest zablokowany

3. **Rozróżnienie operacji (create vs update)**
   - Jeśli `body.id` istnieje → UPDATE flow
   - Jeśli `body.id` nie istnieje → CREATE flow

4. **CREATE flow:**
   - Walidacja biznesowa:
     - `title` jest wymagane
     - `category_id` istnieje w tabeli `categories` (jeśli podane)
   - Wywołanie `listService.createList(userId, data)`
   - INSERT do tabeli `lists` z:
     - `title`, `category_id`, `priority`, `due_date`
     - `owner_id` = aktualny użytkownik
     - `is_archived` = false
   - Zwrócenie utworzonej listy z kodem 201

5. **UPDATE flow:**
   - Walidacja biznesowa:
     - Lista o podanym `id` istnieje
     - Przynajmniej jedno pole do aktualizacji (oprócz id)
     - `category_id` istnieje w tabeli `categories` (jeśli podane)
   - Sprawdzenie autoryzacji:
     - Wywołanie `listService.isListOwner(listId, userId)`
     - Jeśli false → 403 Forbidden
   - Wywołanie `listService.updateList(listId, userId, data)`
   - UPDATE tabeli `lists`
   - Trigger `update_lists_timestamp` automatycznie ustawia `updated_at`
   - Zwrócenie zaktualizowanej listy z kodem 200

6. **Logowanie błędów**
   - Wszystkie błędy 4xx i 5xx logowane do `error_logs`

### DELETE /api/lists/{listId}

1. **Walidacja parametrów URL (Fastify schema)**
   - `listId` jest liczbą całkowitą dodatnią

2. **Middleware uwierzytelniania**
   - Weryfikacja sesji
   - Pobranie danych użytkownika

3. **Sprawdzenie autoryzacji**
   - Middleware `requireAdmin` sprawdza czy `user.role === 'admin'`
   - Jeśli nie → 403 Forbidden

4. **Walidacja biznesowa**
   - Wywołanie `listService.getListById(listId)`
   - Jeśli lista nie istnieje → 404 Not Found
   - Sprawdzenie `list.is_archived === true`
   - Jeśli false → 400 Bad Request "Only archived lists can be deleted"

5. **Usuwanie listy**
   - Wywołanie `listService.deleteList(listId)`
   - DELETE z tabeli `lists` WHERE id = listId
   - Kaskadowe usunięcie dzięki `ON DELETE CASCADE`:
     - Wszystkie zadania z `tasks` (FOREIGN KEY list_id)
     - Wszyscy współpracownicy z `list_collaborators` (FOREIGN KEY list_id)

6. **Odpowiedź**
   - 204 No Content (brak body)

7. **Logowanie błędów**
   - Błędy logowane do `error_logs`

## 6. Względy bezpieczeństwa

### Uwierzytelnianie
- **Mechanizm:** HTTP-only cookie `sessionId` lub JWT Bearer token w nagłówku Authorization
- **Weryfikacja sesji:** 
  - Pobranie sesji z tabeli `user_sessions`
  - Sprawdzenie `expires_at` > current timestamp
  - Pobranie użytkownika z tabeli `users`
  - Sprawdzenie `is_blocked === false`
- **Middleware:** `auth.middleware.mjs`

### Autoryzacja

**PUT /api/lists:**
- Każdy uwierzytelniony użytkownik może tworzyć listy
- Tylko owner może aktualizować swoją listę
- Sprawdzenie: `lists.owner_id === request.user.id`

**DELETE /api/lists/{listId}:**
- Tylko administratorzy (`role === 'admin'`)
- Middleware: `requireAdmin.middleware.mjs`
- Dodatkowa walidacja: lista musi być zarchiwizowana

### Walidacja danych wejściowych

**Fastify Schema Validation:**
```javascript
// PUT /api/lists
schema: {
  body: {
    type: 'object',
    properties: {
      id: { type: 'integer', minimum: 1 },
      title: { type: 'string', minLength: 1 },
      category_id: { type: ['integer', 'null'], minimum: 1 },
      priority: { type: 'string', enum: ['low', 'normal', 'high'] },
      due_date: { type: ['string', 'null'], format: 'date' }
    },
    // title wymagane tylko jeśli id nie jest podane (walidowane w handlerze)
  }
}

// DELETE /api/lists/{listId}
schema: {
  params: {
    type: 'object',
    required: ['listId'],
    properties: {
      listId: { type: 'integer', minimum: 1 }
    }
  }
}
```

**Walidacja biznesowa:**
- Sprawdzenie czy `category_id` istnieje w tabeli `categories`
- Walidacja formatu daty `due_date` (YYYY-MM-DD)
- Przy aktualizacji: przynajmniej jedno pole oprócz `id`

### Ochrona przed SQL Injection
- Użycie prepared statements w SQLite
- Wszystkie zapytania przez parametryzowane query

### Ochrona przed CSRF
- HTTP-only cookies uniemożliwiają dostęp z JavaScript
- SameSite attribute na cookies

### Sanityzacja danych
- Fastify automatycznie sanityzuje dane wejściowe zgodnie ze schematem
- Brak możliwości XSS przez dane tekstowe

### Rate Limiting
- Zalecane: implementacja rate limiting na poziomie Fastify
- Limit np. 100 żądań/minutę per użytkownik

## 7. Obsługa błędów

### PUT /api/lists

| Kod | Scenariusz | Komunikat | Logowanie |
|-----|-----------|-----------|-----------|
| 400 | Brak title przy tworzeniu nowej listy | "body must have required property 'title'" | error_logs |
| 400 | Nieprawidłowy priority | "body/priority must be equal to one of the allowed values" | error_logs |
| 400 | Nieprawidłowy format due_date | "body/due_date must match format 'date'" | error_logs |
| 400 | Nieistniejący category_id | "Category with id {category_id} does not exist" | error_logs |
| 400 | Brak pól do aktualizacji | "At least one field to update is required" | error_logs |
| 401 | Brak lub nieprawidłowa sesja | "Unauthorized" | error_logs |
| 403 | Próba aktualizacji nie swojej listy | "You are not the owner of this list" | error_logs |
| 404 | Lista o podanym id nie istnieje | "List with id {id} not found" | error_logs |
| 500 | Błąd bazy danych | "Internal server error" | error_logs + console |

### DELETE /api/lists/{listId}

| Kod | Scenariusz | Komunikat | Logowanie |
|-----|-----------|-----------|-----------|
| 400 | Lista nie jest zarchiwizowana | "Only archived lists can be deleted" | error_logs |
| 400 | Nieprawidłowy format listId | "params/listId must be integer" | error_logs |
| 401 | Brak lub nieprawidłowa sesja | "Unauthorized" | error_logs |
| 403 | Użytkownik nie jest adminem | "Admin role required" | error_logs |
| 404 | Lista nie istnieje | "List with id {listId} not found" | error_logs |
| 500 | Błąd bazy danych przy usuwaniu | "Internal server error" | error_logs + console |

### Struktura logowania błędów

Wszystkie błędy są rejestrowane w tabeli `error_logs`:
```javascript
await errorLogService.log({
  user_id: request.user?.id || null,
  endpoint: request.url,
  method: request.method,
  status_code: error.statusCode || 500,
  error_message: error.message,
  request_data: JSON.stringify(request.body || request.params),
  response_data: JSON.stringify(reply.body),
  user_agent: request.headers['user-agent']
});
```

## 8. Rozważania dotyczące wydajności

### Potencjalne wąskie gardła

1. **Walidacja category_id:**
   - Każde żądanie z category_id wymaga sprawdzenia w bazie
   - **Rozwiązanie:** Cache kategorii w pamięci (Redis lub in-memory)

2. **Sprawdzanie właściciela przy UPDATE:**
   - Dodatkowe zapytanie do bazy
   - **Rozwiązanie:** Połączenie sprawdzenia z głównym UPDATE w jednym zapytaniu

3. **Kaskadowe usuwanie przy DELETE:**
   - Usuwanie listy z wieloma zadaniami i współpracownikami może być kosztowne
   - **Rozwiązanie:** SQLite automatycznie obsługuje CASCADE, ale dla dużych list warto rozważyć asynchroniczne usuwanie

### Optymalizacje

**Indeksy (już zdefiniowane w db-plan.md):**
- `idx_lists_owner_id` - szybkie filtrowanie list użytkownika
- `idx_lists_is_archived` - szybkie sprawdzenie statusu archiwizacji
- `idx_tasks_list_id` - szybkie kaskadowe usuwanie zadań
- `idx_list_collaborators_list_id` - szybkie kaskadowe usuwanie współpracowników

**Zapytania:**
- Użycie `RETURNING *` w SQLite do zwrócenia danych bez dodatkowego SELECT
- Transakcje dla operacji DELETE (atomowość)

**Caching:**
- Cache listy kategorii (zmienia się rzadko)
- Walidacja category_id bez zapytania do bazy

**Paginacja:**
- Nie dotyczy tych endpointów (pojedyncze operacje)

**Connection pooling:**
- Fastify + better-sqlite3 z connection pooling dla lepszej wydajności

## 9. Etapy wdrożenia

### Faza 1: Przygotowanie struktury i serwisu

1. **Utworzenie list.service.mjs** (`server/services/list.service.mjs`)
   - Metoda `createList(ownerId, data)` - INSERT do tabeli lists
   - Metoda `updateList(listId, ownerId, data)` - UPDATE listy z walidacją ownera
   - Metoda `getListById(listId)` - SELECT listy po id
   - Metoda `deleteList(listId)` - DELETE listy (kaskadowe)
   - Metoda `isListOwner(listId, userId)` - sprawdzenie właściciela
   - Metoda `isListArchived(listId)` - sprawdzenie statusu archiwizacji
   - Użycie prepared statements dla bezpieczeństwa

2. **Dodanie funkcji walidacyjnych do serwisu**
   - `validateCategoryExists(categoryId)` - sprawdzenie czy kategoria istnieje
   - Obsługa błędów SQLite (UNIQUE constraint, FOREIGN KEY constraint)

### Faza 2: Implementacja endpointu PUT /api/lists

3. **Utworzenie pliku routingu** (`server/routes/list.routes.mjs`)
   - Skeleton struktury z eksportem default funkcji async

4. **Implementacja PUT /api/lists**
   - Definicja schematu Fastify dla walidacji body
   - Middleware auth.middleware.mjs (automatycznie ładowany)
   - Handler:
     - Rozróżnienie operacji na podstawie obecności `body.id`
     - CREATE flow:
       - Walidacja wymaganego `title`
       - Walidacja `category_id` (jeśli podane)
       - Wywołanie `listService.createList(request.user.id, data)`
       - Zwrot 201 z utworzoną listą
     - UPDATE flow:
       - Walidacja: przynajmniej jedno pole do aktualizacji
       - Sprawdzenie czy lista istnieje
       - Sprawdzenie czy użytkownik jest właścicielem
       - Walidacja `category_id` (jeśli podane)
       - Wywołanie `listService.updateList(body.id, request.user.id, data)`
       - Zwrot 200 z zaktualizowaną listą
   - Obsługa błędów:
     - Catch wszystkich wyjątków
     - Logowanie do error_logs
     - Zwrot odpowiednich kodów statusu

5. **Testy jednostkowe PUT /api/lists**
   - Test tworzenia nowej listy (201)
   - Test tworzenia z category_id
   - Test tworzenia z pełnymi danymi (priority, due_date)
   - Test aktualizacji własnej listy (200)
   - Test aktualizacji tylko title
   - Test aktualizacji tylko priority
   - Test błędu 400 - brak title przy tworzeniu
   - Test błędu 400 - nieprawidłowy priority
   - Test błędu 400 - nieprawidłowy format due_date
   - Test błędu 400 - nieistniejący category_id
   - Test błędu 401 - brak uwierzytelnienia
   - Test błędu 403 - aktualizacja nie swojej listy
   - Test błędu 404 - aktualizacja nieistniejącej listy

### Faza 3: Implementacja endpointu DELETE /api/lists/{listId}

6. **Implementacja DELETE /api/lists/{listId}**
   - Definicja schematu Fastify dla walidacji params
   - Middleware auth.middleware.mjs
   - Middleware requireAdmin.middleware.mjs
   - Handler:
     - Pobranie listy przez `listService.getListById(listId)`
     - Sprawdzenie czy lista istnieje (404)
     - Sprawdzenie czy lista jest zarchiwizowana (400)
     - Wywołanie `listService.deleteList(listId)`
     - Zwrot 204 No Content
   - Obsługa błędów:
     - Logowanie do error_logs
     - Odpowiednie kody statusu

7. **Implementacja metody 405 dla nieobsługiwanych metod**
   - Użycie utility `methodNotAllowed.mjs`
   - Dodanie handlera dla GET, POST, PATCH zwracającego 405

8. **Testy jednostkowe DELETE /api/lists/{listId}**
   - Test usuwania zarchiwizowanej listy przez admina (204)
   - Test kaskadowego usunięcia zadań
   - Test kaskadowego usunięcia współpracowników
   - Test błędu 400 - lista nie jest zarchiwizowana
   - Test błędu 401 - brak uwierzytelnienia
   - Test błędu 403 - użytkownik nie jest adminem
   - Test błędu 404 - lista nie istnieje

### Faza 4: Integracja i testy

9. **Testy integracyjne**
   - Pełny przepływ: utworzenie listy → aktualizacja → archiwizacja → usunięcie
   - Test z wieloma zadaniami i współpracownikami
   - Test równoległych żądań (race conditions)
   - Test walidacji category_id z rzeczywistą bazą

10. **Testy wydajnościowe**
    - Benchmark tworzenia listy (powinno < 50ms)
    - Benchmark aktualizacji listy (powinno < 30ms)
    - Benchmark usuwania listy z 1000 zadań (powinno < 200ms)
    - Test connection pooling

11. **Dokumentacja API**
    - Aktualizacja OpenAPI/Swagger schema (jeśli używane)
    - Przykłady curl/Postman
    - Dokumentacja błędów

### Faza 5: Deploy i monitoring

12. **Przygotowanie do produkcji**
    - Code review
    - Weryfikacja logowania błędów
    - Sprawdzenie middleware'ów
    - Weryfikacja schematów walidacji

13. **Monitoring**
    - Dodanie metryk (czas odpowiedzi, ilość błędów)
    - Alerting dla wysokiego poziomu błędów 500
    - Monitoring wykorzystania bazy danych

14. **Dokumentacja dla zespołu**
    - README z opisem endpointów
    - Przykłady użycia
    - Known issues / limitations

---

## Dodatkowe uwagi

### Przyszłe rozszerzenia
- Soft delete zamiast fizycznego usuwania (is_deleted flag)
- Archiwizacja automatyczna po upływie due_date
- Powiadomienia przed due_date
- Eksport listy do różnych formatów (JSON, CSV)
- Duplikacja listy
- WebSocket notifications po utworzeniu/aktualizacji/usunięciu listy

### Zależności
- `better-sqlite3` - driver SQLite3 dla Node.js
- `bcrypt` - hashowanie haseł (dla auth)
- `fastify` - framework webowy
- `@fastify/cookie` - obsługa cookies
- Middleware auth i requireAdmin muszą być zaimplementowane przed tym endpointem

### Zgodność z API Plan
Ten plan implementacji jest w pełni zgodny z `api-plan.md` i `db-plan.md`:
- Wszystkie wymagane pola i opcjonalne parametry
- Kody statusu HTTP zgodne z planem
- Walidacja zgodna z regułami biznesowymi
- Autoryzacja i uwierzytelnianie zgodne z mechanizmem sesji
- Kaskadowe usuwanie zgodne z definicjami FOREIGN KEY

