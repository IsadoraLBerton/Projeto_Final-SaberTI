  //CONTROLE DE SESSÃO E BOAS-VINDAS DO MENU

document.addEventListener("DOMContentLoaded", function () {
  // Busca o nome do usuário que guardamos lá no login.js
  const usuarioLogado = sessionStorage.getItem("usuarioLogado");
  const elementoNome = document.getElementById("nome-usuario");

  // PROTEÇÃO DE TELA: Se não houver usuário salvo na sessão, manda de volta pro login
  if (!usuarioLogado) {
    alert("Acesso negado! Por favor, faça login primeiro.");
    window.location.href = "login.html";
    return;
  }

  // Se passou no teste, exibe o nome real da pessoa na tela
  elementoNome.textContent = usuarioLogado;
});