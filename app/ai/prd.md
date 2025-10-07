# Dokument wymagań produktu (PRD) - Tasks

## 1. Przegląd produktu
Aplikacja "Tasks" to proste narzędzie webowe do tworzenia i zarządzania listami TODO. Umożliwia użytkownikom generowanie wielu list zadań, przypisywanie priorytetów, terminów i kategorii oraz filtrowanie i sortowanie elementów. Dodatkowo wspiera współdzielenie list z innymi użytkownikami w czasie rzeczywistym oraz wybór trybu jasnego i ciemnego. Interfejs jest zoptymalizowany pod przeglądarki desktopowe (>=1024px) i synchronizuje zmiany automatycznie w tle.

## 2. Problem użytkownika
Użytkownicy gubią się w dużej liczbie zadań do wykonania: trudno śledzić, co zostało zrobione, co jest w trakcie i co wymaga uwagi. Brak centralnej, uporządkowanej przestrzeni do zarządzania listami, kategoryzowania i szybkiego filtrowania zwiększa ryzyko pominięcia ważnych zadań.

## 3. Wymagania funkcjonalne
1. Autoryzacja i uwierzytelnianie:
   - rejestracja, logowanie, wylogowanie
   - role: zwykły użytkownik, administrator
2. Zarządzanie listami:
   - tworzenie, edycja
   - przeglądanie list aktywnych i archiwalnych (archiwalne widoczne 3 miesiące)
   - archiwizacja list
   - priorytet (domyślny: normalny), termin (opcjonalny)
   - kategorie (np. praca, dom, zakupy)
   - filtrowanie i sortowanie po kategorii, priorytecie, terminie
3. Zarządzanie zadaniami:
   - dodawanie, edytowanie, usuwanie pozycji
   - status: niezrobione, w trakcie, zrobione
   - filtrowanie po statusie
   - zadania posortowane wg dodania z możliwością zmiany kolejności (przeciągnij i upuść)
4. Współdzielenie i synchronizacja:
   - zapraszanie innych użytkowników do listy
   - uprawnienia współwłaściciela (edycja i usuwanie zadań)
   - współwłaściciel nie może usuwać list, zarządzają wyłącznie zadaniami w liście
   - synchronizacja w czasie rzeczywistym przez WebSocket
5. Interfejs użytkownika:
   - responsywny desktop (>=1024px)
   - tryb jasny / ciemny
   - kolory przewodnie UI
   - operacje atomowe z natychmiastowym synchronizowaniem zmian
   - obsługa błędów synchronizacji (komunikat i możliwość przeładowania listy)
6. Monitorowanie i logowanie błędów:
   - rejestrowanie odpowiedzi API innych niż 2xx w bazie danych
   - wyświetlanie użytkownikowi komunikatu o błędzie
7. Panel administratora:
   - zarządzanie kontami użytkowników (dodawanie, blokowanie, zmiana roli)
   - zarządzanie archiwalnymi listami (edycja, usuwanie)

## 4. Granice produktu
Wersja MVP nie obejmuje:
- integracji z kalendarzami czy email
- powiadomień i przypomnień
- aplikacji mobilnych
- zaawansowanej analityki i raportowania
- uwierzytelniania dwuskładnikowego czy innych zaawansowanych zabezpieczeń
- obsługi wielu języków
- panelu administracyjnego do zarządzania treścią (poza kontami i archiwami)
- rozbudowanej personalizacji (poza jasnym/ciemnym trybem)

## 5. Historyjki użytkowników
US-001
Tytuł: Rejestracja nowego konta
Opis: Jako nowy użytkownik chcę się zarejestrować, aby móc tworzyć i zarządzać swoimi listami TODO.
Kryteria akceptacji:
- formularz z polami email i hasło
- walidacja email i hasła (min. 8 znaków)
- po rejestracji użytkownik jest zalogowany i przekierowany do pulpitu

US-002
Tytuł: Logowanie i wylogowanie
Opis: Jako zarejestrowany użytkownik chcę się logować i wylogowywać, aby kontrolować dostęp do mojego konta.
Kryteria akceptacji:
- logowanie przy użyciu email i hasła
- przy nieprawidłowych danych komunikat o błędzie
- po wylogowaniu dostęp do stron chronionych jest zabroniony

US-003
Tytuł: Tworzenie listy TODO
Opis: Jako użytkownik chcę stworzyć nową listę, aby grupować zadania według tematu.
Kryteria akceptacji:
- możliwość podania nazwy listy
- lista pojawia się w sekcji aktywnych list

US-004
Tytuł: Przeglądanie list aktywnych i archiwalnych
Opis: Jako użytkownik chcę zobaczyć moje listy aktywne i archiwalne, aby zarządzać przeszłymi zadaniami.
Kryteria akceptacji:
- dwie zakładki: aktywne i archiwalne
- archiwalne widoczne tylko przez 3 miesiące od archiwizacji

US-005
Tytuł: Dodawanie pozycji do listy
Opis: Jako użytkownik chcę dodać nowe zadanie do listy, aby śledzić swoje obowiązki.
Kryteria akceptacji:
- pole tekstowe i przycisk dodaj
- zadanie pojawia się natychmiast w widoku listy

