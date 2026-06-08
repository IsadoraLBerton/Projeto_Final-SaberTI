// Configuração para implementação do supabase
const SUPABASE_URL = "https://bjvhddpzkuhgbeaaqbyl.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_1JGQt__tf8nWR-jXnUnCRA_JLkO68GA";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Pega elementos do cadastro
const formCadastro = document.getElementById("form-cadastro");
const tabelaUsuarios = document.getElementById("lista-usuarios");
const mensagem = document.getElementById("mensagem");

// Id para controle de edição
let idUsuarioEditando = null;

// Capturando os inputs do formulário de usuários
const nomeInput = document.getElementById("nome-usuario");
const loginInput = document.getElementById("login-usuario");
const senhaInput = document.getElementById("senha-usuario");

const btnSalvar = formCadastro.querySelector("button[type='submit']");

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
  CARREGAR USUÁRIOS
  ============================================
*/
async function carregarUsuarios() {
    // Faz um SELECT na tabela USUARIOS
    const { data, error } = await supabaseClient
        .from("usuarios")
        .select("id, usuario, nome_completo")
        .order("id", { ascending: true });

    if (error) {
        tabelaUsuarios.innerHTML = `<tr><td colspan="4">Erro ao carregar usuários.</td></tr>`;
        mostrarMensagem("Erro ao buscar usuários: " + error.message, "erro");
        return;
    }

    if (data.length === 0) {
        tabelaUsuarios.innerHTML = `<tr><td colspan="4">Nenhum usuário cadastrado.</td></tr>`;
        return;
    }

    // Limpa o corpo da tabela antes de preencher
    tabelaUsuarios.innerHTML = "";

    // Preenche dinamicamente as linhas
    data.forEach(function (usuario) {
        const linha = document.createElement("tr");

        linha.innerHTML = `
      <td>${usuario.id}</td>
      <td>${usuario.nome_completo}</td>
      <td>${usuario.usuario}</td>
      <td>••••••</td> 
      <td class="coluna-acoes"></td>
    `;

        // Botão Editar
        const botaoEditar = document.createElement("button");
        botaoEditar.textContent = "Editar";
        botaoEditar.className = "btn-editar";
        botaoEditar.type = "button";
        botaoEditar.addEventListener("click", function () {
            prepararEdicao(usuario);
        });

        // Botão Excluir
        const botaoExcluir = document.createElement("button");
        botaoExcluir.textContent = "Excluir";
        botaoExcluir.className = "btn-excluir";
        botaoExcluir.type = "button";
        botaoExcluir.addEventListener("click", function () {
            excluirUsuario(usuario);
        });

        linha.querySelector(".coluna-acoes").appendChild(botaoEditar);
        linha.querySelector(".coluna-acoes").appendChild(botaoExcluir);

        tabelaUsuarios.appendChild(linha);
    });
}

/*
  ============================================
  PREPARAR EDIÇÃO
  ============================================
*/
function prepararEdicao(usuario) {
    idUsuarioEditando = usuario.id; // Guarda o ID na memória global do script

    nomeInput.value = usuario.nome_completo;
    loginInput.value = usuario.usuario;
    senhaInput.value = ""; // Por segurança, não pega a senha antiga, o usuário digita uma nova se quiser alterar

    btnSalvar.textContent = "Atualizar";
    mostrarMensagem("Editando o usuário: " + usuario.nome_completo, "sucesso");
}

/*
  ============================================
  CANCELAR/LIMPAR EDIÇÃO
  ============================================
*/
function limparFormulario() {
    formCadastro.reset();
    idUsuarioEditando = null;
    btnSalvar.textContent = "Salvar";
    mostrarMensagem("", "");
}

/*
  ============================================
  SALVAR NOVO USUÁRIO
  ============================================
*/
async function salvarUsuario() {
    const novoUsuario = {
        usuario: loginInput.value.toUpperCase(), // Aceita o usuario independente se escrito o nome em minúsculo ou maiúsculo
        nome_completo: nomeInput.value,
        senha: senhaInput.value,
    };

    const { error } = await supabaseClient.from("usuarios").insert(novoUsuario);

    if (error) {
        mostrarMensagem("Erro ao salvar usuário: " + error.message, "erro");
        return;
    }

    mostrarMensagem("Usuário salvo com sucesso!", "sucesso");
    limparFormulario();
    carregarUsuarios();
}

/*
  ============================================
  ATUALIZAR USUÁRIO EXISTENTE
  ============================================
*/
async function atualizarUsuario() {
    const dadosAtualizados = {
        usuario: loginInput.value.toUpperCase(),
        nome_completo: nomeInput.value,
    };

    // Só atualiza a senha se o campo não estiver em branco
    if (senhaInput.value.trim() !== "") {
        dadosAtualizados.senha = senhaInput.value;
    }

    const { error } = await supabaseClient
        .from("usuarios")
        .update(dadosAtualizados)
        .eq("id", idUsuarioEditando);

    if (error) {
        mostrarMensagem("Erro ao atualizar usuário: " + error.message, "erro");
        return;
    }

    mostrarMensagem("Usuário atualizado com sucesso!", "sucesso");
    limparFormulario();
    carregarUsuarios();
}

/*
  ============================================
  EXCLUIR USUÁRIO
  ============================================
*/
async function excluirUsuario(usuario) {
    const confirmou = confirm("Deseja realmente excluir o usuário " + usuario.nome_completo + "?");

    if (!confirmou) return;

    const { error } = await supabaseClient
        .from("usuarios")
        .delete()
        .eq("id", usuario.id);

    if (error) {
        mostrarMensagem("Erro ao excluir usuário: " + error.message, "erro");
        return;
    }

    if (idUsuarioEditando === usuario.id) {
        limparFormulario();
    }

    mostrarMensagem("Usuário excluído com sucesso!", "sucesso");
    carregarUsuarios();
}

/*
  ============================================
  EVENTOS E INICIALIZAÇÃO
  ============================================
*/
formCadastro.addEventListener("submit", async function (evento) {
    evento.preventDefault();

    const estaEditando = idUsuarioEditando !== null;

    if (estaEditando) {
        await atualizarUsuario();
    } else {
        await salvarUsuario();
    }
});

// Vincula o botão limpar para também cancelar variáveis de edição
formCadastro.addEventListener("reset", function () {
    setTimeout(limparFormulario, 10);
});

// Executa a listagem automática ao entrar na tela
carregarUsuarios();