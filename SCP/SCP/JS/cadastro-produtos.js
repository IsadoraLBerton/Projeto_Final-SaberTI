// Configuração do Supabase
const SUPABASE_URL = "https://bjvhddpzkuhgbeaaqbyl.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_1JGQt__tf8nWR-jXnUnCRA_JLkO68GA";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Pega os elementos do HTML
const formProduto = document.getElementById("form-produto");
const selectCategoria = document.getElementById("categoria-codigo");
const tabelaProdutosCorpo = document.getElementById("tabela-produtos-corpo");
const btnSalvar = document.getElementById("btn-salvar");
const mensagemDiv = document.getElementById("mensagem");

// Variável de controle: null = inserir, número = editar
let idProdutoEditando = null;
let resetAutomatico = false;
let temporizadorMensagem = null;

// Inputs do formulário
const idInputHidden = document.getElementById("produto-id");
const descricaoInput = document.getElementById("descricao-simples");
const observacaoInput = document.getElementById("descricao-completa");
const valorInput = document.getElementById("valor-venda");
const statusInput = document.getElementById("status-produto");

/*
  ============================================
  FUNÇÃO PARA MOSTRAR MENSAGEM NA TELA
  ============================================
*/
function mostrarMensagem(texto, tipo, sumirDepois = false) {
  clearTimeout(temporizadorMensagem);

  mensagemDiv.textContent = texto;
  mensagemDiv.className = "mensagem " + tipo;

  if (sumirDepois) {
    temporizadorMensagem = setTimeout(function () {
      mostrarMensagem("", "");
    }, 3000);
  }
}

/*
  =======================================================
  1. CARREGAR CATEGORIAS NO SELECT
  Busca as categorias do banco e preenche o <select>
  para o usuário poder escolher ao cadastrar um produto.
  =======================================================
*/
async function carregarCategoriasNoSelect() {
  const { data, error } = await supabaseClient
    .from("categoria_produto")
    .select("categoriaprodutoid, ds_categoria_produto")
    .order("ds_categoria_produto", { ascending: true });

  if (error) {
    console.error("Erro ao carregar categorias:", error.message);
    return;
  }

  // Limpa e recarrega o select mantendo a opção padrão
  selectCategoria.innerHTML = '<option value="">Selecionar</option>';

  data.forEach(function (categoria) {
    const opcao = document.createElement("option");
    opcao.value = categoria.categoriaprodutoid; // O VALUE guarda o ID (número)
    opcao.textContent = categoria.ds_categoria_produto; // O TEXTO mostra o nome
    selectCategoria.appendChild(opcao);
  });
}

/*
  =======================================================
  2. CARREGAR PRODUTOS NA TABELA (Read do CRUD)
  =======================================================
*/
async function carregarProdutos() {
  // O asterisco após "categoria_produto" é uma JOIN automática do Supabase:
  // ele vai buscar o nome da categoria usando o relacionamento pelo ID
  const { data, error } = await supabaseClient
    .from("produto")
    .select(`
      produtoid,
      ds_produto,
      obs_produto,
      vl_venda_produto,
      dt_cadastro_produto,
      status_produto,
      categoriaprodutoid,
      categoria_produto ( ds_categoria_produto )
    `)
    .order("produtoid", { ascending: true });

  if (error) {
    tabelaProdutosCorpo.innerHTML = `<tr><td colspan="7">Erro ao carregar produtos.</td></tr>`;
    mostrarMensagem("Erro ao buscar produtos: " + error.message, "erro");
    return;
  }

  if (data.length === 0) {
    tabelaProdutosCorpo.innerHTML = `<tr><td colspan="7">Nenhum produto cadastrado ainda.</td></tr>`;
    return;
  }

  tabelaProdutosCorpo.innerHTML = "";

  data.forEach(function (produto) {
    const linha = document.createElement("tr");

    // Formata a data de ISO (2025-02-18) para o padrão brasileiro (18/02/2025)
    const dataFormatada = new Date(produto.dt_cadastro_produto).toLocaleDateString("pt-BR");

    // Formata o valor para moeda brasileira: R$ 1.234,56
    const valorFormatado = parseFloat(produto.vl_venda_produto).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });

    // Pega o nome da categoria que veio do relacionamento
    const nomeCategoria = produto.categoria_produto
      ? produto.categoria_produto.ds_categoria_produto
      : "Sem Categoria";

    // Define a classe do badge de status (ativo ou inativo) — o CSS vai colorir
    const classeStatus = produto.status_produto.toUpperCase() === "ATIVO" ? "ativo" : "inativo";

    linha.innerHTML = `
      <td>${produto.produtoid}</td>
      <td>${nomeCategoria}</td>
      <td>${produto.ds_produto}</td>
      <td>${valorFormatado}</td>
      <td>${dataFormatada}</td>
      <td><span class="status-badge ${classeStatus}">${produto.status_produto}</span></td>
      <td class="coluna-acoes"></td>
    `;

    const botaoEditar = document.createElement("button");
    botaoEditar.textContent = "Editar";
    botaoEditar.className = "btn-editar";
    botaoEditar.type = "button";
    botaoEditar.addEventListener("click", function () {
      prepararEdicao(produto);
    });

    const botaoExcluir = document.createElement("button");
    botaoExcluir.textContent = "Excluir";
    botaoExcluir.className = "btn-excluir";
    botaoExcluir.type = "button";
    botaoExcluir.addEventListener("click", function () {
      excluirProduto(produto);
    });

    linha.querySelector(".coluna-acoes").appendChild(botaoEditar);
    linha.querySelector(".coluna-acoes").appendChild(botaoExcluir);

    tabelaProdutosCorpo.appendChild(linha);
  });
}

