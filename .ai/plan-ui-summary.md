# Podsumowanie Planowania Architektury UI dla MVP Tasks

## Decyzje Użytkownika

1. **Układ głównego widoku**: Kafelki o różnej wysokości (masonry layout) zamiast listy szczegółowej
2. **Zawartość kafelka**: Tytuł listy + maksymalnie 5 zadań + kategoria (z kolorem) + priorytet (ikona/badge) + termin
3. **Brak rejestracji**: Użytkowników dodaje wyłącznie admin z poziomu panelu administracyjnego
4. **Proces logowania**: Prosty formularz login/hasło → ustawienie HttpOnly cookie `sessionId` → przekierowanie do dashboard
5. **Brak dwuetapowej autoryzacji**: Na tym etapie MVP nie implementujemy 2FA
6. **Nawigacja list**: Dwie proste zakładki w panelu użytkownika: "Aktywne" | "Archiwalne"
7. **Edycja listy**: Ikona edycji na hover → modal z formularzem (tytuł, kategoria, priorytet, termin) → ten sam modal dla dodawania i edycji
8. **Brak drag-and-drop**: Zamiana zadań przez ikony ↑/↓ na hover każdego zadania
9. **Quick filters**: Przyciski "Wszystkie" | "Najważniejsze" (priority=high) | "Bliski termin" (≤2 dni)
10. **Sortowanie**: Priorytet (asc/desc), termin (asc/desc), domyślnie: kolejność dodania (`created_at`)
11. **Walidacja współpracowników**: Email musi istnieć w bazie, w przeciwnym razie błąd dodawania
12. **WebSocket**: Użycie biblioteki Sockette (zgodnie z tech-stack)
13. **Obsługa błędów**: Wykorzystanie `utils/request.ts`, blok `catch` pusty (happy flow), proste toasty dla błędów
14. **Panel admina**: Lista użytkowników (dodawanie/edycja/blokowanie) → kliknięcie w użytkownika → panel z jego listami (aktywne | archiwalne)

## Dopasowane Rekomendacje

1. **Masonry layout z kafelkami o różnej wysokości** - wyświetlanie tytułu, maksymalnie 5 zadań, kategorii z kolorem, priorytetu (ikona/badge), terminu i licznika zadań
2. **Prosty przepływ logowania** - formularz login/hasło → walidacja → `POST /api/auth/login` → HttpOnly cookie → dashboard → komunikaty błędów (toasty)
3. **Zakładki dla widoków list** - "Aktywne" | "Archiwalne", state w Redux, API: `GET /api/lists?archived=false|true`
4. **Modal edycji/dodawania listy** - ikona edycji na hover → modal z polami (tytuł, kategoria dropdown z `GET /api/categories`, priorytet radio buttons, date picker) → `PUT /api/lists`
5. **Ikony ↑/↓ zamiast drag-and-drop** - na hover zadania → `PUT /api/lists/{listId}/tasks/reorder` → optymistyczny update Redux → Sockette dla synchronizacji
6. **Quick filters w toolbarze** - "Wszystkie" | "Najważniejsze" | "Bliski termin" + sortowanie (priorytet, termin) → state w Redux → `GET /api/lists?priority=X&sort_by=Y&order=Z`
7. **Walidacja emaila współpracownika** - modal "Udostępnij" → input email → `POST /api/lists/{listId}/collaborators` → obsługa błędów 409 (już współpracownik), 404 (email nie istnieje) → toast
8. **Sockette do synchronizacji** - połączenie WebSocket per lista (channel: `list:{listId}`) → update Redux store → visual indicator dla zmian innych użytkowników
9. **Zarządzanie błędami przez `utils/request.ts`** - try/catch w akcjach Redux, catch pusty (happy flow) → toasty dla błędów krytycznych (np. "Nie udało się wykonać operacji")
10. **Panel admina** - `/admin` z guard dla roli `admin` → tabela użytkowników (`GET /api/admin/users`) → akcje (dodaj, edytuj, blokuj) → kliknięcie w użytkownika → panel z listami (aktywne | archiwalne) → `GET /api/lists?user_id=X&archived=false|true`

