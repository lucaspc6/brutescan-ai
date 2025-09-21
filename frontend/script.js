// frontend/script.js

// Este arquivo assume que é carregado com `defer` no index.html.
// Assim, o DOM já estará parseado quando o código for executado.

window.addEventListener("DOMContentLoaded", async () => {
  const $ = (id) => document.getElementById(id);

  // Cache de elementos (com checagem defensiva)
  const el = {
    loginForm: $("loginForm"),
    email: $("email"),
    senha: $("senha"),
    mensagem: $("mensagem"),
    bemVindo: $("bemVindo"),
    tituloLogin: $("tituloLogin"),
    logoutBtn: $("logoutBtn"),
    criarUsuariosBtn: $("criarUsuariosBtn"),
    simularLoginsBtn: $("simularLoginsBtn"),
  };

  // Helpers de UI (com null-safety)
  function mostrarTelaBemVindo() {
    if (el.loginForm) el.loginForm.style.display = "none";
    if (el.bemVindo) el.bemVindo.style.display = "block";
    if (el.tituloLogin) el.tituloLogin.style.display = "none";
    if (el.mensagem) el.mensagem.textContent = "";
  }

  function mostrarTelaLogin() {
    if (el.loginForm) el.loginForm.style.display = "block";
    if (el.bemVindo) el.bemVindo.style.display = "none";
    if (el.tituloLogin) el.tituloLogin.style.display = "block";
    if (el.mensagem) el.mensagem.textContent = "";
    if (el.email) el.email.value = "";
    if (el.senha) el.senha.value = "";
  }

  // 1) Verifica sessão e lê feature flags
  try {
    // Usando endpoints relativos, o backend (mesmo host) responde sem CORS
    const resposta = await fetch("/verificar", {
      method: "GET",
      credentials: "include",
    });
    if (resposta.ok) {
      mostrarTelaBemVindo();
    } else {
      mostrarTelaLogin();
    }

    const configRes = await fetch("/config");
    const config = await configRes.json();

    if (config?.feature_criar_usuarios_random && el.criarUsuariosBtn) {
      el.criarUsuariosBtn.style.display = "block";
    }
    if (config?.feature_simulador_login && el.simularLoginsBtn) {
      el.simularLoginsBtn.style.display = "block";
    }
  } catch (err) {
    console.error("Erro ao verificar sessão ou config:", err);
    // Não altera a UI aqui; o usuário ainda pode tentar logar se o backend subir depois.
  }

  // 2) Listeners (só se os elementos existem)
  if (el.loginForm) {
    el.loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = el.email?.value ?? "";
      const senha = el.senha?.value ?? "";

      try {
        const resposta = await fetch("/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email, senha }),
        });

        const data = await resposta.json().catch(() => ({}));

        if (resposta.ok) {
          if (el.mensagem) el.mensagem.textContent = "";
          mostrarTelaBemVindo();
        } else {
          if (el.mensagem) {
            el.mensagem.style.color = "red";
            el.mensagem.textContent = data?.mensagem || "Falha no login.";
          }
        }
      } catch (erro) {
        if (el.mensagem) el.mensagem.textContent = "Erro ao conectar com servidor.";
      }
    });
  }

  if (el.logoutBtn) {
    el.logoutBtn.addEventListener("click", async () => {
      try {
        const resposta = await fetch("/logout", {
          method: "POST",
          credentials: "include",
        });
        if (resposta.ok) {
          mostrarTelaLogin();
        }
      } catch (erro) {
        console.error("Erro ao fazer logout:", erro);
      }
    });
  }

  if (el.criarUsuariosBtn) {
    el.criarUsuariosBtn.addEventListener("click", async () => {
      try {
        const resposta = await fetch("/criar-usuarios-random", { method: "POST" });
        alert(resposta.ok ? "Usuários aleatórios criados com sucesso!" : "Erro ao criar usuários.");
      } catch (erro) {
        console.error("Erro ao criar usuários:", erro);
      }
    });
  }

  if (el.simularLoginsBtn) {
    el.simularLoginsBtn.addEventListener("click", async () => {
      try {
        const resposta = await fetch("/simular-logins", { method: "POST" });
        alert(resposta.ok ? "Simulação de logins concluída!" : "Erro ao executar simulação.");
      } catch (erro) {
        console.error("Erro ao simular logins:", erro);
      }
    });
  }
});
