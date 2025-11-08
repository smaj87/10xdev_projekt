# Plan implementacji widoku Admin Users

## 1. Przegląd
Widok Admin Users (`/admin/users`) umożliwia administratorowi zarządzanie kontami użytkowników: przeglądanie listy z paginacją i filtrami, tworzenie nowych kont, edycję istniejących (zmiana roli, emaila, hasła), blokowanie / odblokowanie oraz szybkie akcje inline. Zapewnia walidację zgodną z wymaganiami backendu, responsywność i kontrolę uprawnień.

## 2. Routing widoku
- Ścieżka: `/admin/users`
- Dostęp: wyłącznie użytkownik z rolą `admin`; w razie braku uprawnień redirect do `/403`.
- Integracja z głównym layoutem admina: render wewnątrz `AdminLayout` z aktywną sekcją w `AdminSidebar`.

## 3. Struktura komponentów
Hierarchia (wysokopoziomowo):
```
<AdminLayout>
  <AdminSidebar />
  <AdminUsersPage>
    <PageTitle />
    <UserFilters />
    <AdminUserTable>
      <UserTableHeader />
      <UserTableBody>
        <UserRowActions />
      </UserTableBody>
    </AdminUserTable>
    <Pagination />
    <AdminUserFormModal />
    <InlineFeedback /> (toast / alert)
  </AdminUsersPage>
</AdminLayout>
```
Komponent kontenerowy: `AdminUsersPage` (łączy stan, pobiera dane, obsługuje akcje).

## 4. Szczegóły komponentów
### AdminUsersPage
- Opis: Kontener głównego widoku; inicjuje pobranie listy użytkowników z filtrami i paginacją; zarządza otwarciem modala tworzenia/edycji, dispatchuje akcje blokowania/zmiany roli.
- Główne elementy: wrapper `<section>`, dzieci: `UserFilters`, `AdminUserTable`, `Pagination`, `AdminUserFormModal`.
- Obsługiwane interakcje:
  - Zmiana filtrów → aktualizacja stanu filtrów + refetch.
  - Zmiana strony → aktualizacja paginacji + refetch.
  - Klik "Dodaj użytkownika" → otwarcie modala w trybie create.
  - Akcje wiersza (blokuj/odblokuj/zmień rolę/edytuj) → dispatch odpowiednich akcji API.
- Walidacja: delegowana do modala i akcji update (email, hasło); kontrola niedozwolonej blokady własnego konta (sprawdzenie `currentUser.id !== target.id`).
- Typy: `AdminUsersState`, `User`, `UserFiltersModel`, `PaginationState`, `UpdateUserPayload`, `CreateUserPayload`.
- Propsy: (otrzymuje minimalne: może brak jeśli łączy się z Redux bezpośrednio); ewentualnie `currentAdmin: User`.

### UserFilters
- Opis: Formularz filtrowania listy użytkowników (rola, status blokady, wyszukiwanie email częściowe – jeśli planowane rozszerzenie).
- Główne elementy: `<form>`, `<select name="role">`, `<select name="is_blocked">`, (opcjonalnie `<input name="query">`).
- Interakcje: `onChange` pól → wywołanie `onFiltersChange` z nowym modelem; reset filtrów.
- Walidacja: pola wyboru ograniczone do enumeracji: role: `admin|user`; is_blocked: `true|false|''`. Brak treści HTML dla niepoprawnych wartości (select generuje z listy).
- Typy: `UserFiltersModel`.
- Propsy: `{ value: UserFiltersModel; onChange: (filters)=>void; loading: boolean }`.

### AdminUserTable
- Opis: Tabela użytkowników z nagłówkiem i wierszami; prezentuje: email, rola, status blokady, akcje.
- Główne elementy: `<table>` z `<thead>` i `<tbody>`; `<tr>` dla każdego użytkownika.
- Interakcje: klik w akcje wiersza (delegowane do `UserRowActions`); sortowanie (opcjonalnie – jeśli rozszerzone); hover podświetla wiersz.
- Walidacja: brak bezpośredniej (prezentacja); wizualne oznaczenie blokady.
- Typy: `User[]`.
- Propsy: `{ users: User[]; onAction: (action: UserAction, user: User)=>void; loading: boolean }`.