## Szczegółowe Podsumowanie Planowania Architektury UI

### Główne Wymagania Architektury UI

**Technologie**:
- Frontend: Preact 10 + preact/compat, Redux 5 + Redux-Thunk, TypeScript 5, TailwindCSS 4, Sockette 2
- Backend: Node.js 20, Fastify 5, SQLite 3
- Narzędzia: Webpack, Babel, Shadcn/ui dla komponentów

**Wymagania funkcjonalne UI**:
- Responsywny desktop (≥1024px)
- Tryb jasny/ciemny
- Synchronizacja w czasie rzeczywistym przez WebSocket
- Autoryzacja przez HttpOnly cookie
- Panel administracyjny (zarządzanie użytkownikami i ich listami)
- Obsługa błędów synchronizacji z możliwością przeładowania

### Kluczowe Widoki, Ekrany i Przepływy Użytkownika

#### 1. **Logowanie** (`/login`)
- **Komponenty**: `LoginForm` (input login, input hasło, przycisk "Zaloguj")
- **Przepływ**: Formularz → walidacja (client-side) → `POST /api/auth/login` → cookie `sessionId` → redirect `/dashboard`
- **Obsługa błędów**: Toast notification dla 401 (nieprawidłowe dane)

#### 2. **Dashboard Użytkownika** (`/dashboard`)
- **Layout**: Header (logo, przełącznik trybu, przycisk wyloguj) + Toolbar (quick filters, sortowanie, przycisk "Dodaj listę") + Grid kafelków (masonry)
- **Komponenty**:
  - `DashboardHeader`: nawigacja, user menu
  - `FilterToolbar`: quick filters ("Wszystkie", "Najważniejsze", "Bliski termin"), sortowanie (dropdown)
  - `ListGrid`: masonry layout z kafelkami list
  - `ListCard`: tytuł, 5 zadań preview, kategoria (badge z kolorem), priorytet (ikona), termin, licznik zadań, ikona edycji (na hover)
- **Zakładki**: "Aktywne" | "Archiwalne"
- **Przepływ**:
  - `GET /api/lists?archived=false` przy montowaniu komponentu
  - Zmiana zakładki → `GET /api/lists?archived=true`
  - Quick filter → update Redux state → `GET /api/lists?priority=high&sort_by=priority&order=desc`
  - Kliknięcie kafelka → redirect `/lists/{listId}`

#### 3. **Szczegóły Listy** (`/lists/{listId}`)
- **Layout**: Breadcrumbs + Nagłówek listy (tytuł, kategoria, priorytet, termin, ikona edycji, przycisk "Udostępnij", przycisk "Archiwizuj") + Lista zadań + Formularz dodawania zadania
- **Komponenty**:
  - `ListHeader`: wyświetlanie metadanych listy, akcje (edycja, udostępnianie, archiwizacja)
  - `TaskList`: lista zadań z możliwością filtrowania (status: todo/in_progress/done)
  - `TaskItem`: checkbox (status), tytuł, ikony ↑/↓ (na hover), ikona edycji, ikona usuń
  - `AddTaskForm`: input + przycisk "Dodaj"
- **Przepływ**:
  - `GET /api/lists?id={listId}` → wyświetlenie listy i zadań
  - WebSocket connect: `list:{listId}` → nasłuchiwanie zmian
  - Dodawanie zadania: `POST /api/lists/{listId}/tasks` → optymistyczny update Redux
  - Zmiana kolejności: kliknięcie ↑/↓ → `PUT /api/lists/{listId}/tasks/reorder` → update Redux
  - Edycja zadania: modal → `PATCH /api/tasks/{taskId}`
  - Usuwanie zadania: `DELETE /api/tasks/{taskId}`

