# Testy curl dla Admin Users API

## Przygotowanie
Przed uruchomieniem testów, ustaw zmienne:

```cmd
set BASE_URL=http://localhost:3000
set ADMIN_SESSION_ID=YOUR_ADMIN_SESSION_ID_HERE
```

Lub dla PowerShell:
```powershell
$BASE_URL="http://localhost:3000"
$ADMIN_SESSION_ID="YOUR_ADMIN_SESSION_ID_HERE"
```

**Uwaga:** Aplikacja używa ciasteczek sesyjnych (sessionId), nie JWT. Musisz najpierw się zalogować i uzyskać sessionId z ciasteczka.

---

## 1. Test podstawowy - pobranie wszystkich użytkowników (domyślna paginacja)

### CMD:
```cmd
curl -X GET "%BASE_URL%/api/admin/users" ^
  -H "Content-Type: application/json" ^
  --cookie "sessionId=%ADMIN_SESSION_ID%"
```

### PowerShell:
```powershell
curl -X GET "$BASE_URL/api/admin/users" `
  -H "Content-Type: application/json" `
  --cookie "sessionId=$ADMIN_SESSION_ID"
```

**Oczekiwany wynik:** Status 200, lista użytkowników z domyślną paginacją (page=1, limit=20)

---

## 2. Test paginacji - strona 2, limit 10

### CMD:
```cmd
curl -X GET "%BASE_URL%/api/admin/users?page=2&limit=10" ^
  -H "Content-Type: application/json" ^
  --cookie "sessionId=%ADMIN_SESSION_ID%"
```

### PowerShell:
```powershell
curl -X GET "$BASE_URL/api/admin/users?page=2&limit=10" `
  -H "Content-Type: application/json" `
  --cookie "sessionId=$ADMIN_SESSION_ID"
```

**Oczekiwany wynik:** Status 200, druga strona z 10 użytkownikami

---

## 3. Test filtrowania - tylko użytkownicy z rolą 'admin'

### CMD:
```cmd
curl -X GET "%BASE_URL%/api/admin/users?role=admin" ^
  -H "Content-Type: application/json" ^
  --cookie "sessionId=%ADMIN_SESSION_ID%"
```

### PowerShell:
```powershell
curl -X GET "$BASE_URL/api/admin/users?role=admin" `
  -H "Content-Type: application/json" `
  --cookie "sessionId=$ADMIN_SESSION_ID"
```

**Oczekiwany wynik:** Status 200, lista tylko administratorów

---

## 4. Test filtrowania - tylko użytkownicy z rolą 'user'

### CMD:
```cmd
curl -X GET "%BASE_URL%/api/admin/users?role=user" ^
  -H "Content-Type: application/json" ^
  --cookie "sessionId=%ADMIN_SESSION_ID%"
```

### PowerShell:
```powershell
curl -X GET "$BASE_URL/api/admin/users?role=user" `
  -H "Content-Type: application/json" `
  --cookie "sessionId=$ADMIN_SESSION_ID"
```

**Oczekiwany wynik:** Status 200, lista tylko zwykłych użytkowników

---

## 5. Test filtrowania - tylko zablokowani użytkownicy

### CMD:
```cmd
curl -X GET "%BASE_URL%/api/admin/users?is_blocked=true" ^
  -H "Content-Type: application/json" ^
  --cookie "sessionId=%ADMIN_SESSION_ID%"
```

### PowerShell:
```powershell
curl -X GET "$BASE_URL/api/admin/users?is_blocked=true" `
  -H "Content-Type: application/json" `
  --cookie "sessionId=$ADMIN_SESSION_ID"
```

**Oczekiwany wynik:** Status 200, lista tylko zablokowanych użytkowników

---

## 6. Test filtrowania - tylko aktywni użytkownicy (nie zablokowani)

### CMD:
```cmd
curl -X GET "%BASE_URL%/api/admin/users?is_blocked=false" ^
  -H "Content-Type: application/json" ^
  --cookie "sessionId=%ADMIN_SESSION_ID%"
```

### PowerShell:
```powershell
curl -X GET "$BASE_URL/api/admin/users?is_blocked=false" `
  -H "Content-Type: application/json" `
  --cookie "sessionId=$ADMIN_SESSION_ID"
```

