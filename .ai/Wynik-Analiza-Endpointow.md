# Analiza Kompletności Endpointów - Tasks App

## ✅ ZAIMPLEMENTOWANE ENDPOINTY

### 1. **Autentykacja (auth.routes.mjs)**
- ✅ `POST /auth/login` - Logowanie użytkownika i tworzenie sesji
- ✅ `GET /auth/logout` - Wylogowanie i usuwanie sesji

**Tabele wykorzystane:** `users`, `user_sessions`

---

### 2. **Zarządzanie Użytkownikami - Admin (admin-users.routes.mjs)**
- ✅ `GET /admin/users` - Pobieranie listy użytkowników (z filtrowaniem i paginacją)
- ✅ `PUT /admin/users/:userId` - Tworzenie/aktualizacja użytkownika (upsert)
- ✅ `DELETE /admin/users/:userId` - Usuwanie użytkownika

**Tabele wykorzystane:** `users`

**Funkcjonalności:**
- Filtrowanie po: `role`, `is_blocked`
- Paginacja: `page`, `limit`
- Zarządzanie: `email`, `password`, `role`, `is_blocked`, `theme`

---

### 3. **Listy Zadań (list.routes.mjs)**
- ✅ `GET /lists` - Pobieranie list użytkownika (jako właściciel)
- ✅ `GET /lists/collaborators` - Pobieranie list, gdzie użytkownik jest współpracownikiem
- ✅ `PUT /lists` - Tworzenie nowej listy
- ✅ `PUT /lists/:listId` - Aktualizacja istniejącej listy
- ✅ `DELETE /lists/:listId` - Usuwanie ZARCHIWIZOWANEJ listy (tylko admin)

**Tabele wykorzystane:** `lists`, `categories`, `tasks`, `list_collaborators` (nazwa w bazie: `collaborators`)

**Funkcjonalności:**
- Pola list: `title`, `category_id`, `priority`, `due_date`
- Zwracane dane zawierają: zadania, współpracowników, właściciela
- Walidacja właściciela listy
- Walidacja istnienia kategorii

---

### 4. **Zadania (tasks.routes.mjs)**
- ✅ `PUT /api/lists/:listId/tasks` - Tworzenie/aktualizacja zadania (upsert)
- ✅ `DELETE /api/tasks/:taskId` - Usuwanie zadania
- ✅ `PUT /api/lists/:listId/tasks/reorder` - Zmiana kolejności zadań

**Tabele wykorzystane:** `tasks`

**Funkcjonalności:**
- Pola zadań: `title`, `status`, `sort_order`
- Status: `todo`, `in_progress`, `done`
- Automatyczne sortowanie przez trigger

---

### 5. **Kategorie (categories.routes.mjs)**
- ✅ `GET /categories` - Pobieranie wszystkich kategorii (publiczny dostęp)
- ✅ `PUT /categories/:id` - Tworzenie/aktualizacja kategorii (upsert, tylko admin)
- ✅ `DELETE /categories/:id` - Usuwanie kategorii (tylko admin)

**Tabele wykorzystane:** `categories`

**Funkcjonalności:**
- Pola: `name`, `color`
- Walidacja koloru (hex format)

---

## ❌ BRAKUJĄCE ENDPOINTY

### 1. **Rejestracja Użytkowników**
**Brak:** `POST /auth/register`

**Potrzebne funkcjonalności:**
- Tworzenie nowego konta użytkownika
- Walidacja unikalności email
- Hashowanie hasła
- Automatyczne przypisanie roli `user`

**Tabele:** `users`

**Uwaga:** Obecnie nowych użytkowników może tworzyć tylko admin przez endpoint `PUT /admin/users/:userId`

---

### 2. **Zarządzanie Współpracownikami List**

**Brak endpointów dla tabeli `list_collaborators` (w bazie: `collaborators`):**

#### a) `POST /lists/:listId/collaborators`
- Dodawanie współpracownika do listy
- Wymagane: `user_id` lub `email`
- Walidacja: tylko właściciel listy może dodawać
- Walidacja: użytkownik nie może być już współpracownikiem

