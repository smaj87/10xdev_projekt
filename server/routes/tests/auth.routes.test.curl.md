# Authentication Endpoints - Test Documentation

### Test 1: Pomyślne logowanie (200 OK)

**Request:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpassword123"}' \
  -v
```

**Oczekiwany response:**
- Status: `200 OK`
- Body:
```json
{
  "user": {
    "id": 1,
    "email": "test@example.com",
    "role": "user"
  }
}
```
- Headers: `Set-Cookie: sessionId=<UUID>; Path=/; HttpOnly; SameSite=Strict; Max-Age=604800`

**Weryfikacja:**
- ✅ Zwrócony obiekt user zawiera id, email, role
- ✅ Brak password_hash w odpowiedzi
- ✅ Cookie sessionId jest ustawione
- ✅ Cookie ma flagi: HttpOnly, SameSite=Strict
- ✅ maxAge = 604800 (7 dni w sekundach)

---

### Test 2: Nieprawidłowe hasło (461 Unauthorized)

**Request:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"wrongPassword"}'
```

**Oczekiwany response:**
- Status: `461 Unauthorized`
- Body:
```json
{
  "statusCode": 461,
  "error": "Unauthorized",
  "message": "Invalid email or password"
}
```

**Weryfikacja:**
- ✅ Status code = 461
- ✅ Komunikat nie ujawnia czy email istnieje w bazie
- ✅ Brak cookie sessionId

---

### Test 3: Nieistniejący email (461 Unauthorized)

**Request:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"nonexistent@example.com","password":"anyPassword"}'
```

**Oczekiwany response:**
- Status: `461 Unauthorized`
- Body:
```json
{
  "statusCode": 461,
  "error": "Unauthorized",
  "message": "Invalid email or password"
}
```

**Weryfikacja:**
- ✅ Identyczny komunikat jak dla błędnego hasła (bezpieczeństwo)
- ✅ Brak ujawniania czy email istnieje

---

### Test 4: Konto zablokowane (463 Forbidden)

**Request:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"blocked@example.com","password":"blocked123"}'
```

**Oczekiwany response:**
- Status: `463 Forbidden`
- Body:
```json
{
  "statusCode": 463,
  "error": "Forbidden",
  "message": "Account is blocked"
}
```

**Weryfikacja:**
- ✅ Status code = 463
- ✅ Jasny komunikat o blokadzie konta
- ✅ Błąd logowany do tabeli error_logs

---

### Test 5: Nieprawidłowy format email (400 Bad Request)

**Request:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"notanemail","password":"password123"}'
```

**Oczekiwany response:**
- Status: `400 Bad Request`
- Body:
```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "body/email must match format \"email\""
}
```

**Weryfikacja:**
- ✅ Fastify schema validation działa
- ✅ Błąd walidacji przed wykonaniem logiki biznesowej

---

### Test 6: Brakujące pole email (400 Bad Request)

**Request:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"password":"password123"}'
```

**Oczekiwany response:**
- Status: `400 Bad Request`
- Body:
```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "body must have required property 'email'"
}
```

---

### Test 7: Brakujące pole password (400 Bad Request)

**Request:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

**Oczekiwany response:**
- Status: `400 Bad Request`
- Body:
```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "body must have required property 'password'"
}
```

---

### Test 8: Nieprawidłowa metoda HTTP (405 Method Not Allowed)

**Request:**
```bash
curl -X GET http://localhost:3000/api/auth/login
```

**Oczekiwany response:**
- Status: `405 Method Not Allowed`
- Body:
```json
{
  "statusCode": 405,
  "error": "Method Not Allowed",
  "message": "Method GET not allowed for this endpoint"
}
```

---

## Endpoint: GET /api/auth/logout

### Test 9: Pomyślne wylogowanie (204 No Content)

**Najpierw zaloguj się, aby uzyskać sessionId:**
```bash
# Krok 1: Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpassword123"}' \
  -c cookies.txt

# Krok 2: Logout z zapisanym cookie
curl -X GET http://localhost:3000/api/auth/logout \
  -b cookies.txt \
  -v
```

**Oczekiwany response:**
- Status: `204 No Content`
- Body: (pusty)
- Headers: `Set-Cookie: sessionId=; Path=/; Max-Age=0` (czyszczenie cookie)

**Weryfikacja:**
- ✅ Status code = 204
- ✅ Brak body w odpowiedzi
- ✅ Cookie sessionId usunięte
- ✅ Sesja usunięta z tabeli user_sessions

---

### Test 10: Wylogowanie bez sesji (409 Unauthorized)

**Request:**
```bash
curl -X GET http://localhost:3000/api/auth/logout
```

**Oczekiwany response:**
- Status: `409 Unauthorized`
- Body:
```json
{
  "statusCode": 409,
  "error": "Unauthorized",
  "message": "Authentication required"
}
```

**Weryfikacja:**
- ✅ Endpoint wymaga sesji
- ✅ Middleware authMiddleware działa poprawnie

---

### Test 11: Wylogowanie z wygasłą sesją (401 Unauthorized)

**Setup:**
1. Utwórz sesję w bazie z `expires_at` w przeszłości
2. Użyj tego sessionId w cookie

**Request:**
```bash
curl -X GET http://localhost:3000/api/auth/logout \
  -H "Cookie: sessionId=expired-session-uuid"
```

**Oczekiwany response:**
- Status: `401 Unauthorized`
- Body:
```json
{
  "statusCode": 401,
  "error": "Unauthorized",
  "message": "Invalid or expired session"
}
```

---

### Test 12: Nieprawidłowa metoda HTTP dla logout (405 Method Not Allowed)

**Request:**
```bash
curl -X POST http://localhost:3000/api/auth/logout
```

