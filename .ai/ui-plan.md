# Architektura UI dla Tasks

## 1. Przegląd struktury UI
Interfejs aplikacji Tasks jest zorganizowany wokół głównych obszarów funkcjonalnych: uwierzytelnianie, zarządzanie listami i zadaniami, współdzielenie, panel administracyjny oraz ustawienia użytkownika (tryb jasny/ciemny). Struktura opiera się na layoutcie podstawowym z nagłówkiem (globalne akcje, przełącznik motywu, wylogowanie), obszarem treści z nawigacją kontekstową (zakładki, sidebar admina) i warstwą modalną dla operacji edycyjnych. Widoki korzystają z spójnych komponentów (karty list, lista zadań, formularze, tabele) oraz wspierają aktualizacje w czasie rzeczywistym poprzez kanały WebSocket per lista. Architektura jest zoptymalizowana pod desktop (≥1024px) i zapewnia dostępność (ARIA, fokus, kontrast) oraz bezpieczeństwo (sesja HttpOnly, kontrola ról, ograniczenie akcji współwłaścicieli).

## 2. Lista widoków
Poniżej wyszczególniono każdy widok wraz z celem, informacjami, komponentami, powiązanymi historyjkami użytkownika (US-XXX), aspektami UX, dostępności i bezpieczeństwa.

### Widok: Logowanie
- Ścieżka: `/login`
- Główny cel: Uwierzytelnienie użytkownika i ustanowienie sesji.
- Kluczowe informacje: Pola email, hasło, komunikaty walidacyjne, stan ładowania.
- Kluczowe komponenty: `LoginForm`, `AuthErrorToast`.
- Historyjki: US-002 (logowanie/wylogowanie), przygotowanie pod brak rejestracji (nota z sesji), częściowo US-001 (wyłączone w MVP – admin tworzy użytkowników).
- UX: Błędne dane → toast z klarownym komunikatem; fokus automatycznie na polu email; Enter wysyła formularz.
- Dostępność: Etykiety `<label>` powiązane z inputami, `aria-live` dla błędów.
- Bezpieczeństwo: Hasło maskowane, brak autouzupełniania hasła (opcjonalnie `autocomplete="current-password"`), HttpOnly cookie ustawiane po sukcesie.
- Przypadki brzegowe: Konto zablokowane (wyświetlenie komunikatu), brak połączenia (retry / odświeżenie).

### Widok: Dashboard (Aktywne listy)
- Ścieżka: `/dashboard` (zakładka aktywne domyślnie) / stan zakładki w store.
- Główny cel: Przegląd aktywnych list i szybkie filtrowanie/sortowanie.
- Kluczowe informacje: Kafelki list (tytuł, top 5 zadań, licznik, kategoria, priorytet, termin), szybkie filtry, sortowanie, przycisk dodaj listę.
- Kluczowe komponenty: `DashboardHeader`, `FilterToolbar`, `ListGrid`, `ListCard`, `AddListButton`, `Tabs`.
- Historyjki: US-003 (tworzenie listy), US-004 (przegląd aktywnych vs archiwalnych – część aktywna), US-009, US-010, US-011 (filtry/sortowanie), US-015 (podgląd zmian), US-016 (tryb jasny/ciemny), US-013 (archiwizacja – inicjacja z poziomu listy), US-014 (dostęp współdzielonych list – wyświetlane), US-012 (sortowanie list po kryteriach – interpretacja), US-017 (obsługa błędów – komunikaty), US-018 (logowanie błędów – niewidoczne bezpośrednio ale wyzwalane przez request).
- UX: Masonry layout dopasowujący liczbę kolumn do szerokości; „+X więcej” przy >5 zadań; szybkie filtry (Wszystkie / Najważniejsze / Bliski termin) jedno-klikowe; wskaźnik ładowania.
- Dostępność: Każda karta listy to przycisk / link z `aria-label` rozszerzonym o liczbę zadań; kolory kategorii mają tekst alternatywny.
- Bezpieczeństwo: Tylko listy należące do użytkownika lub współdzielone; dane filtrowane po stronie API z walidacją.
- Przypadki brzegowe: Brak list → pusty stan z CTA dodaj listę; błędy filtrów (nieprawidłowe parametry) → reset do domyślnych.

