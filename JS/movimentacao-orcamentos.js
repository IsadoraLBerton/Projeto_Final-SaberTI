// Configuração do Supabase
const SUPABASE_URL = "https://bjvhddpzkuhgbeaaqbyl.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_1JGQt__tf8nWR-jXnUnCRA_JLkO68GA";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Elementos da tela
const formOrcamento = document.getElementById("form-orçamento");
const selectCliente = document.getElementById("cliente-orcamento");
const selectProduto = document.getElementById("produto-item");
const inputQuantidade = document.getElementById("quantidade-item");
const inputValorUnitario = document.getElementById("valor-unitario-item");
const btnAdicionarItem = document.getElementById("btn-adicionar-item");
const corpoItensTabela = document.getElementById("corpo-itens-orcamento");
const txtValorTotalGeral = document.getElementById("valor-total-orcamento");
const btnImprimir = document.getElementById("btn-imprimir");
const mensagemDiv = document.getElementById("mensagem");

// Arrays na memória para apoiar a operação
// dadosProdutosDoBanco: guarda todos os produtos para saber o preço quando o usuário escolher
// itensDoOrcamentoAtual: guarda os itens que o usuário foi adicionando na tela
let dadosProdutosDoBanco = [];
let itensDoOrcamentoAtual = [];
let valorTotalOrcamentoCalculado = 0;
let orcamentoEmEdicao = null;

/*
  ============================================
  FUNÇÃO PARA MOSTRAR MENSAGEM NA TELA
  ============================================
*/
function mostrarMensagem(texto, tipo) {
  mensagemDiv.textContent = texto;
  mensagemDiv.className = "mensagem " + tipo;
  // Rola até a mensagem para o usuário ver
  if (texto) mensagemDiv.scrollIntoView({ behavior: "smooth", block: "center" });
}

/*
  =======================================================
  1. CONFIGURAR DATAS AUTOMÁTICAS
  Define a data de hoje e a validade (+7 dias) ao abrir a tela.
  =======================================================
*/
function configurarDatasAutomaticas() {
  const hoje = new Date();

  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, "0");
  const dia = String(hoje.getDate()).padStart(2, "0");

  document.getElementById("data-orcamento").value =
    `${ano}-${mes}-${dia}`;

  const dataValidade = new Date();
  dataValidade.setDate(hoje.getDate() + 7);

  const anoVal = dataValidade.getFullYear();
  const mesVal = String(dataValidade.getMonth() + 1).padStart(2, "0");
  const diaVal = String(dataValidade.getDate()).padStart(2, "0");

  document.getElementById("data-validade").value =
    `${anoVal}-${mesVal}-${diaVal}`;

  document.getElementById("data-validade").min =
    document.getElementById("data-orcamento").value;
}

document
  .getElementById("data-orcamento")
  .addEventListener("change", function () {

    const campoValidade =
      document.getElementById("data-validade");

    campoValidade.min = this.value;

    if (campoValidade.value < this.value) {
      campoValidade.value = this.value;
    }
  });

