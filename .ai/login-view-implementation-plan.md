# Plan implementacji widoku Logowanie

## 1. Przegląd
Widok `/login` służy do uwierzytelnienia użytkownika poprzez podanie email i hasła, wywołanie endpointu `POST /api/auth/login` oraz ustanowienie sesji (HttpOnly cookie `sessionId`). Po pomyślnym logowaniu aplikacja zapisuje minimalne dane użytkownika w stanie (Redux) i przekierowuje do strony głównej (lub docelowej jeśli była próba wejścia na chronioną trasę). Widok zapewnia: dostępność, walidację, informację o błędach (toast), obsługę przypadków brzegowych (konto zablokowane, brak sieci), wygodną obsługę klawiatury (Enter) oraz bezpieczeństwo (maskowanie hasła, brak ekspozycji sessionId w JS poza DTO odpowiedzi jeśli potrzebne).

## 2. Routing widoku
- Ścieżka: `/login`
- Publiczny (nie wymaga sesji). Jeśli użytkownik jest już zalogowany — przekierowanie do strony startowej (np. `/` lub dashboard list) natychmiast po mount.
- Integracja: dodać do mechanizmu routingu (jeśli routing nie istnieje: tymczasowo renderować warunkowo w `App`). Docelowo: `App` -> `Router` -> `Route path="/login" element={<LoginPage/>}`.

## 3. Struktura komponentów
```
LoginPage (kontener widoku)
 ├─ LoginForm (logika formularza + UI)
 │   ├─ EmailField (opcjonalnie wydzielone)
 │   ├─ PasswordField (maskowane)
 │   ├─ SubmitButton
 │   └─ SecondaryActions (np. link do pomocy / info o braku rejestracji w MVP)
 └─ AuthErrorToast (toast wyświetlany warunkowo przy błędach globalnych)
```
Dodatkowe warstwy:
- `hooks/useLogin` (custom hook do obsługi cyklu logowania)
- `redux/authSlice` (globalny stan użytkownika po autentykacji)
- `utils/validators/authValidators.ts` (walidacja email/hasło — opcjonalna ekstrakcja)
- `components/ui/*` (Input, Button, Toast)

## 4. Szczegóły komponentów
### LoginPage
- Opis: Kontener widoku. Odpowiada za sprawdzenie czy użytkownik ma aktywną sesję (np. zapisaną w Redux), jeśli tak — przekierowuje. Renderuje `LoginForm` oraz `AuthErrorToast`.
- Główne elementy: wrapper layout (centrowanie), nagłówek (logo / tytuł), formularz.
- Obsługiwane interakcje: brak bezpośrednich (delegowane do dziecka), efekt `useEffect` do auto-redirect.
- Walidacja: Brak — delegacja do `LoginForm`.
- Typy: korzysta z `AuthState`, `UserAuthDTO`.
- Propsy: brak (widok routowany). 

### LoginForm
- Opis: Komponent odpowiedzialny za UI i logikę logowania — lokalny stan pól, walidacja, wywołanie hooka `useLogin` na submit, zarządzanie stanem błędu.
- Główne elementy: `<form>` z polami Email, Hasło, przyciskiem Zaloguj, inline error placeholders, region `aria-live` dla komunikatów walidacyjnych.
- Obsługiwane interakcje:
  - onChange (email, password)
  - onBlur (walidacja natychmiastowa lub leniwa)
  - onSubmit (Enter / klik przycisku)
  - Retry (po błędzie sieciowym — ponowne submit)
- Walidacja (przed wysłaniem):
  - Email: niepusty, poprawny format RFC 5322 (frontend uproszczony regex), trim.
  - Hasło: niepuste, minLength 8 (zgodnie z backend schema), brak dodatkowych ograniczeń.
  - Uniemożliwić podwójny submit w trakcie ładowania.
- Typy: `LoginFormValues`, `LoginFormErrors`, `LoginStatus`, `UseLoginResult`.
- Propsy: opcjonalnie `onSuccess?: (user: UserAuthDTO) => void` (fallback do globalnego efektu), `autoFocusEmail?: boolean` (domyślnie true).

### AuthErrorToast
- Opis: Wyświetla komunikaty błędów wysokiego poziomu: nieprawidłowe dane (401), konto zablokowane (403), problemy sieciowe, błąd serwera. Używa komponentów toast - własna minimalna implementacja.
- Główne elementy: kontener toast, tekst komunikatu, przycisk zamykania / ponów próbę (retry dla sieci).
- Obsługiwane interakcje:
  - Zamknięcie toast (onDismiss)
  - Retry (wywołanie ostatniej próby submit)
