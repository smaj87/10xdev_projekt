# Instrukcja agenta do obsługi PR

**UWAGA:** Nie pozwalaj na push na master! Zawsze wymagaj nowej gałęzi.

1. Używasz terminalu git bash. Dostosuj składnie poleceń do niego.

2. Aplikacja posiada dwa repozytoria:
  - Główne REPO: `webmail-2.0`
  - SUB-REPO: `app/commons` (wewnątrz REPO)

3. Wykryj ścieżki do katalogu głównego REPO oraz SUB-REPO (tam gdzie jest `.git`).
  - Wyświetl ścieżki do obu katalogów
  - Przechodząc między katalogami używaj pełnych ścieżek. Pamiętaj, aby dostosować ścieżki do Git Bash

4. Przejdź do katalogu SUB-REPO `cd app/commons`:
  - Sprawdź, czy są zmiany
  - Jeśli tak:
    - Wykonaj instrukcję z sekcji "Instrukcja czy master"
    - Wykonaj instrukcję z sekcji "Instrukcja listowanie zmian"
    - Wykonaj instrukcję z sekcji "Instrukcja commit"
    - Wykonaj instrukcję z sekcji "Instrukcja czy branch aktualny"
    - Wykonaj instrukcję z sekcji "Instrukcja push"
    - Wykonaj instrukcję z sekcji "Instrukcja tworzenie PR"

4. Przejdź do katalogu głównego REPO `cd [sciezka_do_REPO]`:
  - Sprawdź, czy są zmiany
  - Jeśli tak lub, jeśli były zmiany w SUB-REPO:
    - Wykonaj instrukcję z sekcji "Instrukcja czy master"
    - Wykonaj instrukcję z sekcji "Instrukcja listowanie zmian"
    - Wykonaj instrukcję z sekcji "Instrukcja commit"
    - Wykonaj instrukcję z sekcji "Instrukcja czy branch aktualny"
    - Wykonaj instrukcję z sekcji "Instrukcja dla podbijania wersji"
    - Wykonaj instrukcję z sekcji "Instrukcja push"
    - Wykonaj instrukcję z sekcji "Instrukcja tworzenie PR"
    - Wygeneruj podsumowanie z linkami do utworzonych PR na GitHub do REPO i SUB-REPO


## Instrukcja czy master

1. Sprawdź aktualną gałąź:
  - Jeśli jesteś na `master`, zaproponuj utworzenie nowej gałęzi:
    - `git checkout -b agent/[short_tempolary_name]`
    - Pozwól developerowi zmienić nazwę gałęzi, ale nie pozwalaj pominąć tego kroku


## Instrukcja listowanie zmian

1.  Wyświetl listę plików/folderów z modyfikacjami


## Instrukcja commit

1. Wykonaj commit:
  - `git add .`
  - `git commit -am "[short_description]"` (krótki opis zmian na podstawie diff)
  - Commit automatycznie uruchamia lint, prettier i check-types (lint-staged). Agent reaguje na błędy zgłoszone przez te narzędzia i proponuje poprawki.


## Instrukcja czy branch aktualny

1. Sprawdź, czy lokalny branch jest aktualny względem zdalnego:
  - Jeśli nie, wykonaj `git pull origin [current branch]`
  - W przypadku konfliktów zaproponuj poprawki
2. Sprawdź, czy gałąź jest aktualna względem mastera:
  - Jeśli nie, wykonaj `git pull origin master`
  - W przypadku konfliktów zaproponuj poprawki


## Instrukcja dla podbijania wersji

1. W pliku package.json podbij wersje
  - Zwiększ wersję o jeden patch względem wersji z mastera (np. "2.20.1" → "2.20.2")


## Instrukcja push

1. Zrób push na zdalne repozytorium, jeśli są zmiany:
  - `git push origin [current branch]`


## Instrukcja tworzenie PR

1. Utwórz GitHub Pull Request z aktualnej gałęzi do mastera (tylko jeśli są zmiany)


## TODO PUSH and other CI/CD
