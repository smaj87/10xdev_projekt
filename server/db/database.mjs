/**
 * Database connection and initialization
 * SQLite database wrapper using better-sqlite3
 */
import Database from 'better-sqlite3';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Database file path
const dbPath = join(__dirname, 'app.db');

// Initialize database connection
const db = new Database(dbPath, {
  verbose: null, // process.env.NODE_ENV === 'development' ? console.log : null, // eslint-disable-line no-console
});

// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL');

/**
 * Initialize database schema
 */
export function initializeDatabase() {
  // Create users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('user', 'admin')),
      is_blocked INTEGER NOT NULL DEFAULT 0 CHECK(is_blocked IN (0, 1)),
      theme TEXT CHECK(theme IN ('light', 'dark', 'system')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // Create indexes for users table
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
    CREATE INDEX IF NOT EXISTS idx_users_is_blocked ON users(is_blocked);
  `);

  // Create user_sessions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_sessions (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Create index for sessions
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON user_sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON user_sessions(expires_at);
  `);

  // Create error_logs table
  db.exec(`
    CREATE TABLE IF NOT EXISTS error_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      endpoint TEXT,
      method TEXT,
      status_code INTEGER,
      error_message TEXT,
      request_data TEXT,
      response_data TEXT,
      user_agent TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );
  `);

  // Create categories table
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      color TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // Create index for categories
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name);
  `);

  // Create lists table
  db.exec(`
    CREATE TABLE IF NOT EXISTS lists (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      owner_id INTEGER NOT NULL,
      category_id INTEGER,
      priority TEXT NOT NULL DEFAULT 'normal' CHECK(priority IN ('low', 'normal', 'high')),
      due_date TEXT,
      is_archived INTEGER NOT NULL DEFAULT 0 CHECK(is_archived IN (0, 1)),
      archived_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
    );
  `);

  // Create indexes for lists table
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_lists_owner_id ON lists(owner_id);
    CREATE INDEX IF NOT EXISTS idx_lists_category_id ON lists(category_id);
    CREATE INDEX IF NOT EXISTS idx_lists_is_archived ON lists(is_archived);
    CREATE INDEX IF NOT EXISTS idx_lists_archived_at ON lists(archived_at);
    CREATE INDEX IF NOT EXISTS idx_lists_priority ON lists(priority);
    CREATE INDEX IF NOT EXISTS idx_lists_due_date ON lists(due_date);
    CREATE INDEX IF NOT EXISTS idx_lists_created_at ON lists(created_at);
  `);

  // Create tasks table
  db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      list_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'todo' CHECK(status IN ('todo', 'in_progress', 'done')),
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (list_id) REFERENCES lists(id) ON DELETE CASCADE
    );
  `);

  // Create indexes for tasks table
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_tasks_list_id ON tasks(list_id);
    CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
    CREATE INDEX IF NOT EXISTS idx_tasks_sort_order ON tasks(sort_order);
    CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at);
  `);

  // Create collaborators table
  db.exec(`
    CREATE TABLE IF NOT EXISTS collaborators (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      list_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      role TEXT NOT NULL DEFAULT 'collaborator' CHECK(role IN ('collaborator')),
      added_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (list_id) REFERENCES lists(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(list_id, user_id)
    );
  `);

  // Create indexes for collaborators table
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_collaborators_list_id ON collaborators(list_id);
    CREATE INDEX IF NOT EXISTS idx_collaborators_user_id ON collaborators(user_id);
  `);

  // Create triggers for automatic updated_at timestamp
  db.exec(`
    CREATE TRIGGER IF NOT EXISTS update_users_timestamp
      AFTER UPDATE ON users
    BEGIN
      UPDATE users SET updated_at = datetime('now') WHERE id = NEW.id;
    END;
  `);

  db.exec(`
    CREATE TRIGGER IF NOT EXISTS update_lists_timestamp
      AFTER UPDATE ON lists
    BEGIN
      UPDATE lists SET updated_at = datetime('now') WHERE id = NEW.id;
    END;
  `);

  db.exec(`
    CREATE TRIGGER IF NOT EXISTS update_tasks_timestamp
      AFTER UPDATE ON tasks
    BEGIN
      UPDATE tasks SET updated_at = datetime('now') WHERE id = NEW.id;
    END;
  `);

  // Create trigger for setting archived_at when archiving lists
  db.exec(`
    CREATE TRIGGER IF NOT EXISTS set_archived_at
      AFTER UPDATE OF is_archived ON lists
      WHEN NEW.is_archived = 1 AND OLD.is_archived = 0
    BEGIN
      UPDATE lists SET archived_at = datetime('now') WHERE id = NEW.id;
    END;
  `);

  // Create trigger for automatic sort_order assignment
  db.exec(`
    CREATE TRIGGER IF NOT EXISTS set_task_sort_order
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
  `);
}

export default db;