### Widok: Dashboard (Archiwalne listy)
- Ścieżka: `/dashboard?tab=archived` (lub stan zakładki).
- Główny cel: Przegląd archiwalnych list (≤3 miesiące) z ograniczonymi akcjami.
- Kluczowe informacje: Lista z datą archiwizacji, dostępne filtrowanie podobne jak aktywne.
- Kluczowe komponenty: Dziedziczone z aktywnych: `Tabs`, `ListGrid`, `ListCard` (bez przycisku archiwizacji, z wyróżnikiem „Archiwalna”).
- Historyjki: US-004 (archiwalne), US-013 (efekt archiwizacji), US-020 (do wglądu w panelu admina – tu tylko dla użytkownika), US-011, US-010 (filtry/sortowanie).
- UX: Wskazanie upływu czasu do wygaśnięcia widoczności (np. badge „Znika za X dni”).
- Dostępność: Tekst alternatywny dla badge archiwizacji.
- Bezpieczeństwo: Tylko listy użytkownika lub współdzielone; brak edycji metadanych listy jeśli archiwalna.
- Przypadki brzegowe: Lista po przekroczeniu 3 miesięcy znika automatycznie (odświeżenie → nieobecna); brak archiwalnych → pusty komunikat.

### Widok: Szczegóły Listy
- Ścieżka: `/lists/:listId`
- Główny cel: Zarządzanie zadaniami i metadanymi pojedynczej listy.
- Kluczowe informacje: Tytuł, kategoria, priorytet, termin, status archiwizacji, współpracownicy, lista zadań (status, kolejność), filtry statusu.
- Kluczowe komponenty: `ListHeader`, `TaskFilterBar`, `TaskList`, `TaskItem`, `AddTaskForm`, `ShareButton`, `ArchiveButton`, `SortOrderControls`, `RealtimeStatusIndicator`.
- Historyjki: US-005, US-006, US-007, US-008, US-012 (sortowanie zadań), US-013, US-014, US-015, US-017, US-009, US-018 (błędy), US-011 (pośrednio sortowanie list), US-010 (kategoria widoczna), US-003 (lista istnieje), US-019 (admin może tu wchodzić), US-020 (archiwalne listy – ograniczenie akcji).
- UX: Ikony ↑/↓ do zmiany kolejności; inline edycja tytułu zadania; zmiana statusu przez przełącznik lub checkbox; wskaźnik synchronizacji (pulsująca ikona przy aktualizacji nadchodzącej z WebSocket); optymistyczne aktualizacje; potwierdzenie usunięcia opcjonalne (szybkie undo 5s?).
- Dostępność: Każdy `TaskItem` posiada role="listitem"; kontrolki statusu z etykietami; przyciski zmiany kolejności z opisem ARIA.
- Bezpieczeństwo: Współwłaściciel bez uprawnienia archiwizacji/usunięcia listy – ukryte lub disabled; walidacja sortowania przed wysłaniem.
- Przypadki brzegowe: Konflikt edycji (ostatni zapis wygrywa – wizualne nadpisanie); brak kategorii (pokaz „Brak kategorii”); zadania puste → sugestia dodania.

