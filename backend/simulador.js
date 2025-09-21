const sqlite3 = require("sqlite3").verbose();
const axios = require("axios");
const { randomUUID } = require("crypto");

const DB_PATH = "./banco.db";
const BASE_URL = "http://localhost:3000";

const SIMULATED_IPS = [
  "192.168.0.101", "192.168.0.102", "192.168.0.103",
  "10.0.0.1", "172.16.0.5", "127.0.0.1"
];

function obterUsuarios() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB_PATH, sqlite3.OPEN_READONLY, (err) => {
      if (err) return reject(err);
    });

    db.all("SELECT email, senha FROM usuarios", [], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
      db.close();
    });
  });
}

async function simularLogin(email, senha, ip, session = axios.create()) {
  try {
    const response = await session.post(`${BASE_URL}/login`, {
      email,
      senha
    }, {
      headers: {
        "X-Forwarded-For": ip
      },
      withCredentials: true
    });

    console.log(`[${ip}] Login: ${email} | ${response.status} | ${response.data.mensagem}`);
    return session;
  } catch (err) {
    console.log(`[${ip}] Falha: ${email} | ${err.response?.status} | ${err.response?.data?.mensagem}`);
    return null;
  }
}

async function simularLogout(session, ip) {
  try {
    const response = await session.post(`${BASE_URL}/logout`, {}, {
      headers: {
        "X-Forwarded-For": ip
      },
      withCredentials: true
    });
    console.log(`[${ip}] Logout | ${response.status} | ${response.data.mensagem}`);
  } catch (err) {
    console.log(`[${ip}] Falha no logout | ${err.response?.status}`);
  }
}

async function executarSimulacoes() {
  const usuarios = await obterUsuarios();
  if (!usuarios.length) {
    console.log("Nenhum usuário encontrado.");
    return;
  }

  for (let i = 0; i < 20; i++) {
    const ip = SIMULATED_IPS[Math.floor(Math.random() * SIMULATED_IPS.length)];
    let { email, senha } = usuarios[Math.floor(Math.random() * usuarios.length)];

    if (i % 5 === 0) senha = "senha_errada";
    if (i % 7 === 0) email = `fake${randomUUID().slice(0, 5)}@teste.com`;

    const sessao = await simularLogin(email, senha, ip);

    if (sessao) {
      await new Promise(r => setTimeout(r, 500));
      await simularLogin(email, senha, ip, sessao);
      await new Promise(r => setTimeout(r, 500));
      await simularLogout(sessao, ip);
    }

    await new Promise(r => setTimeout(r, 300));
  }
}

executarSimulacoes();