US-006
Tytuł: Edycja zadania
Opis: Jako użytkownik chcę edytować opis zadania, aby poprawić lub rozszerzyć treść.
Kryteria akceptacji:
- możliwość edycji treści zadania w miejscu
- zmiany od razu widoczne

US-007
Tytuł: Usuwanie zadania
Opis: Jako użytkownik chcę usunąć niepotrzebne zadanie, aby utrzymać porządek.
Kryteria akceptacji:
- przycisk usuń przy pozycji zadania
- potwierdzenie usunięcia (opcjonalne)
- zadanie znika z listy

US-008
Tytuł: Zmiana statusu zadania
Opis: Jako użytkownik chcę oznaczyć zadanie jako niezrobione, w trakcie lub zrobione.
Kryteria akceptacji:
- kontrolka statusu przy zadaniu
- wizualne rozróżnienie statusu

US-009
Tytuł: Ustawianie priorytetu i terminu
Opis: Jako użytkownik chcę przypisać priorytet i termin do listy, aby lepiej organizować pracę.
Kryteria akceptacji:
- możliwość wyboru priorytetu: niski, normalny, wysoki
- wybór daty terminu
- wartości domyślne: normalny, brak terminu

US-010
Tytuł: Przypisywanie kategorii
Opis: Jako użytkownik chcę kategoryzować listy (praca, dom, zakupy), aby filtrować je tematycznie.
Kryteria akceptacji:
- lista predefiniowanych kategorii
- listy mają opcjonalne pole kategoria

US-011
Tytuł: Filtrowanie i sortowanie list
Opis: Jako użytkownik chcę filtrować i sortować listy po kategorii, priorytecie i terminie.
Kryteria akceptacji:
- filtry i sortowanie dostępne w UI
- widok odświeża się po zmianie kryteriów

US-012
Tytuł: Filtrowanie i sortowanie zadań
Opis: Jako użytkownik chcę filtrować zadania po statusie i sortować zgodnie z wolą użytkownika.
Kryteria akceptacji:
- filtry i sortowanie dostępne w UI
- widok odświeża się po zmianie kryteriów
- sortowanie zgodne z dodawaniem (domyślnie) z możliwością zmiany kolejności przez przeciągnij i upuść

US-013
Tytuł: Archiwizacja listy
Opis: Jako użytkownik chcę zarchiwizować ukończoną listę, aby ukryć ją z widoku aktywnych.
Kryteria akceptacji:
- przycisk archiwizuj na liście
- po archiwizacji lista przenosi się do zakładki archiwalnych

US-014
Tytuł: Współdzielenie listy
Opis: Jako użytkownik chcę zaprosić innych do zarządzania moją listą, aby wspólnie pracować.
Kryteria akceptacji:
- możliwość dodawania adresu email współużytkownika
- email musi być zarejestrowany w systemie
- zaproszony uzyskuje uprawnienia współwłaściciela
- współwłaściciel może dodawać, edytować, usuwać zadania, ale nie może archiwizować listy
- lista pojawia się w widoku współużytkownika

US-015
Tytuł: Synchronizacja w czasie rzeczywistym
Opis: Jako współużytkownik listy chcę widzieć zmiany innych użytkowników na żywo.
Kryteria akceptacji:
- użycie WebSocket do pushowania zmian
- interfejs automatycznie aktualizuje widok listy

US-016
Tytuł: Wybór trybu jasnego/ciemnego
Opis: Jako użytkownik chcę wybrać tryb interfejsu, który lepiej mi odpowiada.
Kryteria akceptacji:
- przełącznik trybu w ustawieniach
- ustawienie zapisane między sesjami
- domyślny tryb zgodny z preferencjami systemu operacyjnego
- kolory przewodnie UI dostosowane do obu trybów

US-017
Tytuł: Obsługa błędów synchronizacji
Opis: Jako użytkownik chcę być powiadomiony o błędzie synchronizacji, by móc odświeżyć listę.
Kryteria akceptacji:
- wykrywanie odpowiedzi API != 2xx
- wyświetlenie komunikatu z opcją odświeżenia

US-018
Tytuł: Logowanie błędów w bazie
Opis: Jako zespół wsparcia chcemy rejestrować błędne odpowiedzi API, aby analizować problemy.
Kryteria akceptacji:
- każda odpowiedź != 2xx jest zapisywana w bazie z timestampem i userId

US-019
Tytuł: Zarządzanie użytkownikami przez administratora
Opis: Jako administrator chcę dodawać/blokować/odblokowywać konta i zmieniać role.
Kryteria akceptacji:
- panel admina z listą użytkowników
- funkcje blokowania, odblokowania i zmiany roli

US-020
Tytuł: Zarządzanie archiwalnymi listami przez administratora
Opis: Jako administrator chcę usuwać archiwalne listy.
Kryteria akceptacji:
- widok archiwalnych list w panelu admina
- usunięcia listy
- możliwość filtrowania list po użytkowniku i dacie archiwizacji

## 6. Metryki sukcesu
- stabilność: wskaźnik błędnych operacji UI < 1% (monitorowane przez logi frontend)
- niezawodność synchronizacji: odsetek odpowiedzi API poza 2xx < 0,5%
- użyteczność: co najmniej 50% aktywnych użytkowników dokonuje zmian w swoich listach przynajmniej raz w tygodniu
