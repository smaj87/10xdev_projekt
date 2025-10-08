# Tasks - Menadżer Zadań

## Spis treści
- [Opis projektu](#opis-projektu)
- [Stos technologiczny](#stos-technologiczny)
- [Rozpoczęcie pracy lokalnie](#rozpoczęcie-pracy-lokalnie)
- [Dostępne skrypty](#dostępne-skrypty)
- [Zakres projektu](#zakres-projektu)
- [Status projektu](#status-projektu)
- [Licencja](#licencja)

## Opis projektu

Tasks to nowoczesna aplikacja webowa do zarządzania listami zadań (TODO), zaprojektowana z myślą o produktywności i współpracy zespołowej. Aplikacja umożliwia użytkownikom tworzenie i organizowanie wielu list zadań z zaawansowanymi funkcjami takimi jak:

- 📝 **Zarządzanie zadaniami** - dodawanie, edytowanie, usuwanie i zmiana statusu zadań
- 🏷️ **Kategoryzacja i priorytety** - organizacja zadań według kategorii (praca, dom, zakupy) i poziomów ważności
- 📅 **Terminy realizacji** - ustawianie dat zakończenia dla lepszego planowania
- 👥 **Współdzielenie w czasie rzeczywistym** - współpraca z innymi użytkownikami przez WebSocket
- 🔍 **Filtrowanie i sortowanie** - szybkie znajdowanie zadań według różnych kryteriów
- 🌓 **Tryb jasny/ciemny** - dostosowanie interfejsu do preferencji użytkownika
- 🗃️ **Archiwizacja** - zarządzanie zakończonymi projektami
- 👨‍💼 **Panel administratora** - zarządzanie użytkownikami i archiwalnymi listami

Aplikacja rozwiązuje problem gubienia się w dużej liczbie zadań, dostarczając centralną, uporządkowaną przestrzeń do zarządzania obowiązkami z możliwością współpracy zespołowej.

## Stos technologiczny

### Frontend
- **Preact 10** - lekka biblioteka do budowy interfejsów użytkownika
- **Redux 5** - zarządzanie stanem aplikacji
- **Redux-Thunk** - obsługa asynchronicznych akcji
- **TypeScript 5** - statyczne typowanie dla lepszego wsparcia IDE
- **TailwindCSS 4** - framework CSS do szybkiego stylowania
- **Shadcn/ui** - biblioteka komponentów React
- **Sockette 2** - komunikacja w czasie rzeczywistym przez WebSocket

### Backend
- **Node.js 20** - środowisko uruchomieniowe JavaScript
- **Fastify 5** - szybki framework webowy do REST API
- **SQLite 3** - lekka baza danych

### CI/CD i Infrastruktura
- **GitHub Actions** - automatyzacja procesów CI/CD
- **Nginx** - serwer proxy i obsługa plików statycznych

## Rozpoczęcie pracy lokalnie

### Wymagania systemowe
- **Node.js**: 22.11.0 (zalecane użycie pliku `.nvmrc`)
- **NPM**: >=10.9.0

### Instalacja

1. **Sklonuj repozytorium:**
```bash
git clone https://github.com/smaj87/10xdev_projekt.git
cd 10xdev_projekt
```

2. **Zainstaluj zależności:**
```bash
npm install
```

3. **Uruchom środowisko deweloperskie:**
```bash
npm start
```

4. **Otwórz aplikację w przeglądarce:**
```
http://localhost:3000
```

### Uruchomienie w trybie produkcyjnym

```bash
npm run start:prod
```

## Dostępne skrypty

- `npm start` - uruchamia aplikację w trybie deweloperskim
- `npm run build` - buduje aplikację do produkcji
- `npm run start:prod` - buduje i uruchamia aplikację w trybie produkcyjnym
- `npm run lint` - sprawdza kod pod kątem błędów składniowych i stylistycznych
- `npm run lint:js` - lintowanie plików JavaScript/TypeScript
- `npm run lint:css` - lintowanie stylów CSS
- `npm run check-types` - sprawdzanie typów TypeScript
- `npm run prettify` - formatowanie kodu zgodnie z regułami Prettier

## Zakres projektu

### Funkcje MVP ✅
- **Autoryzacja**: rejestracja, logowanie, zarządzanie rolami użytkowników
- **Zarządzanie listami**: tworzenie, edycja, archiwizacja z kategoriami i priorytetami
- **Zarządzanie zadaniami**: pełny CRUD z statusami (niezrobione, w trakcie, zrobione)
- **Współdzielenie**: zapraszanie użytkowników, uprawnienia współwłaściciela
- **Synchronizacja**: aktualizacje w czasie rzeczywistym przez WebSocket
- **UI/UX**: responsywny interfejs desktop (>=1024px), tryb jasny/ciemny
- **Monitoring**: logowanie błędów API, obsługa błędów synchronizacji
- **Panel administratora**: zarządzanie kontami i archiwalnymi listami

### Poza zakresem MVP ❌
- Integracje z kalendarzami i email
- Powiadomienia i przypomnienia
- Aplikacje mobilne
- Zaawansowana analityka i raportowanie
- Uwierzytelnianie dwuskładnikowe
- Obsługa wielu języków
- Rozbudowana personalizacja

### Metryki sukcesu 📊
- Stabilność: wskaźnik błędnych operacji UI < 1%
- Niezawodność: odsetek odpowiedzi API poza 2xx < 0,5%
- Aktywność: ≥50% użytkowników dokonuje zmian co najmniej raz w tygodniu

## Status projektu

🚧 **W rozwoju** - Wersja MVP (v0.0.1)

Projekt jest obecnie w fazie aktywnego rozwoju. Podstawowa funkcjonalność jest implementowana zgodnie z wymaganiami produktowymi określonymi w dokumencie PRD.

## Licencja

Projekt jest udostępniony na licencji [MIT](LICENSE).

---

**Autor**: Sebastian Maj  
**Wersja**: 0.0.1  
**Aplikacja zaliczeniowa**: Tasks - Menadżer Zadań
