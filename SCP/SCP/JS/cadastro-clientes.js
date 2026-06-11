// Configuração para implementação do supabase
const SUPABASE_URL = "https://bjvhddpzkuhgbeaaqbyl.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_1JGQt__tf8nWR-jXnUnCRA_JLkO68GA";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Pega elementos do cadastro 
const formCliente = document.getElementById("form-cliente");
const tabelaClientes = document.getElementById("lista-clientes");
const mensagem = document.getElementById("mensagem");

// Id para controle de edição
let idClienteEditando = null;

// Capturando os inputs do formulário de clientes
const tipoInput = document.getElementById("tipo-cliente");
const nomeInput = document.getElementById("nome-cliente");
const cpfCnpjInput = document.getElementById("cpf-cnpj-cliente");

const btnSalvar = formCliente.querySelector("button[type='submit']");


//FUNÇÃO PARA MOSTRAR MENSAGEM NA TELA
function mostrarMensagem(texto, tipo) {
    mensagem.textContent = texto;
    mensagem.className = "mensagem " + tipo;
}

//FUNÇÃO PARA RETORNAR AO TOPO DA PÁGINA
function irParaTopo() {
    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

//CARREGAR CLIENTES
async function carregarClientes() {
    // Faz um SELECT na tabela cliente 
    const { data, error } = await supabaseClient
        .from("cliente")
        .select("clienteid, tipo_cliente, nome_cliente, cpf_cnpj_cliente")
        .order("clienteid", { ascending: true });

    if (error) {
        tabelaClientes.innerHTML = `<tr><td colspan="5">Erro ao carregar clientes.</td></tr>`;
        mostrarMensagem("Erro ao buscar clientes: " + error.message, "erro");
        irParaTopo();
        return;
    }

    if (data.length === 0) {
        tabelaClientes.innerHTML = `<tr><td colspan="5">Nenhum cliente cadastrado.</td></tr>`;
        return;
    }

    // Limpa o corpo da tabela antes de preencher
    tabelaClientes.innerHTML = "";

    // Preenche dinamicamente as linhas
    data.forEach(function (cliente) {
        const linha = document.createElement("tr");

        // Monta as colunas respeitando o cabeçalho do HTML
        linha.innerHTML = `
      <td>${cliente.clienteid}</td>
      <td>${cliente.tipo_cliente}</td>
      <td>${cliente.nome_cliente}</td>
      <td>${cliente.cpf_cnpj_cliente}</td>
      <td class="coluna-acoes"></td>
    `;

        // Botão Editar
        const botaoEditar = document.createElement("button");
        botaoEditar.textContent = "Editar";
        botaoEditar.className = "btn-editar";
        botaoEditar.type = "button";
        botaoEditar.addEventListener("click", function () {
            prepararEdicao(cliente);
        });

        // Botão Excluir
        const botaoExcluir = document.createElement("button");
        botaoExcluir.textContent = "Excluir";
        botaoExcluir.className = "btn-excluir";
        botaoExcluir.type = "button";
        botaoExcluir.addEventListener("click", function () {
            excluirCliente(cliente); // Corrigido a letra maiúscula
        });

        linha.querySelector(".coluna-acoes").appendChild(botaoEditar);
        linha.querySelector(".coluna-acoes").appendChild(botaoExcluir);

        tabelaClientes.appendChild(linha);
    });
}

//PREPARAR EDIÇÃO
function prepararEdicao(cliente) {
    idClienteEditando = cliente.clienteid;

    // Preenche os campos para o usuário alterar
    tipoInput.value = cliente.tipo_cliente;
    nomeInput.value = cliente.nome_cliente;
    cpfCnpjInput.value = cliente.cpf_cnpj_cliente;

    btnSalvar.textContent = "Atualizar";
    mostrarMensagem("Editando o cliente: " + cliente.nome_cliente, "sucesso");

    irParaTopo();
}

//CANCELAR/LIMPAR EDIÇÃO
function limparFormulario() {
    idClienteEditando = null;
    btnSalvar.textContent = "Salvar";
    mostrarMensagem("", "");
}

//SALVAR NOVO CLIENTE
async function salvarCliente() {
    // 1. Conta quantos números puros foram digitados no campo
    const numerosPuros = cpfCnpjInput.value.replace(/\D/g, "").length;
    const tipoSelecionado = tipoInput.value;

    // 2. VALIDAÇÃO: Se selecionou Física (F) mas digitou tamanho de CNPJ (14 dígitos) ou menos dígitos do que o mínimo (11)
    if (tipoSelecionado === "F" && numerosPuros !== 11) {
        mostrarMensagem(
            "Erro: Para Pessoa Física, digite um CPF válido (11 dígitos).",
            "erro",
        );
        irParaTopo();
        return; // Trava a execução e não deixa salvar 
    }

    // 3. VALIDAÇÃO: Se selecionou Jurídica (J) mas digitou tamanho de CPF (11 dígitos ou menos)
    if (tipoSelecionado === "J" && numerosPuros !== 14) {
        mostrarMensagem(
            "Erro: Para Pessoa Jurídica, digite um CNPJ válido (14 dígitos).",
            "erro",
        );
        irParaTopo();
        return; // Trava a execução e não deixa salvar
    }

    // Se passou nas validações, segue o fluxo e monta o objeto para salvar
    const novoCliente = {
        tipo_cliente: tipoSelecionado,
        nome_cliente: nomeInput.value,
        cpf_cnpj_cliente: cpfCnpjInput.value.trim(),
    };

    const { error } = await supabaseClient.from("cliente").insert(novoCliente);

    if (error) {
        mostrarMensagem("Erro ao salvar cliente: " + error.message, "erro");
        irParaTopo();
        return;
    }

    mostrarMensagem("Cliente salvo com sucesso!", "sucesso");
    irParaTopo();
    limparFormulario();
    carregarClientes();
}

//ATUALIZAR CLIENTE EXISTENTE
async function atualizarCliente() {
    // VALIDAÇÃO ANTES DE ATUALIZAR
    const numerosPuros = cpfCnpjInput.value.replace(/\D/g, "").length;
    const tipoSelecionado = tipoInput.value;

    if (tipoSelecionado === "F" && numerosPuros !== 11) {
        mostrarMensagem(
            "Erro: Para Pessoa Física, digite um CPF válido (11 dígitos).",
            "erro",
        );
        irParaTopo();
        return;
    }

    if (tipoSelecionado === "J" && numerosPuros !== 14) {
        mostrarMensagem(
            "Erro: Para Pessoa Jurídica, digite um CNPJ válido (14 dígitos).",
            "erro",
        );
        irParaTopo();
        return;
    }

    // Se estiver tudo certo, faz o update
    const dadosAtualizados = {
        tipo_cliente: tipoSelecionado,
        nome_cliente: nomeInput.value,
        cpf_cnpj_cliente: cpfCnpjInput.value.trim(),
    };

    const { error } = await supabaseClient
        .from("cliente")
        .update(dadosAtualizados)
        .eq("clienteid", idClienteEditando); // Filtra pelo ID armazenado na edição

    if (error) {
        mostrarMensagem("Erro ao atualizar cliente: " + error.message, "erro");
        irParaTopo();
        return;
    }

    mostrarMensagem("Cliente atualizado com sucesso!", "sucesso");
    irParaTopo();
    limparFormulario();
    carregarClientes();
}

//EXCLUIR CLIENTE
async function excluirCliente(cliente) {
    const confirmou = confirm(
        "Deseja realmente excluir o cliente " + cliente.nome_cliente + "?",
    );

    if (!confirmou) return;

    const { error } = await supabaseClient
        .from("cliente")
        .delete()
        .eq("clienteid", cliente.clienteid);

    if (error) {
        mostrarMensagem("Erro ao excluir cliente: " + error.message, "erro");
        irParaTopo();
        return;
    }

    // Se o cliente excluído estava aberto na edição, limpa o formulário
    if (idClienteEditando === cliente.clienteid) {
        limparFormulario();
    }

    mostrarMensagem("Cliente excluído com sucesso!", "sucesso");
    irParaTopo();
    carregarClientes();
}

//EVENTOS E INICIALIZAÇÃO
formCliente.addEventListener("submit", async function (evento) {
    evento.preventDefault();

    const estaEditando = idClienteEditando !== null;

    if (estaEditando) {
        await atualizarCliente();
    } else {
        await salvarCliente();
    }
});

formCliente.addEventListener("reset", function () {
    setTimeout(limparFormulario, 10);
});

// Inicializa a tabela trazendo os dados do Supabase
carregarClientes();

//MÁSCARA AUTOMÁTICA DE CPF / CNPJ
cpfCnpjInput.addEventListener("input", function (evento) {
    // 1. Remove tudo o que NÃO for número (letras, pontos antigos, etc.)
    let valor = evento.target.value.replace(/\D/g, "");

    // Limitador de segurança: não deixa passar de 14 números puros
    if (valor.length > 14) {
        valor = valor.slice(0, 14);
    }

    // 2. Se tiver até 11 dígitos, aplica formato de CPF: 000.000.000-00
    if (valor.length <= 11) {
        valor = valor.replace(/(\d{3})(\d)/, "$1.$2");
        valor = valor.replace(/(\d{3})(\d)/, "$1.$2");
        valor = valor.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    }
    // 3. Se passar de 11 dígitos, muda para formato de CNPJ: 00.000.000/0001-00
    else {
        valor = valor.replace(/^(\d{2})(\d)/, "$1.$2");
        valor = valor.replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3");
        valor = valor.replace(/\.(\d{3})(\d)/, ".$1/$2");
        valor = valor.replace(/(\d{4})(\d{1,2})$/, "$1-$2");
    }

    // 4. Devolve o valor formatado de volta para o input na tela
    evento.target.value = valor;
});

//FILTRO DE BUSCA NA TABELA
function filtrarTabela() {
    // Pega o texto digitado, converte para minúsculo para comparar sem diferenciar maiúscula
    const textoBusca = document.getElementById("campo-busca").value.toLowerCase();

    // Pega todas as linhas do tbody da tabela
    const linhas = document.querySelectorAll("#lista-clientes tr");

    linhas.forEach(function (linha) {
        // Pega TODO o texto daquela linha (nome + cpf + tipo juntos)
        const textoDaLinha = linha.textContent.toLowerCase();

        // Se o texto da linha contém o que foi digitado, mostra. Se não, esconde.
        if (textoDaLinha.includes(textoBusca)) {
            linha.style.display = "";        // mostra a linha (volta ao padrão)
        } else {
            linha.style.display = "none";    // esconde a linha
        }
    });
}

// Evento: chama filtrarTabela() toda vez que o usuário digitar algo no campo
document.getElementById("campo-busca").addEventListener("input", filtrarTabela);