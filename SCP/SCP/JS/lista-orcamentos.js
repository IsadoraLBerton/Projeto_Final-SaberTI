//Configuração supabase
const SUPABASE_URL = "https://bjvhddpzkuhgbeaaqbyl.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_1JGQt__tf8nWR-jXnUnCRA_JLkO68GA";
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ── Seletores principais ──────────────────────────────────────────────────
const corpoTabela = document.getElementById("corpo-lista-orcamentos");
const inputBusca = document.getElementById("input-busca");
const filtroStatus = document.getElementById("filtro-status");
const modal = document.getElementById("modal-visualizar");
const btnFecharModal = document.getElementById("btn-fechar-modal");
const btnImprimirModal = document.getElementById("btn-imprimir-modal");

// Painel de resumo
const resumoTotal = document.getElementById("resumo-total");
const resumoValor = document.getElementById("resumo-valor");
const resumoVencidos = document.getElementById("resumo-vencidos");

// Cache com todos os orçamentos carregados (para filtrar sem nova requisição)
let cacheOrcamentos = [];

// Orçamento aberto no modal (usado no botão imprimir)
let orcamentoAberto = null;

/* ==========================================================================
   UTILITÁRIOS
   ========================================================================== */

function formatarDataISO(dataString) {
  if (!dataString) return "--/--/----";
  const d = new Date(dataString);
  return d.toLocaleDateString("pt-BR", { timeZone: "UTC" });
}

function estaVencido(dataValidade) {
  if (!dataValidade) return false;
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const val = new Date(dataValidade);
  val.setHours(0, 0, 0, 0);
  return val < hoje;
}

