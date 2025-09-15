// backend/database.js

const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.join(__dirname, "banco.db");
const db = new sqlite3.Database(dbPath);

// Cria a tabela se não existir
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      senha TEXT NOT NULL
    )
  `);
});

// Função para buscar usuário por e-mail
function getUserByEmail(email) {
  return new Promise((resolve, reject) => {
    db.get("SELECT * FROM usuarios WHERE email = ?", [email], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

module.exports = {
  db,
  getUserByEmail
};