**Oczekiwany response:**
- Status: `405 Method Not Allowed`
- Body:
```json
{
  "statusCode": 405,
  "error": "Method Not Allowed",
  "message": "Method POST not allowed for this endpoint"
}
```

---

## Weryfikacja bezpieczeństwa (Krok 5)

### Checklist bezpieczeństwa

#### ✅ Hasła i credentials
- [ ] Hasła nie są logowane w `error_logs.request_data`
- [ ] Password nie jest zwracane w żadnej odpowiedzi API
- [ ] Bcrypt używany do weryfikacji haseł (odporny na timing attacks)
- [ ] Komunikaty błędów nie ujawniają czy email istnieje w bazie

#### ✅ Sesje
- [ ] Session ID generowane jako UUID v4 (nieprzewidywalne)
- [ ] Sesje wygasają po 7 dniach (604800 sekund)
- [ ] Sesje usuwane z bazy przy logout
- [ ] Middleware sprawdza `expires_at > datetime('now')`

#### ✅ Cookies
- [ ] Cookie ma flagę `HttpOnly` (ochrona przed XSS)
- [ ] Cookie ma flagę `SameSite=Strict` (ochrona przed CSRF)
- [ ] Cookie ma flagę `Secure` w production (tylko HTTPS)
- [ ] `Path=/` (dostępne dla całej aplikacji)
- [ ] `Max-Age=604800` (7 dni)

#### ✅ SQL Injection
- [ ] Wszystkie query używają prepared statements
- [ ] Parametry przekazywane przez `db.prepare().run/get/all()`
- [ ] Brak konkatenacji stringów w SQL queries

#### ✅ Obsługa błędów
- [ ] Wszystkie operacje DB w try-catch
- [ ] Błędy 500 logowane do `error_logs`
- [ ] Błędy nie ujawniają szczegółów implementacji
- [ ] Stack traces nie są wysyłane do klienta

#### ✅ Walidacja
- [ ] Fastify schema validation dla wszystkich inputów
- [ ] Email format walidowany
- [ ] Required fields oznaczone w schemacie
- [ ] `additionalProperties: false` blokuje nieznane pola

#### ✅ Konta zablokowane
- [ ] Sprawdzenie `is_blocked` przed weryfikacją hasła
- [ ] Status 463 dla zablokowanych kont
- [ ] Logowanie prób logowania na zablokowane konta

---

## Weryfikacja działania w bazie danych

### Sprawdzenie utworzenia sesji po loginie
```sql
SELECT id, user_id, expires_at, created_at
FROM user_sessions
WHERE user_id = 1
ORDER BY created_at DESC
LIMIT 1;
```

### Sprawdzenie usunięcia sesji po logout
```sql
-- Powinno zwrócić 0 wierszy po wylogowaniu
SELECT * FROM user_sessions WHERE id = '<session-id-from-cookie>';
```

### Sprawdzenie logowania błędów
```sql
SELECT endpoint, method, status_code, error_message, created_at
FROM error_logs
WHERE endpoint = '/auth/login'
ORDER BY created_at DESC
LIMIT 10;
```

---

## Performance Benchmarking (opcjonalne)

### Test czasu odpowiedzi LOGIN
```bash
time curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpassword123"}' \
  -o /dev/null -s
```

**Oczekiwany czas:** 150-250ms (głównie bcrypt.compare)

### Test czasu odpowiedzi LOGOUT
```bash
time curl -X GET http://localhost:3000/api/auth/logout \
  -H "Cookie: sessionId=<valid-session-id>" \
  -o /dev/null -s
```

**Oczekiwany czas:** 10-20ms

---

## Troubleshooting

### Problem: 404 Not Found dla /api/auth/login
**Rozwiązanie:**
1. Sprawdź czy `auth.routes.mjs` jest w katalogu `server/routes/`
2. Sprawdź czy `routeLoader.mjs` ładuje plik
3. Sprawdź logi serwera podczas startu

### Problem: Cookie nie jest ustawiane
**Rozwiązanie:**
1. Sprawdź czy `@fastify/cookie` jest zainstalowany
2. Sprawdź czy plugin cookie jest zarejestrowany w Fastify
3. W przeglądarce: sprawdź DevTools → Application → Cookies

### Problem: Sesja nie jest rozpoznawana
**Rozwiązanie:**
1. Sprawdź czy `authMiddleware` jest zarejestrowany jako preHandler
2. Sprawdź czy cookie jest wysyłane w request headers
3. Sprawdź czy sesja nie wygasła (`expires_at`)

### Problem: Błąd 500 przy logowaniu
**Rozwiązanie:**
1. Sprawdź logi serwera (console.log w database.mjs jeśli NODE_ENV=development)
2. Sprawdź czy tabele `users` i `user_sessions` istnieją
3. Sprawdź czy `bcrypt` jest zainstalowany
4. Sprawdź tabelę `error_logs` dla szczegółów

---

## Podsumowanie testowania

### Scenariusze do przetestowania (12 total)

**POST /api/auth/login:**
- [x] Test 1: Pomyślne logowanie (200)
- [x] Test 2: Nieprawidłowe hasło (461)
- [x] Test 3: Nieistniejący email (461)
- [x] Test 4: Konto zablokowane (463)
- [x] Test 5: Nieprawidłowy format email (400)
- [x] Test 6: Brakujące pole email (400)
- [x] Test 7: Brakujące pole password (400)
- [x] Test 8: Nieprawidłowa metoda HTTP (405)

**GET /api/auth/logout:**
- [x] Test 9: Pomyślne wylogowanie (204)
- [x] Test 10: Wylogowanie bez sesji (409)
- [x] Test 11: Wylogowanie z wygasłą sesją (401)
- [x] Test 12: Nieprawidłowa metoda HTTP (405)

---

**Koniec dokumentacji testowej**

