/**
 * geracao.js
 * Extraído e adaptado do projeto solarcalc — mantém somente o necessário
 * para alimentar a página "Estimativa de Geração" da proposta.
 *
 * Fluxo:
 *  1) Usuário escolhe Estado + Município (autocomplete)
 *  2) resolverIrradiacao() busca a irradiação solar:
 *       - Bahia -> base offline (data/irradiacao_bahia.json)
 *       - outros estados -> API PVGIS (via pvgis.js)
 *  3) calcularGeracao() aplica a fórmula de dimensionamento fotovoltaico
 *     sobre a irradiação encontrada, gerando os números da página.
 */

let ESTADOS = [];
let MUNICIPIOS = {};
let IRRADIACAO_BA = {};

let estadoSelecionado = null;   // { uf, estado }
let municipioSelecionado = null; // { nome, lat, lon }
let irradiacaoAtual = null;      // { irradiacaoMediaDiaria, mensal[12], fonte }

const DIAS_POR_MES = [31,28,31,30,31,30,31,31,30,31,30,31];
const NOMES_MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

// ── Carregamento dos dados geográficos e da base offline da Bahia ──────────
async function carregarBaseGeografica(){
  try{
    const [estResp, munResp, baResp] = await Promise.all([
      fetch('data/estados.json'),
      fetch('data/municipios.json'),
      fetch('data/irradiacao_bahia.json')
    ]);
    ESTADOS = await estResp.json();
    MUNICIPIOS = await munResp.json();
    IRRADIACAO_BA = await baResp.json();
  }catch(err){
    console.warn('[geracao.js] Não foi possível carregar a base geográfica (estados/municípios/irradiação BA).', err);
  }
}

// ── Autocomplete de Estado e Município ──────────────────────────────────────
function configurarAutocompleteLocalizacao(){
  if(typeof makeAutocomplete !== 'function') return;

  makeAutocomplete(
    'in-estado', 'list-estado',
    () => ESTADOS.map(e => ({ label: `${e.estado} (${e.uf})`, data: e })),
    (item) => {
      estadoSelecionado = item.data;
      municipioSelecionado = null;
      irradiacaoAtual = null;
      const inputMunicipio = document.getElementById('in-municipio');
      inputMunicipio.value = '';
      inputMunicipio.disabled = false;
      inputMunicipio.placeholder = 'Digite o município...';
      atualizarPagina4();
    }
  );

  makeAutocomplete(
    'in-municipio', 'list-municipio',
    () => {
      if(!estadoSelecionado) return [];
      return (MUNICIPIOS[estadoSelecionado.uf] || []).map(m => ({ label: m.nome, data: m }));
    },
    async (item) => {
      municipioSelecionado = item.data;
      await resolverIrradiacao();
      atualizarPagina4();
    }
  );
}

// ── Resolve a irradiação solar do município selecionado ────────────────────
async function resolverIrradiacao(){
  if(!estadoSelecionado || !municipioSelecionado){ irradiacaoAtual = null; return; }

  // 1) Base offline da Bahia (prioridade — não depende de internet)
  if(estadoSelecionado.uf === 'BA' && IRRADIACAO_BA[municipioSelecionado.nome]){
    const d = IRRADIACAO_BA[municipioSelecionado.nome];
    irradiacaoAtual = {
      irradiacaoMediaDiaria: d.irradiacaoMediaDiaria,
      mensal: d.mensal,
      fonte: 'Base offline Bahia'
    };
    return;
  }

  // 2) Fallback: API PVGIS (Joint Research Centre / UE)
  try{
    const irr = await getIrradiation(municipioSelecionado.lat, municipioSelecionado.lon);
    irradiacaoAtual = { ...irr, fonte: 'API PVGIS' };
  }catch(err){
    console.warn('[geracao.js] Falha ao consultar PVGIS, usando média nacional de referência.', err);
    irradiacaoAtual = {
      irradiacaoMediaDiaria: 5.0,
      mensal: Array(12).fill(5.0),
      fonte: 'Estimativa padrão (sem conexão com a API)'
    };
  }
}

// ── Cálculo de geração fotovoltaica ─────────────────────────────────────────
// Energia (kWh) = Potência total (kWp) × Irradiação (kWh/m²/dia) × Dias × (1 − perdas)
function calcularGeracao({ potenciaModuloW, qtdModulos, perdasPercent, diasMes, irradiacao }){
  const potenciaTotalKwp = (potenciaModuloW * qtdModulos) / 1000;
  const fatorPerdas = 1 - (perdasPercent / 100);

  const capacidadeMensalKwh = potenciaTotalKwp * irradiacao.irradiacaoMediaDiaria * diasMes * fatorPerdas;

  const producaoMensal = irradiacao.mensal.map((irrDia, i) =>
    potenciaTotalKwp * irrDia * DIAS_POR_MES[i] * fatorPerdas
  );

  return {
    potenciaTotalKwp: parseFloat(potenciaTotalKwp.toFixed(2)),
    capacidadeMensalKwh: parseFloat(capacidadeMensalKwh.toFixed(0)),
    producaoMensal: producaoMensal.map(v => parseFloat(v.toFixed(0)))
  };
}