### Widok: Modal Listy (Dodaj/Edycja)
- Ścieżka: Warstwa modalna nad bieżącym widokiem (`/dashboard` lub `/lists/:id`).
- Główny cel: Tworzenie lub edycja metadanych listy.
- Kluczowe informacje: Pola: tytuł (required), kategoria (dropdown), priorytet (radio), termin (date picker), walidacje.
- Kluczowe komponenty: `ListModalForm`, `CategorySelect`, `PriorityRadioGroup`, `DueDatePicker`, `ModalActions`.
- Historyjki: US-003, US-009, US-010.
- UX: Jednolity modal; Po sukcesie automatyczne zamknięcie i odświeżenie list; focus trap; ESC zamyka.
- Dostępność: Role="dialog", `aria-modal="true"`, pierwsze pole focus; przyciski z etykietami.
- Bezpieczeństwo: Walidacja klienta + serwera; brak możliwości zmiany listy archiwalnej (pola read-only lub brak przycisku).
- Przypadki brzegowe: Termin w przeszłości → ostrzeżenie; brak kategorii → dozwolone.

### Widok: Modal Udostępniania Listy
- Ścieżka: Modal nad `/lists/:listId`.
- Główny cel: Dodawanie/usuwanie współpracowników listy.
- Kluczowe informacje: Input email, lista współpracowników (email, rola współwłaściciel), status operacji.
- Kluczowe komponenty: `ShareModal`, `CollaboratorList`, `AddCollaboratorForm`, `RemoveCollaboratorButton`.
- Historyjki: US-014, US-015 (pośrednio – przygotowanie), US-017 (błędy dodawania), US-019 (admin także może).
- UX: Błędy (404, 409) jako toasty; loading indicator przy dodawaniu; dostęp do natychmiastowej aktualizacji po sukcesie.
- Dostępność: Lista współpracowników jako semantyczna lista; przycisk usuwania z `aria-label`.
- Bezpieczeństwo: Tylko właściciel (admin jako właściciel) – ukrycie modal jeśli brak uprawnień; walidacja email.
- Przypadki brzegowe: Duplikat → wyraźny komunikat; email nieistniejący → sugestia sprawdzenia pisowni.

### Widok: Panel Administracyjny (Główny)
- Ścieżka: `/admin`
- Główny cel: Wejście do narzędzi administracyjnych.
- Kluczowe informacje: Nawigacja boczna do sekcji: Użytkownicy, Archiwalne listy, Logi błędów.
- Kluczowe komponenty: `AdminLayout`, `AdminSidebar`, `AdminWelcomePanel`.
- Historyjki: US-019, US-020, US-018.
- UX: Wyraźne rozdzielenie sekcji; podświetlenie aktywnej; responsywność: sidebar stały na desktop.
- Dostępność: Nawigacja jako `<nav>`; skróty klawiszowe (opcjonalnie) do przełączania sekcji.
- Bezpieczeństwo: Guard ról przed wejściem (redirect jeśli nie admin); brak danych produkcyjnych w nieautoryzowanych logach.
- Przypadki brzegowe: Brak uprawnień → redirect `/403`.

### Widok: Admin Użytkownicy
- Ścieżka: `/admin/users`
- Główny cel: Zarządzanie kontami (dodawanie, blokowanie, zmiana roli, edycja email/hasła).
- Kluczowe informacje: Tabela użytkowników (email, rola, status blokady), paginacja, filtr roli/statusu.
- Kluczowe komponenty: `AdminUserTable`, `UserFilters`, `UserRowActions`, `AdminUserFormModal`.
- Historyjki: US-019 (pełne). US-002 (logowanie – admin wizualizuje konta), US-001 (tworzenie konta przez admina – adaptacja).
- UX: Inline status blokady (toggle); edycja w modalach; wskaźnik paginacji (strona X z Y).
- Dostępność: Tabela ze scope nagłówków; role="button" dla akcji wierszy.
- Bezpieczeństwo: Walidacja email unikalny, hasło min 8; wysyłane tylko pola zmienione.
- Przypadki brzegowe: Próba zmiany na istniejący email → komunikat; blokada własnego konta admina – zabronione.

