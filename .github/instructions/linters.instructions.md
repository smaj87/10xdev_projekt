# Reguły kodowania dla agenta

## TypeScript Configuration

### Kompilator
- Używaj `jsx: "preserve"` z `jsxImportSource: "preact"`
- Target i module: `esnext`
- Włącz `strict: true`, `noImplicitAny: true`
- Używaj `noUnusedLocals` i `noUnusedParameters`
- Włącz `forceConsistentCasingInFileNames`

### Aliasy ścieżek
- `components/*` → `app/components/*`
- `containers/*` → `app/containers/*`
- `hoc/*` → `app/containers/HOC/*`
- `images/*` → `app/images/*`
- `translations/*` → `app/translations/*`
- `utils/*` → `app/utils/*`

## Prettier Formatting

- **Print width**: 80 znaków
- **Indentacja**: 2 spacje (bez tabów)
- **Średniki**: zawsze dodawaj
- **Cudzysłowy**: pojedyncze (`'`)
- **Trailing commas**: zawsze w wieloliniowych strukturach

## ESLint Rules

### Import/Export
- Sortuj importy według grup: external → commons → relative → local
- Używaj `simple-import-sort` dla automatycznego sortowania
- Dodawaj nową linię po importach
- Nie używaj default exports jako preferencji
- Do tłumaczenia tekstów używaj `import useTranslations from 'components/hooks/useTranslations'; const t = useTranslations(); t('key');`
- Do selektorów używaj `import { useSelector, getStateValueBySelector } from 'components/utils/react-redux'; const value = useSelector(selector)) lub const value = getStateValueBySelector(selector) w hookach`
- Dla importów reactowych używaj `import { FC, memo, useEffect, useMemo, useCallback, useState, useRef } from 'components/utils/react';`

### React/Preact
- Komponenty jako arrow functions: `const Component: FC<Props> = ({ ... }) => {}; export default memo(Component); `
- Sortuj props w JSX alfabetycznie
- Używaj podwójnych cudzysłowów w JSX: `<div className="class">`
- Nie wymagaj PropTypes (TypeScript zastępuje)
- Destrukturyzuj props w posortowanej kolejności

### TypeScript Specific
- Ignoruj niewykorzystane zmienne/parametry z prefixem `_`
- Pozwalaj na puste funkcje
- Nie wymagaj explicit `any`
- Używaj `@typescript-eslint/no-shadow` zamiast podstawowego

### General Code Style
- Zawsze używaj nawiasów klamrowych w if/else: `if (condition) { ... }`
- Zawsze używaj `===` i `!==`
- Używaj `const` jako domyślnie, `let` tylko gdy konieczne
- Zawsze dodawaj dodatkową linię, gdy:
  - Po definicji funkcji
  - Przed return
  - Po importach
  - Przed blokami kodu (if, for, while, switch) oraz po zakończeniu bloków
  - Przed hookami (useEffect, useMemo, useCallback, itp) oraz po zakończeniu hooków
- Preferuj template literals nad konkatenacją
- Nie używaj `console.log` (błąd)
- Używaj arrow functions gdy to możliwe
- Unix line endings (`\n`)
- Do nasłuchiwania na zmianę języka w hooks, w deps używaj `t.lang`, np. `useEffect(() => { ... }, [t.lang]);`

### Error Handling
- Pozwalaj na puste bloki catch: `catch (error) {}`
- Wymagaj yield w generator functions

## Preact Specific
- Używaj `<>` dla fragmentów
- Aliasy React → Preact w resolverze modułów
