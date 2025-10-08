# Aplikacja Zaliczeniowa Tasks

Aplikacja to menadżer zadań do wykonania. Użytkownik może dodawać, edytować i usuwać zadania, a także oznaczać je jako ukończone.

## Struktura folderów
- `app/` - Główny folder aplikacji
- `app/components/` - Komponenty UI (np. TaskItem, TaskList)
- `app/containers/` - Komponenty kontenerowe (np. TaskContainer)
- `app/templates/` - Szablony stron (dla index.html)
- `server` - Backend aplikacji (np. API do zarządzania zadaniami)
- `webpack/` - Konfiguracja Webpacka

## Biblioteki i Frameworki
- React - Biblioteka do budowy interfejsów użytkownika
- Redux - Zarządzanie stanem aplikacji
- Redux Thunk - Middleware do obsługi asynchronicznych akcji w Redux
- Tailwind CSS - Framework CSS do szybkiego stylizowania aplikacji
- Node.js i Fastify - Backend aplikacji
- Webpack i Babel - Narzędzia do budowy i transpilacji kodu
- SqlLite - Lekka baza danych do przechowywania zadań
- Shadcn/ui - zapewnia bibliotekę dostępnych komponentów React, na których oprzemy UI
- Sockette - do obsługi komunikacji w czasie rzeczywistym przez WebSockety

## Własne funkcje
- request `import request from 'components/utils/request'; await request(url, options)` - funkcja do wykonywania zapytań HTTP oparta o fetch
