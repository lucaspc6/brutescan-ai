const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");

const logsDir = path.join(__dirname, "logs");
const centralizadoDir = path.join(logsDir, "centralizado");
const centralLogPath = path.join(centralizadoDir, "log_geral.csv");
const porHorarioDir = path.join(logsDir, "por_horario");

function logSistema(msg) {
  const agora = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
  console.log(`[${agora}] [LOG-MANAGER] ${msg}`);
}

function verificarEstruturaLogs() {
  if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir);
  if (!fs.existsSync(centralizadoDir)) fs.mkdirSync(centralizadoDir);
  if (!fs.existsSync(porHorarioDir)) fs.mkdirSync(porHorarioDir);
}

// Formata um Date em "YYYY-MM-DD HH:mm:ss" no fuso desejado
function formatInTZ(date, timeZone) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  }).formatToParts(date);
  const map = {};
  for (const p of parts) map[p.type] = p.value;
  return `${map.year}-${map.month}-${map.day} ${map.hour}:${map.minute}:${map.second}`;
}

// Converte diferentes formatos de timestamp para "YYYY-MM-DD HH:mm:ss" em America/Sao_Paulo
function normalizeToLocalYMDhms(raw) {
  if (!raw) return null;
  const ts = String(raw).trim();

  // 1) Já no formato local "YYYY-MM-DD HH:mm" ou "YYYY-MM-DD HH:mm:ss"
  let m = ts.match(/^(\d{4}-\d{2}-\d{2}) (\d{2}):(\d{2})(?::(\d{2}))?$/);
  if (m) {
    const [_, ymd, hh, mm, ss] = m;
    return `${ymd} ${hh}:${mm}:${ss || "00"}`;
  }

  // 2) ISO (ex.: "2025-09-21T02:58:00.000Z" ou sem 'Z')
  //    -> interpretamos via Date e formatamos em America/Sao_Paulo
  if (/^\d{4}-\d{2}-\d{2}T/.test(ts)) {
    const d = new Date(ts);
    if (!isNaN(d)) return formatInTZ(d, "America/Sao_Paulo");
  }

  // 3) "M/D/YYYY HH:mm[:ss] AM/PM" (alguns CSVs/Excel)
  m = ts.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)$/i
  );
  if (m) {
    let [, M, D, Y, h, min, s, ampm] = m;
    let HH = parseInt(h, 10);
    if (ampm.toUpperCase() === "PM" && HH !== 12) HH += 12;
    if (ampm.toUpperCase() === "AM" && HH === 12) HH = 0;
    const y = String(Y);
    const mm = String(M).padStart(2, "0");
    const dd = String(D).padStart(2, "0");
    const hh = String(HH).padStart(2, "0");
    const ss = String(s || "00").padStart(2, "0");

    // Como não temos lib de TZ para construir "Date em TZ",
    // montamos diretamente a string local (já é o alvo).
    return `${y}-${mm}-${dd} ${hh}:${min}:${ss}`;
  }

  // 4) Tentativa genérica: new Date(ts) -> formata para America/Sao_Paulo
  const d = new Date(ts);
  if (!isNaN(d)) {
    return formatInTZ(d, "America/Sao_Paulo");
  }

  return null; // formato desconhecido
}

// Extrai {dataStr, hora} a partir do timestamp normalizado "YYYY-MM-DD HH:mm:ss"
function extrairChaveHoraLocal(tsLocal) {
  if (!tsLocal) return null;
  const m = tsLocal.match(/^(\d{4}-\d{2}-\d{2}) (\d{2}):\d{2}:\d{2}$/);
  if (!m) return null;
  const dataStr = m[1];
  const hora = m[2]; // já é HH (00..23)
  return { dataStr, hora };
}

function gerarLogsPorHora() {
  verificarEstruturaLogs();
  const logsPorHora = {};

  if (!fs.existsSync(centralLogPath)) {
    logSistema("Arquivo log_geral.csv não encontrado.");
    return;
  }

  fs.createReadStream(centralLogPath)
    .pipe(csv())
    .on("data", (row) => {
      try {
        const tsLocal = normalizeToLocalYMDhms(row.timestamp);
        const chave = extrairChaveHoraLocal(tsLocal);
        if (!chave) {
          logSistema("Timestamp inválido ou ausente. Linha ignorada.");
          return;
        }
        const { dataStr, hora } = chave;
        const key = `${dataStr}_${hora}`;
        if (!logsPorHora[key]) logsPorHora[key] = [];
        // Guardamos a versão normalizada para a saída nas partições
        logsPorHora[key].push({
          ...row,
          timestamp: tsLocal
        });
      } catch (err) {
        logSistema(`Erro ao processar linha: ${err.message}`);
      }
    })
    .on("end", () => {
      for (const key in logsPorHora) {
        const [dataStr, horaStr] = key.split("_");
        const pastaDia = path.join(porHorarioDir, dataStr);
        if (!fs.existsSync(pastaDia)) {
          fs.mkdirSync(pastaDia, { recursive: true });
          logSistema(`Pasta criada: ${pastaDia}`);
        }
        const nomeArquivo = `logs_${dataStr}_${horaStr.padStart(2, "0")}h.csv`;
        const caminhoArquivo = path.join(pastaDia, nomeArquivo);

        const linhas = logsPorHora[key];
        const conteudo = [
          "timestamp,email,success,ip,motivo_do_erro",
          ...linhas.map((l) =>
            `${(l.timestamp || "").trim()},${l.email || ""},${l.success || 0},${l.ip || ""},${(l.motivo_do_erro || "")
              .toString()
              .replace(/\r?\n/g, " ")}`
          ),
        ].join("\n");

        fs.writeFileSync(caminhoArquivo, conteudo, "utf-8");
        logSistema(`Arquivo gerado: ${caminhoArquivo} (${linhas.length} registros)`);
      }
      logSistema("Todos os arquivos por hora foram atualizados.");
    });
}

function iniciarMonitoramento() {
  verificarEstruturaLogs();
  if (fs.existsSync(centralLogPath)) {
    fs.watchFile(centralLogPath, { interval: 1000 }, (curr, prev) => {
      if (curr.mtime !== prev.mtime) {
        logSistema("Alteração detectada no log_geral.csv. Atualizando arquivos por hora...");
        gerarLogsPorHora();
      }
    });
    logSistema("Monitoramento iniciado.");
    gerarLogsPorHora();
  } else {
    logSistema("Aguardando criação do log_geral.csv...");
    const intervalo = setInterval(() => {
      if (fs.existsSync(centralLogPath)) {
        clearInterval(intervalo);
        iniciarMonitoramento();
      }
    }, 1000);
  }
}

iniciarMonitoramento();