// ── Renderização do gráfico (SVG simples, sem dependências externas) ───────
function renderizarGrafico(producaoMensal, consumoMensal){
  const container = document.getElementById('p4-grafico');
  if(!container) return;

  const largura = 500, altura = 190, baseY = 160, topoY = 10;
  const maxValor = Math.max(...producaoMensal, ...consumoMensal, 1);
  const escalaY = (baseY - topoY) / maxValor;
  const larguraGrupo = largura / 12;

  let barras = '';
  for(let i = 0; i < 12; i++){
    const xGrupo = i * larguraGrupo;
    const alturaProd = producaoMensal[i] * escalaY;
    const alturaCons = consumoMensal[i] * escalaY;
    const wBarra = larguraGrupo * 0.32;

    const xProd = xGrupo + larguraGrupo*0.14;
    const xCons = xGrupo + larguraGrupo*0.54;

    barras += `
      <rect x="${xProd}" y="${baseY-alturaProd}" width="${wBarra}" height="${alturaProd}" fill="#f5821f" rx="1.5"/>
      <rect x="${xCons}" y="${baseY-alturaCons}" width="${wBarra}" height="${alturaCons}" fill="#16233f" rx="1.5"/>
      <text x="${xGrupo+larguraGrupo/2}" y="${baseY+14}" font-size="8" fill="#5a6472" text-anchor="middle" font-family="Arial, sans-serif">${NOMES_MESES[i]}</text>
    `;
  }

  container.innerHTML = `
    <svg viewBox="0 0 ${largura} ${altura}" width="100%" height="100%">
      <line x1="0" y1="${baseY}" x2="${largura}" y2="${baseY}" stroke="#dfe3ea" stroke-width="1"/>
      ${barras}
    </svg>
  `;
}

// ── Atualização geral da página 4 (chamada a cada mudança relevante) ───────
function atualizarPagina4(){
  const potenciaModuloW = parseFloat(document.getElementById('in-potencia-modulo').value) || 610;
  const qtdModulos = parseFloat(document.getElementById('in-qtd-modulos').value) || 20;
  const perdasPercent = parseFloat(document.getElementById('in-perdas').value) || 14;
  const diasMes = parseFloat(document.getElementById('in-dias-mes').value) || 30;
  const consumoMedio = parseFloat(document.getElementById('in-consumo-medio').value) || 0;
  const valorContaAtual = parseFloat(document.getElementById('in-valor-conta').value) || 0;
  const economiaPercentual = parseFloat(document.getElementById('in-economia').value) || 95;

  const fonteEl = document.getElementById('p4-out-fonte');

  if(!irradiacaoAtual){
    // Sem localização selecionada ainda: mantém placeholders, não quebra a página
    document.getElementById('p4-out-capacidade').textContent = '—';
    if(fonteEl) fonteEl.textContent = 'Selecione o estado e o município no formulário para calcular.';
    renderizarGrafico(Array(12).fill(0), Array(12).fill(0));
  } else {
    const resultado = calcularGeracao({ potenciaModuloW, qtdModulos, perdasPercent, diasMes, irradiacao: irradiacaoAtual });
    document.getElementById('p4-out-capacidade').textContent =
      resultado.capacidadeMensalKwh.toLocaleString('pt-BR');
    if(fonteEl) fonteEl.textContent = `Fonte da irradiação solar: ${irradiacaoAtual.fonte} · ${municipioSelecionado.nome}/${estadoSelecionado.uf}`;
    renderizarGrafico(resultado.producaoMensal, Array(12).fill(consumoMedio));
  }

  // ── Economia na conta de energia ──
  const valorComSolar = valorContaAtual * (1 - economiaPercentual/100);
  const economiaMensal = valorContaAtual - valorComSolar;
  const economiaAnual = economiaMensal * 12;
  const economia25anos = economiaAnual * 25;

  const fmt = (v) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  document.getElementById('p4-out-conta-sem').textContent = `R$ ${fmt(valorContaAtual)}`;
  document.getElementById('p4-out-conta-com').textContent = `R$ ${fmt(valorComSolar)}`;
  document.getElementById('p4-out-economia-mensal').textContent = `R$ ${fmt(economiaMensal)}`;
  document.getElementById('p4-out-economia-anual').textContent = `R$ ${fmt(economiaAnual)}`;
  document.getElementById('p4-out-economia-25anos').textContent = `R$ ${fmt(economia25anos)}`;
  document.getElementById('p4-out-reducao').textContent = `${economiaPercentual}%`;
}

// ── Inicialização (roda assim que o script carrega, sem esperar DOMContentLoaded,
//    pois este <script> já fica no fim do <body>) ─────────────────────────────
window.geracaoDataReady = carregarBaseGeografica().then(() => {
  configurarAutocompleteLocalizacao();
  atualizarPagina4();
});

// Permite que script.js (dados padrão do JSON) pré-selecione estado/município
window.aplicarLocalizacaoPadrao = async function(nomeEstado, nomeMunicipio){
  await window.geracaoDataReady;
  if(!nomeEstado || !nomeMunicipio) return;

  const estado = ESTADOS.find(e => e.estado === nomeEstado || e.uf === nomeEstado);
  if(!estado) return;
  estadoSelecionado = estado;
  const inputEstado = document.getElementById('in-estado');
  inputEstado.value = `${estado.estado} (${estado.uf})`;

  const lista = MUNICIPIOS[estado.uf] || [];
  const municipio = lista.find(m => m.nome === nomeMunicipio);
  if(!municipio) return;
  municipioSelecionado = municipio;
  const inputMunicipio = document.getElementById('in-municipio');
  inputMunicipio.value = municipio.nome;
  inputMunicipio.disabled = false;

  await resolverIrradiacao();
  atualizarPagina4();
};

['in-potencia-modulo','in-qtd-modulos','in-perdas','in-dias-mes','in-consumo-medio','in-valor-conta','in-economia']
  .forEach(id => {
    const el = document.getElementById(id);
    if(el) el.addEventListener('input', atualizarPagina4);
  });