function moedaBR(valor) {
  return Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

 //CARREGAR HISTÓRICO DO SUPABASE
async function carregarHistoricoOrcamentos() {
  corpoTabela.innerHTML = `<tr><td colspan="7">Carregando...</td></tr>`;

  const { data, error } = await supabaseClient
    .from("orcamento")
    .select(`
      orcamentoid,
      dt_orcamento,
      dt_validade_orcamento,
      vl_total_orcamento,
      cliente ( clienteid, nome_cliente, tipo_cliente, cpf_cnpj_cliente )
    `)
    .order("orcamentoid", { ascending: false });

  if (error) {
    corpoTabela.innerHTML = `<tr><td colspan="7">Erro ao carregar: ${error.message}</td></tr>`;
    return;
  }

  if (!data || data.length === 0) {
    corpoTabela.innerHTML = `<tr><td colspan="7">Nenhum orçamento encontrado.</td></tr>`;
    atualizarResumo([]);
    return;
  }

  cacheOrcamentos = data;
  atualizarResumo(data);
  renderizarTabela(data);
}

//RENDERIZAR TABELA (RECEBE ARRAY JÁ FILTRADO)
function renderizarTabela(lista) {
  if (!lista || lista.length === 0) {
    corpoTabela.innerHTML = `<tr><td colspan="7">Nenhum orçamento encontrado para este filtro.</td></tr>`;
    return;
  }

  corpoTabela.innerHTML = "";

  lista.forEach(function (orc) {
    const vencido = estaVencido(orc.dt_validade_orcamento);
    const nomeCliente = orc.cliente ? orc.cliente.nome_cliente : "Cliente não identificado";

    const badgeHTML = vencido
      ? `<span class="badge badge-vencido"><i class="fas fa-times-circle"></i> Vencido</span>`
      : `<span class="badge badge-valido"><i class="fas fa-check-circle"></i> Válido</span>`;

    // Guarda o objeto cliente serializado no botão para evitar nova query só para abrir o modal
    const clienteJSON = JSON.stringify(orc.cliente || {}).replace(/'/g, "&#39;");

    const linha = document.createElement("tr");
    linha.innerHTML = `
      <td><strong>#${orc.orcamentoid}</strong></td>
      <td>${nomeCliente}</td>
      <td>${formatarDataISO(orc.dt_orcamento)}</td>
      <td>${formatarDataISO(orc.dt_validade_orcamento)}</td>
      <td><strong>${moedaBR(orc.vl_total_orcamento)}</strong></td>
      <td>${badgeHTML}</td>
<td>
  <button
    type="button"
    class="btn-ver-detalhes"
    data-id="${orc.orcamentoid}"
    data-emissao="${orc.dt_orcamento}"
    data-validade="${orc.dt_validade_orcamento}"
    data-total="${moedaBR(orc.vl_total_orcamento)}"
    data-cliente='${clienteJSON}'
  >
    <i class="fas fa-eye"></i> Detalhes
  </button>

  <button
    type="button"
    class="btn-editar-orcamento"
    data-id="${orc.orcamentoid}"
  >
    <i class="fas fa-edit"></i> Editar
  </button>

  <button
  type="button"
  class="btn-excluir-orcamento"
  data-id="${orc.orcamentoid}"
>
  <i class="fas fa-trash"></i> Excluir
</button>
</td>    `;
    corpoTabela.appendChild(linha);
  });
}

//ATUALIZAR PAINEL DE RESUMO
function atualizarResumo(lista) {
  const totalValor = lista.reduce((acc, o) => acc + (o.vl_total_orcamento || 0), 0);
  const qtdVencidos = lista.filter(o => estaVencido(o.dt_validade_orcamento)).length;

  resumoTotal.textContent = lista.length;
  resumoValor.textContent = moedaBR(totalValor);
  resumoVencidos.textContent = qtdVencidos;
}

//FILTRO EM TEMPO REAL (busca + select de status)
function aplicarFiltros() {
  const termo = inputBusca.value.toLowerCase().trim();
  const status = filtroStatus.value;

  const filtrado = cacheOrcamentos.filter(function (orc) {
    const nomeCliente = orc.cliente ? orc.cliente.nome_cliente.toLowerCase() : "";
    const idStr = String(orc.orcamentoid);
    const bateTermo = !termo || nomeCliente.includes(termo) || idStr.includes(termo);

    const vencido = estaVencido(orc.dt_validade_orcamento);
    const bateStatus = status === "todos"
      || (status === "valido" && !vencido)
      || (status === "vencido" && vencido);

    return bateTermo && bateStatus;
  });

  renderizarTabela(filtrado);
}

inputBusca.addEventListener("input", aplicarFiltros);
filtroStatus.addEventListener("change", aplicarFiltros);

//ABRIR MODAL DE DETALHES
corpoTabela.addEventListener("click", async function (e) {
  const btnEditar =
    e.target.closest(".btn-editar-orcamento");

  if (btnEditar) {

    const id = btnEditar.dataset.id;

    window.location.href =
      `orcamentos.html?editar=${id}`;

    return;
  }

  const btnExcluir =
    e.target.closest(".btn-excluir-orcamento");

  if (btnExcluir) {

    const id = btnExcluir.dataset.id;

    await excluirOrcamento(id);

    return;
  }

  const btn = e.target.closest(".btn-ver-detalhes");
  if (!btn) return;

  const idOrcamento = btn.getAttribute("data-id");
  const dataEmissao = btn.getAttribute("data-emissao");
  const dataValidade = btn.getAttribute("data-validade");
  const totalOrc = btn.getAttribute("data-total");
  const clienteObj = JSON.parse(btn.getAttribute("data-cliente"));

  // Guarda no cache global para o botão imprimir
  orcamentoAberto = { idOrcamento, dataEmissao, dataValidade, totalOrc, clienteObj };

  // Preenche cabeçalho do modal
  document.getElementById("modal-numero").textContent = "#" + idOrcamento;
  document.getElementById("modal-nome-cliente").textContent = clienteObj.nome_cliente || "---";
  document.getElementById("modal-tipo-cliente").textContent = clienteObj.tipo_cliente === "F"
    ? "Pessoa Física (CPF)" : "Pessoa Jurídica (CNPJ)";
  document.getElementById("modal-doc-cliente").textContent = clienteObj.cpf_cnpj_cliente || "---";
  document.getElementById("modal-data-emissao").textContent = formatarDataISO(dataEmissao);
  document.getElementById("modal-data-validade").textContent = formatarDataISO(dataValidade);
  document.getElementById("modal-total-geral").textContent = totalOrc;

  // Badge de status
  const badge = document.getElementById("modal-status-badge");
  if (estaVencido(dataValidade)) {
    badge.innerHTML = '<i class="fas fa-times-circle"></i> Proposta Expirada';
    badge.className = "badge badge-vencido";
  } else {
    badge.innerHTML = '<i class="fas fa-check-circle"></i> Proposta Válida';
    badge.className = "badge badge-valido";
  }

  // Busca os itens do orçamento
  const corpoItensModal = document.getElementById("modal-corpo-itens");
  corpoItensModal.innerHTML = `<tr><td colspan="4">Carregando produtos...</td></tr>`;
  modal.style.display = "block";

  const { data: itens, error } = await supabaseClient
    .from("orcamento_item")
    .select("produtodesc, qt_produto, vl_unitario, vl_total")
    .eq("orcamentoid", idOrcamento)
    .order("orcamentoitemid", { ascending: true });

  if (error) {
    corpoItensModal.innerHTML = `<tr><td colspan="4">Erro ao buscar itens: ${error.message}</td></tr>`;
    return;
  }

  if (!itens || itens.length === 0) {
    corpoItensModal.innerHTML = `<tr><td colspan="4">Nenhum item encontrado.</td></tr>`;
    return;
  }

  corpoItensModal.innerHTML = "";
  itens.forEach(function (item) {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${item.produtodesc}</td>
      <td>${Number(item.qt_produto).toFixed(2)}</td>
      <td>${moedaBR(item.vl_unitario)}</td>
      <td><strong>${moedaBR(item.vl_total)}</strong></td>
    `;
    corpoItensModal.appendChild(row);
  });
});

//FECHAR MODAL
function fecharModal() {
  modal.style.display = "none";
  orcamentoAberto = null;
}

btnFecharModal.addEventListener("click", fecharModal);
window.addEventListener("click", function (e) {
  if (e.target === modal) fecharModal();
});

//IMPRESSÃO DO ORÇAMENTO SELECIONADO
btnImprimirModal.addEventListener("click", function () {
  if (!orcamentoAberto) return;

  const { idOrcamento, dataEmissao, dataValidade, totalOrc, clienteObj } = orcamentoAberto;

  // Preenche a área de impressão invisível com os dados do modal
  document.getElementById("print-numero").textContent = "#" + idOrcamento;
  document.getElementById("print-nome-cliente").textContent = clienteObj.nome_cliente || "---";
  document.getElementById("print-tipo-cliente").textContent = clienteObj.tipo_cliente === "F"
    ? "Pessoa Física (CPF)" : "Pessoa Jurídica (CNPJ)";
  document.getElementById("print-doc-cliente").textContent = clienteObj.cpf_cnpj_cliente || "---";
  document.getElementById("print-data-emissao").textContent = formatarDataISO(dataEmissao);
  document.getElementById("print-data-validade").textContent = formatarDataISO(dataValidade);
  document.getElementById("print-total").textContent = totalOrc;

  // Clona as linhas do modal para a tabela de impressão
  const printCorpo = document.getElementById("print-corpo-itens");
  printCorpo.innerHTML = document.getElementById("modal-corpo-itens").innerHTML;

  fecharModal();
  window.print();
});

async function excluirOrcamento(idOrcamento) {

  const confirmou = confirm(
    "Deseja realmente excluir este orçamento?"
  );

  if (!confirmou) return;

  // Exclui os itens primeiro
  const { error: erroItens } = await supabaseClient
    .from("orcamento_item")
    .delete()
    .eq("orcamentoid", idOrcamento);

  if (erroItens) {
    alert("Erro ao excluir itens: " + erroItens.message);
    return;
  }

  // Exclui o orçamento
  const { error: erroOrcamento } = await supabaseClient
    .from("orcamento")
    .delete()
    .eq("orcamentoid", idOrcamento);

  if (erroOrcamento) {
    alert("Erro ao excluir orçamento: " + erroOrcamento.message);
    return;
  }

  alert("Orçamento excluído com sucesso!");

  carregarHistoricoOrcamentos();
}

//INICIALIZAÇÃO
carregarHistoricoOrcamentos();