### UserRowActions
- Opis: Zestaw przycisków w wierszu: blokuj/odblokuj (toggle), zmień rolę (select lub cykliczny przycisk), edytuj (otwiera modal), ewentualnie usuń (jeśli przewidziane w przyszłości – teraz brak).
- Główne elementy: `<div role="group">` z przyciskami `<button>` / `<select>`.
- Interakcje: onClick blokada/odblokowanie; onChange rola; onClick edycja → modal.
- Walidacja: zapobieganie blokadzie własnego admina (disabled przycisk jeśli `user.id === currentAdmin.id`).
- Typy: `UserAction = 'BLOCK'|'UNBLOCK'|'CHANGE_ROLE'|'EDIT'`.
- Propsy: `{ user: User; currentAdminId: string; onAction: (action: UserAction, user: User, data?: any)=>void }`.

### Pagination
- Opis: Kontrolki nawigacji stron: pierwszy, poprzedni, numery, następny, ostatni. Wyświetla "Strona X z Y".
- Główne elementy: `<nav aria-label="Paginacja użytkowników">` z przyciskami.
- Interakcje: onClick zmiana strony → `onPageChange(page)`.
- Walidacja: disable poprzedni gdy page=1; disable następny gdy page=totalPages.
- Typy: `PaginationState`.
- Propsy: `{ page: number; total: number; limit: number; onChange: (page:number)=>void; disabled: boolean }`.

### AdminUserFormModal
- Opis: Modal do tworzenia lub edycji użytkownika (email, rola, hasło – hasło przy edycji opcjonalne; blokada nie przez modal lecz akcja wiersza).
- Główne elementy: `<dialog>` / warstwa modalna, `<form>`, pola: `<input email>`, `<select role>`, `<input password>`.
- Interakcje: submit → walidacja → dispatch create/update; zamknięcie przy anulowaniu/klik poza.
- Walidacja: email format + unikalność (unikalność sprawdzana po 409/400 odpowiedzi); hasło min 8 znaków jeśli podane; rola z enumeracji. Przy edycji: jeśli pole email niezmienione – nie wysyłać; podobnie hasło tylko gdy wypełnione.
- Typy: `AdminUserFormMode = 'create'|'edit'`, `CreateUserPayload`, `UpdateUserPayload` (partial), `AdminUserFormValues`.
- Propsy: `{ open: boolean; mode: AdminUserFormMode; initialUser?: User; onClose: ()=>void; onSubmit: (values: AdminUserFormValues)=>void; submitting: boolean; error?: FormError }`.

### InlineFeedback / Toast (może istniejące w projekcie)
- Opis: Prezentacja sukcesów / błędów akcji (np. "Użytkownik zaktualizowany", "Email już istnieje").
- Propsy: zależne od istniejącego systemu; jeśli brak, dodać prosty hook `useToast()`.

### PageTitle
- Opis: Komponent nagłówka strony: tytuł "Użytkownicy" + przycisk "Dodaj".
- Propsy: `{ title: string; actions?: ReactNode }`.

## 5. Typy
Nowe / rozszerzone typy (TypeScript):
- `Role = 'admin' | 'user'`
- `User = { id: string; email: string; role: Role; is_blocked: boolean }`
- `UserFiltersModel = { role?: Role; is_blocked?: boolean; page: number; limit: number }` (opcjonalne przyszłe: `query?: string`)
- `PaginationState = { page: number; limit: number; total: number }`
- `CreateUserPayload = { email: string; password: string; role: Role }`
- `UpdateUserPayload = Partial<{ email: string; password: string; role: Role; is_blocked: boolean }>` (co najmniej jedno pole; backend oczekuje partial)
- `UsersApiResponse = { users: User[]; page: number; total: number }`
- `AdminUsersState = { list: User[]; loading: boolean; error?: string; filters: UserFiltersModel; pagination: PaginationState; editingUser?: User | null; formOpen: boolean; formMode: AdminUserFormMode; submitting: boolean }`
- `FormError = { field?: string; message: string }`
- `UserAction = 'BLOCK'|'UNBLOCK'|'CHANGE_ROLE'|'EDIT'`
- `AdminUserFormValues = { email: string; password?: string; role: Role }`