#### 4. **Modal Edycji/Dodawania Listy**
- **Komponenty**: `ListModal` (formularz: input tytuł, dropdown kategoria z `GET /api/categories`, radio priorytet, date picker termin)
- **Przepływ**:
  - Dodawanie: `PUT /api/lists` bez `id`
  - Edycja: `PUT /api/lists` z `id` + zmiany
  - Walidacja: tytuł (wymagane), priorytet (low/normal/high)

#### 5. **Modal Udostępniania Listy**
- **Komponenty**: `ShareModal` (input email, lista współpracowników z akcją usuwania)
- **Przepływ**:
  - `GET /api/lists/{listId}/collaborators` → wyświetlenie listy
  - Dodawanie: input email → `POST /api/lists/{listId}/collaborators` → obsługa błędów (409, 404) → toast
  - Usuwanie: `DELETE /api/lists/{listId}/collaborators/{collabId}`

#### 6. **Panel Administracyjny** (`/admin`)
- **Layout**: Sidebar (nawigacja: Użytkownicy, Archiwalne listy) + Content area
- **Komponenty**:
  - `AdminUserTable`: tabela użytkowników (email, rola, status blokady), akcje (dodaj, edytuj, blokuj/odblokuj)
  - `AdminUserPanel`: po kliknięciu użytkownika → panel boczny z zakładkami "Aktywne" | "Archiwalne" → wyświetlenie list użytkownika (`GET /api/lists?user_id=X&archived=false|true`)
  - `AdminUserForm`: modal dodawania/edycji użytkownika (`PUT /api/admin/users/{userId}`)
- **Przepływ**:
  - `GET /api/admin/users` → wyświetlenie tabeli
  - Dodawanie użytkownika: modal → walidacja (email unique, hasło ≥8 znaków) → `PUT /api/admin/users/{userId}`
  - Blokowanie: `PUT /api/admin/users/{userId}` z `is_blocked: true`
  - Usuwanie archiwalnej listy: `DELETE /api/lists/{listId}` (tylko archived)

### Strategia Integracji z API i Zarządzania Stanem

#### Redux State Structure
```typescript
{
  auth: {
    user: { id, email, role } | null,
    sessionId: string | null,
    loading: boolean
  },
  lists: {
    items: List[], // [{id, title, category_id, priority, due_date, is_archived, tasks: Task[], collaborators: Collaborator[]}]
    filters: {
      archived: boolean,
      category_id: number | null,
      priority: 'low' | 'normal' | 'high' | null,
      sort_by: 'priority' | 'due_date' | 'created_at',
      order: 'asc' | 'desc'
    },
    loading: boolean,
    error: string | null
  },
  categories: {
    items: Category[], // [{id, name, color}]
    loading: boolean
  },
  users: { // dla panelu admina
    items: User[],
    selectedUserId: number | null,
    loading: boolean
  },
  ui: {
    theme: 'light' | 'dark' | 'system'
  }
}
```

#### Thunk Actions (przykłady)
```typescript
// fetchLists
export const fetchLists = (filters) => async (dispatch) => {
  dispatch({ type: 'LISTS_LOADING' });
  try {
    const queryParams = new URLSearchParams(filters).toString();
    const response = await request(`/api/lists?${queryParams}`);
    dispatch({ type: 'LISTS_SUCCESS', payload: response });
  } catch (error) {
    // Happy flow - catch pusty
  }
};

// addTask
export const addTask = (listId, title) => async (dispatch) => {
  try {
    const newTask = await request(`/api/lists/${listId}/tasks`, {
      method: 'POST',
      body: JSON.stringify({ title })
    });
    dispatch({ type: 'TASK_ADDED', payload: { listId, task: newTask } });
  } catch (error) {
    // Toast notification
    showToast('Nie udało się dodać zadania');
  }
};
```