#### b) `DELETE /lists/:listId/collaborators/:collaboratorId`
- Usuwanie współpracownika z listy
- Walidacja: tylko właściciel listy może usuwać

#### c) `GET /lists/:listId/collaborators`
- Opcjonalny endpoint do pobierania tylko współpracowników konkretnej listy
- (Obecnie współpracownicy są zwracani w ramach GET /lists i GET /lists/collaborators)

**Tabele:** `list_collaborators` (w bazie: `collaborators`)

**Uwaga:** Tabela istnieje w bazie, serwisy `list.service.mjs` i `task.service.mjs` już z niej korzystają (sprawdzanie dostępu, pobieranie danych), ale brak dedykowanych endpointów do zarządzania.

---

### 3. **Archiwizacja List**

**Brak:** `PUT/PATCH /lists/:listId/archive` lub zarządzanie przez `PUT /lists/:listId`

**Potrzebne funkcjonalności:**
- Ustawienie `is_archived = TRUE`
- Trigger automatycznie ustawi `archived_at`
- Opcjonalnie: `PUT /lists/:listId/unarchive` do przywracania

**Tabele:** `lists`

**Uwaga:** Pole `is_archived` istnieje w tabeli i jest używane przy usuwaniu (można usunąć tylko zarchiwizowaną listę), ale brak endpointu do samej archiwizacji.

**Alternatywa:** Można dodać `is_archived` do pól akceptowanych przez `PUT /lists/:listId`

---

### 4. **Zarządzanie Sesjami Użytkownika**

**Brak endpointów dla tabeli `user_sessions`:**

#### a) `GET /auth/sessions`
- Pobieranie aktywnych sesji użytkownika
- Przydatne do wyświetlania listy zalogowanych urządzeń

#### b) `DELETE /auth/sessions/:sessionId`
- Wylogowanie z konkretnej sesji (np. z innego urządzenia)

#### c) `DELETE /auth/sessions` (lub `DELETE /auth/sessions/all`)
- Wylogowanie ze wszystkich sesji oprócz bieżącej

**Tabele:** `user_sessions`

**Uwaga:** Tabela istnieje i jest używana do autentykacji, ale użytkownik nie ma kontroli nad swoimi sesjami (poza wylogowaniem bieżącej).

---

### 5. **Profil Użytkownika**

**Brak endpointów dla zwykłego użytkownika do zarządzania własnym profilem:**

#### a) `GET /auth/me` lub `GET /users/me`
- Pobieranie danych zalogowanego użytkownika
- Zwraca: `id`, `email`, `role`, `theme`, `created_at`

#### b) `PUT /users/me` lub `PATCH /users/me`
- Aktualizacja własnego profilu
- Możliwe pola: `email`, `password`, `theme`
- **Nie** pozwala zmieniać: `role`, `is_blocked`

**Tabele:** `users`

**Uwaga:** Obecnie użytkownik nie ma endpointu do edycji własnych danych (np. zmiana hasła, motywu).

---

### 6. **Zmiana Hasła**

**Brak:** `POST /auth/change-password` lub `PUT /users/me/password`

**Potrzebne funkcjonalności:**
- Wymagane: stare hasło (weryfikacja)
- Nowe hasło (z walidacją minimum 8 znaków)
- Hashowanie nowego hasła

**Tabele:** `users`

---

### 7. **Logi Błędów - Dostęp dla Admina**

**Brak endpointów dla tabeli `error_logs`:**

#### a) `GET /admin/error-logs`
- Pobieranie logów błędów
- Filtrowanie: `user_id`, `status_code`, `endpoint`, `method`, date range
- Paginacja

#### b) `DELETE /admin/error-logs/:logId` (opcjonalnie)
- Usuwanie pojedynczego logu

#### c) `DELETE /admin/error-logs` (opcjonalnie)
- Czyszczenie starych logów (np. starszych niż 30 dni)

**Tabele:** `error_logs`

**Uwaga:** Serwis `errorLog.service.mjs` zapisuje logi, ale nie ma endpointów do ich przeglądania przez admina.

---

## 📊 PODSUMOWANIE