## 6. Zarządzanie stanem
- Redux slice: `adminUsersSlice`
  - Actions: `fetchUsers(filters)`, `fetchUsersSuccess(data)`, `fetchUsersError(error)`, `openCreateModal()`, `openEditModal(user)`, `closeModal()`, `submitStart()`, `submitSuccess(user)`, `submitError(error)`, `updateUserInList(user)`, `setFilters(partial)`, `setPage(page)`.
  - Selectory: `selectAdminUsers`, `selectAdminUsersLoading`, `selectAdminUsersPagination`.
- Middleware / Thunk:
  - `loadUsersThunk()` – buduje query paramy i wywołuje GET.
  - `updateUserThunk(userId, payload)` – PUT.
  - `createOrUpdateUserThunk(payload|userId)` – kieruje do PUT (ten sam endpoint). W przypadku tworzenia: wywołanie PUT bez `userId`? (UWAGA: jeśli backend dodaje nowego użytkownika przez ten sam endpoint, konieczna weryfikacja – jeśli jednak wymagane odrębne API, dostosować. Założenie: PUT /{id} tworzy lub aktualizuje. W przypadku tworzenia możliwe będzie tymczasowe generowanie id? Jeśli niepewne – dodać TODO. Alternatywa: osobny POST /api/admin/users jeśli pojawi się w backendzie.)
  - `toggleBlockUserThunk(user)` – odwraca `is_blocked`.
  - `changeUserRoleThunk(user, role)`.
- Lokalny stan komponentu: formularz modala (kontrolowane inputy), bieżąca walidacja.
- Custom hooki:
  - `useAdminUsers()` – spina selectory i dispatch (ułatwia komponentowi kontenerowemu).
  - `useUserRowActions(user)` – zwraca akcje z preoptymistyczną aktualizacją.
  - `useModalForm(initialUser, mode)` – zarządzanie wartościami i walidacją modala.

## 7. Integracja API
- Lista użytkowników:
  - Request: `GET /api/admin/users?role=admin|user&is_blocked=true|false&page=1&limit=20`
  - Response: `UsersApiResponse`
  - Frontend: buduje query z `filters`; po sukcesie aktualizacja `list` + `pagination.total`.
- Aktualizacja / tworzenie użytkownika:
  - Request: `PUT /api/admin/users/{userId}` (dla istniejącego) – body: `UpdateUserPayload` (tylko zmienione pola). Tworzenie (jeśli wspierane) – generowanie nowego id lub endpoint adaptowany; body: `CreateUserPayload`.
  - Response: `User` (zaktualizowany lub utworzony).
  - Walidacje po stronie UI: email format (regex), hasło min 8 znaków, rola enumeracja; unikalność email – wykrywana z odpowiedzi 400 (kod / komunikat) → pokazanie błędu.
- Blokada / odblokowanie: część `UpdateUserPayload` (`is_blocked: true|false`).
- Zmiana roli: `role` w `UpdateUserPayload`.
- Błędy: 400 (walidacja), 403 (brak uprawnień), 500 (serwer). Mapowane na komunikaty: email istnieje, hasło za krótkie, brak uprawnień.

## 8. Interakcje użytkownika
1. Administrator otwiera `/admin/users` → automatyczne pobranie listy z domyślnymi filtrami.
2. Zmiana filtrów (rola, blokada) → natychmiastowe (lub debounce) odpytanie endpointu.
3. Paginacja – przejście na stronę X → fetch z `page=X`.
4. Klik "Dodaj użytkownika" → modal create; wypełnienie pól; submit → PUT; sukces: zamknięcie modala + refetch (lub wstawienie do listy jeśli na bieżącej stronie jest miejsce).
5. Akcja blokuj/odblokuj → optymistyczna zmiana (opcjonalnie) + PUT; w razie błędu rollback.
6. Zmiana roli (select) → PUT; loader w wierszu.
7. Edytuj → modal w trybie edit z prefill; po submit tylko zmienione pola wysyłane.
8. Błędy walidacji → wyświetlenie pod polem / jako toast.
9. Próba blokady własnego konta admina → przycisk disabled + tooltip.

