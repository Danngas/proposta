/**
 * sizing.js
 * Lógica de dimensionamento fotovoltaico
 * Port direto de solar/domain/sizing.py
 * Autor: Daniel Silva de Souza
 *
 * Fórmula base:
 *   Energia (kWh) = Potência (kWp) × Irradiação × Dias × (1 − perdas)
 */

/**
 * Taxa mínima por tipo de ligação (kWh/mês)
 * Conforme resolução ANEEL / práticas distribuidoras
 */
const TAXA_MINIMA = {
  mono:   30,
  bi:     50,
  tri:    100,
  ignorar: 0,
};

/**
 * Resultado do dimensionamento.
 * @typedef {Object} SizingResult
 * @property {number} quantidadeModulos
 * @property {number} potenciaTotalKwp
 * @property {number} geracaoEstimadaKwhMes
 * @property {number} geracaoEstimadaKwhAno
 * @property {number} geracaoAjustada
 * @property {number} taxaDescontada
 * @property {number} margemAplicadaPercent
 * @property {number} perdasPercent
 */

/**
 * Calcula o dimensionamento do sistema FV.
 *
 * @param {Object} params
 * @param {number} params.geracaoDesejadaKwhMes   - kWh/mês pretendido pelo cliente
 * @param {number} params.potenciaModuloW          - Potência do módulo em Watts
 * @param {number} params.irradiacaoMediaDiaria    - kWh/m²/dia (vem do PVGIS)
 * @param {number} params.diasMes                  - Dias do mês de referência
 * @param {number} params.perdasPercent            - Perdas totais (%)
 * @param {number} params.margemPercent            - Margem de segurança (%)
 * @param {string} params.tipoLigacao              - 'mono' | 'bi' | 'tri' | 'ignorar'
 *
 * @returns {SizingResult}
 */
function calcularDimensionamento(params) {
  const {
    geracaoDesejadaKwhMes,
    potenciaModuloW,
    irradiacaoMediaDiaria,
    diasMes,
    perdasPercent,
    margemPercent,
    tipoLigacao,
  } = params;

  // ── Validações
  if (geracaoDesejadaKwhMes <= 0) throw new Error('A geração desejada deve ser maior que zero.');
  if (potenciaModuloW <= 0)       throw new Error('A potência do módulo deve ser maior que zero.');
  if (irradiacaoMediaDiaria <= 0) throw new Error('A irradiação média diária deve ser maior que zero.');
  if (diasMes <= 0)               throw new Error('Os dias do mês devem ser maior que zero.');

  // ── Taxa mínima
  const taxa = TAXA_MINIMA[tipoLigacao] ?? 0;
  const geracaoAjustada = Math.max(geracaoDesejadaKwhMes - taxa, 1);

  // ── Conversões
  const potenciaModuloKw = potenciaModuloW / 1000.0;
  const fatorPerdas      = 1 - (perdasPercent / 100.0);

  // ── Potência necessária (kWp)
  const potenciaNecessariaKwp = geracaoAjustada / (irradiacaoMediaDiaria * diasMes * fatorPerdas);

  // ── Quantidade de módulos sem margem
  const qtdBase = Math.ceil(potenciaNecessariaKwp / potenciaModuloKw);

  // ── Aplicar margem de segurança
  const qtdComMargem = Math.ceil(qtdBase * (1 + margemPercent / 100.0));

  // ── Potência total instalada
  const potenciaTotalKwp = qtdComMargem * potenciaModuloKw;

  // ── Geração estimada real com essa potência
  const geracaoEstimada = potenciaTotalKwp * irradiacaoMediaDiaria * diasMes * fatorPerdas;

  return {
    quantidadeModulos:       qtdComMargem,
    potenciaTotalKwp:        parseFloat(potenciaTotalKwp.toFixed(2)),
    geracaoEstimadaKwhMes:   parseFloat(geracaoEstimada.toFixed(2)),
    geracaoEstimadaKwhAno:   parseFloat((geracaoEstimada * 12).toFixed(2)),
    geracaoAjustada:         geracaoAjustada,
    taxaDescontada:          taxa,
    margemAplicadaPercent:   margemPercent,
    perdasPercent:           perdasPercent,
  };
}