**Oczekiwany wynik:** Status 200, lista tylko aktywnych użytkowników

---

## 7. Test złożonego filtrowania - aktywni adminowie, strona 1, limit 5

### CMD:
```cmd
curl -X GET "%BASE_URL%/api/admin/users?role=admin&is_blocked=false&page=1&limit=5" ^
  -H "Content-Type: application/json" ^
  --cookie "sessionId=%ADMIN_SESSION_ID%"
```

### PowerShell:
```powershell
curl -X GET "$BASE_URL/api/admin/users?role=admin&is_blocked=false&page=1&limit=5" `
  -H "Content-Type: application/json" `
  --cookie "sessionId=$ADMIN_SESSION_ID"
```

**Oczekiwany wynik:** Status 200, pierwszych 5 aktywnych administratorów

---

## 8. Test maksymalnego limitu - 100 rekordów

### CMD:
```cmd
curl -X GET "%BASE_URL%/api/admin/users?limit=100" ^
  -H "Content-Type: application/json" ^
  --cookie "sessionId=%ADMIN_SESSION_ID%"
```

### PowerShell:
```powershell
curl -X GET "$BASE_URL/api/admin/users?limit=100" `
  -H "Content-Type: application/json" `
  --cookie "sessionId=$ADMIN_SESSION_ID"
```

**Oczekiwany wynik:** Status 200, maksymalnie 100 użytkowników

---

## 9. Test bez ciasteczka sesyjnego (401 Unauthorized)

### CMD:
```cmd
curl -X GET "%BASE_URL%/api/admin/users" ^
  -H "Content-Type: application/json"
```

### PowerShell:
```powershell
curl -X GET "$BASE_URL/api/admin/users" `
  -H "Content-Type: application/json"
```

**Oczekiwany wynik:** Status 401, błąd braku uwierzytelnienia
```json
{
  "statusCode": 401,
  "error": "Unauthorized",
  "message": "Authentication required"
}
```

---

## 10. Test z nieprawidłowym sessionId (401 Unauthorized)

### CMD:
```cmd
curl -X GET "%BASE_URL%/api/admin/users" ^
  -H "Content-Type: application/json" ^
  --cookie "sessionId=invalid_session_id_12345"
```

### PowerShell:
```powershell
curl -X GET "$BASE_URL/api/admin/users" `
  -H "Content-Type: application/json" `
  --cookie "sessionId=invalid_session_id_12345"
```

**Oczekiwany wynik:** Status 401, błąd nieprawidłowej sesji
```json
{
  "statusCode": 401,
  "error": "Unauthorized",
  "message": "Invalid or expired session"
}
```

---

## 11. Test z sessionId zwykłego użytkownika (403 Forbidden)

```cmd
set USER_SESSION_ID=YOUR_REGULAR_USER_SESSION_ID_HERE
curl -X GET "%BASE_URL%/api/admin/users" ^
  -H "Content-Type: application/json" ^
  --cookie "sessionId=%USER_SESSION_ID%"
```

**Oczekiwany wynik:** Status 403, brak uprawnień administratora
```json
{
  "statusCode": 403,
  "error": "Forbidden",
  "message": "Admin access required"
}
```

---

## 12. Test metody POST (405 Method Not Allowed)

### CMD:
```cmd
curl -X POST "%BASE_URL%/api/admin/users" ^
  -H "Content-Type: application/json" ^
  --cookie "sessionId=%ADMIN_SESSION_ID%"
```

### PowerShell:
```powershell
curl -X POST "$BASE_URL/api/admin/users" `
  -H "Content-Type: application/json" `
  --cookie "sessionId=$ADMIN_SESSION_ID"
```

**Oczekiwany wynik:** Status 405, metoda niedozwolona

---

## 13. Test metody PUT (405 Method Not Allowed)

### CMD:
```cmd
curl -X PUT "%BASE_URL%/api/admin/users" ^
  -H "Content-Type: application/json" ^
  --cookie "sessionId=%ADMIN_SESSION_ID%"
```

### PowerShell:
```powershell
curl -X PUT "$BASE_URL/api/admin/users" `
  -H "Content-Type: application/json" `
  --cookie "sessionId=$ADMIN_SESSION_ID"
