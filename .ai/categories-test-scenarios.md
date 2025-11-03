# Categories API - Scenariusze testowe

## Przegląd
Dokumentacja testowa dla endpointów API Categories z przykładami cURL.

**Uwaga:** Wszystkie endpointy są dostępne pod prefiksem `/api`, który jest automatycznie dodawany przez apiMiddleware.

## Endpoint: GET /api/categories

### Test 1: Pobieranie wszystkich kategorii (bez autoryzacji)
```bash
curl -X GET http://localhost:3000/api/categories
```

**Oczekiwana odpowiedź:** 200 OK
```json
[]
```
lub jeśli są kategorie:
```json
[
  {
    "id": 1,
    "name": "Praca",
    "color": "#3B82F6",
    "created_at": "2025-01-17T10:30:00.000Z"
  }
]
```

---

## Endpoint: PUT /api/categories/:id

### Test 2: Tworzenie kategorii bez autoryzacji
```bash
curl -X PUT http://localhost:3000/api/categories/1 \
  -H "Content-Type: application/json" \
  -d '{"name":"Work","color":"#3B82F6"}'
```

**Oczekiwana odpowiedź:** 401 Unauthorized
```json
{
  "statusCode": 401,
  "error": "Unauthorized",
  "message": "Authentication required"
}
```

### Test 3: Tworzenie kategorii z tokenem użytkownika (nie admin)
```bash
curl -X PUT http://localhost:3000/api/categories/1 \
  -H "Content-Type: application/json" \
  -H "Cookie: sessionId=USER_SESSION_ID" \
  -d '{"name":"Work","color":"#3B82F6"}'
```

**Oczekiwana odpowiedź:** 403 Forbidden
```json
{
  "statusCode": 403,
  "error": "Forbidden",
  "message": "Admin role required"
}
```

### Test 4: Tworzenie nowej kategorii (CREATE MODE)
```bash
curl -X PUT http://localhost:3000/api/categories/1 \
  -H "Content-Type: application/json" \
  -H "Cookie: sessionId=ADMIN_SESSION_ID" \
  -d '{"name":"Work","color":"#3B82F6"}'
```

**Oczekiwana odpowiedź:** 201 Created
```json
{
  "id": 1,
  "name": "Work",
  "color": "#3B82F6",
  "created_at": "2025-01-17T14:22:00.000Z"
}
```

### Test 5: Próba utworzenia bez pola 'name'
```bash
curl -X PUT http://localhost:3000/api/categories/2 \
  -H "Content-Type: application/json" \
  -H "Cookie: sessionId=ADMIN_SESSION_ID" \
  -d '{"color":"#10B981"}'
```

**Oczekiwana odpowiedź:** 400 Bad Request
```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Name and color are required for creating category"
}
```

### Test 6: Próba utworzenia bez pola 'color'
```bash
curl -X PUT http://localhost:3000/api/categories/2 \
  -H "Content-Type: application/json" \
  -H "Cookie: sessionId=ADMIN_SESSION_ID" \
  -d '{"name":"Personal"}'
```

**Oczekiwana odpowiedź:** 400 Bad Request
```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Name and color are required for creating category"
}
```

### Test 7: Próba utworzenia z nieprawidłowym formatem koloru
```bash
curl -X PUT http://localhost:3000/api/categories/2 \
  -H "Content-Type: application/json" \
  -H "Cookie: sessionId=ADMIN_SESSION_ID" \
  -d '{"name":"Personal","color":"blue"}'
```

**Oczekiwana odpowiedź:** 400 Bad Request (Fastify schema validation)

### Test 8: Próba utworzenia z duplikatem nazwy
```bash
# Najpierw utwórz kategorię "Work"
curl -X PUT http://localhost:3000/api/categories/1 \
  -H "Content-Type: application/json" \
  -H "Cookie: sessionId=ADMIN_SESSION_ID" \
  -d '{"name":"Work","color":"#3B82F6"}'

# Następnie spróbuj utworzyć inną kategorię z tą samą nazwą
curl -X PUT http://localhost:3000/api/categories/2 \
  -H "Content-Type: application/json" \
  -H "Cookie: sessionId=ADMIN_SESSION_ID" \
  -d '{"name":"Work","color":"#10B981"}'
```

**Oczekiwana odpowiedź:** 409 Conflict
```json
{
  "statusCode": 409,
  "error": "Conflict",
  "message": "Category with this name already exists"
}
```

### Test 9: Aktualizacja istniejącej kategorii - tylko nazwa (UPDATE MODE)
```bash
# Najpierw utwórz kategorię
curl -X PUT http://localhost:3000/api/categories/1 \
  -H "Content-Type: application/json" \
  -H "Cookie: sessionId=ADMIN_SESSION_ID" \
  -d '{"name":"Work","color":"#3B82F6"}'

# Następnie zaktualizuj tylko nazwę
curl -X PUT http://localhost:3000/api/categories/1 \
  -H "Content-Type: application/json" \
  -H "Cookie: sessionId=ADMIN_SESSION_ID" \
  -d '{"name":"Professional Work"}'
```

