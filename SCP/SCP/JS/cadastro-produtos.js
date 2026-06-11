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

// Inputs do formulário
const idInputHidden = document.getElementById("produto-id");
const descricaoInput = document.getElementById("descricao-simples");
const observacaoInput = document.getElementById("descricao-completa");
const valorInput = document.getElementById("valor-venda");
const statusInput = document.getElementById("status-produto");

//FUNÇÃO PARA MOSTRAR MENSAGEM NA TELA
function mostrarMensagem(texto, tipo) {
  mensagemDiv.textContent = texto;
  mensagemDiv.className = "mensagem " + tipo;
}

//CARREGAR CATEGORIAS 
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
    opcao.value = categoria.categoriaprodutoid;
    opcao.textContent = categoria.ds_categoria_produto;
    selectCategoria.appendChild(opcao);
  });
}

//CARREGAR PRODUTOS NA TABELA (Read do CRUD)
async function carregarProdutos() {
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

    const dataFormatada = new Date(produto.dt_cadastro_produto).toLocaleDateString("pt-BR");

    // Formata o valor para moeda brasileira
    const valorFormatado = parseFloat(produto.vl_venda_produto).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });

    // Pega o nome da categoria
    const nomeCategoria = produto.categoria_produto
      ? produto.categoria_produto.ds_categoria_produto
      : "Sem Categoria";

    // Define a classe do badge de status (ativo ou inativo) 
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

//PREPARAR EDIÇÃO
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

//LIMPAR FORMULÁRIO
function limparFormulario() {
  formProduto.reset();
  idProdutoEditando = null;
  idInputHidden.value = "";
  btnSalvar.textContent = "Salvar";
  mostrarMensagem("", "");
}

//SALVAR OU ATUALIZAR
formProduto.addEventListener("submit", async function (evento) {
  evento.preventDefault();

  // Validação manual — verifica campos obrigatórios
  if (!selectCategoria.value || !descricaoInput.value || !valorInput.value || !statusInput.value) {
    mostrarMensagem("Preencha todos os campos obrigatórios.", "erro");
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
    mostrarMensagem("Produto atualizado com sucesso!", "sucesso");
  } else {
    const { error } = await supabaseClient
      .from("produto")
      .insert(dadosProduto);

    if (error) {
      mostrarMensagem("Erro ao cadastrar produto: " + error.message, "erro");
      return;
    }
    mostrarMensagem("Produto cadastrado com sucesso!", "sucesso");
  }

  limparFormulario();
  carregarProdutos();
});

//EXCLUIR PRODUTO
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

  mostrarMensagem("Produto removido com sucesso!", "sucesso");
  carregarProdutos();
}

formProduto.addEventListener("reset", function () {
  setTimeout(limparFormulario, 10);
});

// Carrega categorias no select E produtos na tabela ao abrir a tela
async function inicializarTela() {
  await carregarCategoriasNoSelect();
  await carregarProdutos();
}

inicializarTela();

//FILTRO PARA PESQUISA NA TABELA
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