```

**Oczekiwany wynik:** Status 405, metoda niedozwolona

---

## 14. Test metody DELETE (405 Method Not Allowed)

### CMD:
```cmd
curl -X DELETE "%BASE_URL%/api/admin/users" ^
  -H "Content-Type: application/json" ^
  --cookie "sessionId=%ADMIN_SESSION_ID%"
```

### PowerShell:
```powershell
curl -X DELETE "$BASE_URL/api/admin/users" `
  -H "Content-Type: application/json" `
  --cookie "sessionId=$ADMIN_SESSION_ID"
```

**Oczekiwany wynik:** Status 405, metoda niedozwolona

---

## 15. Test metody PATCH (405 Method Not Allowed)

### CMD:
```cmd
curl -X PATCH "%BASE_URL%/api/admin/users" ^
  -H "Content-Type: application/json" ^
  --cookie "sessionId=%ADMIN_SESSION_ID%"
```

### PowerShell:
```powershell
curl -X PATCH "$BASE_URL/api/admin/users" `
  -H "Content-Type: application/json" `
  --cookie "sessionId=$ADMIN_SESSION_ID"
```

**Oczekiwany wynik:** Status 405, metoda niedozwolona

---

## 16. Test walidacji - nieprawidłowa wartość role

### CMD:
```cmd
curl -X GET "%BASE_URL%/api/admin/users?role=superadmin" ^
  -H "Content-Type: application/json" ^
  --cookie "sessionId=%ADMIN_SESSION_ID%"
```

### PowerShell:
```powershell
curl -X GET "$BASE_URL/api/admin/users?role=superadmin" `
  -H "Content-Type: application/json" `
  --cookie "sessionId=$ADMIN_SESSION_ID"
```

**Oczekiwany wynik:** Status 400, błąd walidacji (role musi być 'user' lub 'admin')

---

## 17. Test walidacji - page = 0 (minimum to 1)

### CMD:
```cmd
curl -X GET "%BASE_URL%/api/admin/users?page=0" ^
  -H "Content-Type: application/json" ^
  --cookie "sessionId=%ADMIN_SESSION_ID%"
```

### PowerShell:
```powershell
curl -X GET "$BASE_URL/api/admin/users?page=0" `
  -H "Content-Type: application/json" `
  --cookie "sessionId=$ADMIN_SESSION_ID"
```

**Oczekiwany wynik:** Status 400, błąd walidacji (page musi być >= 1)

---

## 18. Test walidacji - limit = 101 (maksimum to 100)

### CMD:
```cmd
curl -X GET "%BASE_URL%/api/admin/users?limit=101" ^
  -H "Content-Type: application/json" ^
  --cookie "sessionId=%ADMIN_SESSION_ID%"
```

### PowerShell:
```powershell
curl -X GET "$BASE_URL/api/admin/users?limit=101" `
  -H "Content-Type: application/json" `
  --cookie "sessionId=$ADMIN_SESSION_ID"
```

**Oczekiwany wynik:** Status 400, błąd walidacji (limit musi być <= 100)

---

## 19. Test z dodatkowymi nagłówkami (verbose)

### CMD:
```cmd
curl -v -X GET "%BASE_URL%/api/admin/users" ^
  -H "Content-Type: application/json" ^
  -H "User-Agent: TestClient/1.0" ^
  --cookie "sessionId=%ADMIN_SESSION_ID%"
```

### PowerShell:
```powershell
curl -v -X GET "$BASE_URL/api/admin/users" `
  -H "Content-Type: application/json" `
  -H "User-Agent: TestClient/1.0" `
  --cookie "sessionId=$ADMIN_SESSION_ID"
```

**Oczekiwany wynik:** Status 200, pełne informacje o nagłówkach żądania i odpowiedzi

---

## 20. Test z zapisem odpowiedzi do pliku

### CMD:
```cmd
curl -X GET "%BASE_URL%/api/admin/users?limit=5" ^
  -H "Content-Type: application/json" ^
  --cookie "sessionId=%ADMIN_SESSION_ID%" ^
  -o admin_users_response.json
```

