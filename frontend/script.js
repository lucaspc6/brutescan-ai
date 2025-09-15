// Verifica se já há uma sessão ativa ao carregar a página
window.addEventListener("DOMContentLoaded", async () => {
  try {
    const resposta = await fetch("http://localhost:3000/verificar", {
      method: "GET",
      credentials: "include"
    });

    if (resposta.ok) {
      mostrarTelaBemVindo();
    } else {
      mostrarTelaLogin();
    }
  } catch (err) {
    console.error("Erro ao verificar sessão:", err);
  }
});

document.getElementById("loginForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const email = document.getElementById("email").value;
  const senha = document.getElementById("senha").value;

  try {
    const resposta = await fetch("http://localhost:3000/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, senha })
    });

    const data = await resposta.json();
    const mensagemEl = document.getElementById("mensagem");

    if (resposta.ok) {
      mensagemEl.textContent = "";
      mostrarTelaBemVindo();
    } else {
      mensagemEl.style.color = "red";
      mensagemEl.textContent = data.mensagem;
    }

  } catch (erro) {
    document.getElementById("mensagem").textContent = "Erro ao conectar com servidor.";
  }
});

document.getElementById("logoutBtn").addEventListener("click", async function () {
  try {
    const resposta = await fetch("http://localhost:3000/logout", {
      method: "POST",
      credentials: "include"
    });

    if (resposta.ok) {
      mostrarTelaLogin();
    }
  } catch (erro) {
    console.error("Erro ao fazer logout:", erro);
  }
});

// Funções utilitárias para exibir UI
function mostrarTelaBemVindo() {
  document.getElementById("loginForm").style.display = "none";
  document.getElementById("bemVindo").style.display = "block";
  document.getElementById("mensagem").textContent = "";
} 

function mostrarTelaLogin() {
  document.getElementById("loginForm").style.display = "block";
  document.getElementById("bemVindo").style.display = "none";
  document.getElementById("mensagem").textContent = "";
  document.getElementById("email").value = "";
  document.getElementById("senha").value = "";
}