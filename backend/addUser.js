// backend/addUser.js

const { db } = require("./database");

const email = process.argv[2];
const senha = process.argv[3];

if (!email || !senha) {
  console.log("Uso: node addUser.js <email> <senha>");
  process.exit(1);
}

db.run(
  "INSERT INTO usuarios (email, senha) VALUES (?, ?)",
  [email, senha],
  function (err) {
    if (err) {
      if (err.message.includes("UNIQUE")) {
        console.error("Erro: este email já está cadastrado.");
      } else {
        console.error("Erro ao inserir usuário:", err.message);
      }
    } else {
      console.log(`Usuário ${email} inserido com sucesso (ID ${this.lastID})`);
    }
    db.close();
  }
);
