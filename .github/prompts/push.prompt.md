Wykonaj polecenia sekwencyjnie. Czekaj na zakończenie polecenia przed rozpoczęciem następnego.

## Polecenia
1. **Nie wolno** robić push do branch **master**.

2. Jeżeli są zmiany w plikach i jesteś na branch **master**, stworz nowy branch o nazwie `agent/[short_name]`, gdzie [short_name] to krótka losowa nazwa. Jeżeli nie jesteś na branch **master**, przejdź do następnego kroku.

3. Jeżeli są zmiany i nie jesteś już na **master**:
  - Wykonaj polecenie 
    ```bash
      git add . && git commit -am "[comment]"
    ```
    gdzie [comment] to krótki opis zmian, które zostały wprowadzone.
  - Wynikiem commit mogą być błędy lint, prettier i TypeScript. Jeżeli wystąpią, napraw je i wykonaj ponownie powyższe polecenie.
  - Wykonaj polecenie 
    ```bash
      git pull origin [current_branch]
    ```
    gdzie [current_branch] to nazwa aktualnego branch.
  - Jeżeli wystąpiły konflikty, rozwiąż je.
  - Wykonaj polecenie 
    ```bash
      git pull origin master
    ```
  - Jeżeli wystąpiły konflikty, rozwiąż je.

4. Wykonaj polecenie
  ```bash
    git push origin [current_branch]
  ```
  , gdzie [current_branch] to nazwa aktualnego branch.

5. Podsumuj operacje.