### Widok: Admin Szczegóły Użytkownika
- Ścieżka: `/admin/users/:userId`
- Główny cel: Podgląd list użytkownika (aktywne/archiwalne) z możliwością zarządzania archiwalnymi.
- Kluczowe informacje: Karty list, filtry, zakładki jak dashboard użytkownika.
- Kluczowe komponenty: `UserListTabs`, `UserListGrid`, `ListCardAdminActions`.
- Historyjki: US-020 (zarządzanie archiwalnymi), US-019 (przegląd użytkownika).
- UX: Kontekstowy nagłówek z email użytkownika; możliwość usunięcia archiwalnej listy (potwierdzenie).
- Dostępność: Jak dashboard; dodatkowy opis "Listy użytkownika X".
- Bezpieczeństwo: Tylko admin; usunięcie listy sprawdza status archiwizacji.
- Przypadki brzegowe: Brak list → pusty stan; usunięcie listy sukcesywnie aktualizuje widok.

### Widok: Admin Archiwalne Listy (Zbiorczo)
- Ścieżka: `/admin/archived-lists`
- Główny cel: Zarządzanie archiwalnymi listami globalnie (filtr użytkownik, data archiwizacji, usuwanie).
- Kluczowe informacje: Tabela lub siatka z datą archiwizacji, właścicielem, kategorią, priorytetem.
- Kluczowe komponenty: `ArchivedListFilterBar`, `ArchivedListTable`, `DeleteArchivedListAction`.
- Historyjki: US-020.
- UX: Filtry natychmiastowe; potwierdzenie usunięcia listy; paginacja.
- Dostępność: Tabela semantyczna; filtry z labelami.
- Bezpieczeństwo: Tylko listy archiwalne; logowanie błędów nieudanych operacji.
- Przypadki brzegowe: Brak wyników filtrowania → informacja.

### Widok: Admin Logi Błędów
- Ścieżka: `/admin/error-logs`
- Główny cel: Analiza nieudanych odpowiedzi API.
- Kluczowe informacje: Lista logów (timestamp, userId, endpoint, status_code), filtry.
- Kluczowe komponenty: `ErrorLogTable`, `ErrorLogFilters`, `PaginationControls`.
- Historyjki: US-018.
- UX: Kolorystyczne oznaczenia statusów (np. czerwony ≥500); sortowanie po dacie i statusie.
- Dostępność: Nagłówki tabeli opisane; status jako tekst + kolor.
- Bezpieczeństwo: Tylko admin; brak wrażliwych payloadów.
- Przypadki brzegowe: Duża liczba logów → wydajna paginacja; brak logów → pusty komunikat.

### Widok: Ustawienia (Motyw)
- Ścieżka: `/settings` (lub panel w headerze).
- Główny cel: Wybór motywu (light/dark/system).
- Kluczowe informacje: Aktualny wybór, podgląd motywu.
- Kluczowe komponenty: `ThemeSwitcher`, `ThemePreview`.
- Historyjki: US-016.
- UX: Natychmiastowa zmiana motywu; zapamiętanie preferencji.
- Dostępność: Przełącznik z opisem; kontrast w obu motywach.
- Bezpieczeństwo: Brak wrażliwych danych; preferencja w localStorage lub w profilu.
- Przypadki brzegowe: Brak wsparcia systemowego → fallback do light.

### Widok: Błąd Dostępu (403)
- Ścieżka: `/403`
- Główny cel: Informacja o braku uprawnień.
- Kluczowe informacje: Komunikat, opcja powrotu na dashboard.
- Komponenty: `AccessDeniedMessage`, `BackToDashboardButton`.
- Historyjki: Wynik naruszenia ról z US-019, US-020.
- UX/Dostępność/Bezpieczeństwo: Jasny komunikat; brak szczegółów o zasobach.

### Widok: Nie znaleziono (404)
- Ścieżka: `*` (fallback routing).
- Główny cel: Informowanie o nieistniejącym zasobie.
- Kluczowe informacje: Treść błędu, link powrotu.
- Komponenty: `NotFoundMessage`.
- Historyjki: Ogólne; brak bezpośrednich.