/*
  =======================================================
  2. CARREGAR CLIENTES E PRODUTOS NOS SELECTS
  =======================================================
*/
async function carregarDadosIniciais() {
  // Busca clientes
  const { data: clientes, error: errC } = await supabaseClient
    .from("cliente")
    .select("clienteid, nome_cliente")
    .order("nome_cliente", { ascending: true });

  if (errC) {
    mostrarMensagem("Erro ao carregar clientes: " + errC.message, "erro");
  } else if (clientes) {
    selectCliente.innerHTML = '<option value="">Selecionar Cliente</option>';
    clientes.forEach(function (c) {
      const op = document.createElement("option");
      op.value = c.clienteid;
      op.textContent = c.nome_cliente;
      selectCliente.appendChild(op);
    });
  }

  // Busca produtos ATIVOS para o select de itens
  // Filtramos apenas os ativos para não oferecer produto inativo no orçamento
  const { data: produtos, error: errP } = await supabaseClient
    .from("produto")
    .select("produtoid, ds_produto, vl_venda_produto")
    .eq("status_produto", "ATIVO")
    .order("ds_produto", { ascending: true });

  if (errP) {
    mostrarMensagem("Erro ao carregar produtos: " + errP.message, "erro");
  } else if (produtos) {
    dadosProdutosDoBanco = produtos;
    selectProduto.innerHTML = '<option value="">Selecionar Produto</option>';
    produtos.forEach(function (p) {
      const op = document.createElement("option");
      op.value = p.produtoid;
      op.textContent = p.ds_produto;
      selectProduto.appendChild(op);
    });
  }

  configurarDatasAutomaticas();
  const params = new URLSearchParams(window.location.search);
  const idEdicao = params.get("editar");

  if (idEdicao) {
    await carregarOrcamentoParaEdicao(idEdicao);
  }
}

async function carregarOrcamentoParaEdicao(id) {

  orcamentoEmEdicao = parseInt(id);

  const { data: cabecalho, error: erroCab } =
    await supabaseClient
      .from("orcamento")
      .select("*")
      .eq("orcamentoid", id)
      .single();

  if (erroCab) {
    mostrarMensagem(
      "Erro ao carregar orçamento: " +
      erroCab.message,
      "erro"
    );
    return;
  }

  selectCliente.value = cabecalho.clienteid;

  document.getElementById("data-orcamento").value =
    cabecalho.dt_orcamento.substring(0, 10);

  document.getElementById("data-validade").value =
    cabecalho.dt_validade_orcamento.substring(0, 10);

  const { data: itens, error: erroItens } =
    await supabaseClient
      .from("orcamento_item")
      .select("*")
      .eq("orcamentoid", id)
      .order("orcamentoitemid");

  if (erroItens) {
    mostrarMensagem(
      "Erro ao carregar itens: " +
      erroItens.message,
      "erro"
    );
    return;
  }

  itensDoOrcamentoAtual = [];

  itens.forEach(function (item) {

    itensDoOrcamentoAtual.push({
      produtoid: item.produtoid,
      produtodesc: item.produtodesc,
      qt_produto: item.qt_produto,
      vl_unitario: item.vl_unitario,
      vl_total: item.vl_total
    });

  });

  atualizarTabelaEValores();

  mostrarMensagem(
    "Editando orçamento #" + id,
    "sucesso"
  );
}
/*
  =======================================================
  3. PREENCHIMENTO AUTOMÁTICO DO VALOR UNITÁRIO
  Quando o usuário escolhe um produto, o preço já preenche
  o campo automaticamente.
  =======================================================
*/
selectProduto.addEventListener("change", function () {
  const idProdutoSelecionado = parseInt(selectProduto.value);
  // find() percorre o array e devolve o primeiro item que bate com a condição
  const produtoEncontrado = dadosProdutosDoBanco.find(function (p) {
    return p.produtoid === idProdutoSelecionado;
  });

  if (produtoEncontrado) {
    inputValorUnitario.value = produtoEncontrado.vl_venda_produto;
    inputQuantidade.value = "1";
    inputQuantidade.focus(); // Foca na quantidade para facilitar a digitação
  } else {
    inputValorUnitario.value = "";
    inputQuantidade.value = "";
  }
});