## 9. Warunki i walidacja
- Format email: regex prosty `/^[^@\s]+@[^@\s]+\.[^@\s]+$/` – walidacja przed submit.
- Unikalność email: jeśli odpowiedź 400 z kodem błędu `EMAIL_EXISTS` → pokazanie komunikatu.
- Hasło: min 8 znaków; przy edycji jeśli puste → nie wysyłane; walidacja przy create – wymagane.
- Rola: wartość z enumeracji; select gwarantuje poprawność.
- Blokada własnego konta: warunek w UI (disabled) + defensywnie w logice (nie wysyłaj żądania jeśli user.id === currentAdmin.id).
- Paginacja: strona między 1 a `Math.ceil(total/limit)` – przy out-of-range (np. po zmianie filtrów zmniejszających liczbę stron) reset do 1.
- Filtrowanie: jeśli wartość pusta → nie dodawaj query paramu.

## 10. Obsługa błędów
- Sieć / 500: globalny toast "Błąd serwera. Spróbuj ponownie."; pozostaw poprzednią listę.
- 403: redirect `/403` (centralny middleware / guard).
- 400 walidacja:
  - Email istnieje → komunikat w modalu.
  - Hasło za krótkie → komunikat przy polu.
  - Niepoprawny format email → lokalna walidacja przed requestem.
- Timeout / brak odpowiedzi → retry (opcjonalnie 1x) + komunikat.
- Błąd optymistycznej akcji (blokada/rola) → rollback wartości i pokazanie toastu.
- Empty state: gdy `users.length===0` → komponent pustego stanu z informacją "Brak użytkowników spełniających kryteria".

## 11. Kroki implementacji
1. Utwórz typy (`types/auth.types.ts` lub nowy plik `types/adminUsers.types.ts`).
2. Dodaj slice Redux `adminUsersSlice` w `components/store/` lub zgodnie z istniejącą strukturą: stan, akcje, selectory.
3. Zaimplementuj thunki: `loadUsersThunk`, `updateUserThunk`, `toggleBlockUserThunk`, `changeUserRoleThunk`, `createOrUpdateUserThunk` korzystające z `request()`.
4. Dodaj routing: w module routingu kontenera (np. `App` / `ProtectedHome`) – ścieżka `/admin/users` z guardem roli.
5. Stwórz komponent kontenerowy `AdminUsersPage` w `app/containers/AdminUsers/` (lub analogicznie) – integracja z Redux, dispatch thunki, render dzieci.
6. Implementacja `UserFilters` (controlled), integracja z slice (`setFilters` + trigger refetch przy zmianie / submit).
7. Implementacja `AdminUserTable` + `UserRowActions` (disable akcji blokady dla własnego konta admina, loader per wiersz).
8. Implementacja `Pagination` komponentu (nawigacja stron; wywołanie `setPage` + fetch).
9. Implementacja `AdminUserFormModal` (tryby create/edit, prefill, lokalna walidacja, minimalny diff payload: porównanie z `initialUser`, usunięcie pustego hasła).
10. Dodaj globalny system feedbacku (reuse istniejącego `ErrorBoundary` / toast; jeśli brak – prosty hook `useToast`).
11. Obsłuż edge-case: zmiana filtrów redukująca liczbę stron – reset page do 1 przed fetch.
12. Dodaj testy jednostkowe slice (redukcja listy, paginacja, update użytkownika), oraz test walidacji modala.
13. Dodaj dostępnościowe atrybuty: `aria-label` w paginacji, `scope="col"` w nagłówkach tabeli, `role="button"` w niestandardowych elementach akcji jeśli nie są `<button>`.
14. Dodaj klasy Tailwind do layoutu: responsywne układy (sidebar stały na desktop: `hidden md:block`), tabela przewijalna poziomo na mobile (`overflow-x-auto`).
15. Weryfikacja integracji: manualny smoke test (filtrowanie, paginacja, create, edit, blokada, zmiana roli, edge-case email exists).
16. Dodaj dokumentację krótką w README sekcję Admin Users (opcjonalne).
17. Refine: Optymalizacja – memoization wierszy (`React.memo(UserRowActions)`), uniknięcie refetch po optymistycznym update jeśli dane wystarczą.
18. Code review pod kątem bezpieczeństwa (brak możliwości blokady siebie, brak wysyłki niezmienionych pól) i dostępności.
