// Configuração para implementação do supabase
const SUPABASE_URL = "https://bjvhddpzkuhgbeaaqbyl.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_1JGQt__tf8nWR-jXnUnCRA_JLkO68GA";

// Cria o cliente de conexão com o Supabase utilizando o padrão do modelo
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);


// Pega elementos do cadastro da tela de login
const formLogin = document.getElementById("form-login");
const usuarioInput = document.getElementById("usuario-login");
const senhaInput = document.getElementById("senha-login");
const mensagem = document.getElementById("mensagem");

/*
  ============================================
  FUNÇÃO PARA MOSTRAR MENSAGEM NA TELA
  ============================================
*/
function mostrarMensagem(texto, tipo) {
  mensagem.textContent = texto;
  mensagem.className = "mensagem " + tipo;
}

/*
  ============================================
  EVENTO DE ENVIO DO FORMULÁRIO (LOGIN)
  ============================================
*/
formLogin.addEventListener("submit", async function (evento) {
  // Impede a página de recarregar e perder os dados digitados
  evento.preventDefault();

  // Limpa qualquer mensagem de erro ou sucesso anterior antes de tentar logar
  mostrarMensagem("", "");

  // Captura os valores e padroniza o usuário em maiúsculo conforme o padrão 
  const usuarioDigitado = usuarioInput.value.toUpperCase();
  const senhaDigitada = senhaInput.value;

  const { data, error } = await supabaseClient
    .from("usuarios")
    .select("id, usuario, nome_completo, senha")
    .eq("usuario", usuarioDigitado)
    .eq("senha", senhaDigitada);

  // Se houver algum erro de rede ou comunicação com o Supabase
  if (error) {
    mostrarMensagem("Erro ao conectar com o banco: " + error.message, "erro");
    return;
  }

  if (data && data.length > 0) {
    mostrarMensagem("Acesso concedido! Redirecionando...", "sucesso");

    // Guarda o nome completo da pessoa que logou na memória do navegador
    sessionStorage.setItem("usuarioLogado", data[0].nome_completo);

    // Espera 1 segundo para o usuário ler a mensagem de sucesso e muda de página
    setTimeout(function () {
      window.location.href = "menu.html";
    }, 1000);

  } else {
    // Se o array 'data' voltar vazio, significa que a combinação usuário/senha não existe
    mostrarMensagem("Usuário ou senha inválidos.", "erro");
  }
});