/*
  =======================================================
  4. ADICIONAR ITEM NA LISTA TEMPORÁRIA
  Não salva no banco ainda — apenas adiciona ao array
  itensDoOrcamentoAtual e renderiza na tabela.
  =======================================================
*/
btnAdicionarItem.addEventListener("click", function () {
  const idProduto = parseInt(selectProduto.value);
  const quantidade = parseFloat(inputQuantidade.value);
  const valorUnitario = parseFloat(inputValorUnitario.value);

  if (!idProduto || isNaN(quantidade) || quantidade <= 0 || isNaN(valorUnitario) || valorUnitario < 0) {
    mostrarMensagem("Escolha um produto e informe uma quantidade válida.", "erro");
    return;
  }

  const produtoOriginal = dadosProdutosDoBanco.find(function (p) {
    return p.produtoid === idProduto;
  });

  // Cálculo: total do item = quantidade × valor unitário
  const subtotalItem = quantidade * valorUnitario;

  const novoItem = {
    produtoid: idProduto,
    produtodesc: produtoOriginal.ds_produto,
    qt_produto: quantidade,
    vl_unitario: valorUnitario,
    vl_total: subtotalItem
  };

  itensDoOrcamentoAtual.push(novoItem);

  // Limpa os campos de item após adicionar
  selectProduto.value = "";
  inputQuantidade.value = "";
  inputValorUnitario.value = "";

  mostrarMensagem("", ""); // Limpa mensagem de erro anterior
  atualizarTabelaEValores(); // Renderiza a tabela com o novo item
});