#### WebSocket (Sockette)
```typescript
// Połączenie per lista
const socket = new Sockette(`wss://api.example.com/ws/list:${listId}`, {
  onmessage: (event) => {
    const { type, payload } = JSON.parse(event.data);
    if (type === 'TASK_UPDATED') {
      dispatch({ type: 'WS_TASK_UPDATED', payload });
    }
  }
});
```

#### Funkcja `request` (`utils/request.ts`)
```typescript
async function request(url: string, options?: RequestInit) {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers
    },
    credentials: 'include' // dla cookie
  });

  if (!response.ok) {
    // Logowanie błędu na backend (opcjonalnie)
    // await fetch('/api/admin/error-logs', { method: 'POST', body: ... });
    throw new Error(`HTTP ${response.status}`);
  }

  return response.json();
}
```

### Responsywność, Dostępność i Bezpieczeństwo

#### Responsywność
- **Target**: Desktop ≥1024px (PRD: „zoptymalizowany pod przeglądarki desktopowe")
- **Masonry layout**: użycie TailwindCSS grid z `grid-cols-3` (1024-1280px) → `grid-cols-4` (≥1280px)
- **Modalne**: overlay fullscreen z centrowanym contentem

#### Dostępność
- **Semantyczny HTML**: `<button>`, `<form>`, `<nav>`
- **ARIA labels**: dla ikon (np. `aria-label="Edytuj listę"`)
- **Keyboard navigation**: Tab order, Enter/Space dla akcji
- **Focus indicators**: outline dla elementów interaktywnych
- **Contrast ratio**: zgodność z WCAG AA (≥4.5:1 dla tekstu)

#### Bezpieczeństwo
- **HttpOnly cookie**: `sessionId` nie dostępne dla JavaScript (zapobiega XSS)
- **CSRF protection**: token w headerze `X-CSRF-Token` (opcjonalnie, jeśli Fastify wspiera)
- **Role-based access**: guard w routingu dla `/admin` (sprawdzenie `auth.user.role === 'admin'`)
- **Input validation**: client-side (email format, długość hasła) + server-side (Fastify schemas)

### Nierozwiązane Kwestie

1. **Strategie buforowania**: Czy implementować cache dla `GET /api/lists` w Redux (TTL)? Czy używać Service Workers dla offline support?
2. **Paginacja**: API wspiera paginację (`page`, `limit`), ale nie określono UX dla przeglądania dużych zbiorów list (scroll nieskończony vs przyciski "Poprzednia/Następna")
3. **Optymalizacja wydajności masonry layout**: Przy >100 kafelkach może występować spadek wydajności. Rozważyć wirtualizację (np. `react-window`)?
4. **Throttling WebSocket updates**: Rekomendacja „max 1 update/100ms" – jak dokładnie zaimplementować? Użyć `lodash.throttle` lub custom middleware?
5. **Visual indicator dla zmian WebSocket**: Jaki dokładnie UX? Migający badge, pulsująca ikona, animacja kafelka?
6. **Obsługa konfliktów synchronizacji**: Co jeśli użytkownik A i B edytują to samo zadanie jednocześnie? Strategia: last-write-wins, operational transforms, czy manual conflict resolution?
7. **Preferencje trybu jasny/ciemny**: Czy domyślny tryb „system" (zgodnie z PRD) wymaga detekowania `prefers-color-scheme`? Czy zapisywać preferencję w localStorage czy na backendzie (`user.theme`)?
8. **Limit zadań w kafelku**: „Maksymalnie 5 zadań" – czy wyświetlać „+X więcej" dla list z >5 zadaniami?
9. **Walidacja dat**: Czy termin (`due_date`) może być w przeszłości? Czy wyświetlać ostrzeżenie dla przeterminowanych list?
10. **Error boundary**: Czy implementować React Error Boundary dla graceful degradation przy błędach renderowania?
