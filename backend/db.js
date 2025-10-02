import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

let dbInstance = null

export function getDb() {
  if (dbInstance) return dbInstance
  // Resolve to the directory of this file so DB lives at backend/data.sqlite
  const __dirname = path.dirname(fileURLToPath(import.meta.url))
  const dbPath = path.resolve(__dirname, 'data.sqlite')
  const dir = path.dirname(dbPath)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  const db = new Database(dbPath)
  db.pragma('journal_mode = WAL')

  db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS conversations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    conversation_id INTEGER NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY(conversation_id) REFERENCES conversations(id)
  );
  `)

  dbInstance = db
  return db
}

export function createConversationIfNeeded(userId, title = 'New chat') {
  const db = getDb()
  const stmt = db.prepare('INSERT INTO conversations (user_id, title) VALUES (?, ?)')
  const info = stmt.run(userId, title)
  return info.lastInsertRowid
}

export function addMessage(conversationId, role, content) {
  const db = getDb()
  const stmt = db.prepare('INSERT INTO messages (conversation_id, role, content) VALUES (?, ?, ?)')
  stmt.run(conversationId, role, content)
}

export function listConversations(userId, limit = 20) {
  const db = getDb()
  const rows = db.prepare('SELECT id, title, created_at FROM conversations WHERE user_id = ? ORDER BY id DESC LIMIT ?').all(userId, limit)
  return rows
}

export function getConversationMessages(conversationId, limit = 200) {
  const db = getDb()
  const rows = db.prepare('SELECT role, content, created_at FROM messages WHERE conversation_id = ? ORDER BY id ASC LIMIT ?').all(conversationId, limit)
  return rows
}