- Walidacja: Brak (prezentacja błędów z warstwy logiki).
- Typy: `AuthErrorKind`, `AuthErrorToastProps`.
- Propsy: `error: AuthErrorState | null`, `onRetry: () => void`, `onDismiss: () => void`.

### EmailField / PasswordField (opcjonalnie jako wydzielone)
- Opis: Reużywalne kontrolki z label, input, inline error.
- Elementy: `<label for=...>`, `<input />`, `<p role="alert">` (przy błędzie).
- Interakcje: onChange, onBlur.
- Walidacja: otrzymują tekst błędu z rodzica.
- Propsy: `value: string`, `onChange`, `onBlur`, `error?: string`, `autoFocus?`, `type` (dla password), `name`.

## 5. Typy
Nowe typy (TS):
- `LoginFormValues`:
```ts
interface LoginFormValues { email: string; password: string; }
```
- `LoginFormErrors`:
```ts
interface LoginFormErrors { email?: string; password?: string; _form?: string; }
```
- `LoginStatus` (stan lokalny):
```ts
type LoginStatus = 'idle' | 'validating' | 'submitting' | 'success' | 'error';
```
- `AuthErrorKind`:
```ts
type AuthErrorKind = 'INVALID_CREDENTIALS' | 'ACCOUNT_BLOCKED' | 'NETWORK' | 'SERVER' | 'UNKNOWN';
```
- `AuthErrorState`:
```ts
interface AuthErrorState { kind: AuthErrorKind; message: string; statusCode?: number; retryable: boolean; }
```
- `UseLoginResult` (z hooka `useLogin`):
```ts
interface UseLoginResult {
  login: (values: LoginFormValues) => Promise<UserAuthDTO | null>;
  status: LoginStatus;
  error: AuthErrorState | null;
  clearError: () => void;
}
```
- Redux slice `AuthState`:
```ts
interface AuthState {
  user: UserAuthDTO | null;
  isAuthenticated: boolean;
  lastLoginAt?: string;
}
```
- Akcje Redux:
```ts
type AuthAction = { type: 'auth/loginSuccess'; payload: UserAuthDTO } | { type: 'auth/logout' };
```
- Selectory:
```ts
const selectAuthUser = (state: RootState) => state.auth.user;
const selectIsAuthenticated = (state: RootState) => state.auth.isAuthenticated;
```

Reużywane typy z istniejących definicji: `LoginCommand`, `LoginResponseDTO`, `UserAuthDTO`.

## 6. Zarządzanie stanem
- Lokalny stan formularza (useState / useReducer): wartości, błędy, status.
- Globalny stan (Redux): przechowywanie zalogowanego użytkownika i flagi `isAuthenticated`.
- Logika:
  1. Submit -> walidacja -> jeśli OK -> `useLogin.login()`.
  2. Po sukcesie: dispatch `auth/loginSuccess`, ustawienie użytkownika.
  3. Po błędzie: ustawienie `AuthErrorState` w hooku -> propagacja do `AuthErrorToast`.
- Custom hook `useLogin` implementuje: blokadę wielokrotnych submitów, mapowanie status code na `AuthErrorKind`, automatyczne czyszczenie poprzedniego błędu przy zmianie pól.
- Persistent session: HttpOnly cookie — nie dostępne w JS. Opcjonalnie dodatkowy endpoint `GET /api/auth/session` (jeśli planowany) do hydratacji po odświeżeniu (w dalszym etapie). W MVP: po reload bez mechanizmu hydratacji user stanie się `null` — docelowo do uzupełnienia.

## 7. Integracja API
Endpoint: `POST /api/auth/login`
- Request body: `LoginCommand` (`{ email, password }`).
- Oczekiwania: 200 -> `LoginResponseDTO { sessionId, user }`, cookie `sessionId` ustawione przez serwer (HttpOnly, SameSite=Strict).
- Błędy:
  - 401: Nieprawidłowe dane (mapowane na `INVALID_CREDENTIALS`).
  - 403: Konto zablokowane (`ACCOUNT_BLOCKED`).
  - 500: Błąd serwera (`SERVER`).
  - Fetch failure / brak sieci: (`NETWORK`).
Implementacja:
```ts
await request('/api/auth/login', { method: 'POST', body: { email, password } });
```
`request` już ustawia `credentials: 'include'` więc cookie zostanie zapisane. Nie trzeba manualnie operować na `sessionId` poza ewentualnym użyciem w debug lub dalszych wywołaniach.
Logout (przyszły): `POST /api/auth/logout` -> po sukcesie dispatch `auth/logout`.

