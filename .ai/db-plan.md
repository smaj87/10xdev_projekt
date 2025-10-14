# Schemat bazy danych SQLite 3 - Tasks App

## 1. Tabele z kolumnami, typami danych i ograniczeniami

### users
```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    is_blocked BOOLEAN NOT NULL DEFAULT FALSE,
    theme TEXT DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### categories
```sql
CREATE TABLE categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    color TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### lists
```sql
CREATE TABLE lists (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    owner_id INTEGER NOT NULL,
    category_id INTEGER,
    priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high')),
    due_date DATE,
    is_archived BOOLEAN NOT NULL DEFAULT FALSE,
    archived_at DATETIME,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);
```

### tasks
```sql
CREATE TABLE tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    list_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (list_id) REFERENCES lists(id) ON DELETE CASCADE
);
```

### list_collaborators
```sql
CREATE TABLE list_collaborators (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    list_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    role TEXT NOT NULL DEFAULT 'collaborator' CHECK (role IN ('collaborator')),
    added_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (list_id) REFERENCES lists(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(list_id, user_id)
);
```

### error_logs
```sql
CREATE TABLE error_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    endpoint TEXT NOT NULL,
    method TEXT NOT NULL,
    status_code INTEGER NOT NULL,
    error_message TEXT,
    request_data TEXT,
    response_data TEXT,
    user_agent TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);
```

### user_sessions
```sql
CREATE TABLE user_sessions (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

## 2. Relacje między tabelami

### Relacje jeden-do-wielu:
- **users -> lists**: Jeden użytkownik może mieć wiele list (owner_id)
- **users -> error_logs**: Jeden użytkownik może mieć wiele logów błędów
- **users -> user_sessions**: Jeden użytkownik może mieć wiele aktywnych sesji
- **categories -> lists**: Jedna kategoria może być przypisana do wielu list
- **lists -> tasks**: Jedna lista może zawierać wiele zadań
- **lists -> list_collaborators**: Jedna lista może mieć wielu współpracowników

### Relacje wiele-do-wielu:
- **users <-> lists**: Użytkownicy mogą współpracować przy wielu listach (tabela łącząca: list_collaborators)

## 3. Indeksy

```sql
-- Indeksy dla wydajności zapytań
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_is_blocked ON users(is_blocked);

CREATE INDEX idx_lists_owner_id ON lists(owner_id);
CREATE INDEX idx_lists_category_id ON lists(category_id);
CREATE INDEX idx_lists_is_archived ON lists(is_archived);
CREATE INDEX idx_lists_archived_at ON lists(archived_at);
CREATE INDEX idx_lists_priority ON lists(priority);
CREATE INDEX idx_lists_due_date ON lists(due_date);
CREATE INDEX idx_lists_created_at ON lists(created_at);

CREATE INDEX idx_tasks_list_id ON tasks(list_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_sort_order ON tasks(sort_order);
CREATE INDEX idx_tasks_created_at ON tasks(created_at);

CREATE INDEX idx_list_collaborators_list_id ON list_collaborators(list_id);
CREATE INDEX idx_list_collaborators_user_id ON list_collaborators(user_id);

CREATE INDEX idx_error_logs_user_id ON error_logs(user_id);
CREATE INDEX idx_error_logs_status_code ON error_logs(status_code);
CREATE INDEX idx_error_logs_created_at ON error_logs(created_at);
CREATE INDEX idx_error_logs_endpoint ON error_logs(endpoint);

CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_expires_at ON user_sessions(expires_at);
```

## 4. Triggery SQLite 3

```sql
-- Trigger do automatycznego ustawiania updated_at
CREATE TRIGGER update_users_timestamp 
    AFTER UPDATE ON users
BEGIN
    UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER update_lists_timestamp 
    AFTER UPDATE ON lists
BEGIN
    UPDATE lists SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER update_tasks_timestamp 
    AFTER UPDATE ON tasks
BEGIN
    UPDATE tasks SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Trigger do ustawiania archived_at przy archiwizacji
CREATE TRIGGER set_archived_at 
    AFTER UPDATE OF is_archived ON lists
    WHEN NEW.is_archived = TRUE AND OLD.is_archived = FALSE
BEGIN
    UPDATE lists SET archived_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Trigger do automatycznego sortowania zadań
CREATE TRIGGER set_task_sort_order
    AFTER INSERT ON tasks
    WHEN NEW.sort_order = 0
BEGIN
    UPDATE tasks 
    SET sort_order = (
        SELECT COALESCE(MAX(sort_order), 0) + 1 
        FROM tasks 
        WHERE list_id = NEW.list_id AND id != NEW.id
    )
    WHERE id = NEW.id;
END;
```

## 5. Dane inicjalne

```sql
-- Podstawowe kategorie
INSERT INTO categories (name, color) VALUES
    ('Praca', '#3B82F6'),
    ('Dom', '#10B981'),
    ('Zakupy', '#F59E0B'),
    ('Osobiste', '#8B5CF6'),
    ('Zdrowie', '#EF4444'),
    ('Edukacja', '#06B6D4');
```

## 6. Uwagi dotyczące decyzji projektowych

### Bezpieczeństwo:
- Hasła przechowywane jako hash (implementacja w aplikacji)
- Sesje użytkowników z automatycznym wygasaniem
- Logowanie błędów dla celów diagnostycznych

### Wydajność:
- Indeksy na kluczowych polach do filtrowania i sortowania
- Soft delete dla list (is_archived) zamiast fizycznego usuwania
- Automatyczne zarządzanie sort_order dla zadań

### Skalowalność:
- Struktura pozwala na łatwe dodanie nowych funkcji
- Relacje zaprojektowane zgodnie z 3NF
- Możliwość rozszerzenia ról użytkowników

### Funkcjonalności biznesowe:
- Wsparcie dla współpracy (list_collaborators)
- Kategoryzacja list z predefiniowanymi kategoriami
- Priorytetyzacja i terminy wykonania
- System logowania błędów dla monitorowania
- Archiwizacja z automatycznym timestampem

### Ograniczenia SQLite 3:
- Brak natywnych typów ENUM - zastąpione CHECK constraints
- Triggery używane do automatyzacji procesów
- Indeksy optymalizowane pod zapytania aplikacji
