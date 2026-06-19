// Configuração do Supabase
const SUPABASE_URL = "https://bjvhddpzkuhgbeaaqbyl.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_1JGQt__tf8nWR-jXnUnCRA_JLkO68GA";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Pega os elementos do HTML pelo ID
const formCategoria = document.getElementById("form-categoria");
const tabelaCategoriasCorpo = document.getElementById("tabela-categorias-corpo");
const btnSalvar = document.getElementById("btn-salvar");
const mensagemDiv = document.getElementById("mensagem"); // <-- agora usa a div, não alert!

// Inputs do formulário
const descricaoInput = document.getElementById("descricao-categoria");

// Variável de controle: guarda o ID do registro que está sendo editado.
// Quando é null, significa que vamos INSERIR. Quando tem número, vamos ATUALIZAR.
let idCategoriaEditando = null;
let resetAutomatico = false;
let temporizadorMensagem = null;

//FUNÇÃO PARA MOSTRAR MENSAGEM NA TELA
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

//CARREGAR CATEGORIAS
async function carregarCategorias() {
  const { data, error } = await supabaseClient
    .from("categoria_produto")
    .select("categoriaprodutoid, ds_categoria_produto")
    .order("categoriaprodutoid", { ascending: true });

  if (error) {
    tabelaCategoriasCorpo.innerHTML = `<tr><td colspan="3">Erro ao carregar categorias.</td></tr>`;
    mostrarMensagem("Erro ao buscar categorias: " + error.message, "erro");
    return;
  }

  if (data.length === 0) {
    tabelaCategoriasCorpo.innerHTML = `<tr><td colspan="3">Nenhuma categoria cadastrada ainda.</td></tr>`;
    return;
  }

  // Limpa antes de preencher para não duplicar linhas
  tabelaCategoriasCorpo.innerHTML = "";

  // Para cada categoria do banco, cria uma linha HTML dinamicamente
  data.forEach(function (categoria) {
    const linha = document.createElement("tr");

    linha.innerHTML = `
      <td>${categoria.categoriaprodutoid}</td>
      <td>${categoria.ds_categoria_produto}</td>
      <td class="coluna-acoes"></td>
    `;

    // Cria o botão Editar e define o que acontece ao clicar
    const botaoEditar = document.createElement("button");
    botaoEditar.textContent = "Editar";
    botaoEditar.className = "btn-editar";
    botaoEditar.type = "button";
    botaoEditar.addEventListener("click", function () {
      prepararEdicao(categoria);
    });

    // Cria o botão Excluir e define o que acontece ao clicar
    const botaoExcluir = document.createElement("button");
    botaoExcluir.textContent = "Excluir";
    botaoExcluir.className = "btn-excluir";
    botaoExcluir.type = "button";
    botaoExcluir.addEventListener("click", function () {
      excluirCategoria(categoria);
    });

    // Adiciona os botões dentro da célula de ações
    const celulaAcoes = linha.querySelector(".coluna-acoes");
    celulaAcoes.appendChild(botaoEditar);
    celulaAcoes.appendChild(botaoExcluir);

    tabelaCategoriasCorpo.appendChild(linha);
  });
}

//PREPARAR EDIÇÃO 
function prepararEdicao(categoria) {
  idCategoriaEditando = categoria.categoriaprodutoid;
  descricaoInput.value = categoria.ds_categoria_produto;
  btnSalvar.textContent = "Atualizar";
  mostrarMensagem("Editando: " + categoria.ds_categoria_produto, "sucesso");
  // Rola a página para cima para o usuário ver o formulário preenchido
  window.scrollTo({ top: 0, behavior: "smooth" });
}

//LIMPAR FORMULÁRIO / CANCELAR EDIÇÃO
function limparFormulario(limparMensagem = true) {
  resetAutomatico = true;
  formCategoria.reset();
  resetAutomatico = false;
  idCategoriaEditando = null;
  btnSalvar.textContent = "Salvar";
  if (limparMensagem) {
    mostrarMensagem("", "");
  }
}

//SALVAR OU ATUALIZAR
formCategoria.addEventListener("submit", async function (evento) {
  // Impede o comportamento padrão do formulário (recarregar a página)
  evento.preventDefault();

  const descricaoTexto = descricaoInput.value.trim();
  if (!descricaoTexto) {
    mostrarMensagem("Por favor, digite uma descrição para a categoria.", "erro");
    return;
  }

  // Objeto com os dados que vão para o banco
  const dadosCategoria = {
    ds_categoria_produto: descricaoTexto
  };

  // Se idCategoriaEditando tem valor, é UPDATE. Se é null, é INSERT.
  if (idCategoriaEditando !== null) {
    const { error } = await supabaseClient
      .from("categoria_produto")
      .update(dadosCategoria)
      .eq("categoriaprodutoid", idCategoriaEditando);

    if (error) {
      mostrarMensagem("Erro ao atualizar categoria: " + error.message, "erro");
      return;
    }
    mostrarMensagem("Categoria atualizada com sucesso!", "sucesso", true);
  } else {
    const { error } = await supabaseClient
      .from("categoria_produto")
      .insert(dadosCategoria);

    if (error) {
      mostrarMensagem("Erro ao cadastrar categoria: " + error.message, "erro");
      return;
    }
    mostrarMensagem("Categoria cadastrada com sucesso!", "sucesso", true);
  }

  limparFormulario(false);
  carregarCategorias(); // Atualiza a tabela logo abaixo
});

//EXCLUIR CATEGORIA 
async function excluirCategoria(categoria) {
  // Confirmação antes de excluir
  const confirmou = confirm(`Deseja realmente excluir a categoria "${categoria.ds_categoria_produto}"?`);
  if (!confirmou) return;

  const { error } = await supabaseClient
    .from("categoria_produto")
    .delete()
    .eq("categoriaprodutoid", categoria.categoriaprodutoid);

  if (error) {
    mostrarMensagem("Não foi possível excluir. Verifique se nenhum produto usa esta categoria.", "erro");
    return;
  }

  // Se o usuário estava editando justamente essa categoria, limpa o formulário
  if (idCategoriaEditando === categoria.categoriaprodutoid) {
    limparFormulario();
  }

  mostrarMensagem("Categoria removida com sucesso!", "sucesso", true);
  carregarCategorias();
}

// Quando o botão Limpar/Reset é clicado, também reseta as variáveis de controle
formCategoria.addEventListener("reset", function () {
  if (resetAutomatico) return;

  setTimeout(function () {
    idCategoriaEditando = null;
    btnSalvar.textContent = "Salvar";
    mostrarMensagem("", "");
  }, 10);
});

// Executa ao abrir a página: carrega as categorias já cadastradas
carregarCategorias();

function filtrarTabela() {
  const textoBusca = document.getElementById("campo-busca").value.toLowerCase();
  const linhas = document.querySelectorAll("#tabela-categorias-corpo tr");

  linhas.forEach(function (linha) {
    const textoDaLinha = linha.textContent.toLowerCase();
    if (textoDaLinha.includes(textoBusca)) {
      linha.style.display = "";
    } else {
      linha.style.display = "none";
    }
  });
}

document.getElementById("campo-busca").addEventListener("input", filtrarTabela);