### PowerShell:
```powershell
curl -X GET "$BASE_URL/api/admin/users?limit=5" `
  -H "Content-Type: application/json" `
  --cookie "sessionId=$ADMIN_SESSION_ID" `
  -o admin_users_response.json
```

**Oczekiwany wynik:** Odpowiedź zapisana do pliku `admin_users_response.json`

---

## 21. Test z użyciem pliku cookies.txt (automatyczne zarządzanie ciasteczkami)

### Krok 1: Zaloguj się i zapisz ciasteczko
```cmd
curl -X POST "%BASE_URL%/api/auth/login" ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"admin@example.com\",\"password\":\"password123\"}" ^
  -c cookies.txt
```

### Krok 2: Użyj zapisanego ciasteczka
```cmd
curl -X GET "%BASE_URL%/api/admin/users" ^
  -H "Content-Type: application/json" ^
  -b cookies.txt
```

**Oczekiwany wynik:** Status 200, curl automatycznie używa sessionId z pliku cookies.txt

---

## 22. Test z blokadą konta (403 Forbidden)

Jeśli konto admina zostanie zablokowane:

```cmd
curl -X GET "%BASE_URL%/api/admin/users" ^
  -H "Content-Type: application/json" ^
  --cookie "sessionId=%BLOCKED_ADMIN_SESSION_ID%"
```

**Oczekiwany wynik:** Status 403
```json
{
  "statusCode": 403,
  "error": "Forbidden",
  "message": "Account is blocked"
}
```

---

## Struktura oczekiwanej odpowiedzi (200 OK)

```json
{
  "users": [
    {
      "id": 1,
      "email": "admin@example.com",
      "role": "admin",
      "is_blocked": false,
      "theme": "dark",
      "created_at": "2025-01-13T10:00:00.000Z",
      "updated_at": "2025-01-13T10:00:00.000Z"
    }
  ],
  "page": 1,
  "limit": 20,
  "total": 50,
  "totalPages": 3
}
```

## Struktura odpowiedzi błędu (500)

```json
{
  "statusCode": 500,
  "error": "Internal Server Error",
  "message": "An error occurred while retrieving users"
}
```

## Struktura odpowiedzi błędu (405)

```json
{
  "statusCode": 405,
  "error": "Method Not Allowed",
  "message": "POST method is not supported for this endpoint"
}
```

---

## Jak uzyskać sessionId?

### Metoda 1: Logowanie przez API
```cmd
curl -X POST "%BASE_URL%/api/auth/login" ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"admin@example.com\",\"password\":\"your_password\"}" ^
  -v
```

Szukaj w odpowiedzi nagłówka `Set-Cookie: sessionId=...`

### Metoda 2: Logowanie przez przeglądarkę
1. Zaloguj się w przeglądarce jako admin
2. Otwórz DevTools (F12)
3. Zakładka Application/Storage → Cookies
4. Skopiuj wartość ciasteczka `sessionId`

### Metoda 3: Użyj pliku cookies.txt (zalecane)
```cmd
REM Logowanie z zapisem ciasteczek
curl -X POST "%BASE_URL%/api/auth/login" ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"admin@example.com\",\"password\":\"your_password\"}" ^
  -c cookies.txt

REM Użycie zapisanych ciasteczek
curl -X GET "%BASE_URL%/api/admin/users" ^
  -b cookies.txt
```

---

## Dodatkowe narzędzia testowe

### jq - formatowanie JSON w CMD/PowerShell
Jeśli masz zainstalowane `jq`, możesz formatować odpowiedzi:

```cmd
curl -X GET "%BASE_URL%/api/admin/users" ^
  --cookie "sessionId=%ADMIN_SESSION_ID%" | jq .
```

### Testowanie wydajności z czasem odpowiedzi

```cmd
curl -w "\nTime: %{time_total}s\n" ^
  -X GET "%BASE_URL%/api/admin/users?limit=100" ^
  -H "Content-Type: application/json" ^
  --cookie "sessionId=%ADMIN_SESSION_ID%"
```

### Sprawdzenie statusu HTTP
```cmd
curl -s -o NUL -w "HTTP Status: %%{http_code}\n" ^
  -X GET "%BASE_URL%/api/admin/users" ^
  --cookie "sessionId=%ADMIN_SESSION_ID%"
```
