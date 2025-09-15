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

function ajustarFusoHorario(timestampStr) {
  try {
    const dt = new Date(timestampStr);
    const spTime = new Date(dt.getTime() - 3 * 60 * 60 * 1000); // UTC-3
    return spTime;
  } catch {
    return null;
  }
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
        const dateObj = ajustarFusoHorario(row.timestamp);
        if (!dateObj || isNaN(dateObj.getTime())) {
          logSistema("Timestamp inválido ou ausente. Linha ignorada.");
          return;
        }

        const ano = dateObj.getFullYear();
        const mes = String(dateObj.getMonth() + 1).padStart(2, "0");
        const dia = String(dateObj.getDate()).padStart(2, "0");
        const hora = String(dateObj.getHours()).padStart(2, "0");

        const dataStr = `${ano}-${mes}-${dia}`;
        const chave = `${dataStr}_${hora}`;
        if (!logsPorHora[chave]) logsPorHora[chave] = [];
        logsPorHora[chave].push(row);
      } catch (err) {
        logSistema(`Erro ao processar linha: ${err.message}`);
      }
    })
    .on("end", () => {
      for (const chave in logsPorHora) {
        const [dataStr, horaStr] = chave.split("_");
        const pastaDia = path.join(porHorarioDir, dataStr);
        if (!fs.existsSync(pastaDia)) {
          fs.mkdirSync(pastaDia, { recursive: true });
          logSistema(`Pasta criada: ${pastaDia}`);
        }

        const nomeArquivo = `logs_${dataStr}_${horaStr}h.csv`;
        const caminhoArquivo = path.join(pastaDia, nomeArquivo);

        const linhas = logsPorHora[chave];
        const conteudo = [
          "timestamp,email,success,ip,motivo_do_erro",
          ...linhas.map(l => `${l.timestamp},${l.email},${l.success},${l.ip},${l.motivo_do_erro || ""}`)
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