/*
  =======================================================
  3. PREPARAR EDIÇÃO
  Preenche o formulário com os dados do produto clicado.
  =======================================================
*/
function prepararEdicao(produto) {
  idProdutoEditando = produto.produtoid;
  idInputHidden.value = produto.produtoid;

  selectCategoria.value = produto.categoriaprodutoid;
  descricaoInput.value = produto.ds_produto;
  observacaoInput.value = produto.obs_produto || "";
  valorInput.value = produto.vl_venda_produto;
  statusInput.value = produto.status_produto;

  btnSalvar.textContent = "Atualizar";
  mostrarMensagem("Editando: " + produto.ds_produto, "sucesso");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

/*
  =======================================================
  4. LIMPAR FORMULÁRIO
  =======================================================
*/
function limparFormulario(limparMensagem = true) {
  resetAutomatico = true;
  formProduto.reset();
  resetAutomatico = false;
  idProdutoEditando = null;
  idInputHidden.value = "";
  btnSalvar.textContent = "Salvar";
  if (limparMensagem) {
    mostrarMensagem("", "");
  }
}

/*
  =======================================================
  5. SALVAR OU ATUALIZAR
  =======================================================
*/
formProduto.addEventListener("submit", async function (evento) {
  evento.preventDefault();

  // Validação manual — verifica campos obrigatórios
  if (!selectCategoria.value || !descricaoInput.value || !valorInput.value || !statusInput.value) {
    mostrarMensagem("Preencha todos os campos obrigatórios (*).", "erro");
    return;
  }

  // Monta o objeto com os dados para enviar ao banco
  const dadosProduto = {
    categoriaprodutoid: parseInt(selectCategoria.value),
    ds_produto: descricaoInput.value.trim(),
    obs_produto: observacaoInput.value.trim(),
    vl_venda_produto: parseFloat(valorInput.value),
    status_produto: statusInput.value,
    dt_cadastro_produto: new Date().toISOString()
  };

  if (idProdutoEditando !== null) {
    const { error } = await supabaseClient
      .from("produto")
      .update(dadosProduto)
      .eq("produtoid", idProdutoEditando);

    if (error) {
      mostrarMensagem("Erro ao atualizar produto: " + error.message, "erro");
      return;
    }
    mostrarMensagem("Produto atualizado com sucesso!", "sucesso", true);
  } else {
    const { error } = await supabaseClient
      .from("produto")
      .insert(dadosProduto);

    if (error) {
      mostrarMensagem("Erro ao cadastrar produto: " + error.message, "erro");
      return;
    }
    mostrarMensagem("Produto cadastrado com sucesso!", "sucesso", true);
  }

  limparFormulario(false);
  carregarProdutos();
});

/*
  =======================================================
  6. EXCLUIR PRODUTO
  =======================================================
*/
async function excluirProduto(produto) {
  const confirmou = confirm(`Deseja realmente excluir o produto "${produto.ds_produto}"?`);
  if (!confirmou) return;

  const { error } = await supabaseClient
    .from("produto")
    .delete()
    .eq("produtoid", produto.produtoid);

  if (error) {
    mostrarMensagem("Erro ao excluir produto. Verifique se ele não está em algum orçamento.", "erro");
    return;
  }

  if (idProdutoEditando === produto.produtoid) {
    limparFormulario();
  }

  mostrarMensagem("Produto removido com sucesso!", "sucesso", true);
  carregarProdutos();
}

formProduto.addEventListener("reset", function () {
  if (resetAutomatico) return;

  setTimeout(function () {
    idProdutoEditando = null;
    idInputHidden.value = "";
    btnSalvar.textContent = "Salvar";
    mostrarMensagem("", "");
  }, 10);
});

// Carrega categorias no select E produtos na tabela ao abrir a tela
async function inicializarTela() {
  await carregarCategoriasNoSelect();
  await carregarProdutos();
}

inicializarTela();

function filtrarTabela() {
  const textoBusca = document.getElementById("campo-busca").value.toLowerCase();
  const statusFiltro = document.getElementById("filtro-status").value.toLowerCase();
  const linhas = document.querySelectorAll("#tabela-produtos-corpo tr");

  linhas.forEach(function (linha) {
    const textoDaLinha = linha.textContent.toLowerCase();

    const combinaTexto = textoDaLinha.includes(textoBusca);
    // Se o select está em "Todos" (valor vazio), aceita qualquer status
    const combinaStatus = statusFiltro === "" || textoDaLinha.includes(statusFiltro);

    if (combinaTexto && combinaStatus) {
      linha.style.display = "";
    } else {
      linha.style.display = "none";
    }
  });
}

document.getElementById("campo-busca").addEventListener("input", filtrarTabela);
document.getElementById("filtro-status").addEventListener("change", filtrarTabela);