## 8. Interakcje użytkownika
- Wpisanie email: aktualizacja stanu, jeśli był błąd formatowy — ponowna walidacja po blur.
- Wpisanie hasła: aktualizacja stanu, minimalna walidacja przy submit lub blur.
- Enter w polu hasła/email: submit formularza jeśli nie w stanie `submitting`.
- Klik przycisku „Zaloguj”: submit.
- Zamknięcie toast: `clearError()`.
- Retry w toast (dla `NETWORK`, `SERVER`): ponowny submit ostatnich wartości (cache ostatnich `LoginFormValues`).
- AutoFocus: po mount fokus na email (przy pomocy `useEffect` + ref).

## 9. Warunki i walidacja
Warunki: 
1. `email` wymagany, poprawny format — regex `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` (wystarczający dla UI). Błąd -> komunikat: „Podaj poprawny email”.
2. `password` wymagane, min 8 znaków — komunikat: „Hasło musi mieć co najmniej 8 znaków”.
3. Brak błędów -> dopiero wywołanie API.
4. Status `submitting` blokuje interakcje (disable button, ignore Enter).
5. Błąd globalny (np. 401) nie resetuje pól — umożliwia poprawę.
6. Po `ACCOUNT_BLOCKED` komunikat specyficzny: „Konto jest zablokowane. Skontaktuj się z administratorem.”.
7. `NETWORK` -> „Brak połączenia. Spróbuj ponownie.” + przycisk Retry.
8. `SERVER` -> „Wystąpił błąd serwera. Spróbuj ponownie.”.
9. Po sukcesie -> czyści błędy i wywołuje redirect.

## 10. Obsługa błędów
Mapowanie:
- 401 -> `INVALID_CREDENTIALS`: toast + fokus na email (opcjonalnie). Nie ujawniamy czy email czy hasło błędne.
- 403 -> `ACCOUNT_BLOCKED`: toast stały bez retry.
- 500 -> `SERVER`: toast z retry.
- Fetch failure -> `NETWORK`: toast z retry.
- Inne statusy -> `UNKNOWN`.
Działania dodatkowe:
- Logowanie błędów UI (opcjonalne) — np. dispatch akcji `error/log` (future).
- Re-try mechanizm: ostatnie wartości przechowywane w hooku.
- Accessibility: toast kontener z `role="alert" aria-live="assertive"`.

## 11. Kroki implementacji
1. Utwórz folder `app/containers/LoginPage/` i plik `index.tsx` (struktura kontenera).
2. Dodaj Redux slice `authSlice.ts` w `app/components/store/auth/` (lub analogicznej ścieżce zgodnej z projektem), z akcjami `loginSuccess`, `logout`.
3. Zarejestruj reducer `auth` w store (mechanizm `store.injectedReducers` jeśli stosowany; w MVP można dodać bez dynamicznego ładowania).
4. Utwórz typy: `auth.types.ts` w `app/types/` (LoginFormValues, LoginFormErrors, AuthErrorState, itp.).
5. Utwórz hook `useLogin.ts` w `app/components/hooks/`:
   - Przyjmuje brak parametrów, zwraca `UseLoginResult`.
   - Implementuje status, mapuje błędy.
   - Używa `request` do wywołania API.
   - Po sukcesie dispatch `loginSuccess`.
6. Utwórz komponent `LoginForm.tsx` w `app/components/Auth/`:
   - Formularz z polami, lokalny stan.
   - Walidacja email/hasło.
   - Obsługa Enter.
   - Wywołuje `useLogin`.
7. Utwórz komponent `AuthErrorToast.tsx` w `app/components/Auth/`:
   - Przyjmuje `error`, `onRetry`, `onDismiss`.
   - Implementuje UI toast - własna implementacja. 
8. Dodaj style (Tailwind klasy) zapewniające responsywność desktop.
9. Dodaj dostępność: `aria-live` region na błędy inline lub w toast, poprawne powiązania `<label htmlFor=...>`.
10. Dodaj autofocus: ref na email input w `useEffect`.
11. Dodaj logiczne przekierowanie w `LoginPage`: jeśli `isAuthenticated` -> redirect.
12. Przetestuj przypadki:
    - Sukces (200) -> user zapisany, redirect.
    - 401 -> toast Invalid, brak redirect.
    - 403 -> toast Blocked.
    - 500 -> toast z Retry.
    - Network offline (symulacja) -> Retry działa.
13. Dodaj testy jednostkowe (opcjonalnie): walidator email, mapowanie statusów w hooku.
14. (Future) Hydratacja sesji po reload — zaplanować endpoint `/api/auth/session`.
15. Code review pod kątem braku logowania hasła i braku wycieku `sessionId`.

---
Gotowe. Widok może zostać wdrożony zgodnie z powyższym planem. 