### ✅ Gotowe (5 grup endpointów):
1. ✅ Autentykacja (login, logout)
2. ✅ Zarządzanie użytkownikami (admin)
3. ✅ Listy zadań (CRUD bez archiwizacji)
4. ✅ Zadania (CRUD + reorder)
5. ✅ Kategorie (CRUD)

### ❌ Brakujące (7 grup endpointów):
1. ❌ Rejestracja użytkowników (`POST /auth/register`)
2. ❌ Zarządzanie współpracownikami list (add, remove)
3. ❌ Archiwizacja list (archive/unarchive)
4. ❌ Zarządzanie sesjami użytkownika (view, revoke)
5. ❌ Profil użytkownika (view, edit)
6. ❌ Zmiana hasła
7. ❌ Logi błędów (admin access)

---

## 📌 PRIORYTETY IMPLEMENTACJI

### 🔴 **Krytyczne (Podstawowa funkcjonalność):**
1. **Rejestracja użytkowników** - bez tego aplikacja jest zamknięta
2. **Zarządzanie współpracownikami** - tabela istnieje, ale nie można z niej korzystać
3. **Archiwizacja list** - funkcjonalność opisana w schemacie, ale nieosiągalna

### 🟡 **Ważne (User Experience):**
4. **Profil użytkownika** - użytkownik powinien móc edytować swoje dane
5. **Zmiana hasła** - podstawowa funkcjonalność bezpieczeństwa

### 🟢 **Opcjonalne (Nice to have):**
6. **Zarządzanie sesjami** - dodatkowa kontrola dla użytkownika
7. **Logi błędów (admin)** - monitoring i diagnostyka

---

## 🔍 SZCZEGÓŁY TECHNICZNE

### Wykorzystanie Tabel:

| Tabela | Status | Endpointy |
|--------|--------|-----------|
| `users` | ✅ Częściowo | Admin: pełny CRUD, Brak: rejestracja, profil użytkownika |
| `categories` | ✅ Kompletne | GET, PUT, DELETE |
| `lists` | ✅ Częściowo | GET, PUT, DELETE, Brak: archiwizacja |
| `tasks` | ✅ Kompletne | PUT (upsert), DELETE, reorder |
| `list_collaborators` | ❌ **Brak** | Tabela istnieje, ale brak endpointów |
| `error_logs` | ❌ **Brak** | Tylko zapis, brak odczytu |
| `user_sessions` | ✅ Częściowo | Tworzenie/usuwanie przy login/logout, Brak: zarządzanie |

### Zastosowane Triggery:
- ✅ `update_users_timestamp` - działa automatycznie
- ✅ `update_lists_timestamp` - działa automatycznie
- ✅ `update_tasks_timestamp` - działa automatycznie
- ✅ `set_archived_at` - działa automatycznie (gdy `is_archived = TRUE`)
- ✅ `set_task_sort_order` - działa automatycznie

### Bezpieczeństwo:
- ✅ Middleware autentykacji (`authMiddleware`)
- ✅ Middleware admin (`requireAdmin`)
- ✅ Walidacja właściciela zasobów
- ✅ Sprawdzanie dostępu współpracowników (w task.service.mjs)
- ✅ Logowanie błędów
- ❌ Brak rate limiting
- ❌ Brak walidacji siły hasła przy rejestracji (brak endpointu)

---

## 💡 REKOMENDACJE

1. **Najpierw zaimplementuj krytyczne endpointy:**
  - Rejestracja
  - Zarządzanie współpracownikami
  - Archiwizacja

2. **Rozważ rozszerzenie `PUT /lists/:listId`:**
  - Dodaj pole `is_archived` do akceptowanych pól
  - Zamiast osobnego endpointu `/lists/:listId/archive`

3. **Dla zarządzania sesjami:**
  - Rozważ czy użytkownicy rzeczywiście tego potrzebują
  - Może być przydatne dla aplikacji mobilnej

4. **Dla logów błędów:**
  - Jeśli to tylko narzędzie diagnostyczne, może wystarczyć dostęp bezpośrednio do bazy
  - Jeśli chcesz UI do przeglądania, dodaj endpointy admin

---

**Status analizy:** Kompletna ✅  
**Data:** 2025-10-30  
**Autor:** Analiza automatyczna na podstawie kodu źródłowego i schematu bazy danych
