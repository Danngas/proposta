/**
 * ui.js
 * Renderização de resultados e manipulação do DOM
 * Autor: Daniel Silva de Souza
 */

// ─── Fase / Taxa mínima ───────────────────────────────────────────────────────

let currentFase = null;

/**
 * Seleciona o tipo de ligação e atualiza UI.
 * Chamado pelo onclick nos botões de fase no HTML.
 * @param {HTMLElement} btn
 */
function selectFase(btn) {
  document.querySelectorAll('.fase-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  currentFase = btn.dataset.fase;

  const taxa    = TAXA_MINIMA[currentFase] ?? 0;
  const infoEl  = document.getElementById('taxa-info');
  const taxaVal = document.getElementById('taxa-val');

  if (currentFase === 'ignorar') {
    infoEl.classList.remove('visible');
  } else {
    taxaVal.textContent = taxa;
    infoEl.classList.add('visible');
  }
}

// ─── Erros ───────────────────────────────────────────────────────────────────

function showError(msg) {
  const el = document.getElementById('error-msg');
  el.textContent = msg;
  el.classList.add('visible');
}

function clearError() {
  document.getElementById('error-msg').classList.remove('visible');
}

// ─── Resultados ──────────────────────────────────────────────────────────────

function clearResults() {
  document.getElementById('results-section').classList.remove('visible');
  clearError();
}

/**
 * Exibe os resultados do dimensionamento na UI.
 * @param {SizingResult} result
 * @param {Object}       irr    - { irradiacaoMediaDiaria }
 * @param {number}       geracaoInput - valor original digitado pelo usuário
 */

function renderResults(result, irr, geracaoInput) {
  const nomesFase = { mono: 'Monofásico', bi: 'Bifásico', tri: 'Trifásico', ignorar: 'Ignorada' };

  // Cards principais
  document.getElementById('r-modulos').innerHTML = `${result.quantidadeModulos}<span class="result-unit">un</span>`;
  document.getElementById('r-kwp').innerHTML = `${result.potenciaTotalKwp.toFixed(2)}<span class="result-unit">kWp</span>`;
  document.getElementById('r-geracao').innerHTML = `${Math.round(result.geracaoEstimadaKwhMes)}<span class="result-unit">kWh/mês</span>`;

  // Detalhamento
  document.getElementById('d-geracao-input').textContent = `${geracaoInput} kWh/mês`;
  document.getElementById('d-taxa').textContent = result.taxaDescontada > 0 
    ? `${result.taxaDescontada} kWh (${nomesFase[currentFase]})` 
    : 'Não considerada';
  document.getElementById('d-geracao-ajustada').textContent = `${result.geracaoAjustada} kWh/mês`;
  document.getElementById('d-irr').textContent = `${irr.irradiacaoMediaDiaria.toFixed(3)} kWh/m²/dia`;
  document.getElementById('d-perdas').textContent = `${result.perdasPercent}%`;
  document.getElementById('d-margem').textContent = `${result.margemAplicadaPercent}%`;
  document.getElementById('d-modulo').textContent = `${document.getElementById('input-potencia').value} Wp`;

  // ==================== GRÁFICO DE GERAÇÃO MENSAL ====================
  const generationSection = document.getElementById('generation-section');
  if (generationSection && irr && irr.mensal && irr.mensal.length === 12) {
    generationSection.style.display = 'block';     // ← Correção principal
    renderGenerationChart(
      result.potenciaTotalKwp, 
      irr.mensal, 
      result.perdasPercent || 0,
      geracaoInput                    // ← Adicionado: consumo pretendido
    );
  } else {
    console.warn("⚠️ Não foi possível mostrar o gráfico de geração mensal.");
  }

  // Mostrar seção principal
  const section = document.getElementById('results-section');
  section.classList.add('visible');
  section.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
// ─── Gráfico card ────────────────────────────────────────────────────────────

function showChartCard(cidade, uf, lat, lon) {
  const card = document.getElementById('chart-card');
  card.classList.add('visible');
  document.getElementById('chart-loading').style.display = 'flex';
  document.getElementById('chart-wrap').style.display    = 'none';
  document.getElementById('chart-city-name').textContent = `${cidade}, ${uf}`;
  document.getElementById('chart-city-coords').textContent =
    `Lat: ${lat.toFixed(4)} | Lon: ${lon.toFixed(4)}`;
  document.getElementById('chart-avg-val').textContent = '...';
}

function showChartData(media) {
  document.getElementById('chart-loading').style.display = 'none';
  document.getElementById('chart-wrap').style.display    = 'block';
  document.getElementById('chart-avg-val').textContent   = media.toFixed(2);
}

function showChartError(msg) {
  document.getElementById('chart-loading').innerHTML = `⚠️ ${msg}`;
}

function hideChartCard() {
  document.getElementById('chart-card').classList.remove('visible');
}
