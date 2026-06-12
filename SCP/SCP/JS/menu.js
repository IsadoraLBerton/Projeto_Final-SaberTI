// CONTROLE DE SESSÃO E BOAS-VINDAS DO MENU
document.addEventListener("DOMContentLoaded", function () {

  // Busca o nome do usuário que guardamos no login.js usando sessionStorage
  const usuarioLogado = sessionStorage.getItem("usuarioLogado");
  const elementoNome = document.getElementById("nome-usuario");

  // PROTEÇÃO DE TELA: Se não houver usuário salvo na sessão, manda de volta pro login
  if (!usuarioLogado) {
    alert("Acesso negado! Por favor, faça login primeiro.");
    window.location.href = "index.html";
    return;
  }

  // Se passou no teste, exibe o nome real da pessoa na tela
  elementoNome.textContent = usuarioLogado;
});

// FUNÇÃO SAIR: Limpa a sessão e redireciona para o login.
function sair() {
  // Remove o dado de sessão armazenada no login
  sessionStorage.removeItem("usuarioLogado");
  // Manda o usuário de volta para a tela de login
  window.location.href = "index.html";
}