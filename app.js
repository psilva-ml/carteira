// Chaves usadas para simular sessão e cadastros locais, sem backend.
const SESSION_KEY = "carteirinha_fesn_sessao";
const REGISTRY_KEY = "carteirinha_fesn_cadastros";
const TELAS_INICIAIS = [
  "./telas/tela1.jpeg",
  "./telas/tela2.jpeg",
  "./telas/tela3.jpeg",
];

const ESTUDANTE_PADRAO = {
  nome: "PEDRO HENRIQUE OLIVEIRA SILVA",
  cpf: "11166091694",
  nascimento: "18/05/1993",
  instituicao: "UFJF",
  curso: "ENGENHARIA ELÉTRICA",
  tipoCurso: "DOUTORADO",
  cie: "B592LCA2",
  foto: "./assets/student-photo.jpg",
  fotoCertificado: "./CIE_files/B592LCA2_app",
};

const telas = {
  introducao: document.querySelector("#introView"),
  login: document.querySelector("#loginView"),
  cadastro: document.querySelector("#registerView"),
  credencial: document.querySelector("#credentialView"),
  certificado: document.querySelector("#certificateView"),
};

const introButton = document.querySelector("#introButton");
const introImage = document.querySelector("#introImage");
const openRegisterButton = document.querySelector("#openRegisterButton");
const formulario = document.querySelector("#loginForm");
const formularioCadastro = document.querySelector("#registerForm");
const campoDocumento = document.querySelector("#documento");
const mensagemErro = document.querySelector("#loginError");
const mensagemCadastro = document.querySelector("#registerError");
const backToLoginButton = document.querySelector("#backToLoginButton");
const botaoLogout = document.querySelector("#logoutButton");
const validadeValor = document.querySelector("#validadeValor");
const validadeCertificado = document.querySelector("#validadeCertificado");
const anoAtual = document.querySelector("#anoAtual");
const certificateButton = document.querySelector("#certificateButton");
const certificateBackButton = document.querySelector("#certificateBackButton");

const camposCadastro = {
  nome: document.querySelector("#registerName"),
  cpf: document.querySelector("#registerCpf"),
  nascimento: document.querySelector("#registerBirth"),
  instituicao: document.querySelector("#registerInstitution"),
  curso: document.querySelector("#registerCourse"),
  tipoCurso: document.querySelector("#registerCourseType"),
  cie: document.querySelector("#registerCie"),
  foto: document.querySelector("#registerPhoto"),
};

const camposCredencial = {
  foto: document.querySelector("#studentPhoto"),
  nome: document.querySelector("#studentName"),
  instituicao: document.querySelector("#institutionValue"),
  curso: document.querySelector("#courseValue"),
  tipoCurso: document.querySelector("#courseTypeValue"),
  cpf: document.querySelector("#cpfValue"),
  nascimento: document.querySelector("#birthValue"),
  cie: document.querySelector("#cieCodeValue"),
};

const camposCertificado = {
  foto: document.querySelector("#certificatePhoto"),
  nome: document.querySelector("#certificateName"),
  nascimento: document.querySelector("#certificateBirth"),
  cpf: document.querySelector("#certificateCpf"),
  instituicao: document.querySelector("#certificateInstitution"),
  tipoCurso: document.querySelector("#certificateCourseType"),
  curso: document.querySelector("#certificateCourse"),
};

let telaInicialAtual = 0;
let timerTelaInicial = null;

document.addEventListener("DOMContentLoaded", iniciarApp);

function iniciarApp() {
  registrarServiceWorker();
  configurarEventos();
  atualizarDadosDinamicos();
  mostrarIntroducao();
}

function configurarEventos() {
  introButton.addEventListener("click", avancarTelaInicial);
  openRegisterButton.addEventListener("click", mostrarCadastro);
  formulario.addEventListener("submit", entrar);
  formularioCadastro.addEventListener("submit", cadastrarEstudante);
  backToLoginButton.addEventListener("click", mostrarLogin);
  botaoLogout.addEventListener("click", sair);
  certificateButton.addEventListener("click", mostrarCertificado);
  certificateBackButton.addEventListener("click", mostrarCredencial);
  camposCadastro.cpf.addEventListener("input", aplicarMascaraCpf);
  camposCadastro.nascimento.addEventListener("input", aplicarMascaraData);
  window.addEventListener("hashchange", sincronizarRota);
}

