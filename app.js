// Chave usada para simular uma sessão local, sem backend.
const SESSION_KEY = "carteirinha_fesn_sessao";

const telas = {
  login: document.querySelector("#loginView"),
  credencial: document.querySelector("#credentialView"),
};

const formulario = document.querySelector("#loginForm");
const campoDocumento = document.querySelector("#documento");
const campoSenha = document.querySelector("#senha");
const mensagemErro = document.querySelector("#loginError");
const botaoLogout = document.querySelector("#logoutButton");

document.addEventListener("DOMContentLoaded", iniciarApp);

function iniciarApp() {
  registrarServiceWorker();
  configurarEventos();

  if (temSessaoAtiva()) {
    mostrarCredencial();
    return;
  }

  mostrarLogin();
}

function configurarEventos() {
  formulario.addEventListener("submit", entrar);
  botaoLogout.addEventListener("click", sair);
  window.addEventListener("hashchange", sincronizarRota);
}

function entrar(evento) {
  evento.preventDefault();

  const documento = campoDocumento.value.trim();
  const senha = campoSenha.value.trim();

  limparErro();

  if (!documento || !senha) {
    mostrarErro("Preencha o CPF ou código de uso e a senha para entrar.");
    return;
  }

  const sessao = {
    autenticado: true,
    documento,
    criadoEm: new Date().toISOString(),
  };

  localStorage.setItem(SESSION_KEY, JSON.stringify(sessao));
  formulario.reset();
  mostrarCredencial();
}

function sair() {
  localStorage.removeItem(SESSION_KEY);
  mostrarLogin();
}

function temSessaoAtiva() {
  try {
    const sessao = JSON.parse(localStorage.getItem(SESSION_KEY));
    return Boolean(sessao && sessao.autenticado);
  } catch (erro) {
    localStorage.removeItem(SESSION_KEY);
    return false;
  }
}

function sincronizarRota() {
  if (window.location.hash === "#credencial" && temSessaoAtiva()) {
    alternarTela("credencial", false);
    return;
  }

  if (!temSessaoAtiva()) {
    alternarTela("login", false);
  }
}

function mostrarLogin() {
  alternarTela("login", true);
  campoDocumento.focus();
}

function mostrarCredencial() {
  alternarTela("credencial", true);
}

function alternarTela(nomeTela, atualizarHash) {
  const abrirCredencial = nomeTela === "credencial";

  telas.login.classList.toggle("hidden", abrirCredencial);
  telas.credencial.classList.toggle("hidden", !abrirCredencial);

  document.title = abrirCredencial
    ? "Minha Carteirinha | FESN"
    : "FESN | Carteirinha Estudantil";

  if (atualizarHash) {
    const hash = abrirCredencial ? "#credencial" : "#login";
    history.replaceState(null, "", hash);
  }
}

function mostrarErro(texto) {
  mensagemErro.textContent = texto;
  campoDocumento.setAttribute("aria-invalid", String(!campoDocumento.value.trim()));
  campoSenha.setAttribute("aria-invalid", String(!campoSenha.value.trim()));
}

function limparErro() {
  mensagemErro.textContent = "";
  campoDocumento.removeAttribute("aria-invalid");
  campoSenha.removeAttribute("aria-invalid");
}

function registrarServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    return;
  }

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").catch((erro) => {
      console.warn("Service worker não registrado:", erro);
    });
  });
}
