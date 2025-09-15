const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const session = require("express-session");
const { getUserByEmail } = require("./database");
const { parse } = require("json2csv");
const { exec } = require("child_process");

const app = express();
const PORT = 3000;

function formatarTimestampLocal() {
  const utcNow = new Date();
  const spNow = new Date(utcNow.getTime() - 3 * 60 * 60 * 1000); // UTC-3
  const ano = spNow.getFullYear();
  const mes = String(spNow.getMonth() + 1).padStart(2, "0");
  const dia = String(spNow.getDate()).padStart(2, "0");
  const hora = String(spNow.getHours()).padStart(2, "0");
  const minuto = String(spNow.getMinutes()).padStart(2, "0");
  return `${ano}-${mes}-${dia} ${hora}:${minuto}`;
}


function logSistema(msg) {
  const agora = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
  console.log(`[${agora}] [SISTEMA] ${msg}`);
}

function removerAcentos(str) {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

app.use(express.static(path.join(__dirname, "../frontend")));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || origin.startsWith("http://localhost")) {
      callback(null, true);
    } else {
      callback(new Error("CORS bloqueado para essa origem: " + origin));
    }
  },
  credentials: true
}));

app.set('trust proxy', true);

app.use(session({
  secret: 'segredo-super-seguro',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}));

const sessoesAtivas = {};
const logsDir = path.join(__dirname, "logs");
const centralizadoDir = path.join(logsDir, "centralizado");
const centralLogPath = path.join(centralizadoDir, "log_geral.csv");

function verificarEstruturaLogs() {
  if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir);
  if (!fs.existsSync(centralizadoDir)) fs.mkdirSync(centralizadoDir);
}

function formatarTimestampLocal() {
  const agora = new Date();
  return agora.toISOString().slice(0, 16).replace("T", " ");
}

function registrarLogCSV(req, email, sucesso, motivo) {
  verificarEstruturaLogs();

  let ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'IP_DESCONHECIDO';
  if (ip.includes(',')) ip = ip.split(',')[0];
  ip = ip.replace('::ffff:', '').trim();
  if (ip === '::1') ip = '127.0.0.1';

  const timestamp = formatarTimestampLocal();
  const motivoSanitizado = removerAcentos(motivo || "");

  const logEntry = {
    timestamp,
    email,
    success: sucesso ? 1 : 0,
    ip,
    motivo_do_erro: motivoSanitizado
  };

  const csv = parse([logEntry], { header: !fs.existsSync(centralLogPath) });
  fs.appendFileSync(centralLogPath, csv + "\n");
  logSistema(`Tentativa registrada: ${email} | Sucesso: ${logEntry.success} | IP: ${ip} | Motivo: ${motivoSanitizado || "N/A"}`);

  exec("node logManager.js", (error, stdout, stderr) => {
    if (error) logSistema(`Erro ao executar logManager.js: ${error.message}`);
    if (stderr) logSistema(`stderr: ${stderr}`);
    if (stdout) logSistema(`logManager.js executado: ${stdout.trim()}`);
  });
}

app.post("/login", async (req, res) => {
  const { email, senha } = req.body || {};

  if (!email || !senha) {
    logSistema("Tentativa de login com corpo ausente ou incompleto.");
    registrarLogCSV(req, email || "desconhecido", false, "Email ou senha ausente");
    return res.status(400).json({ mensagem: "Email e senha são obrigatórios." });
  }

  try {
    const usuario = await getUserByEmail(email);

    if (!usuario || usuario.senha !== senha) {
      logSistema(`Tentativa de login com credenciais inválidas: ${email}`);
      registrarLogCSV(req, email, false, "Credenciais invalidas");
      return res.status(401).json({ mensagem: "Credenciais inválidas." });
    }

    if (!req.session) {
      logSistema("Sessão não inicializada.");
      registrarLogCSV(req, email, false, "Sessao nao disponivel");
      return res.status(500).json({ mensagem: "Sessão não disponível." });
    }

    if (sessoesAtivas[email]) {
      logSistema(`Tentativa de login com usuário já logado: ${email}`);
      registrarLogCSV(req, email, false, "Usuario ja logado");
      return res.status(403).json({ mensagem: "Usuário já está logado em outro local." });
    }

    req.session.email = email;
    sessoesAtivas[email] = req.sessionID;

    registrarLogCSV(req, email, true, "");
    return res.status(200).json({ mensagem: "Login bem-sucedido!" });
  } catch (err) {
    logSistema(`Erro ao fazer login: ${err.message}`);
    registrarLogCSV(req, email || "erro", false, "Erro interno no servidor");
    return res.status(500).json({ mensagem: "Erro no servidor." });
  }
});

app.post("/logout", (req, res) => {
  if (!req.session) {
    logSistema("Sessão não disponível para logout.");
    return res.status(500).json({ mensagem: "Sessão não disponível." });
  }

  const email = req.session?.email;

  if (email && sessoesAtivas[email] === req.sessionID) {
    delete sessoesAtivas[email];
  }

  req.session.destroy(err => {
    if (err) {
      logSistema("Erro ao encerrar a sessão.");
      return res.status(500).json({ mensagem: "Erro ao encerrar a sessão." });
    }
    res.clearCookie("connect.sid");
    logSistema(`Logout realizado: ${email}`);
    return res.status(200).json({ mensagem: "Logout bem-sucedido." });
  });
});

app.get("/verificar", (req, res) => {
  const email = req.session?.email;
  if (!email || sessoesAtivas[email] !== req.sessionID) {
    return res.status(401).json({ mensagem: "Não autenticado." });
  }
  return res.status(200).json({ mensagem: `Você está logado como ${email}.` });
});

app.listen(PORT, () => {
  logSistema(`Servidor rodando em http://localhost:${PORT}`);
  verificarEstruturaLogs();

  if (fs.existsSync(centralLogPath)) {
    logSistema("Arquivo log_geral.csv encontrado. Executando logManager.js...");
    exec("node logManager.js", (error, stdout, stderr) => {
      if (error) logSistema(`Erro ao executar logManager.js: ${error.message}`);
      if (stderr) logSistema(`stderr: ${stderr}`);
      if (stdout) logSistema(`logManager.js executado: ${stdout.trim()}`);
    });
  }
});
