/**
 * app.js - Versão corrigida com OFFLINE Bahia prioritário
 */

let selectedEstado = null;
let selectedCidade = null;
let currentIrr     = null;

// ─── Navegação ───────────────────────────────────────────────────────────────
function goTo(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(`page-${page}`).classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ─── Inicialização ───────────────────────────────────────────────────────────
async function init() {
  await initData();
  setupAutocompletes();
}

// ─── Autocompletes (sem mudança) ─────────────────────────────────────────────
function setupAutocompletes() {
  makeAutocomplete(
    'input-estado',
    'list-estado',
    () => ESTADOS.map(e => ({ label: `${e.estado} (${e.uf})`, data: e })),
    (item) => {
      selectedEstado = item.data;
      selectedCidade = null;
      currentIrr     = null;

      const inputCidade = document.getElementById('input-cidade');
      inputCidade.value = '';
      inputCidade.placeholder = 'Digite o município...';
      inputCidade.disabled = false;

      hideChartCard();
      destroyIrrChart();
      clearResults();
    }
  );

  makeAutocomplete(
    'input-cidade',
    'list-cidade',
    () => {
      if (!selectedEstado) return [];
      return (MUNICIPIOS[selectedEstado.uf] || []).map(c => ({ label: c.nome, data: c }));
    },
    async (item) => {
      selectedCidade = item.data;
      currentIrr     = null;
      clearResults();
      await carregarIrradiacao(selectedCidade.lat, selectedCidade.lon);
    }
  );
}

// ─── CARREGAMENTO DE IRRADIAÇÃO (VERSÃO CORRIGIDA) ───────────────────────────
async function carregarIrradiacao(lat, lon) {
  showChartCard(selectedCidade.nome, selectedEstado.uf, lat, lon);

  // ==================== OFFLINE PARA BAHIA (PRIORIDADE MÁXIMA) ====================
  if (selectedEstado.uf === 'BA' && IRRADIACAO_BA[selectedCidade.nome]) {
    const data = IRRADIACAO_BA[selectedCidade.nome];

    currentIrr = {
      irradiacaoMediaDiaria: data.irradiacaoMediaDiaria,
      mensal: data.mensal,
      fonte: 'offline-bahia',
      lat: data.lat,
      lon: data.lon,
    };

    console.log(`✅ [OFFLINE BAHIA] Usando dados locais para: ${selectedCidade.nome}`);
    
    showChartData(currentIrr.irradiacaoMediaDiaria);
    renderIrrChart(currentIrr.mensal, currentIrr.irradiacaoMediaDiaria);
    return;   // ← Sai aqui! Não tenta PVGIS
  }

  // ==================== ONLINE (outros estados ou falha no offline) ====================
  console.log(`🌐 Tentando PVGIS online para ${selectedCidade.nome}...`);

  try {
    const irr = await getIrradiation(lat, lon);
    currentIrr = irr;
    showChartData(irr.irradiacaoMediaDiaria);
    renderIrrChart(irr.mensal, irr.irradiacaoMediaDiaria);
  } catch (err) {
    console.error('[PVGIS] Erro:', err);
    showChartError('Não foi possível buscar os dados de irradiação. Verifique sua conexão.');
    currentIrr = null;
  }
}

// ─── Calcular (sem mudança importante) ───────────────────────────────────────
// ─── Calcular ────────────────────────────────────────────────────────────────

function calcular() {
  clearResults();

  // Validações de contexto
  if (!selectedEstado || !selectedCidade)
    return showError('Selecione o estado e o município para continuar.');

  if (!currentIrr)
    return showError('Aguarde o carregamento dos dados de irradiação solar do município selecionado.');

  if (!currentFase)
    return showError('Selecione o tipo de ligação (Monofásico, Bifásico, Trifásico ou Ignorar).');

  // Leitura dos inputs
  const geracaoInput = parseFloat(document.getElementById('input-geracao').value);
  const potModulo    = parseFloat(document.getElementById('input-potencia').value);
  const perdas       = parseFloat(document.getElementById('input-perdas').value);
  const margem       = parseFloat(document.getElementById('input-margem').value);
  const dias         = parseInt(document.getElementById('input-dias').value);

  // Validações dos inputs
  if (!geracaoInput || geracaoInput <= 0)
    return showError('Informe a geração pretendida em kWh/mês.');
  if (!potModulo || potModulo <= 0)
    return showError('Informe a potência do módulo em Wp.');
  if (isNaN(perdas) || perdas < 0 || perdas >= 100)
    return showError('Perdas inválidas. Informe um valor entre 0 e 99%.');
  if (isNaN(margem) || margem < 0 || margem >= 100)
    return showError('Margem inválida. Informe um valor entre 0 e 99%.');
  if (!dias || dias <= 0 || dias > 31)
    return showError('Dias do mês inválidos. Informe um valor entre 1 e 31.');

  // Cálculo — sizing.js
  let result;
  try {
    result = calcularDimensionamento({
      geracaoDesejadaKwhMes:  geracaoInput,
      potenciaModuloW:        potModulo,
      irradiacaoMediaDiaria:  currentIrr.irradiacaoMediaDiaria,
      diasMes:                dias,
      perdasPercent:          perdas,
      margemPercent:          margem,
      tipoLigacao:            currentFase,
    });
  } catch (err) {
    return showError(err.message);
  }

  // Renderizar — ui.js
  renderResults(result, currentIrr, geracaoInput);
}

// ─── Boot ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', init);