function entrar(evento) {
  evento.preventDefault();

  const documento = campoDocumento.value.trim();

  limparErro();

  if (!documento) {
    mostrarErro("Preencha o CPF ou código de uso para entrar.");
    return;
  }

  const estudante = buscarEstudante(documento);

  if (!estudante) {
    mostrarErro("Carteirinha não encontrada. Cadastre os dados em Consulta Rápida.");
    return;
  }

  salvarSessao(documento);
  formulario.reset();
  renderizarEstudante(estudante);
  mostrarCredencial();
}

async function cadastrarEstudante(evento) {
  evento.preventDefault();
  limparErroCadastro();

  const cpf = somenteNumeros(camposCadastro.cpf.value);
  const cadastro = {
    nome: normalizarTexto(camposCadastro.nome.value),
    cpf,
    nascimento: camposCadastro.nascimento.value.trim(),
    instituicao: normalizarTexto(camposCadastro.instituicao.value),
    curso: normalizarTexto(camposCadastro.curso.value),
    tipoCurso: normalizarTexto(camposCadastro.tipoCurso.value),
    cie: camposCadastro.cie.value.trim().toUpperCase(),
  };

  if (!cadastro.nome || !cadastro.cpf || !cadastro.nascimento || !cadastro.instituicao || !cadastro.curso || !cadastro.tipoCurso || !cadastro.cie) {
    mostrarErroCadastro("Preencha todos os campos obrigatórios.");
    return;
  }

  if (cadastro.cpf.length < 3) {
    mostrarErroCadastro("Informe um CPF válido para localizar depois.");
    return;
  }

  try {
    const cadastroExistente = buscarCadastroSalvo(cadastro.cpf);
    const foto = await obterFotoCadastro(camposCadastro.foto.files[0], cadastroExistente);

    salvarCadastro({ ...cadastro, foto, fotoCertificado: foto });
    salvarSessao(cadastro.cpf);
    formularioCadastro.reset();
    renderizarEstudante(buscarEstudante(cadastro.cpf));
    mostrarCredencial();
  } catch (erro) {
    mostrarErroCadastro(erro.message || "Não foi possível salvar o cadastro.");
  }
}

function salvarCadastro(cadastro) {
  const cadastros = carregarCadastros();
  const cpfCadastro = somenteNumeros(cadastro.cpf);
  const cieCadastro = normalizarCodigo(cadastro.cie);
  const atualizados = cadastros.filter((item) => {
    return somenteNumeros(item.cpf) !== cpfCadastro && normalizarCodigo(item.cie) !== cieCadastro;
  });

  atualizados.push({
    ...cadastro,
    cpf: cpfCadastro,
    atualizadoEm: new Date().toISOString(),
  });

  try {
    localStorage.setItem(REGISTRY_KEY, JSON.stringify(atualizados));
  } catch (erro) {
    throw new Error("A foto ficou grande demais para salvar neste navegador.");
  }
}

function carregarCadastros() {
  try {
    const cadastros = JSON.parse(localStorage.getItem(REGISTRY_KEY));
    return Array.isArray(cadastros) ? cadastros : [];
  } catch (erro) {
    localStorage.removeItem(REGISTRY_KEY);
    return [];
  }
}

function buscarCadastroSalvo(valor) {
  const cpf = somenteNumeros(valor);
  return carregarCadastros().find((cadastro) => somenteNumeros(cadastro.cpf) === cpf) || null;
}

function buscarEstudante(valor) {
  const cpf = somenteNumeros(valor);
  const codigo = normalizarCodigo(valor);
  const todos = carregarCadastros().concat(ESTUDANTE_PADRAO);

  return todos.find((cadastro) => {
    return somenteNumeros(cadastro.cpf) === cpf || normalizarCodigo(cadastro.cie) === codigo;
  }) || null;
}

async function obterFotoCadastro(arquivo, cadastroExistente) {
  if (!arquivo) {
    return cadastroExistente?.foto || ESTUDANTE_PADRAO.foto;
  }

  if (!arquivo.type.startsWith("image/")) {
    throw new Error("Envie um arquivo de imagem.");
  }

  return reduzirImagem(arquivo);
}