### Widok: Fallback Error Boundary
- Ścieżka: Warstwa globalna (nie routowana).
- Główny cel: Graceful degradation przy błędach renderowania.
- Informacje: Prosty komunikat, przycisk odśwież.
- Komponenty: `ErrorBoundaryFallback`.
- Historyjki: US-017 (obsługa błędów – rozszerzenie UI).

### Widok: Sesja Wygasła (Modal)
- Ścieżka: Modal globalny (po błędach 401 na chronionych zasobach).
- Cel: Informacja o wygaśnięciu sesji, przycisk powrotu do logowania.
- Komponenty: `SessionExpiredModal`.
- Historyjki: US-002 (wylogowanie konsekwencja).

## 3. Mapa podróży użytkownika
Opis głównych przepływów między widokami dla podstawowych scenariuszy.

1. Logowanie (US-002):
   - Użytkownik wchodzi na `/login` → wypełnia formularz → wysyła → walidacja → sukces: przekierowanie do `/dashboard` (aktywnych list).
   - Błąd: toast + fokus na pierwszym błędnym polu.
2. Tworzenie listy (US-003, US-009, US-010):
   - W dashboard klik „Dodaj listę” → Modal Listy → wypełnia pola → zapis → modal zamyka się → lista pojawia się w siatce.
3. Przegląd i filtrowanie list (US-004, US-011):
   - Dashboard aktywne → zmiana szybkiego filtra/sortowania → odświeżenie wyników → przejście do archiwalnych zakładką.
4. Współdzielenie listy (US-014, US-015):
   - Widok szczegółów → klik „Udostępnij” → Modal Udostępniania → dodanie email → natychmiast aktualizacja listy współpracowników → współużytkownik na swoim dashboardzie widzi listę → real-time aktualizacje w TaskList.
5. Zarządzanie zadaniami (US-005–US-008, US-012):
   - Widok szczegółów → dodawanie zadania (formularz) → natychmiastowe dodanie (optimistic) → edycja inline → zmiana statusu → kontrolki ↑/↓ zmieniają order → persist przez endpoint reorder.
6. Archiwizacja (US-013):
   - Widok szczegółów listy → klik „Archiwizuj” → potwierdzenie → lista znika z aktywnych → pojawia się w zakładce archiwalnych oraz w panelu admina.
7. Zmiana motywu (US-016):
   - Nagłówek / ustawienia → przełącznik → natychmiastowa zmiana klas motywu → zapis preferencji.
8. Admin zarządzanie użytkownikami (US-019):
   - `/admin/users` → dodanie lub edycja użytkownika → zapis → odświeżenie tabeli.
9. Admin zarządzanie archiwalnymi listami (US-020):
   - `/admin/archived-lists` → filtracja → usunięcie konkretnej listy → zniknięcie listy z widoku.
10. Analiza błędów (US-018):
    - `/admin/error-logs` → filtry → analiza trendów → powrót do innych sekcji.
11. Obsługa błędów synchronizacji (US-017):
    - Podczas akcji: jeśli odpowiedź !=2xx → toast + opcja „Odśwież” → przy chronicznym błędzie modal z możliwością ponownego połączenia WebSocket.

## 4. Układ i struktura nawigacji
- Globalny layout: `Header` (logo, przełącznik motywu, przycisk wyloguj, opcje ustawień) + główny kontener treści.
- Nawigacja podstawowa (routy główne): `/login`, `/dashboard`, `/lists/:listId`, `/settings`, `/admin/*`.
- Dashboard: Zakładki (Aktywne | Archiwalne) – sterowanie stanem, nie zmianą podstawowego URL (opcjonalnie query param `tab`).
- Panel admina: Sidebar z linkami do sekcji (`/admin/users`, `/admin/archived-lists`, `/admin/error-logs`).
- Nawigacja kontekstowa: W widoku listy przyciski akcji (archiwizuj, udostępnij, edytuj) otwierają modale bez zmiany routy.
- Fallback: Nieznane URL → `/404`; brak uprawnień → `/403`.
- Orientacja użytkownika: Breadcrumb w szczegółach listy (Dashboard > Lista „X”).
- Stany: Modal nie zmienia głównego routu (pozwala na zachowanie historii powrotu). Opcjonalnie możemy zapisać w stanie (np. `/lists/:id?modal=edit`).
- Po wylogowaniu: Invalidate store, redirect do `/login`.

