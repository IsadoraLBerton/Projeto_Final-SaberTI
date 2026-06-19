// Configuração para implementação do supabase
const SUPABASE_URL = "https://bjvhddpzkuhgbeaaqbyl.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_1JGQt__tf8nWR-jXnUnCRA_JLkO68GA";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const formRecuperacao = document.getElementById("form-esqueci-senha");
const usuarioInput = document.getElementById("usuario-recuperacao");
const nomeInput = document.getElementById("nome-recuperacao");
const novaSenhaInput = document.getElementById("nova-senha");
const confirmarSenhaInput = document.getElementById("confirmar-senha");
const mensagem = document.getElementById("mensagem");

let temporizadorMensagem = null;

function mostrarMensagem(texto, tipo, redirecionarDepois = false) {
  clearTimeout(temporizadorMensagem);

  mensagem.textContent = texto;
  mensagem.className = "mensagem " + tipo;

  if (redirecionarDepois) {
    temporizadorMensagem = setTimeout(function () {
      window.location.href = "login.html";
    }, 2000);
  }
}

function normalizarTexto(texto) {
  return (texto || "")
    .toString()
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

formRecuperacao.addEventListener("submit", async function (evento) {
  evento.preventDefault();
  mostrarMensagem("", "");

  const usuarioDigitado = usuarioInput.value.trim().toUpperCase();
  const nomeDigitado = normalizarTexto(nomeInput.value);
  const novaSenha = novaSenhaInput.value;
  const confirmarSenha = confirmarSenhaInput.value;

  if (novaSenha.length < 4) {
    mostrarMensagem("A nova senha deve ter pelo menos 4 caracteres.", "erro");
    return;
  }

  if (novaSenha !== confirmarSenha) {
    mostrarMensagem("As senhas digitadas não conferem.", "erro");
    return;
  }

  const { data, error } = await supabaseClient
    .from("usuarios")
    .select("id, usuario, nome_completo")
    .eq("usuario", usuarioDigitado)
    .maybeSingle();

  if (error) {
    mostrarMensagem("Erro ao buscar usuário: " + error.message, "erro");
    return;
  }

  if (!data || normalizarTexto(data.nome_completo) !== nomeDigitado) {
    mostrarMensagem("Usuário ou nome completo não encontrado.", "erro");
    return;
  }

  const { error: erroAtualizacao } = await supabaseClient
    .from("usuarios")
    .update({ senha: novaSenha })
    .eq("id", data.id);

  if (erroAtualizacao) {
    mostrarMensagem("Erro ao redefinir senha: " + erroAtualizacao.message, "erro");
    return;
  }

  formRecuperacao.reset();
  mostrarMensagem("Senha redefinida com sucesso! Voltando ao login...", "sucesso", true);
});