function reduzirImagem(arquivo) {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader();

    leitor.addEventListener("error", () => reject(new Error("Não foi possível ler a foto.")));
    leitor.addEventListener("load", () => {
      const imagem = new Image();

      imagem.addEventListener("error", () => reject(new Error("Não foi possível carregar a foto.")));
      imagem.addEventListener("load", () => {
        const tamanhoMaximo = 720;
        const escala = Math.min(1, tamanhoMaximo / Math.max(imagem.width, imagem.height));
        const largura = Math.max(1, Math.round(imagem.width * escala));
        const altura = Math.max(1, Math.round(imagem.height * escala));
        const canvas = document.createElement("canvas");
        const contexto = canvas.getContext("2d");

        canvas.width = largura;
        canvas.height = altura;
        contexto.fillStyle = "#ffffff";
        contexto.fillRect(0, 0, largura, altura);
        contexto.drawImage(imagem, 0, 0, largura, altura);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      });

      imagem.src = leitor.result;
    });

    leitor.readAsDataURL(arquivo);
  });
}

function salvarSessao(documento) {
  const sessao = {
    autenticado: true,
    documento,
    criadoEm: new Date().toISOString(),
  };

  localStorage.setItem(SESSION_KEY, JSON.stringify(sessao));
}

function obterEstudanteDaSessao() {
  try {
    const sessao = JSON.parse(localStorage.getItem(SESSION_KEY));

    if (!sessao || !sessao.autenticado) {
      return null;
    }

    return buscarEstudante(sessao.documento);
  } catch (erro) {
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
}

function sair() {
  localStorage.removeItem(SESSION_KEY);
  mostrarLogin();
}

function temSessaoAtiva() {
  return Boolean(obterEstudanteDaSessao());
}

function sincronizarRota() {
  if (window.location.hash === "#cadastro") {
    alternarTela("cadastro", false);
    return;
  }

  if (window.location.hash === "#credencial" && temSessaoAtiva()) {
    renderizarEstudante(obterEstudanteDaSessao());
    alternarTela("credencial", false);
    return;
  }

  if (window.location.hash === "#certificado" && temSessaoAtiva()) {
    renderizarEstudante(obterEstudanteDaSessao());
    alternarTela("certificado", false);
    return;
  }

  if (!temSessaoAtiva()) {
    alternarTela("login", false);
  }
}

function mostrarLogin() {
  limparErro();
  alternarTela("login", true);
  campoDocumento.focus();
}

function mostrarCadastro() {
  limparErroCadastro();
  alternarTela("cadastro", true);
  camposCadastro.nome.focus();
}

function mostrarCredencial() {
  const estudante = obterEstudanteDaSessao();

  if (!estudante) {
    mostrarLogin();
    return;
  }

  renderizarEstudante(estudante);
  alternarTela("credencial", true);
}

function mostrarCertificado() {
  const estudante = obterEstudanteDaSessao();

  if (!estudante) {
    mostrarLogin();
    return;
  }

  renderizarEstudante(estudante);
  alternarTela("certificado", true);
}

function mostrarIntroducao() {
  alternarTela("introducao", false);
  exibirTelaInicial(0);
  timerTelaInicial = window.setTimeout(avancarTelaInicial, 3000);
}

function avancarTelaInicial() {
  if (timerTelaInicial) {
    window.clearTimeout(timerTelaInicial);
    timerTelaInicial = null;
  }

  if (telaInicialAtual < TELAS_INICIAIS.length - 1) {
    exibirTelaInicial(telaInicialAtual + 1);
    return;
  }

  mostrarLogin();
}

function exibirTelaInicial(indice) {
  telaInicialAtual = indice;
  introImage.src = TELAS_INICIAIS[indice];
  introImage.alt = "";
}

function alternarTela(nomeTela, atualizarHash) {
  const abrirIntroducao = nomeTela === "introducao";
  const abrirLogin = nomeTela === "login";
  const abrirCadastro = nomeTela === "cadastro";
  const abrirCredencial = nomeTela === "credencial";
  const abrirCertificado = nomeTela === "certificado";

  telas.introducao.classList.toggle("hidden", !abrirIntroducao);
  telas.login.classList.toggle("hidden", !abrirLogin);
  telas.cadastro.classList.toggle("hidden", !abrirCadastro);
  telas.credencial.classList.toggle("hidden", !abrirCredencial);
  telas.certificado.classList.toggle("hidden", !abrirCertificado);

  document.title = abrirCredencial || abrirCertificado ? "Minha Carteirinha | DNE FESN" : "DNE FESN";

  if (atualizarHash) {
    const hash = abrirCredencial ? "#credencial" : abrirCertificado ? "#certificado" : abrirCadastro ? "#cadastro" : "#login";
    history.replaceState(null, "", hash);
  }
}

function mostrarErro(texto) {
  mensagemErro.textContent = texto;
  campoDocumento.setAttribute("aria-invalid", "true");
}

function limparErro() {
  mensagemErro.textContent = "";
  campoDocumento.removeAttribute("aria-invalid");
}

function atualizarDadosDinamicos() {
  const ano = new Date().getFullYear();

  validadeValor.textContent = `31/03/${ano + 1}`;
  validadeCertificado.textContent = `31/03/${ano + 1}`;
  anoAtual.textContent = String(ano);
}

function renderizarEstudante(estudante) {
  const dados = completarDados(estudante);
  const validade = obterValidade();
  const ano = String(new Date().getFullYear());

  camposCredencial.foto.src = dados.foto;
  camposCredencial.foto.alt = `Foto de ${dados.nome}`;
  camposCredencial.nome.textContent = dados.nome;
  camposCredencial.instituicao.textContent = dados.instituicao;
  camposCredencial.curso.textContent = dados.curso;
  camposCredencial.tipoCurso.textContent = dados.tipoCurso;
  camposCredencial.cpf.textContent = dados.cpf;
  camposCredencial.nascimento.textContent = dados.nascimento;
  camposCredencial.cie.textContent = dados.cie;
  validadeValor.textContent = validade;
  anoAtual.textContent = ano;

  camposCertificado.foto.src = dados.fotoCertificado || dados.foto;
  camposCertificado.foto.alt = `Foto de ${dados.nome}`;
  camposCertificado.nome.textContent = dados.nome;
  camposCertificado.nascimento.textContent = dados.nascimento;
  camposCertificado.cpf.textContent = dados.cpf;
  camposCertificado.instituicao.textContent = dados.instituicao;
  camposCertificado.tipoCurso.textContent = dados.tipoCurso;
  camposCertificado.curso.textContent = dados.curso;
  validadeCertificado.textContent = validade;
}

function completarDados(estudante) {
  return {
    nome: (estudante.nome || ESTUDANTE_PADRAO.nome).toUpperCase(),
    cpf: somenteNumeros(estudante.cpf || ESTUDANTE_PADRAO.cpf),
    nascimento: estudante.nascimento || ESTUDANTE_PADRAO.nascimento,
    instituicao: (estudante.instituicao || ESTUDANTE_PADRAO.instituicao).toUpperCase(),
    curso: (estudante.curso || ESTUDANTE_PADRAO.curso).toUpperCase(),
    tipoCurso: (estudante.tipoCurso || ESTUDANTE_PADRAO.tipoCurso).toUpperCase(),
    cie: (estudante.cie || ESTUDANTE_PADRAO.cie).toUpperCase(),
    foto: estudante.foto || ESTUDANTE_PADRAO.foto,
    fotoCertificado: estudante.fotoCertificado || estudante.foto || ESTUDANTE_PADRAO.fotoCertificado,
  };
}

function obterValidade() {
  return `31/03/${new Date().getFullYear() + 1}`;
}

function aplicarMascaraCpf(evento) {
  const numeros = somenteNumeros(evento.target.value).slice(0, 11);
  evento.target.value = numeros
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1-$2");
}

function aplicarMascaraData(evento) {
  const numeros = somenteNumeros(evento.target.value).slice(0, 8);
  evento.target.value = numeros
    .replace(/^(\d{2})(\d)/, "$1/$2")
    .replace(/^(\d{2})\/(\d{2})(\d)/, "$1/$2/$3");
}

function mostrarErroCadastro(texto) {
  mensagemCadastro.textContent = texto;
}

function limparErroCadastro() {
  mensagemCadastro.textContent = "";
}

function normalizarTexto(valor) {
  return valor.trim().replace(/\s+/g, " ");
}

function somenteNumeros(valor) {
  return String(valor || "").replace(/\D/g, "");
}

function normalizarCodigo(valor) {
  return String(valor || "").replace(/[^a-z0-9]/gi, "").toUpperCase();
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