## 5. Kluczowe komponenty
Opis komponentów wielokrotnego użycia budujących spójność interfejsu.

- Header: Zawiera globalne akcje (motyw, wyloguj, ustawienia); reaguje na rolę (admin – link panelu).
- Tabs: Abstrakcja zakładek (dashboard aktywne/archiwalne, admin listy użytkownika). ARIA role tablist.
- ListCard: Prezentacja listy w siatce (tytuł, maks 5 zadań, kategoria badge, priorytet ikona, termin, licznik zadań, status archiwalny). Wariant admin (dodatkowe akcje).
- ListGrid: Siatka masonry dopasowująca kolumny do szerokości; obsługuje pusty stan.
- FilterToolbar: Szybkie filtry i sortowanie list (priority, due_date); integracja z Redux.
- ListHeader: Metadane listy + akcje (edycja, udostępnij, archiwizuj); wskaźnik real-time.
- TaskList: Renderuje `TaskItem` według aktualnego filtra statusu i kolejności.
- TaskItem: Status (checkbox / switch), tytuł, akcje edycji/usunięcia, kontrolki ↑/↓, dostępne etykiety ARIA.
- AddTaskForm: Formularz dodawania zadania z walidacją pustego tytułu.
- SortOrderControls: Logika obliczania nowej pozycji i wysyłania batch reorder.
- ListModalForm: Reużywalny formularz dodawania/edycji listy (title, category, priority, due_date).
- ShareModal: Zarządzanie współpracownikami (lista współpracowników, formularz email, usuwanie).
- CollaboratorList: Prezentacja współpracowników (email, rola, akcje).
- AdminLayout: Wrapper z sidebar i obszarem treści dla widoków admina.
- AdminUserTable: Tabela użytkowników z paginacją, filtrami, akcjami edycji/blokady.
- AdminUserFormModal: Formularz tworzenia/edycji użytkownika (email, rola, blokada, hasło).
- ArchivedListTable: Widok tabelaryczny list archiwalnych (w panelu admina) + akcje usunięcia.
- ErrorLogTable: Tabela logów błędów z kolorami statusów.
- ThemeSwitcher: Przełącznik motywu (light/dark/system) + integracja z preferencją systemową.
- RealtimeStatusIndicator: Ikona/animacja sygnalizująca aktywność WebSocket lub opóźnienia.
- ToastContainer / Toast: Prezentacja błędów i informacji (dostępność: `aria-live`).
- SessionExpiredModal: Komunikat o wygaśnięciu sesji z przyciskiem powrotu do logowania.
- ErrorBoundaryFallback: Fallback dla niespodziewanych błędów renderowania.
- PaginationControls: Spójna kontrolka paginacji dla tabel admina i logów.
- LoadingSpinner / Skeleton: Wskazanie stanu ładowania.

---
Mapowanie historyjek użytkownika zakończone: każda US-001–US-020 posiada przypisane widoki lub komponenty (US-001 zastąpiona procesem admina przy tworzeniu użytkownika w AdminUserFormModal). Architektura uwzględnia wszystkie wymagania PRD, integruje zaplanowane endpointy API i notatki z sesji (masonry, brak drag&drop, szybkie filtry, Sockette real-time, toasty błędów, panel admina z listami użytkownika). Uwzględniono kluczowe punkty bólu: chaos zadań (filtry, priorytety, kategorie), widoczność postępu (statusy, wskaźnik real-time), zarządzanie archiwami (zakładki i panel admina), bezpieczeństwo (role, wymuszenia akcji) oraz czytelność (spójne komponenty i dostępność).