/*
  =======================================================
  5. RENDERIZAR TABELA E RECALCULAR TOTAL GERAL
  Sempre que a lista de itens muda, esta função recria
  a tabela do zero e soma tudo.
  =======================================================
*/
function atualizarTabelaEValores() {
  corpoItensTabela.innerHTML = ""; // Limpa antes de redesenhar
  valorTotalOrcamentoCalculado = 0; // Zera o total

  itensDoOrcamentoAtual.forEach(function (item, index) {
    // Acumula no total geral
    valorTotalOrcamentoCalculado += item.vl_total;

    const linha = document.createElement("tr");
    linha.innerHTML = `
      <td>${item.produtoid}</td>
      <td>${item.produtodesc}</td>
      <td>${item.qt_produto.toFixed(2)}</td>
      <td>${item.vl_unitario.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</td>
      <td>${item.vl_total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</td>
      <td class="no-print">
        <button type="button" class="btn-excluir" data-index="${index}">Remover</button>
      </td>
    `;
    corpoItensTabela.appendChild(linha);
  });

  // Atualiza o texto do total geral na tela
  txtValorTotalGeral.textContent = valorTotalOrcamentoCalculado.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

/*
  =======================================================
  6. REMOVER ITEM DA LISTA
  Usa delegação de evento: ouvimos o click no tbody
  e verificamos qual botão foi clicado pelo data-index.
  =======================================================
*/
corpoItensTabela.addEventListener("click", function (e) {
  if (e.target.classList.contains("btn-excluir")) {
    const indexParaRemover = parseInt(e.target.getAttribute("data-index"));
    // splice(posição, quantos remover) — remove 1 item no índice
    itensDoOrcamentoAtual.splice(indexParaRemover, 1);
    atualizarTabelaEValores(); // Recalcula o total após remover
  }
});

/*
  =======================================================
  7. SALVAR ORÇAMENTO NO BANCO (Operação mestre/detalhe)
  Primeiro salva o cabeçalho (orcamento) e pega o ID gerado.
  Depois salva todos os itens usando esse ID.
  =======================================================
*/
formOrcamento.addEventListener("submit", async function (evento) {
  evento.preventDefault();

  if (!selectCliente.value) {
    mostrarMensagem("Selecione um cliente antes de salvar.", "erro");
    return;
  }

  if (itensDoOrcamentoAtual.length === 0) {
    mostrarMensagem("Adicione ao menos um item ao orçamento antes de salvar.", "erro");
    return;
  }

  const dataOrcamento =
    document.getElementById("data-orcamento").value;

  const dataValidade =
    document.getElementById("data-validade").value;

  if (dataValidade < dataOrcamento) {
    mostrarMensagem(
      "A data de validade não pode ser anterior à data do orçamento.",
      "erro"
    );
    return;
  }

  // PASSO 1: Salva o cabeçalho do orçamento
  const dadosMestre = {
    clienteid: parseInt(selectCliente.value),
    dt_orcamento: new Date(document.getElementById("data-orcamento").value).toISOString(),
    dt_validade_orcamento: new Date(document.getElementById("data-validade").value).toISOString(),
    vl_total_orcamento: valorTotalOrcamentoCalculado
  };

  let idDoOrcamentoGerado;

  if (orcamentoEmEdicao) {

    const { error: errUpdate } =
      await supabaseClient
        .from("orcamento")
        .update(dadosMestre)
        .eq("orcamentoid", orcamentoEmEdicao);

    if (errUpdate) {
      mostrarMensagem(
        "Erro ao atualizar orçamento: " +
        errUpdate.message,
        "erro"
      );
      return;
    }

    idDoOrcamentoGerado = orcamentoEmEdicao;

  } else {

    const { data: orcamentoCriado, error: errMestre } =
      await supabaseClient
        .from("orcamento")
        .insert(dadosMestre)
        .select("orcamentoid")
        .single();

    if (errMestre) {
      mostrarMensagem(
        "Erro ao salvar orçamento: " +
        errMestre.message,
        "erro"
      );
      return;
    }

    idDoOrcamentoGerado =
      orcamentoCriado.orcamentoid;
  }

  // PASSO 2: Salva os itens usando o ID do orçamento recém-criado
  const itensProntos = itensDoOrcamentoAtual.map(function (item, index) {
    return {
      orcamentoid: idDoOrcamentoGerado,
      orcamentoitemid: index + 1,
      produtoid: item.produtoid,
      produtodesc: item.produtodesc,
      qt_produto: item.qt_produto,
      vl_unitario: item.vl_unitario,
      vl_total: item.vl_total
    };
  });

  if (orcamentoEmEdicao) {

    await supabaseClient
      .from("orcamento_item")
      .delete()
      .eq("orcamentoid", orcamentoEmEdicao);

  }

  const { error: errDetalhes } = await supabaseClient
    .from("orcamento_item")
    .insert(itensProntos);

  if (errDetalhes) {
    mostrarMensagem("Erro ao salvar itens do orçamento: " + errDetalhes.message, "erro");
    return;
  }

  mostrarMensagem("Orçamento salvo com sucesso! (Nº " + idDoOrcamentoGerado + ")", "sucesso");

  // Limpa tudo para um novo orçamento
  formOrcamento.reset();
  itensDoOrcamentoAtual = [];
  atualizarTabelaEValores();
  configurarDatasAutomaticas();
});

/*
  =======================================================
  8. IMPRESSÃO
  Preenche os campos da folha timbrada e abre o diálogo de impressão.
  =======================================================
*/
btnImprimir.addEventListener("click", function () {
  if (!selectCliente.value) {
    mostrarMensagem("Selecione um cliente antes de imprimir.", "erro");
    return;
  }
  if (itensDoOrcamentoAtual.length === 0) {
    mostrarMensagem("Adicione ao menos um item antes de imprimir.", "erro");
    return;
  }

  // Pega o texto do option selecionado (nome do cliente)
  const nomeCliente = selectCliente.options[selectCliente.selectedIndex].text;
  const dataOrcRaw = document.getElementById("data-orcamento").value;
  const dataValRaw = document.getElementById("data-validade").value;

  // Converte de YYYY-MM-DD para DD/MM/YYYY
  function formatarData(raw) {
    if (!raw) return "--/--/----";
    const [ano, mes, dia] = raw.split("-");
    return `${dia}/${mes}/${ano}`;
  }

  document.getElementById("print-nome-cliente").textContent = nomeCliente;
  document.getElementById("print-data-emissao").textContent = formatarData(dataOrcRaw);
  document.getElementById("print-data-validade").textContent = formatarData(dataValRaw);

  window.print(); // Abre o diálogo de impressão do navegador
});

// Inicialização: carrega clientes e produtos ao abrir a tela
carregarDadosIniciais();