**Oczekiwana odpowiedź:** 200 OK
```json
{
  "id": 1,
  "name": "Professional Work",
  "color": "#3B82F6",
  "created_at": "2025-01-17T14:22:00.000Z"
}
```

### Test 10: Aktualizacja istniejącej kategorii - tylko kolor
```bash
curl -X PUT http://localhost:3000/api/categories/1 \
  -H "Content-Type: application/json" \
  -H "Cookie: sessionId=ADMIN_SESSION_ID" \
  -d '{"color":"#FF5733"}'
```

**Oczekiwana odpowiedź:** 200 OK
```json
{
  "id": 1,
  "name": "Professional Work",
  "color": "#FF5733",
  "created_at": "2025-01-17T14:22:00.000Z"
}
```

### Test 11: Aktualizacja istniejącej kategorii - oba pola
```bash
curl -X PUT http://localhost:3000/api/categories/1 \
  -H "Content-Type: application/json" \
  -H "Cookie: sessionId=ADMIN_SESSION_ID" \
  -d '{"name":"Updated Work","color":"#10B981"}'
```

**Oczekiwana odpowiedź:** 200 OK

### Test 12: Próba aktualizacji bez żadnych pól
```bash
curl -X PUT http://localhost:3000/api/categories/1 \
  -H "Content-Type: application/json" \
  -H "Cookie: sessionId=ADMIN_SESSION_ID" \
  -d '{}'
```

**Oczekiwana odpowiedź:** 400 Bad Request
```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "At least one field (name or color) must be provided for update"
}
```

---

## Endpoint: DELETE /api/categories/:id

### Test 13: Usuwanie kategorii bez autoryzacji
```bash
curl -X DELETE http://localhost:3000/api/categories/1
```

**Oczekiwana odpowiedź:** 401 Unauthorized

### Test 14: Usuwanie kategorii z tokenem użytkownika (nie admin)
```bash
curl -X DELETE http://localhost:3000/api/categories/1 \
  -H "Cookie: sessionId=USER_SESSION_ID"
```

**Oczekiwana odpowiedź:** 403 Forbidden

### Test 15: Usuwanie nieistniejącej kategorii
```bash
curl -X DELETE http://localhost:3000/api/categories/999 \
  -H "Cookie: sessionId=ADMIN_SESSION_ID"
```

**Oczekiwana odpowiedź:** 404 Not Found
```json
{
  "statusCode": 404,
  "error": "Not Found",
  "message": "Category not found"
}
```

### Test 16: Usuwanie istniejącej kategorii
```bash
# Najpierw utwórz kategorię
curl -X PUT http://localhost:3000/api/categories/1 \
  -H "Content-Type: application/json" \
  -H "Cookie: sessionId=ADMIN_SESSION_ID" \
  -d '{"name":"To Delete","color":"#FF0000"}'

# Następnie usuń ją
curl -X DELETE http://localhost:3000/api/categories/1 \
  -H "Cookie: sessionId=ADMIN_SESSION_ID"
```

**Oczekiwana odpowiedź:** 204 No Content (pusta odpowiedź)

---

## Endpoint: Method Not Allowed

### Test 17: POST na /api/categories
```bash
curl -X POST http://localhost:3000/api/categories \
  -H "Content-Type: application/json" \
  -d '{"name":"Test"}'
```

**Oczekiwana odpowiedź:** 405 Method Not Allowed
```json
{
  "statusCode": 405,
  "error": "Method Not Allowed",
  "message": "Method POST is not allowed for this endpoint"
}
```

### Test 18: PATCH na /api/categories/:id
```bash
curl -X PATCH http://localhost:3000/api/categories/1 \
  -H "Content-Type: application/json" \
  -d '{"name":"Test"}'
```

**Oczekiwana odpowiedź:** 405 Method Not Allowed

---

## Uwagi do testowania

### Uzyskanie tokenu sesji administratora:
1. Zaloguj się jako admin przez endpoint `/api/auth/login`
2. Skopiuj wartość cookie `sessionId` z odpowiedzi
3. Użyj go w nagłówku `-H "Cookie: sessionId=WARTOŚĆ"`

### Sprawdzanie bazy danych:
```bash
# Sprawdź zawartość tabeli categories
sqlite3 server/db/app.db "SELECT * FROM categories;"
```

### Czyszczenie danych testowych:
```bash
# Usuń wszystkie kategorie
sqlite3 server/db/app.db "DELETE FROM categories;"
```

### Testowanie walidacji:
- ID musi być liczbą całkowitą >= 1
- name: 1-50 znaków
- color: format hex #RRGGBB (6 cyfr hex po #)
- additionalProperties: false - dodatkowe pola zostaną odrzucone

### Sprawdzanie logów błędów:
```bash
# Zobacz logi błędów w bazie
sqlite3 server/db/app.db "SELECT * FROM error_logs ORDER BY created_at DESC LIMIT 10;"
```
